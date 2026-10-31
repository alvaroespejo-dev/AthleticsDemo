package com.aespejo.registrations.infrastructure.whatsapp;

/**
 * Credentials of one brand with the inheritance already applied. The sender, the template catalog and the media client
 * only see this record and never read the properties again..
 */
public record WhatsAppCredentials(
        String brandCode,
        String provider,
        String version,
        String businessAccountId,
        String phoneNumberId,
        String token,
        String templateLanguage) {

    public boolean usesMeta() {
        return WhatsAppProperties.PROVIDER_META.equalsIgnoreCase(provider);
    }

    public boolean hasSendingNumber() {
        return phoneNumberId != null && !phoneNumberId.isBlank() && token != null && !token.isBlank();
    }
}
