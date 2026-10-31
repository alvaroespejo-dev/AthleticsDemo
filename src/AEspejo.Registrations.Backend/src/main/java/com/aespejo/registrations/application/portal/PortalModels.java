package com.aespejo.registrations.application.portal;

import com.aespejo.registrations.application.athlete.AthleteModels.AthleteDetail;
import com.aespejo.registrations.domain.enums.DocumentType;
import com.aespejo.registrations.domain.enums.Sex;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Contracts of the athlete self-service portal. */
public final class PortalModels {

    private PortalModels() {
    }

    /** What the external identity provider says about the signed-in person. */
    public record Identity(String email, boolean emailVerified, String firstNames, String lastNames) {
    }

    /**
     * The signed-in account. {@code profile} is null while the person has not completed the sign-up, which is how the
     * portal knows to ask for the data.
     */
    public record AccountView(
            Integer accountId,
            Integer athleteId,
            String email,
            AthleteDetail profile,
            String suggestedFirstNames,
            String suggestedLastNames) {
    }

    /** Sign-up and profile body of the portal. Mirrors {@code GuardarPerfilAtletaDto}. */
    public record SaveProfileRequest(
            @NotNull DocumentType documentType,
            @NotBlank @Size(min = 4, max = 30) String documentNumber,
            @Size(min = 2, max = 2) String nationality,
            @NotBlank @Size(min = 2, max = 120) String firstNames,
            @NotBlank @Size(min = 2, max = 120) String lastNames,
            @NotNull Sex sex,
            @NotNull LocalDate birthDate,
            @NotBlank @Pattern(regexp = "^[1-9]\\d{0,2}$", message = "phone.countryCode.invalid") String phoneCountryCode,
            @NotBlank @Pattern(regexp = "^\\d{4,12}$", message = "phone.number.invalid") String phoneNumber,
            @Size(max = 100) String city,
            @Size(max = 150) String club,
            @Size(min = 2, max = 150) String emergencyContactName,
            @Pattern(regexp = "^[1-9]\\d{0,2}$", message = "phone.countryCode.invalid") String emergencyContactPhoneCountryCode,
            @Pattern(regexp = "^\\d{4,12}$", message = "phone.number.invalid") String emergencyContactPhoneNumber,
            @Size(max = 10) String bloodType,
            @Size(max = 1000) String allergies,
            boolean acceptsMarketing) {
    }

    /** Claim of an athlete who already exists, verified with document plus phone. Mirrors {@code ReclamarAtletaDto}. */
    public record ClaimRequest(
            @NotNull DocumentType documentType,
            @NotBlank @Size(min = 4, max = 30) String documentNumber,
            @Size(min = 2, max = 2) String nationality,
            @NotBlank @Pattern(regexp = "^[1-9]\\d{0,2}$", message = "phone.countryCode.invalid") String phoneCountryCode,
            @NotBlank @Pattern(regexp = "^\\d{4,12}$", message = "phone.number.invalid") String phoneNumber) {
    }
}
