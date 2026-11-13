package com.aespejo.registrations.domain.enums;

/** Delivery status of an outgoing message. The numeric values are persisted as-is in the database. */
public enum MessageStatus implements ValueEnum {
    Pending(0),
    Sent(1),
    Delivered(2),
    Read(3),
    Failed(4);

    private final int value;

    MessageStatus(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}