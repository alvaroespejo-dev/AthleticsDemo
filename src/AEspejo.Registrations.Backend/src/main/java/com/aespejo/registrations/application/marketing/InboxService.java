package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.application.marketing.InboxModels.ConversationDetail;
import com.aespejo.registrations.application.marketing.InboxModels.ConversationFilter;
import com.aespejo.registrations.application.marketing.InboxModels.ConversationSummary;
import com.aespejo.registrations.application.marketing.InboxModels.MediaFile;
import com.aespejo.registrations.application.marketing.InboxModels.MessageView;
import com.aespejo.registrations.application.marketing.InboxModels.ReplyRequest;
import com.aespejo.registrations.application.marketing.InboxModels.ReplyTemplateRequest;
import com.aespejo.registrations.application.marketing.InboxModels.Summary;
import com.aespejo.registrations.application.marketing.InboxModels.Window;
import com.aespejo.registrations.application.marketing.WhatsAppSender.SendResult;
import com.aespejo.registrations.application.marketing.WhatsAppSender.TemplateSend;
import com.aespejo.registrations.application.marketing.WhatsAppSender.TextReply;
import com.aespejo.registrations.common.PageMapper;
import com.aespejo.registrations.common.PageResponse;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.entities.WhatsAppConversation;
import com.aespejo.registrations.domain.entities.WhatsAppMessage;
import com.aespejo.registrations.domain.enums.MessageDirection;
import com.aespejo.registrations.domain.enums.MessageStatus;
import com.aespejo.registrations.domain.enums.WhatsAppContentType;
import com.aespejo.registrations.infrastructure.files.FileStore;
import com.aespejo.registrations.infrastructure.persistence.repository.UserRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.WhatsAppConversationRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.WhatsAppMessageRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The WhatsApp inbox: what customers write to each brand's number, and the replies the operator sends from the panel.
 *.
 *
 * <p>Replies that Meta refuses are saved with status Failed and returned, not thrown: the controller turns them into an
 * error after the transaction is committed, so the failed attempt stays on record.
 */
@Service
@Transactional
public class InboxService {

    /** Meta only allows free text within 24 hours of the customer's last message (the "customer service window"). */
    public static final Duration SERVICE_WINDOW = Duration.ofHours(24);

    private static final int PREVIEW_LENGTH = 150;
    private static final int ERROR_LENGTH = 1000;
    private static final DateTimeFormatter CLOSES_AT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final WhatsAppConversationRepository conversations;
    private final WhatsAppMessageRepository messages;
    private final UserRepository users;
    private final WhatsAppSender sender;
    private final FileStore files;

    public InboxService(WhatsAppConversationRepository conversations, WhatsAppMessageRepository messages,
                        UserRepository users, WhatsAppSender sender, FileStore files) {
        this.conversations = conversations;
        this.messages = messages;
        this.users = users;
        this.sender = sender;
        this.files = files;
    }

    @Transactional(readOnly = true)
    public PageResponse<ConversationSummary> list(ConversationFilter filter, int page, int size) {
        PageRequest request = PageRequest.of(Math.max(1, page) - 1, Math.max(1, Math.min(size, PageResponse.MAX_PAGE_SIZE)),
                Sort.by(Sort.Direction.DESC, "lastMessageAt"));

        Page<WhatsAppConversation> result = conversations.findAll(matching(filter), request);
        OffsetDateTime now = OffsetDateTime.now();

        return PageMapper.of(result.map(c -> summary(c, now)));
    }

    @Transactional(readOnly = true)
    public ConversationDetail get(int id) {
        return detail(find(id), OffsetDateTime.now());
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageView> messages(int conversationId, int page, int size) {
        find(conversationId);
        Page<WhatsAppMessage> result = messages.findByConversationIdOrderByMessageAtDesc(
                conversationId, PageMapper.request(page, size));

        return PageMapper.of(result.map(this::view));
    }

    /** Clears the unread count and tells Meta the last inbound message was read. */
    public void markRead(int id) {
        WhatsAppConversation conversation = find(id);

        if (conversation.getUnreadCount() == 0) {
            return;
        }

        conversation.setUnreadCount(0);

        messages.findFirstByConversationIdAndDirectionAndExternalIdIsNotNullOrderByMessageAtDesc(id, MessageDirection.Inbound)
                .map(WhatsAppMessage::getExternalId)
                .ifPresent(externalId -> sender.markRead(conversation.getBrand().getCode(), externalId));
    }

    /** Free-text reply. Only allowed inside the 24-hour window of the customer's last message. */
    public MessageView reply(int conversationId, ReplyRequest request, int userId) {
        WhatsAppConversation conversation = find(conversationId);
        OffsetDateTime now = OffsetDateTime.now();
        Window window = window(conversation, now);

        if (!window.open()) {
            throw new BusinessRuleException(conversation.getLastInboundMessageAt() == null
                    ? "inbox.window.never"
                    : "inbox.window.closed", closesAt(conversation));
        }

        WhatsAppMessage message = outbound(conversation, WhatsAppContentType.Text, request.text().trim(), null, userId, now);
        message.setExternalRepliedId(request.externalRepliedId());
        messages.saveAndFlush(message);

        SendResult result = sender.sendText(new TextReply(
                conversation.getBrand().getCode(), conversation.getPhoneE164(), message.getText(), request.externalRepliedId()));

        recordOutcome(message, conversation, result);
        return view(message);
    }

    /** Reopens the contact with an approved template. Allowed outside the 24-hour window: that is what templates are for. */
    public MessageView replyWithTemplate(int conversationId, ReplyTemplateRequest request, int userId) {
        WhatsAppConversation conversation = find(conversationId);
        OffsetDateTime now = OffsetDateTime.now();
        String text = "Plantilla enviada: " + request.templateName() + " (" + request.language() + ")";

        WhatsAppMessage message = outbound(conversation, WhatsAppContentType.Template, text, request.templateName(), userId, now);
        messages.saveAndFlush(message);

        SendResult result = sender.sendTemplate(new TemplateSend(
                conversation.getBrand().getCode(),
                conversation.getPhoneE164(),
                request.templateName(),
                request.language(),
                List.of(),
                request.headerImageUrl(),
                request.parameters() == null ? List.of() : request.parameters(),
                text));

        recordOutcome(message, conversation, result);
        return view(message);
    }

    public void archive(int id, boolean archive) {
        find(id).setArchived(archive);
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        return new Summary((int) conversations.countByArchivedFalseAndUnreadCountGreaterThan(0));
    }

    /** The stored file of an inbound media message, or empty if it never arrived or is no longer on disk. */
    @Transactional(readOnly = true)
    public Optional<MediaFile> media(int messageId) {
        return messages.findById(messageId)
                .filter(WhatsAppMessage::isMediaDownloaded)
                .filter(m -> m.getMediaFilePath() != null)
                .flatMap(m -> files.read(m.getMediaFilePath())
                        .map(bytes -> new MediaFile(bytes, m.getMediaMimeType(), m.getMediaFileName())));
    }

    private WhatsAppConversation find(int id) {
        return conversations.findById(id).orElseThrow(() -> new NotFoundException("entity.conversation", id));
    }

    private WhatsAppMessage outbound(WhatsAppConversation conversation, WhatsAppContentType type, String text,
                                     String templateName, int userId, OffsetDateTime now) {
        WhatsAppMessage message = new WhatsAppMessage();
        message.setConversation(conversation);
        message.setDirection(MessageDirection.Outbound);
        message.setContentType(type);
        message.setText(text);
        message.setTemplateName(templateName);
        message.setStatus(MessageStatus.Pending);
        message.setMessageAt(now);
        message.setCreatedAt(now);
        message.setSentByUser(users.findById(userId).orElse(null));
        return message;
    }

    /**
     * Saves the outcome of a send. The conversation's last message moves forward either way, but a send that the
     * platform refused does not extend the window: only a new message from the customer does.
     */
    private void recordOutcome(WhatsAppMessage message, WhatsAppConversation conversation, SendResult result) {
        if (result.success()) {
            message.setStatus(MessageStatus.Sent);
            message.setExternalId(result.externalId());
        } else {
            message.setStatus(MessageStatus.Failed);
            message.setError(truncate(result.error(), ERROR_LENGTH));
        }

        conversation.setLastMessageAt(message.getMessageAt());
        conversation.setLastMessageSummary(truncate(message.getText(), PREVIEW_LENGTH));
    }

    private Specification<WhatsAppConversation> matching(ConversationFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.brandId() != null) {
                predicates.add(cb.equal(root.get("brand").get("id"), filter.brandId()));
            }

            if (filter.onlyUnread()) {
                predicates.add(cb.greaterThan(root.get("unreadCount"), 0));
            }

            if (!filter.includeArchived()) {
                predicates.add(cb.isFalse(root.get("archived")));
            }

            if (filter.search() != null && !filter.search().isBlank()) {
                String like = "%" + filter.search().trim().toLowerCase(Locale.ROOT) + "%";
                Join<WhatsAppConversation, Athlete> athlete = root.join("athlete", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("phoneE164")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("profileName"), "")), like),
                        cb.like(cb.lower(cb.concat(cb.concat(cb.coalesce(athlete.get("firstNames"), ""), " "),
                                cb.coalesce(athlete.get("lastNames"), ""))), like)));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private ConversationSummary summary(WhatsAppConversation c, OffsetDateTime now) {
        return new ConversationSummary(
                c.getId(),
                c.getBrand().getId(),
                c.getBrand().getCode(),
                c.getBrand().getName(),
                c.getPhoneE164(),
                c.getProfileName(),
                c.getAthlete() == null ? null : c.getAthlete().getId(),
                athleteName(c),
                c.getLastMessageAt(),
                c.getLastMessageSummary(),
                c.getUnreadCount(),
                c.isArchived(),
                window(c, now));
    }

    private ConversationDetail detail(WhatsAppConversation c, OffsetDateTime now) {
        return new ConversationDetail(
                c.getId(),
                c.getBrand().getId(),
                c.getBrand().getCode(),
                c.getBrand().getName(),
                c.getPhoneE164(),
                c.getWaId(),
                c.getProfileName(),
                c.getAthlete() == null ? null : c.getAthlete().getId(),
                athleteName(c),
                c.getLastMessageAt(),
                c.getUnreadCount(),
                c.isArchived(),
                window(c, now));
    }

    private MessageView view(WhatsAppMessage m) {
        return new MessageView(
                m.getId(),
                m.getDirection(),
                m.getContentType(),
                m.getText(),
                m.getStatus(),
                m.getError(),
                m.getMessageAt(),
                m.getExternalId(),
                m.getExternalRepliedId(),
                m.getMediaMetaId() != null,
                m.getMediaMimeType(),
                m.getMediaFileName(),
                m.getMediaSizeBytes(),
                m.isMediaDownloaded(),
                m.getSentByUser() == null ? null : m.getSentByUser().getName(),
                m.getTemplateName());
    }

    /** The window opened by the customer's last message. Its closing time is the last message plus 24 hours. */
    static Window window(WhatsAppConversation conversation, OffsetDateTime now) {
        OffsetDateTime closesAt = conversation.getWindowClosesAt();

        if (closesAt == null) {
            return new Window(false, null, 0);
        }

        Duration remaining = Duration.between(now, closesAt);

        if (remaining.isNegative() || remaining.isZero()) {
            return new Window(false, closesAt, 0);
        }

        return new Window(true, closesAt, (int) remaining.toMinutes());
    }

    private static String closesAt(WhatsAppConversation conversation) {
        return conversation.getWindowClosesAt() == null ? "" : conversation.getWindowClosesAt().format(CLOSES_AT);
    }

    private static String athleteName(WhatsAppConversation c) {
        Athlete athlete = c.getAthlete();
        return athlete == null ? null : athlete.getFirstNames() + " " + athlete.getLastNames();
    }

    private static String truncate(String text, int maximum) {
        return text == null || text.length() <= maximum ? text : text.substring(0, maximum);
    }
}
