package com.aespejo.registrations.domain.enums;

/** Rule that matched a payment to a registration. The numeric values are persisted as-is in the database. */
public enum ReconciliationRule implements ValueEnum {
    None(0),
    TransactionNumber(1),
    AmountAndPayer(3),
    Manual(4);

    private final int value;

    ReconciliationRule(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}