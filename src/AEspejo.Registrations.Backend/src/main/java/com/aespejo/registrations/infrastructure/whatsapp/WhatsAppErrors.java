package com.aespejo.registrations.infrastructure.whatsapp;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Turns a Graph API error response into text for a person. Meta puts the detail in
 * {@code error.message}, and that is what tells an operator what to fix, so it is preferred over the raw body.
 */
final class WhatsAppErrors {

    private static final ObjectMapper JSON = new ObjectMapper();

    private WhatsAppErrors() {
    }

    static String describe(int status, String body) {
        try {
            JsonNode error = JSON.readTree(body).path("error");
            String message = error.path("message").asText("");
            String details = error.path("error_data").path("details").asText("");

            if (!message.isBlank()) {
                return details.isBlank() ? message : message + " (" + details + ")";
            }
        } catch (JacksonException ex) {
            // Falls through to the raw body below.
        }

        return "HTTP " + status + ": " + body;
    }
}
