package com.aespejo.registrations.api.webhook;

import com.aespejo.registrations.application.marketing.WhatsAppWebhookService;
import java.io.IOException;
import com.aespejo.registrations.infrastructure.whatsapp.WebhookSignature;
import com.aespejo.registrations.infrastructure.whatsapp.WhatsAppBrandResolver;
import com.aespejo.registrations.infrastructure.whatsapp.WhatsAppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Callback of Meta's Cloud API: inbound messages and delivery statuses arrive here. It is anonymous because Meta does not send our JWT; authentication is the
 * {@code X-Hub-Signature-256} signature made with the app secret. Every brand points at this same URL, and routing to the
 * brand happens inside, by {@code phone_number_id}. Public access is granted in {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/webhooks/whatsapp")
public class WhatsAppWebhookController {

    private static final Logger LOG = LoggerFactory.getLogger(WhatsAppWebhookController.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final WhatsAppWebhookService service;
    private final WhatsAppBrandResolver resolver;
    private final WhatsAppProperties properties;

    public WhatsAppWebhookController(WhatsAppWebhookService service, WhatsAppBrandResolver resolver,
                                     WhatsAppProperties properties) {
        this.service = service;
        this.resolver = resolver;
        this.properties = properties;
    }

    /** The handshake when the webhook is registered: Meta sends the verify token and expects the challenge back as text. */
    @GetMapping
    public ResponseEntity<String> verify(@RequestParam(name = "hub.mode", required = false) String mode,
                                         @RequestParam(name = "hub.verify_token", required = false) String token,
                                         @RequestParam(name = "hub.challenge", required = false) String challenge) {
        String expected = properties.webhook().verifyToken();

        if (!"subscribe".equals(mode) || expected.isEmpty() || !expected.equals(token)) {
            LOG.warn("WhatsApp webhook handshake rejected: the token does not match.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(challenge == null ? "" : challenge);
    }

    /**
     * Receives the events. It always answers 200 unless the signature is invalid: a 500 makes Meta resend the batch in a
     * loop until it removes the subscription, so any processing error is logged and swallowed here.
     */
    @PostMapping
    public ResponseEntity<Void> receive(@RequestBody byte[] rawBody,
                                        @RequestHeader(name = "X-Hub-Signature-256", required = false) String signature) {
        if (properties.webhook().requireSignature()) {
            if (!WebhookSignature.verify(rawBody, signature, resolver.appSecrets())) {
                LOG.warn("WhatsApp webhook with an invalid or missing signature.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        } else {
            LOG.warn("WhatsApp webhook processed without validating the signature (requireSignature=false).");
        }

        try {
            JsonNode payload = JSON.readTree(rawBody);
            service.process(payload);
        } catch (IOException ex) {
            LOG.warn("The WhatsApp webhook body is not valid JSON.", ex);
        } catch (RuntimeException ex) {
            LOG.error("Processing the WhatsApp webhook failed.", ex);
        }

        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").build();
    }
}
