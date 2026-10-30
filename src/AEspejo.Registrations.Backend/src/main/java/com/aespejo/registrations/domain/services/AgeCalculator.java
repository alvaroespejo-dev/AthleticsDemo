package com.aespejo.registrations.domain.services;

import java.time.LocalDate;

/**
 * Age of an athlete on a reference date. Age is evaluated on the event date, never on the
 * registration date. Athletes born on 29 February turn 28 in non-leap years, as {@link LocalDate#plusYears} does.
 */
public final class AgeCalculator {

    private AgeCalculator() {
    }

    public static int age(LocalDate birthDate, LocalDate referenceDate) {
        if (birthDate.isAfter(referenceDate)) {
            throw new IllegalArgumentException("birth date must not be after the reference date");
        }
        int age = referenceDate.getYear() - birthDate.getYear();
        if (referenceDate.isBefore(birthDate.plusYears(age))) {
            age--;
        }
        return age;
    }
}