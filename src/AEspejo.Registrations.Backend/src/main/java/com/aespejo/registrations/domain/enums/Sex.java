package com.aespejo.registrations.domain.enums;

/** Sex of an athlete, also used by age categories. The numeric values are persisted as-is in the database. */
public enum Sex implements ValueEnum {
    Female(1),
    Male(2);

    private final int value;

    Sex(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}