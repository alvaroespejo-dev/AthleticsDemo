package com.aespejo.registrations.infrastructure.whatsapp;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Checks the {@code X-Hub-Signature-256} header Meta sends with every webhook POST, ported from {@code FirmaWebhookMeta}.
 * It works on the raw bytes Meta sent, before any parsing.
 */
public final class WebhookSignature {

    private static final String PREFIX = "sha256=";

    private WebhookSignature() {
    }

    /** True if the HMAC-SHA256 of the body matches the header for at least one of the candidate secrets. */
    public static boolean verify(byte[] rawBody, String header, Iterable<String> secrets) {
        if (header == null || !header.startsWith(PREFIX)) {
            return false;
        }

        byte[] received;
        try {
            received = HexFormat.of().parseHex(header.substring(PREFIX.length()));
        } catch (IllegalArgumentException ex) {
            return false;
        }

        for (String secret : secrets) {
            if (secret != null && !secret.isBlank() && MessageDigest.isEqual(hmac(secret, rawBody), received)) {
                return true;
            }
        }

        return false;
    }

    private static byte[] hmac(String secret, byte[] body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(body);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("HMAC-SHA256 is not available.", ex);
        }
    }
}
