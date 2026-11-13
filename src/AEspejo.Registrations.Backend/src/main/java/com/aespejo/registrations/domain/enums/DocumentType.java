package com.aespejo.registrations.domain.enums;

/** Identity document type of an athlete. The numeric values are persisted as-is in the database. */
public enum DocumentType implements ValueEnum {
    Ci(0),
    Dni(1),
    Passport(2),
    ForeignerId(3),
    Rut(4),
    Cpf(5),
    Other(99);

    private final int value;

    DocumentType(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}