package com.aespejo.registrations.domain.services;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Derives the public URL identifier of an event from its name. Accents are removed, the text is
 * lowercased, and every run of other characters becomes a single hyphen. The result is at most 80
 * characters long.
 */
public final class SlugGenerator {

    private static final int MAX_LENGTH = 80;

    private SlugGenerator() {
    }

    public static String generate(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("text must not be blank");
        }
        String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String slug = withoutAccents.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.length() > MAX_LENGTH) {
            slug = slug.substring(0, MAX_LENGTH).replaceAll("-+$", "");
        }
        return slug;
    }
}
