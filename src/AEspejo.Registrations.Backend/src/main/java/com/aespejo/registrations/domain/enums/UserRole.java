package com.aespejo.registrations.domain.enums;

/** Role of a back-office user. The numeric values are persisted as-is in the database. */
public enum UserRole implements ValueEnum {
    Admin(1),
    Cashier(2),
    KitStaff(3),
    ReadOnly(4);

    private final int value;

    UserRole(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}