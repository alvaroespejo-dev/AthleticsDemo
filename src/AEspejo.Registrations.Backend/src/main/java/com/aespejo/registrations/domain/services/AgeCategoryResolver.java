package com.aespejo.registrations.domain.services;

import com.aespejo.registrations.domain.entities.AgeCategory;
import com.aespejo.registrations.domain.enums.Sex;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Comparator;
import java.util.Optional;

/**
 * Chooses the award category of an athlete among the event's categories. Categories tied to the
 * athlete's modality take priority over general ones, then the sort order decides. Returns empty when
 * no category covers the athlete, so the report shows the gap instead of an invented value.
 */
public final class AgeCategoryResolver {

    private AgeCategoryResolver() {
    }

    public static Optional<AgeCategory> resolve(
            Collection<AgeCategory> categories,
            Sex sex,
            LocalDate birthDate,
            LocalDate eventDate,
            Integer modalityId) {
        int age = AgeCalculator.age(birthDate, eventDate);
        return categories.stream()
                .filter(c -> c.getSex() == sex)
                .filter(c -> age >= c.getMinAge() && age <= c.getMaxAge())
                .filter(c -> c.getModality() == null || c.getModality().getId().equals(modalityId))
                .min(Comparator.comparing((AgeCategory c) -> c.getModality() == null)
                        .thenComparingInt(AgeCategory::getSortOrder));
    }
}