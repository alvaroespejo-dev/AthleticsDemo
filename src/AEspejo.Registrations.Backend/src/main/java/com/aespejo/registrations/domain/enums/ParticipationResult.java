package com.aespejo.registrations.domain.enums;

/** Participation result of an athlete after the event. The numeric values are persisted as-is in the database. */
public enum ParticipationResult implements ValueEnum {
    Finished(1),
    Dropped(2),
    NoShow(3);

    private final int value;

    ParticipationResult(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}