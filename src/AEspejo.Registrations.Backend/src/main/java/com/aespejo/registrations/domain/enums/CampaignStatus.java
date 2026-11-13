package com.aespejo.registrations.domain.enums;

/** Lifecycle status of a messaging campaign. The numeric values are persisted as-is in the database. */
public enum CampaignStatus implements ValueEnum {
    Draft(0),
    Scheduled(1),
    Sending(2),
    Sent(3),
    Cancelled(4);

    private final int value;

    CampaignStatus(int value) {
        this.value = value;
    }

    @Override
    public int value() {
        return value;
    }
}