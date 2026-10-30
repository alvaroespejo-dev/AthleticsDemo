package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.domain.enums.MessageDirection;
import com.aespejo.registrations.domain.enums.MessageStatus;
import com.aespejo.registrations.domain.enums.WhatsAppContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;

/** What the WhatsApp inbox screens read and write. Ported from {@code DtosBandeja}, with English field names. */
public final class InboxModels {

    private InboxModels() {
    }

    /**
     * State of Meta's 24-hour customer-service window. Only inside it can the panel send free text; outside it, the
     * operator has to use an approved template.
     */
    public record Window(boolean open, OffsetDateTime closesAt, int minutesRemaining) {
    }

    /** A conversation row in the list. */
    public record ConversationSummary(
            Integer id,
            Integer brandId,
            String brandCode,
            String brandName,
            String phoneE164,
            String profileName,
            Integer athleteId,
            String athleteName,
            OffsetDateTime lastMessageAt,
            String lastMessageSummary,
            int unreadCount,
            boolean archived,
            Window window) {
    }

    /** A conversation header. */
    public record ConversationDetail(
            Integer id,
            Integer brandId,
            String brandCode,
            String brandName,
            String phoneE164,
            String waId,
            String profileName,
            Integer athleteId,
            String athleteName,
            OffsetDateTime lastMessageAt,
            int unreadCount,
            boolean archived,
            Window window) {
    }

    /** One message of a thread, inbound or outbound. */
    public record MessageView(
            Integer id,
            MessageDirection direction,
            WhatsAppContentType contentType,
            String text,
            MessageStatus status,
            String error,
            OffsetDateTime messageAt,
            String externalId,
            String externalRepliedId,
            boolean hasMedia,
            String mediaMimeType,
            String mediaFileName,
            Long mediaSizeBytes,
            boolean mediaAvailable,
            String sentBy,
            String templateName) {
    }

    /** Body of a free-text reply. {@code externalRepliedId} quotes a message, when the operator picked one. */
    public record ReplyRequest(
            @NotBlank @Size(max = 4096) String text,
            String externalRepliedId) {
    }

    /** Body of a template reply, which may be sent outside the 24-hour window. */
    public record ReplyTemplateRequest(
            @NotBlank @Size(max = 150) String templateName,
            @NotBlank @Size(max = 10) String language,
            List<String> parameters,
            @Size(max = 2000) String headerImageUrl) {
    }

    /** Badge of unread conversations next to the inbox menu item. */
    public record Summary(int unreadCount) {
    }

    /** The list filters. */
    public record ConversationFilter(Integer brandId, boolean onlyUnread, boolean includeArchived, String search) {
    }

    /** A downloaded media file ready to be served. */
    public record MediaFile(byte[] content, String contentType, String fileName) {
    }
}
