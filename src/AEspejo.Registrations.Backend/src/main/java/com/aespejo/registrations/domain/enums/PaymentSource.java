package com.aespejo.registrations.domain.enums;

/** Channel through which a payment was credited. The numeric values are persisted as-is in the database. */
public enum PaymentSource implements ValueEnum {
    Statement(1),
    Receipt(2),
    Manual(3),
    Webhook(4);

    private final int value;

    PaymentSource(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}