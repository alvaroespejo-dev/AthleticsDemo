package com.aespejo.registrations.infrastructure.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings for the JWT issued by the admin login. The secret comes from the {@code JWT_SECRET}
 * environment variable and must be at least 32 characters, the minimum for HMAC-SHA256.
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(String issuer, String audience, String secret, long expirationMinutes) {

    public JwtProperties {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be set and have at least 32 characters.");
        }
    }
}
