package com.aespejo.registrations.infrastructure.whatsapp;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * WhatsApp Cloud API settings. The top-level values are the
 * default for every brand. Each brand in {@link #brands()} can override them, keyed by brand code ({@code ecotrail},
 * {@code onesport}). Tokens come from environment variables, never from versioned files.
 */
@ConfigurationProperties(prefix = "whatsapp")
public record WhatsAppProperties(
        String provider,
        String baseUrl,
        String version,
        String businessAccountId,
        String phoneNumberId,
        String token,
        String templateLanguage,
        Integer messagesPerMinute,
        Map<String, BrandProperties> brands,
        WebhookProperties webhook) {

    /** Provider that really calls the Cloud API. */
    public static final String PROVIDER_META = "meta";

    /** Provider that only logs the send. The default until the account has approved marketing templates. */
    public static final String PROVIDER_SIMULATED = "simulated";

    public WhatsAppProperties {
        provider = blankTo(provider, PROVIDER_SIMULATED);
        baseUrl = blankTo(baseUrl, "https://graph.facebook.com");
        version = blankTo(version, "v21.0");
        businessAccountId = blankTo(businessAccountId, "");
        phoneNumberId = blankTo(phoneNumberId, "");
        token = blankTo(token, "");
        templateLanguage = blankTo(templateLanguage, "es");
        messagesPerMinute = messagesPerMinute == null ? 60 : messagesPerMinute;
        brands = brands == null ? Map.of() : brands;
        webhook = webhook == null ? new WebhookProperties(null, null, null) : webhook;
    }

    /** Per-brand overrides, section {@code whatsapp.brands.<code>}. */
    public record BrandProperties(
            String provider,
            String version,
            String businessAccountId,
            String phoneNumberId,
            String token,
            String templateLanguage,
            String appSecret) {
    }

    /** Webhook settings, shared by every brand: Meta subscribes at app level, not per number. */
    public record WebhookProperties(String verifyToken, String appSecret, Boolean requireSignature) {

        public WebhookProperties {
            verifyToken = blankTo(verifyToken, "");
            appSecret = blankTo(appSecret, "");
            requireSignature = requireSignature == null || requireSignature;
        }
    }

    private static String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
