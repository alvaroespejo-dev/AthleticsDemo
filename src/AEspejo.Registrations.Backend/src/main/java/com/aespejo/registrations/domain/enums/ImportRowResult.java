package com.aespejo.registrations.domain.enums;

/** Outcome of processing one row of an athlete import. The numeric values are persisted as-is in the database. */
public enum ImportRowResult implements ValueEnum {
    Accepted(1),
    Corrected(2),
    InReview(3),
    Duplicate(4),
    Rejected(5);

    private final int value;

    ImportRowResult(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}