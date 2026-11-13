package com.aespejo.registrations.application.athlete;

import com.aespejo.registrations.common.PageResponse;
import com.aespejo.registrations.domain.enums.DocumentType;
import com.aespejo.registrations.domain.enums.ParticipationResult;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.enums.Sex;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** Contracts of the athlete register (padron). */
public final class AthleteModels {

    private AthleteModels() {
    }

    /** Sort order of the register list. */
    public enum AthleteOrder { LastNameAsc, RecentDesc, MostEvents, LastRaceDesc }

    /** Filters of the register. Filters are optional; a missing filter matches everything. */
    public record AthleteFilter(
            String text,
            String city,
            String club,
            Sex sex,
            Integer minAge,
            Integer maxAge,
            Boolean marketingOptIn,
            Boolean withEmail,
            Integer eventId,
            AthleteOrder order) {
    }

    /** One row of the register: one person, not one registration. */
    public record AthleteRow(
            Integer id,
            DocumentType documentType,
            String documentNumber,
            String firstNames,
            String lastNames,
            Sex sex,
            LocalDate birthDate,
            int age,
            String phone,
            String email,
            String city,
            String club,
            int eventsRegistered,
            int eventsPaid,
            String lastEventName,
            LocalDate lastEventDate,
            boolean marketingOptIn,
            OffsetDateTime unsubscribedAt) {
    }

    /** Totals of the filtered register. */
    public record AthleteSummary(long total, long withWhatsApp, long withEmail, long withMarketingOptIn, long unsubscribed) {
    }

    public record AthleteListing(PageResponse<AthleteRow> page, AthleteSummary summary) {
    }

    /** One registration of the athlete, read-only. */
    public record ParticipationItem(
            Integer registrationId,
            Integer eventId,
            String code,
            String eventName,
            LocalDate eventDate,
            String modality,
            RegistrationStatus status,
            Integer bibNumber,
            int distanceMeters,
            ParticipationResult result) {
    }

    /** Full data of the athlete, for the edit form. Phones are split into country code and number. */
    public record AthleteDetail(
            Integer id,
            DocumentType documentType,
            String documentNumber,
            String documentNumberOriginal,
            String nationality,
            String firstNames,
            String lastNames,
            Sex sex,
            LocalDate birthDate,
            int age,
            String phoneCountryCode,
            String phoneNumber,
            String email,
            String city,
            String club,
            String emergencyContactName,
            String emergencyContactPhoneCountryCode,
            String emergencyContactPhoneNumber,
            String bloodType,
            String allergies,
            boolean marketingOptIn,
            OffsetDateTime marketingOptInAt,
            OffsetDateTime unsubscribedAt,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            List<ParticipationItem> participations) {
    }

    /** Body for correcting personal and contact data. Does not touch registrations, payments or consent. */
    public record SaveAthleteRequest(
            @NotNull DocumentType documentType,
            @NotBlank @Size(min = 4, max = 30) String documentNumber,
            @Size(min = 2, max = 2) String nationality,
            @NotBlank @Size(min = 2, max = 120) String firstNames,
            @NotBlank @Size(min = 2, max = 120) String lastNames,
            @NotNull Sex sex,
            @NotNull LocalDate birthDate,
            @NotBlank @Pattern(regexp = "^[1-9]\\d{0,2}$", message = "phone.countryCode.invalid") String phoneCountryCode,
            @NotBlank @Pattern(regexp = "^\\d{4,12}$", message = "phone.number.invalid") String phoneNumber,
            @Email @Size(max = 200) String email,
            @Size(max = 100) String city,
            @Size(max = 150) String club,
            @Size(min = 2, max = 150) String emergencyContactName,
            @Pattern(regexp = "^[1-9]\\d{0,2}$", message = "phone.countryCode.invalid") String emergencyContactPhoneCountryCode,
            @Pattern(regexp = "^\\d{4,12}$", message = "phone.number.invalid") String emergencyContactPhoneNumber,
            @Size(max = 10) String bloodType,
            @Size(max = 1000) String allergies) {
    }

    /** One linked external sign-in (Auth0 account) of an athlete. */
    public record LinkedAccount(Integer accountId, String provider, String email,
                                OffsetDateTime createdAt, OffsetDateTime lastAccessAt) {
    }
}
