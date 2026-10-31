package com.aespejo.registrations.api.marketing;

import com.aespejo.registrations.application.marketing.InboxModels.ConversationDetail;
import com.aespejo.registrations.application.marketing.InboxModels.ConversationFilter;
import com.aespejo.registrations.application.marketing.InboxModels.ConversationSummary;
import com.aespejo.registrations.application.marketing.InboxModels.MediaFile;
import com.aespejo.registrations.application.marketing.InboxModels.MessageView;
import com.aespejo.registrations.application.marketing.InboxModels.ReplyRequest;
import com.aespejo.registrations.application.marketing.InboxModels.ReplyTemplateRequest;
import com.aespejo.registrations.application.marketing.InboxModels.Summary;
import com.aespejo.registrations.application.marketing.InboxService;
import com.aespejo.registrations.common.PageResponse;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.enums.MessageStatus;
import com.aespejo.registrations.infrastructure.security.Policies;
import jakarta.validation.Valid;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * The WhatsApp inbox: conversations with customers and the operator's replies. It is operational work that any staff member can do, not only an administrator.
 */
@RestController
@RequestMapping("/api/marketing/inbox")
@PreAuthorize(Policies.OPERATIONS)
public class InboxController {

    private final InboxService inbox;

    public InboxController(InboxService inbox) {
        this.inbox = inbox;
    }

    @GetMapping("/conversations")
    public PageResponse<ConversationSummary> conversations(
            @RequestParam(required = false) Integer brandId,
            @RequestParam(defaultValue = "false") boolean onlyUnread,
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "25") int size) {
        return inbox.list(new ConversationFilter(brandId, onlyUnread, includeArchived, search), page, size);
    }

    @GetMapping("/conversations/{id}")
    public ConversationDetail conversation(@PathVariable int id) {
        return inbox.get(id);
    }

    @GetMapping("/conversations/{id}/messages")
    public PageResponse<MessageView> messages(@PathVariable int id,
                                              @RequestParam(defaultValue = "1") int page,
                                              @RequestParam(defaultValue = "50") int size) {
        return inbox.messages(id, page, size);
    }

    /**
     * Free-text reply. Only works inside the 24-hour window after the customer's last message; outside it the API
     * answers 422 with the reason.
     */
    @PostMapping("/conversations/{id}/reply")
    public MessageView reply(@AuthenticationPrincipal Jwt jwt, @PathVariable int id,
                             @Valid @RequestBody ReplyRequest request) {
        MessageView sent = inbox.reply(id, request, Integer.parseInt(jwt.getSubject()));

        if (sent.status() == MessageStatus.Failed) {
            throw new BusinessRuleException("inbox.reply.failed", sent.error());
        }

        return sent;
    }

    /** Reopens the contact with an approved template. Allowed outside the 24-hour window. */
    @PostMapping("/conversations/{id}/reply-template")
    public MessageView replyWithTemplate(@AuthenticationPrincipal Jwt jwt, @PathVariable int id,
                                         @Valid @RequestBody ReplyTemplateRequest request) {
        MessageView sent = inbox.replyWithTemplate(id, request, Integer.parseInt(jwt.getSubject()));

        if (sent.status() == MessageStatus.Failed) {
            throw new BusinessRuleException("inbox.template.failed", sent.error());
        }

        return sent;
    }

    @PostMapping("/conversations/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable int id) {
        inbox.markRead(id);
    }

    @PostMapping("/conversations/{id}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable int id, @RequestParam boolean archive) {
        inbox.archive(id, archive);
    }

    /**
     * The file of an inbound media message. Authenticated, unlike public images: it can be a payment receipt or personal
     * data of the sender.
     */
    @GetMapping("/messages/{id}/media")
    public ResponseEntity<byte[]> media(@PathVariable int id) {
        Optional<MediaFile> file = inbox.media(id);

        if (file.isEmpty()) {
            throw new NotFoundException("entity.message", id);
        }

        MediaFile media = file.get();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.contentType() == null
                        ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                        : media.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(media.content());
    }

    /** Unread conversations, for the badge next to the menu item. */
    @GetMapping("/summary")
    public Summary summary() {
        return inbox.summary();
    }
}
