package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.domain.entities.Brand;
import com.aespejo.registrations.domain.entities.CampaignMessage;
import com.aespejo.registrations.domain.entities.WhatsAppConversation;
import com.aespejo.registrations.domain.entities.WhatsAppMessage;
import com.aespejo.registrations.domain.enums.MessageDirection;
import com.aespejo.registrations.domain.enums.MessageStatus;
import com.aespejo.registrations.domain.enums.WhatsAppContentType;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.BrandRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.CampaignMessageRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.WhatsAppConversationRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.WhatsAppMessageRepository;
import com.aespejo.registrations.infrastructure.whatsapp.WhatsAppBrandResolver;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Ingests the payload Meta sends to the webhook: inbound messages and delivery statuses of messages sent from the inbox
 * and from campaigns. Ported from {@code ServicioWebhookWhatsApp}.
 *
 * <p>Everything is defensive on purpose. Meta resends events, adds message types without notice, and can send several
 * {@code value} entries in one batch. A problem with one must not stop the others, so each {@code value} runs in its own
 * transaction and its own try/catch. The controller always answers 200: a 500 makes Meta resend the same batch in a loop.
 */
@Service
public class WhatsAppWebhookService {

    private static final Logger LOG = LoggerFactory.getLogger(WhatsAppWebhookService.class);
    private static final int PREVIEW_LENGTH = 150;
    private static final int ERROR_LENGTH = 1000;

    private final WhatsAppBrandResolver resolver;
    private final BrandRepository brands;
    private final WhatsAppConversationRepository conversations;
    private final WhatsAppMessageRepository messages;
    private final CampaignMessageRepository campaignMessages;
    private final AthleteRepository athletes;
    private final TransactionTemplate transaction;

    public WhatsAppWebhookService(WhatsAppBrandResolver resolver, BrandRepository brands,
                                  WhatsAppConversationRepository conversations, WhatsAppMessageRepository messages,
                                  CampaignMessageRepository campaignMessages, AthleteRepository athletes,
                                  PlatformTransactionManager transactions) {
        this.resolver = resolver;
        this.brands = brands;
        this.conversations = conversations;
        this.messages = messages;
        this.campaignMessages = campaignMessages;
        this.athletes = athletes;
        this.transaction = new TransactionTemplate(transactions);
    }

    public void process(JsonNode payload) {
        for (JsonNode entry : payload.path("entry")) {
            for (JsonNode change : entry.path("changes")) {
                JsonNode value = change.path("value");

                if (value.isMissingNode()) {
                    continue;
                }

                try {
                    transaction.executeWithoutResult(status -> handleValue(value));
                } catch (RuntimeException ex) {
                    LOG.error("Processing a WhatsApp webhook value failed.", ex);
                }
            }
        }
    }

    private void handleValue(JsonNode value) {
        String phoneNumberId = text(value, "metadata", "phone_number_id");

        if (phoneNumberId == null || phoneNumberId.isBlank()) {
            return;
        }

        // Not an error: it can be another app's webhook pointing here, or a number removed from the configuration.
        Optional<String> brandCode = resolver.findByPhoneNumberId(phoneNumberId).map(c -> c.brandCode());

        if (brandCode.isEmpty()) {
            LOG.warn("The WhatsApp webhook brought an unknown phone_number_id: {}", phoneNumberId);
            return;
        }

        Optional<Brand> brand = brands.findByCode(brandCode.get());

        if (brand.isEmpty()) {
            LOG.warn("The brand {} resolved from the webhook does not exist in the database.", brandCode.get());
            return;
        }

        // Statuses are cheaper and create nothing, so they go first.
        for (JsonNode status : value.path("statuses")) {
            handleStatus(status);
        }

        Map<String, String> contacts = contacts(value);

        for (JsonNode message : value.path("messages")) {
            handleInbound(message, brand.get(), contacts);
        }

        for (JsonNode error : value.path("errors")) {
            LOG.warn("The WhatsApp webhook brought an account-level error: {}", error);
        }
    }

    // ---- Statuses of outbound messages ----

    private void handleStatus(JsonNode status) {
        String externalId = text(status, "id");
        String statusText = text(status, "status");

        if (externalId == null || externalId.isBlank() || statusText == null) {
            return;
        }

        MessageStatus next = mapStatus(statusText);

        if (next == null) {
            return;
        }

        String error = next == MessageStatus.Failed ? failureDetail(status) : null;

        // The same wamid belongs to a campaign message or to an inbox message, never to both, so both tables are checked.
        campaignMessages.findFirstByExternalId(externalId)
                .filter(m -> advances(m.getStatus(), next))
                .ifPresent(m -> applyStatus(m, next, error));

        messages.findFirstByExternalIdAndDirection(externalId, MessageDirection.Outbound)
                .filter(m -> advances(m.getStatus(), next))
                .ifPresent(m -> applyStatus(m, next, error));
    }

    private static void applyStatus(CampaignMessage message, MessageStatus next, String error) {
        message.setStatus(next);

        if (error != null) {
            message.setLastError(truncate(error, ERROR_LENGTH));
        }
    }

    private static void applyStatus(WhatsAppMessage message, MessageStatus next, String error) {
        message.setStatus(next);

        if (error != null) {
            message.setError(truncate(error, ERROR_LENGTH));
        }
    }

    private static MessageStatus mapStatus(String status) {
        return switch (status) {
            case "sent" -> MessageStatus.Sent;
            case "delivered" -> MessageStatus.Delivered;
            case "read" -> MessageStatus.Read;
            case "failed" -> MessageStatus.Failed;
            default -> null;
        };
    }

    /** Title and detail of the first error Meta reports for a failed message. */
    private static String failureDetail(JsonNode status) {
        JsonNode first = status.path("errors").path(0);

        if (first.isMissingNode()) {
            return null;
        }

        String title = text(first, "title") == null ? "Meta rechazó el mensaje." : text(first, "title");
        String details = text(first, "error_data", "details");

        return details == null || details.isBlank() ? title : title + " (" + details + ")";
    }

    /**
     * Status events can arrive out of order. A status never goes backwards (read, then delivered, is ignored), and a
     * failure only applies if the message was never confirmed delivered: a failure reported after delivery makes no sense.
     */
    static boolean advances(MessageStatus current, MessageStatus next) {
        if (next == MessageStatus.Failed) {
            return current == MessageStatus.Pending || current == MessageStatus.Sent;
        }

        return rank(next) > rank(current);
    }

    private static int rank(MessageStatus status) {
        return switch (status) {
            case Pending -> 0;
            case Sent -> 1;
            case Delivered -> 2;
            case Read -> 3;
            case Failed -> -1;
        };
    }

    // ---- Inbound messages ----

    private void handleInbound(JsonNode message, Brand brand, Map<String, String> contacts) {
        String externalId = text(message, "id");
        String waId = text(message, "from");
        String rawType = text(message, "type");

        if (externalId == null || waId == null || rawType == null) {
            return;
        }

        // Idempotency: Meta resends the same event when it does not get a confirmation in time.
        if (messages.existsByExternalId(externalId)) {
            return;
        }

        WhatsAppConversation conversation = conversation(brand, waId, contacts.get(waId));
        OffsetDateTime messageAt = timestamp(message);
        Content content = interpret(message, rawType);

        WhatsAppMessage saved = new WhatsAppMessage();
        saved.setConversation(conversation);
        saved.setDirection(MessageDirection.Inbound);
        saved.setExternalId(externalId);
        saved.setExternalRepliedId(repliedId(message, content.type()));
        saved.setContentType(content.type());
        saved.setText(content.text());
        saved.setMediaMetaId(content.mediaId());
        saved.setMediaMimeType(content.mimeType());
        saved.setMediaFileName(content.fileName());
        saved.setStatus(MessageStatus.Delivered);
        saved.setMessageAt(messageAt);
        saved.setCreatedAt(OffsetDateTime.now());
        messages.save(saved);

        conversation.setLastMessageAt(messageAt);
        conversation.setLastMessageSummary(truncate(summary(content.type(), content.text()), PREVIEW_LENGTH));
        // The anchor of the 24-hour window: it reopens with every new inbound message.
        conversation.setLastInboundMessageAt(messageAt);
        conversation.setUnreadCount(conversation.getUnreadCount() + 1);
        conversation.setArchived(false);
    }

    private WhatsAppConversation conversation(Brand brand, String waId, String profileName) {
        String phone = "+" + waId;

        Optional<WhatsAppConversation> existing = conversations.findByBrandIdAndPhoneE164(brand.getId(), phone);

        if (existing.isPresent()) {
            WhatsAppConversation conversation = existing.get();

            if (profileName != null && !profileName.isBlank()) {
                conversation.setProfileName(profileName);
            }

            return conversation;
        }

        WhatsAppConversation conversation = new WhatsAppConversation();
        conversation.setBrand(brand);
        conversation.setPhoneE164(phone);
        conversation.setWaId(waId);
        conversation.setProfileName(profileName);
        conversation.setAthlete(athletes.findIdsByWhatsAppId(waId).stream().findFirst()
                .flatMap(athletes::findById).orElse(null));
        conversation.setCreatedAt(OffsetDateTime.now());
        return conversations.save(conversation);
    }

    /** The contact names Meta includes in the batch, indexed by wa_id. */
    private static Map<String, String> contacts(JsonNode value) {
        Map<String, String> result = new HashMap<>();

        for (JsonNode contact : value.path("contacts")) {
            String waId = text(contact, "wa_id");

            if (waId != null) {
                result.put(waId, text(contact, "profile", "name"));
            }
        }

        return result;
    }

    /** The content of a message, mapped to our model. Unknown types become Unsupported rather than failing. */
    static Content interpret(JsonNode message, String rawType) {
        return switch (rawType) {
            case "text" -> new Content(WhatsAppContentType.Text, text(message, "text", "body"), null, null, null);
            case "image" -> new Content(WhatsAppContentType.Image, text(message, "image", "caption"),
                    text(message, "image", "id"), text(message, "image", "mime_type"), null);
            case "audio" -> new Content(WhatsAppContentType.Audio, null,
                    text(message, "audio", "id"), text(message, "audio", "mime_type"), null);
            case "video" -> new Content(WhatsAppContentType.Video, text(message, "video", "caption"),
                    text(message, "video", "id"), text(message, "video", "mime_type"), null);
            case "document" -> new Content(WhatsAppContentType.Document, text(message, "document", "caption"),
                    text(message, "document", "id"), text(message, "document", "mime_type"),
                    text(message, "document", "filename"));
            case "sticker" -> new Content(WhatsAppContentType.Sticker, null,
                    text(message, "sticker", "id"), text(message, "sticker", "mime_type"), null);
            case "location" -> new Content(WhatsAppContentType.Location, location(message), null, null, null);
            case "contacts" -> new Content(WhatsAppContentType.Contact,
                    "Contacto compartido: " + contactNames(message), null, null, null);
            case "reaction" -> new Content(WhatsAppContentType.Reaction,
                    Optional.ofNullable(text(message, "reaction", "emoji")).orElse("(reacción)"), null, null, null);
            case "button" -> new Content(WhatsAppContentType.Button, text(message, "button", "text"), null, null, null);
            case "interactive" -> new Content(WhatsAppContentType.Button,
                    Optional.ofNullable(text(message, "interactive", "button_reply", "title"))
                            .orElse(text(message, "interactive", "list_reply", "title")),
                    null, null, null);
            default -> new Content(WhatsAppContentType.Unsupported,
                    "Mensaje de tipo «" + rawType + "» no soportado.", null, null, null);
        };
    }

    /** The message the customer quoted, or the one the reaction points to. */
    private static String repliedId(JsonNode message, WhatsAppContentType type) {
        String context = text(message, "context", "id");

        if (context != null) {
            return context;
        }

        return type == WhatsAppContentType.Reaction ? text(message, "reaction", "message_id") : null;
    }

    private static String location(JsonNode message) {
        String latitude = text(message, "location", "latitude");
        String longitude = text(message, "location", "longitude");
        String name = text(message, "location", "name");

        return name == null || name.isBlank()
                ? "Ubicación: " + latitude + ", " + longitude
                : "Ubicación: " + name + " (" + latitude + ", " + longitude + ")";
    }

    private static String contactNames(JsonNode message) {
        StringBuilder names = new StringBuilder();

        for (JsonNode contact : message.path("contacts")) {
            String name = text(contact, "name", "formatted_name");

            if (name != null && !name.isBlank()) {
                names.append(names.isEmpty() ? "" : ", ").append(name);
            }
        }

        return names.isEmpty() ? "(sin nombre)" : names.toString();
    }

    private static String summary(WhatsAppContentType type, String text) {
        if (text != null && !text.isBlank()) {
            return text;
        }

        return switch (type) {
            case Image -> "📷 Imagen";
            case Audio -> "🎤 Audio";
            case Video -> "🎬 Video";
            case Document -> "📄 Documento";
            case Sticker -> "Sticker";
            default -> "Mensaje";
        };
    }

    private static OffsetDateTime timestamp(JsonNode message) {
        String raw = text(message, "timestamp");

        if (raw == null) {
            return OffsetDateTime.now();
        }

        try {
            return OffsetDateTime.ofInstant(Instant.ofEpochSecond(Long.parseLong(raw)), ZoneOffset.UTC);
        } catch (NumberFormatException ex) {
            return OffsetDateTime.now();
        }
    }

    /** A string at the given path, or null if it is missing. Numbers come back as text, as Meta sends some as numbers. */
    static String text(JsonNode node, String... path) {
        JsonNode current = node;

        for (String step : path) {
            current = current.path(step);
        }

        return current.isValueNode() && !current.isNull() ? current.asText() : null;
    }

    private static String truncate(String text, int maximum) {
        return text == null || text.length() <= maximum ? text : text.substring(0, maximum);
    }

    /** The parts of an inbound message that get stored. */
    record Content(WhatsAppContentType type, String text, String mediaId, String mimeType, String fileName) {
    }
}
