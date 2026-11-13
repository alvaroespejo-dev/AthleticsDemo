package com.aespejo.registrations.domain.enums;

/** How an athlete gave marketing consent. The numeric values are persisted as-is in the database. */
public enum OptInSource implements ValueEnum {
    Form(1),
    Imported(2),
    Manual(3);

    private final int value;

    OptInSource(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}