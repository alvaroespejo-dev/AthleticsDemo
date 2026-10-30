package com.aespejo.registrations.domain.enums;

/** Direction of a WhatsApp message. The numeric values are persisted as-is in the database. */
public enum MessageDirection implements ValueEnum {
    Inbound(1),
    Outbound(2);

    private final int value;

    MessageDirection(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}