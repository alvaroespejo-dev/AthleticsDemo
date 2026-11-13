package com.aespejo.registrations.common.exception;

/**
 * Thrown when a change clashes with existing data, for example a duplicate name. Mapped to HTTP 409.
 * The message is a key from {@code messages*.properties}; {@code args} fill its placeholders.
 */
public class ConflictException extends RuntimeException {

    private final transient Object[] args;

    public ConflictException(String messageKey, Object... args) {
        super(messageKey);
        this.args = args;
    }

    public String getMessageKey() {
        return getMessage();
    }

    public Object[] getArgs() {
        return args;
    }
}
