package com.aespejo.registrations.common.exception;

/**
 * Thrown when credentials are wrong or the caller is not authenticated. Mapped to HTTP 401.
 * The message is a key from {@code messages*.properties}; {@code args} fill its placeholders.
 */
public class UnauthorizedException extends RuntimeException {

    private final transient Object[] args;

    public UnauthorizedException(String messageKey, Object... args) {
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
