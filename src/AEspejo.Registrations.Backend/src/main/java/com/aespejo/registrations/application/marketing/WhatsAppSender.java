package com.aespejo.registrations.application.marketing;

import java.util.List;

/**
 * Channel that sends WhatsApp messages. The campaign dispatcher and the inbox
 * do not know whether behind it there is a call to the Cloud API or a simulated record: a brand decides which one.
 */
public interface WhatsAppSender {

    /** Name stored in {@code Campaign.provider} to show which channel resolved the campaign for this brand. */
    String providerNameFor(String brandCode);

    /** Sends an approved template to one recipient. Outside the 24-hour window this is the only allowed message. */
    SendResult sendTemplate(TemplateSend send);

    /** Replies with free text. Only valid inside the 24-hour customer-service window. */
    SendResult sendText(TextReply reply);

    /** Marks an inbound message as read (the blue double check). Failures are logged and ignored. */
    void markRead(String brandCode, String externalId);

    /** A message to one recipient, built from a campaign message. */
    record TemplateSend(
            String brandCode,
            String phoneE164,
            String templateName,
            String language,
            List<String> headerParameters,
            String headerImageUrl,
            List<String> parameters,
            String renderedBody) {
    }

    /** Free-text reply. {@code repliedExternalId} is the wamid being quoted, if any. */
    record TextReply(String brandCode, String phoneE164, String text, String repliedExternalId) {
    }

    /**
     * Outcome of one send attempt. {@code retryLater} separates a temporary failure from a permanent one: a number that
     * does not exist does not improve by retrying, a 429 or a network cut does. {@code missingConfiguration} means the
     * brand lacks its number or token, so the dispatcher does not spend an attempt on the message.
     */
    record SendResult(
            boolean success,
            String externalId,
            String error,
            boolean retryLater,
            boolean missingConfiguration) {

        public static SendResult ok(String externalId) {
            return new SendResult(true, externalId, null, false, false);
        }

        public static SendResult permanent(String error) {
            return new SendResult(false, null, error, false, false);
        }

        public static SendResult transientFailure(String error) {
            return new SendResult(false, null, error, true, false);
        }

        public static SendResult notConfigured(String error) {
            return new SendResult(false, null, error, true, true);
        }
    }
}
