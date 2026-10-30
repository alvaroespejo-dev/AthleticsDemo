package com.aespejo.registrations.domain.enums;

/** Lifecycle status of an event. The numeric values are persisted as-is in the database. */
public enum EventStatus implements ValueEnum {
    Draft(0),
    Published(1),
    Closed(2),
    Finished(3),
    Cancelled(4);

    private final int value;

    EventStatus(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}