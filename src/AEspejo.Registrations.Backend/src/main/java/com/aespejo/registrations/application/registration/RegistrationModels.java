package com.aespejo.registrations.application.registration;

import com.aespejo.registrations.application.payment.PaymentModels;

import com.aespejo.registrations.domain.enums.DocumentType;
import com.aespejo.registrations.domain.enums.GarmentType;
import com.aespejo.registrations.domain.enums.ParticipationResult;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.enums.Sex;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** Request and response contracts of the registration endpoints. */
public final class RegistrationModels {

    private RegistrationModels() {
    }

    /** Public form body. {@code athleteId} is set only when the athlete was picked from the search. */
    public record CreateRegistrationRequest(
            @NotNull Integer modalityId,
            @NotNull Integer kitId,
            Integer sizeId,
            @NotNull DocumentType documentType,
            @NotBlank String documentNumber,
            String nationality,
            @NotBlank String firstNames,
            @NotBlank String lastNames,
            @NotNull Sex sex,
            @NotNull LocalDate birthDate,
            @NotBlank String phoneCountryCode,
            @NotBlank String phoneNumber,
            String email,
            String city,
            String club,
            String emergencyContactName,
            String emergencyContactPhoneCountryCode,
            String emergencyContactPhoneNumber,
            String bloodType,
            String allergies,
            boolean waiverAccepted,
            boolean marketingOptIn,
            String acquisitionChannel,
            String referralCode,
            Integer athleteId,
            /** Money Sport credit to apply, in cents. Null or zero means none. */
            Integer useMoneySportBalanceCents) {
    }

    public record RegistrationCreatedResponse(
            Integer id,
            String code,
            RegistrationStatus status,
            String eventName,
            String athleteName,
            String modalityName,
            String kitName,
            String sizeLabel,
            String ageCategoryName,
            int amountCents,
            OffsetDateTime reservationExpiresAt,
            boolean hasQr,
            int moneySportDiscountCents) {
    }

    /** One row of the event's registration list. */
    public record RegistrationListItem(
            Integer id,
            String code,
            Integer athleteId,
            String athleteName,
            String documentNumber,
            String modalityName,
            String kitName,
            String sizeLabel,
            String ageCategoryName,
            RegistrationStatus status,
            int amountCents,
            Integer bibNumber,
            ParticipationResult result,
            OffsetDateTime createdAt,
            OffsetDateTime reservationExpiresAt) {
    }

    /** Full view of one registration. Full registration view. */
    public record RegistrationDetail(
            Integer id,
            String code,
            RegistrationStatus status,
            Integer bibNumber,
            String eventName,
            LocalDate eventDate,
            String modality,
            String kit,
            String size,
            String ageCategory,
            int amountCents,
            int moneySportDiscountCents,
            long totalPaidCents,
            OffsetDateTime createdAt,
            OffsetDateTime reservationExpiresAt,
            OffsetDateTime paidAt,
            boolean waiverAccepted,
            OffsetDateTime waiverAcceptedAt,
            String waiverIp,
            String acquisitionChannel,
            String referralCode,
            boolean complimentary,
            String notes,
            ParticipationResult result,
            OffsetDateTime resultAt,
            AthleteInfo athlete,
            List<PaymentModels.PaymentItem> payments,
            KitDeliveryInfo kitDelivery,
            boolean hasReceipt) {
    }

    /** The athlete of a registration, as the detail screen shows it. Mirrors {@code AtletaDetalleDto}. */
    public record AthleteInfo(
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
            String phone,
            String email,
            String city,
            String club,
            String emergencyContactName,
            String emergencyContactPhone,
            String bloodType,
            String allergies,
            boolean marketingOptIn,
            OffsetDateTime marketingOptInAt,
            OffsetDateTime unsubscribedAt,
            int eventsParticipated) {
    }

    /** Who delivered the kit and when. Mirrors {@code EntregaKitDto}. */
    public record KitDeliveryInfo(OffsetDateTime deliveredAt, String user, String deliveryPoint, String pickedUpBy) {
    }

    public record BibRequest(Integer bibNumber) {
    }

    /**
     * Result of assigning or clearing a bib. {@code warning} is set when the bib is valid but outside the
     * modality's reserved range: the range only warns, it never blocks .
     */
    public record BibAssignmentResponse(Integer registrationId, Integer bibNumber, String warning, String message) {
    }

    public record CancelRequest(String reason) {
    }

    /** Null clears the result. */
    public record ResultRequest(ParticipationResult result) {
    }

    /** Result for several registrations of one event at once. A null result clears it. */
    public record BatchResultRequest(List<Integer> registrationIds, ParticipationResult result) {
    }

    /** How many registrations got the result, and how many were skipped (not paid, or would leave Money Sport negative). */
    public record BatchResultResponse(int updated, int omitted, String message) {
    }

    public record RecalculationResponse(int registrationsUpdated) {
    }

    /** Size label used on screens and reports, for example {@code M TShirt}. */
    static String sizeLabel(String measure, GarmentType type) {
        return measure == null ? null : measure + " " + type;
    }

    /** Sort order of the registrant list, as ({@code OrdenInscritos}). */
    public enum RegistrationOrder { DateDesc, DateAsc, LastName, Bib, Modality }

    /** One row of the registrant list. One row of the registration list. */
    public record RegistrationRow(
            Integer id,
            String code,
            RegistrationStatus status,
            Integer bibNumber,
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
            String modality,
            int distanceMeters,
            String kit,
            boolean requiresSize,
            String size,
            String ageCategory,
            int amountCents,
            long totalPaidCents,
            OffsetDateTime createdAt,
            OffsetDateTime reservationExpiresAt,
            boolean kitDelivered,
            Integer bibFrom,
            Integer bibTo,
            boolean hasReceipt,
            ParticipationResult result,
            OffsetDateTime resultAt,
            int moneySportDiscountCents) {
    }

    public record RegistrationPage(
            List<RegistrationRow> items,
            int page,
            int pageSize,
            long total,
            int totalPages,
            boolean hasPrevious,
            boolean hasNext) {
    }

    /** Counts and money of the whole event, not only of the page shown. Mirrors {@code ResumenInscritosDto}. */
    public record RegistrationSummary(
            long total,
            long paid,
            long pending,
            long underReview,
            long expired,
            long cancelled,
            long collectedCents,
            long expectedCents,
            long withoutSize,
            long withoutBib,
            long kitsDelivered,
            long withoutEmergencyContact,
            long withoutResult) {
    }

    public record RegistrationListing(RegistrationPage page, RegistrationSummary summary) {
    }
}