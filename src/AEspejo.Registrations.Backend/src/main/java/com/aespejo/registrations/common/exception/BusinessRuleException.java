package com.aespejo.registrations.common.exception;

/**
 * Thrown when a request violates a business rule, for example publishing an incomplete event.
 * Mapped to HTTP 422. The message is a key from {@code messages*.properties}; {@code args} fill its placeholders.
 */
public class BusinessRuleException extends RuntimeException {

    private final transient Object[] args;

    public BusinessRuleException(String messageKey, Object... args) {
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
