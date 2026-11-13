package com.aespejo.registrations.application.athlete;

import com.aespejo.registrations.domain.enums.DocumentType;
import com.aespejo.registrations.domain.enums.Sex;
import java.time.LocalDate;

/** Contracts of the public athlete lookup. Contract returned for each athlete found. */
public final class AthleteSearchModels {

    private AthleteSearchModels() {
    }

    /**
     * What is already known about an athlete, to pre-fill the public form. {@code alreadyRegisteredInEvent} is null when
     * the lookup had no event.
     */
    public record FoundAthlete(
            Integer id,
            DocumentType documentType,
            String documentNumber,
            String firstNames,
            String lastNames,
            Sex sex,
            LocalDate birthDate,
            String phoneCountryCode,
            String phoneNumber,
            String email,
            String city,
            String club,
            String nationality,
            String emergencyContactName,
            String emergencyContactPhoneCountryCode,
            String emergencyContactPhoneNumber,
            String bloodType,
            String allergies,
            Boolean alreadyRegisteredInEvent,
            long moneySportBalanceCents) {
    }
}
