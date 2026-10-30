package com.aespejo.registrations.infrastructure.whatsapp;

import com.aespejo.registrations.application.marketing.WhatsAppSender;
import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Sends through the official WhatsApp Cloud API (Meta Graph API), ported from {@code ProveedorWhatsAppMeta}. Marketing
 * messages outside the 24-hour window must be approved templates, so a campaign always sends a template and never free
 * text. The rendered body goes as positional parameters, in the order the placeholders appear.
 */
@Component
public class MetaWhatsAppSender implements WhatsAppSender {

    private static final Logger LOG = LoggerFactory.getLogger(MetaWhatsAppSender.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient http;
    private final WhatsAppBrandResolver resolver;

    public MetaWhatsAppSender(RestClient.Builder builder, WhatsAppProperties properties, WhatsAppBrandResolver resolver) {
        this.http = builder.baseUrl(properties.baseUrl()).build();
        this.resolver = resolver;
    }

    @Override
    public String providerNameFor(String brandCode) {
        return WhatsAppProperties.PROVIDER_META;
    }

    @Override
    public SendResult sendTemplate(TemplateSend send) {
        WhatsAppCredentials credentials = resolver.resolve(send.brandCode());

        if (!credentials.hasSendingNumber()) {
            return notConfigured(credentials);
        }

        if (send.templateName() == null || send.templateName().isBlank()) {
            return SendResult.permanent("La campaña no tiene nombre de plantilla aprobada en Meta.");
        }

        Map<String, Object> template = new LinkedHashMap<>();
        template.put("name", send.templateName());
        template.put("language", Map.of("code", send.language()));
        template.put("components", components(send));

        return post(credentials, message(send.phoneE164(), "template", template), send.brandCode());
    }

    @Override
    public SendResult sendText(TextReply reply) {
        WhatsAppCredentials credentials = resolver.resolve(reply.brandCode());

        if (!credentials.hasSendingNumber()) {
            return notConfigured(credentials);
        }

        Map<String, Object> message = message(reply.phoneE164(), "text",
                Map.of("body", reply.text(), "preview_url", true));

        if (reply.repliedExternalId() != null) {
            message.put("context", Map.of("message_id", reply.repliedExternalId()));
        }

        return post(credentials, message, reply.brandCode());
    }

    @Override
    public void markRead(String brandCode, String externalId) {
        WhatsAppCredentials credentials = resolver.resolve(brandCode);

        if (!credentials.hasSendingNumber()) {
            return;
        }

        try {
            http.post()
                    .uri("/{version}/{phoneNumberId}/messages", credentials.version(), credentials.phoneNumberId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + credentials.token())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("messaging_product", "whatsapp", "status", "read", "message_id", externalId))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            LOG.warn("Meta did not confirm the read of {} ({}): {}", externalId, brandCode,
                    WhatsAppErrors.describe(ex.getStatusCode().value(), ex.getResponseBodyAsString()));
        } catch (RestClientException ex) {
            // Not critical: the message is already in the inbox, only the blue check is missing.
            LOG.warn("Could not mark {} as read ({}).", externalId, brandCode, ex);
        }
    }

    /** Parameters of the header and body components. The header image, when present, replaces the text header. */
    private static List<Map<String, Object>> components(TemplateSend send) {
        List<Map<String, Object>> components = new ArrayList<>();

        if (send.headerImageUrl() != null && !send.headerImageUrl().isBlank()) {
            components.add(Map.of("type", "header", "parameters", List.of(
                    Map.of("type", "image", "image", Map.of("link", send.headerImageUrl())))));
        } else if (send.headerParameters() != null && !send.headerParameters().isEmpty()) {
            components.add(Map.of("type", "header", "parameters", textParameters(send.headerParameters())));
        }

        components.add(Map.of("type", "body", "parameters", textParameters(send.parameters())));
        return components;
    }

    private static List<Map<String, Object>> textParameters(List<String> values) {
        return values.stream().map(value -> Map.<String, Object>of("type", "text", "text", value)).toList();
    }

    private static Map<String, Object> message(String phoneE164, String type, Map<String, ?> content) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("messaging_product", "whatsapp");
        message.put("recipient_type", "individual");
        // Meta expects the number without the plus sign.
        message.put("to", phoneE164.replace("+", ""));
        message.put("type", type);
        message.put(type, content);
        return message;
    }

    private SendResult post(WhatsAppCredentials credentials, Map<String, Object> message, String brandCode) {
        try {
            String body = http.post()
                    .uri("/{version}/{phoneNumberId}/messages", credentials.version(), credentials.phoneNumberId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + credentials.token())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(message)
                    .retrieve()
                    .body(String.class);

            return SendResult.ok(messageId(body));
        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();
            String error = WhatsAppErrors.describe(status, ex.getResponseBodyAsString());

            LOG.warn("Meta rejected the message from {}: {} {}", brandCode, status, error);

            // 429 and 5xx come from Meta's infrastructure and clear up by themselves; the rest will not improve by retrying.
            return status == 429 || status >= 500 ? SendResult.transientFailure(error) : SendResult.permanent(error);
        } catch (RestClientException ex) {
            LOG.warn("Could not reach Meta from {}.", brandCode, ex);
            return SendResult.transientFailure("No se pudo contactar a Meta: " + ex.getMessage());
        }
    }

    /** The {@code messages[0].id} of the response: the wamid used later to match status webhooks. */
    private static String messageId(String json) {
        if (json == null) {
            return null;
        }

        try {
            String id = JSON.readTree(json).path("messages").path(0).path("id").asText("");
            return id.isEmpty() ? null : id;
        } catch (JacksonException ex) {
            return null;
        }
    }

    private static SendResult notConfigured(WhatsAppCredentials credentials) {
        return SendResult.notConfigured("Falta configurar el número de WhatsApp de la marca «" + credentials.brandCode()
                + "»: whatsapp.brands." + credentials.brandCode() + ".phone-number-id y .token.");
    }
}
