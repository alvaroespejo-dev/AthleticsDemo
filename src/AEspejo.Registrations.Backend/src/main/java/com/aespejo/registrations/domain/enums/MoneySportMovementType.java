package com.aespejo.registrations.domain.enums;

/** Type of a Money Sport virtual wallet movement. The numeric values are persisted as-is in the database. */
public enum MoneySportMovementType implements ValueEnum {
    Credit(1),
    Debit(2);

    private final int value;

    MoneySportMovementType(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}