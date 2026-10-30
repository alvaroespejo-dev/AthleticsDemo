package com.aespejo.registrations.application.settings;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/** Contracts of the global settings, ported from {@code ConfiguracionDto} in the C# reference. */
public final class SettingsModels {

    private SettingsModels() {
    }

    /** Organization-wide defaults. Read by any signed-in user. */
    public record SettingsView(
            String organizationName,
            String defaultWaiverText,
            int defaultReservationHours,
            int defaultPaymentToleranceCents,
            int serviceFeeCents,
            int moneySportAmountCents,
            OffsetDateTime updatedAt) {
    }

    /** Body for saving the defaults. Validation messages are keys from the bundles. */
    public record SaveSettingsRequest(
            @Size(max = 200) String organizationName,
            @Size(max = 8000) String defaultWaiverText,
            @NotNull @Min(value = 1, message = "settings.reservation.range")
            @Max(value = 720, message = "settings.reservation.range") Integer defaultReservationHours,
            @NotNull @Min(value = 0, message = "settings.tolerance.range")
            @Max(value = 10000, message = "settings.tolerance.range") Integer defaultPaymentToleranceCents,
            @NotNull @Min(value = 0, message = "settings.serviceFee.range")
            @Max(value = 10000, message = "settings.serviceFee.range") Integer serviceFeeCents,
            @NotNull @Min(value = 0, message = "settings.moneySport.range")
            @Max(value = 100000, message = "settings.moneySport.range") Integer moneySportAmountCents) {
    }

    /** The only settings the public site may see: the organization name. */
    public record PublicOrganization(String organizationName) {
    }

    /** The default waiver text offered when the settings have none. */
    public record SuggestedWaiver(String text) {
    }
}
