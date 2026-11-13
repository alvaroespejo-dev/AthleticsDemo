package com.aespejo.registrations.infrastructure.security;

import com.aespejo.registrations.application.portal.PortalModels.Identity;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Reads the profile of an Auth0 identity from {@code /userinfo}. Failures are not fatal: the portal then asks the athlete
 * to fill in the form from scratch.
 */
@Component
public class Auth0UserInfo {

    private static final Logger LOG = LoggerFactory.getLogger(Auth0UserInfo.class);

    private final String domain;
    private final RestClient http;

    public Auth0UserInfo(@Value("${auth0.domain:}") String domain) {
        this.domain = domain;
        this.http = RestClient.builder().baseUrl("https://" + domain).build();
    }

    public Optional<Identity> fetch(String accessToken) {
        if (domain == null || domain.isBlank()) {
            return Optional.empty();
        }
        try {
            UserInfo info = http.get()
                    .uri("/userinfo")
                    .headers(headers -> headers.setBearerAuth(accessToken))
                    .retrieve()
                    .body(UserInfo.class);
            if (info == null || info.email() == null || info.email().isBlank()) {
                return Optional.empty();
            }
            return Optional.of(split(info));
        } catch (RestClientException e) {
            LOG.warn("Auth0 /userinfo could not be read: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /** Names for the sign-up form. A plain "name" that is actually an e-mail is discarded. */
    private static Identity split(UserInfo info) {
        boolean verified = Boolean.TRUE.equals(info.emailVerified());
        if ((info.givenName() != null && !info.givenName().isBlank())
                || (info.familyName() != null && !info.familyName().isBlank())) {
            return new Identity(info.email(), verified, info.givenName(), info.familyName());
        }
        String full = info.name() == null ? "" : info.name().trim();
        if (full.isEmpty() || full.contains("@")) {
            return new Identity(info.email(), verified, null, null);
        }
        int cut = full.indexOf(' ');
        return cut < 0
                ? new Identity(info.email(), verified, full, null)
                : new Identity(info.email(), verified, full.substring(0, cut), full.substring(cut + 1).trim());
    }

    private record UserInfo(
            String email,
            @JsonProperty("email_verified") Boolean emailVerified,
            @JsonProperty("given_name") String givenName,
            @JsonProperty("family_name") String familyName,
            String name) {
    }
}
