package com.aespejo.registrations.infrastructure.whatsapp;

import com.aespejo.registrations.application.marketing.WhatsAppTemplateCatalog;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Reads a brand's approved templates from the Graph API. Asking
 * which messages may be sent needs a different permission and endpoint than sending them, so it is a separate class
 * from {@link MetaWhatsAppSender}. Only successful results are cached: caching a failure would keep showing the same
 * error for five minutes after the credential was fixed.
 */
@Component
public class MetaTemplateCatalog implements WhatsAppTemplateCatalog {

    private static final Logger LOG = LoggerFactory.getLogger(MetaTemplateCatalog.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    // Approving a template takes minutes to hours, so five minutes is fresh enough. The panel's refresh button covers the rest.
    private static final Duration TTL = Duration.ofMinutes(5);

    // Sanity limit so a cursor loop cannot run forever.
    private static final int MAX_PAGES = 10;

    private static final Pattern POSITIONAL = Pattern.compile("\\{\\{\\s*(\\d+)\\s*\\}\\}");

    private final RestClient http;
    private final WhatsAppBrandResolver resolver;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public MetaTemplateCatalog(RestClient.Builder builder, WhatsAppProperties properties, WhatsAppBrandResolver resolver) {
        this.http = builder.baseUrl(properties.baseUrl()).build();
        this.resolver = resolver;
    }

    @Override
    public List<Template> listApproved(String brandCode, boolean refresh) {
        WhatsAppCredentials credentials = resolver.resolve(brandCode);

        if (credentials.businessAccountId() == null || credentials.businessAccountId().isBlank()) {
            throw new BusinessRuleException("whatsapp.templates.noBusinessAccount", brandCode);
        }

        if (credentials.token() == null || credentials.token().isBlank()) {
            throw new BusinessRuleException("whatsapp.templates.noToken", brandCode);
        }

        // Keyed by the account consulted, not by the brand asking: two brands sharing an account make one call to Meta.
        String key = credentials.businessAccountId() + ":" + credentials.version();

        if (refresh) {
            cache.remove(key);
        }

        Cached hit = cache.get(key);

        if (hit != null && hit.expiresAt().isAfter(Instant.now())) {
            return hit.templates();
        }

        List<Template> templates = fetchApproved(credentials);
        cache.put(key, new Cached(Instant.now().plus(TTL), templates));

        return templates;
    }

    /** All pages, keeping only approved templates that have a body. */
    private List<Template> fetchApproved(WhatsAppCredentials credentials) {
        List<JsonNode> raw = new ArrayList<>();
        String cursor = null;

        for (int page = 0; page < MAX_PAGES; page++) {
            String path = "/" + credentials.version() + "/" + credentials.businessAccountId()
                    + "/message_templates?limit=100&fields=name,language,status,category,components"
                    + (cursor == null ? "" : "&after=" + URLEncoder.encode(cursor, StandardCharsets.UTF_8));

            JsonNode body = get(path, credentials);
            body.path("data").forEach(raw::add);

            cursor = body.path("paging").path("cursors").path("after").asText(null);

            if (cursor == null || cursor.isBlank()) {
                break;
            }
        }

        return raw.stream()
                .filter(t -> "APPROVED".equalsIgnoreCase(t.path("status").asText("")))
                .map(MetaTemplateCatalog::project)
                .filter(t -> t != null)
                .sorted(Comparator.comparing(Template::name, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Template::language, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private JsonNode get(String path, WhatsAppCredentials credentials) {
        try {
            String body = http.get()
                    .uri(path)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + credentials.token())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);

            return JSON.readTree(body == null ? "{}" : body);
        } catch (RestClientResponseException ex) {
            String error = WhatsAppErrors.describe(ex.getStatusCode().value(), ex.getResponseBodyAsString());
            LOG.warn("Meta rejected the template list: {} {}", ex.getStatusCode().value(), error);
            throw new BusinessRuleException("whatsapp.templates.rejected", error);
        } catch (RestClientException ex) {
            LOG.warn("Could not reach the Graph API to list templates.", ex);
            throw new BusinessRuleException("whatsapp.templates.unreachable");
        } catch (com.fasterxml.jackson.core.JacksonException ex) {
            throw new BusinessRuleException("whatsapp.templates.rejected", ex.getOriginalMessage());
        }
    }

    /**
     * Takes the body text and, when present, the first row of body examples. The header and footer are optional, and
     * a TEXT header is kept while an image header is simply left out, without dropping the whole template.
     */
    private static Template project(JsonNode template) {
        List<JsonNode> components = new ArrayList<>();
        template.path("components").forEach(components::add);

        JsonNode body = find(components, "BODY");
        String name = template.path("name").asText(null);
        String language = template.path("language").asText(null);

        if (body == null || body.path("text").asText("").isBlank() || name == null || language == null) {
            return null;
        }

        String bodyText = body.path("text").asText();
        JsonNode header = find(components, "HEADER");
        JsonNode footer = find(components, "FOOTER");

        List<String> examples = new ArrayList<>();
        body.path("example").path("body_text").path(0).forEach(value -> examples.add(value.asText()));

        return new Template(
                name,
                language,
                template.path("status").asText("APPROVED"),
                template.path("category").asText(null),
                header != null && "TEXT".equals(header.path("format").asText()) ? header.path("text").asText(null) : null,
                header == null ? null : header.path("format").asText(null),
                bodyText,
                footer == null ? null : footer.path("text").asText(null),
                parameterCount(bodyText),
                examples);
    }

    /** The highest positional index in the body: the number of values the Cloud API expects. */
    static int parameterCount(String body) {
        Matcher matcher = POSITIONAL.matcher(body);
        int max = 0;

        while (matcher.find()) {
            max = Math.max(max, Integer.parseInt(matcher.group(1)));
        }

        return max;
    }

    private static JsonNode find(List<JsonNode> components, String type) {
        return components.stream()
                .filter(c -> type.equalsIgnoreCase(c.path("type").asText("")))
                .findFirst()
                .orElse(null);
    }

    private record Cached(Instant expiresAt, List<Template> templates) {
    }
}
