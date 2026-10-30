package com.aespejo.registrations.application.marketing;

import java.util.Optional;

/**
 * Downloads media that arrives by WhatsApp, ported from {@code IMediaWhatsApp}. It is a separate port from the webhook
 * on purpose: pulling a multi-megabyte file inside the POST that Meta expects to confirm within seconds would make Meta
 * time out and resend the whole batch.
 */
public interface WhatsAppMedia {

    /** Empty when Meta no longer has the file (it deletes them after 30 days) or the brand has no token. */
    Optional<Downloaded> download(String brandCode, String mediaId);

    /** The file content and its MIME type. */
    record Downloaded(byte[] content, String mimeType) {
    }
}
