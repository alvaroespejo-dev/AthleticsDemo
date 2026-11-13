package com.aespejo.registrations.domain.services;

import java.util.Locale;
import java.util.Optional;

/**
 * Cleans the fields used to deduplicate athletes. Historical data contains documents such as
 * {@code 17197} or {@code 19DF48276} and phone numbers with mixed prefixes and separators; without
 * normalization the athlete base fills up with duplicates.
 */
public final class DataNormalizer {

    private static final String DEFAULT_COUNTRY_CODE = "591";

    /** A phone number split into its international prefix and its national number. */
    public record Phone(String countryCode, String number) {
    }

    private DataNormalizer() {
    }

    /** Uppercase, no spaces or hyphens. Letters are kept because passports and some IDs contain them. */
    public static String normalizeDocument(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("document must not be blank");
        }
        return value.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
    }

    /**
     * Validates and cleans a country code and a phone number that arrive as separate values.
     * Returns empty when the result is not a valid phone, so the row is rejected instead of stored dirty.
     * Bolivian mobile numbers must have 8 digits and start with 6 or 7. Other countries only need a
     * reasonable digit count, because the rules of each country are not known here.
     */
    public static Optional<Phone> normalizePhone(String countryCode, String number) {
        if (number == null || number.isBlank()) {
            return Optional.empty();
        }
        String digits = number.replaceAll("\\D", "");
        String prefix = countryCode == null ? "" : countryCode.replaceAll("\\D", "");
        if (prefix.isEmpty()) {
            prefix = DEFAULT_COUNTRY_CODE;
        }
        if (DEFAULT_COUNTRY_CODE.equals(prefix)) {
            if (digits.length() != 8 || (digits.charAt(0) != '6' && digits.charAt(0) != '7')) {
                return Optional.empty();
            }
        } else if (digits.length() < 4 || digits.length() > 12) {
            return Optional.empty();
        }
        return Optional.of(new Phone(prefix, digits));
    }

    /** Collapses spaces and applies proper-name capitalization. */
    public static String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        StringBuilder result = new StringBuilder();
        for (String part : name.trim().split("\\s+")) {
            if (result.length() > 0) {
                result.append(' ');
            }
            result.append(part.length() == 1
                    ? part.toUpperCase(Locale.ROOT)
                    : Character.toUpperCase(part.charAt(0)) + part.substring(1).toLowerCase(Locale.ROOT));
        }
        return result.toString();
    }
}