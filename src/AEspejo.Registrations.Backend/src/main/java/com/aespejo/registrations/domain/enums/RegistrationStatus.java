package com.aespejo.registrations.domain.enums;

/** Lifecycle status of a registration. The numeric values are persisted as-is in the database. */
public enum RegistrationStatus implements ValueEnum {
    Draft(0),
    Pending(1),
    Paid(2),
    UnderReview(3),
    Expired(4),
    Cancelled(5),
    Refunded(6);

    private final int value;

    RegistrationStatus(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}