package com.aespejo.registrations.infrastructure.whatsapp;

import com.aespejo.registrations.application.marketing.WhatsAppMedia;
import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Downloads media from the Cloud API in two steps, ported from {@code MediaWhatsAppMeta}. First the media id gives a
 * short-lived signed URL, then that URL is fetched with the same Bearer token. The URL looks public but is not, and that
 * is where this usually fails.
 */
@Component
public class MetaMediaClient implements WhatsAppMedia {

    private static final Logger LOG = LoggerFactory.getLogger(MetaMediaClient.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient http;
    private final WhatsAppBrandResolver resolver;

    public MetaMediaClient(RestClient.Builder builder, WhatsAppProperties properties, WhatsAppBrandResolver resolver) {
        this.http = builder.baseUrl(properties.baseUrl()).build();
        this.resolver = resolver;
    }

    @Override
    public Optional<Downloaded> download(String brandCode, String mediaId) {
        WhatsAppCredentials credentials = resolver.resolve(brandCode);

        if (credentials.token() == null || credentials.token().isBlank()) {
            LOG.warn("Cannot download media {}: brand {} has no token.", mediaId, brandCode);
            return Optional.empty();
        }

        JsonNode metadata = metadata(credentials, mediaId);

        if (metadata == null || metadata.path("url").asText("").isBlank()) {
            return Optional.empty();
        }

        try {
            byte[] content = http.get()
                    .uri(metadata.path("url").asText())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + credentials.token())
                    .retrieve()
                    .body(byte[].class);

            String mimeType = metadata.path("mime_type").asText("");

            if (content == null) {
                return Optional.empty();
            }

            return Optional.of(new Downloaded(content, mimeType.isBlank() ? MediaType.APPLICATION_OCTET_STREAM_VALUE : mimeType));
        } catch (RestClientException ex) {
            LOG.warn("Could not download media {} ({}).", mediaId, brandCode, ex);
            return Optional.empty();
        }
    }

    private JsonNode metadata(WhatsAppCredentials credentials, String mediaId) {
        try {
            String body = http.get()
                    .uri("/{version}/{mediaId}", credentials.version(), mediaId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + credentials.token())
                    .retrieve()
                    .body(String.class);

            return JSON.readTree(body == null ? "{}" : body);
        } catch (RestClientResponseException ex) {
            // The usual cause is that Meta already purged the file after 30 days, which a forwarded old photo can hit.
            LOG.info("Meta no longer has media {}: {} {}", mediaId, ex.getStatusCode().value(), ex.getResponseBodyAsString());
            return null;
        } catch (RestClientException ex) {
            LOG.warn("Could not read the metadata of media {}.", mediaId, ex);
            return null;
        } catch (JacksonException ex) {
            LOG.warn("Media {} metadata has an unexpected format.", mediaId, ex);
            return null;
        }
    }
}
