package com.aespejo.registrations.domain.enums;

/** Reconciliation state of a bank statement movement. The numeric values are persisted as-is in the database. */
public enum ReconciliationStatus implements ValueEnum {
    Pending(0),
    AutoReconciled(1),
    Suggested(2),
    ManuallyReconciled(3),
    Discarded(4);

    private final int value;

    ReconciliationStatus(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}