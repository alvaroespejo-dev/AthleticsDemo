package com.aespejo.registrations.domain.enums;

/** Garment type that a kit item or size refers to. The numeric values are persisted as-is in the database. */
public enum GarmentType implements ValueEnum {
    TShirt(1),
    Singlet(2);

    private final int value;

    GarmentType(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}