package com.aespejo.registrations.domain.services;

import java.security.SecureRandom;

/** Public registration code such as {@code K7QD-3MNP}. The alphabet leaves out look-alike characters (0/O, 1/I). */
public final class RegistrationCodeGenerator {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int BLOCK_LENGTH = 4;
    private static final SecureRandom RANDOM = new SecureRandom();

    private RegistrationCodeGenerator() {
    }

    public static String generate() {
        return block() + "-" + block();
    }

    private static String block() {
        StringBuilder block = new StringBuilder(BLOCK_LENGTH);
        for (int i = 0; i < BLOCK_LENGTH; i++) {
            block.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return block.toString();
    }
}