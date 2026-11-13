package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.domain.enums.EventStatus;
import com.aespejo.registrations.domain.enums.GarmentType;
import com.aespejo.registrations.domain.enums.Sex;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** Request and response bodies of the catalog endpoints, as JSON contract records. */
public final class CatalogModels {

    private CatalogModels() {
    }

    // ---- Requests ----

    /** Body for creating or updating an event. */
    public record SaveEventRequest(
            @NotBlank String name,
            @NotNull Integer brandId,
            String slug,
            String description,
            String location,
            @NotNull LocalDate eventDate,
            @NotNull OffsetDateTime registrationOpensAt,
            @NotNull OffsetDateTime registrationClosesAt,
            OffsetDateTime sizeChangeClosesAt,
            @NotNull Integer reservationHours,
            @NotNull Integer paymentToleranceCents,
            Integer serviceFeeCents,
            String waiverText,
            String imagePath,
            String runnerManualPath,
            String runnerManualName) {
    }

    /** Body for creating or updating a modality. */
    public record SaveModalityRequest(
            @NotBlank String name,
            @NotNull Integer distanceMeters,
            Integer quota,
            @NotNull Integer sortOrder,
            Integer minAge,
            @NotNull Boolean active,
            Integer bibFrom,
            Integer bibTo) {
    }

    // ---- Responses ----

    public record BrandResponse(Integer id, String code, String name, boolean active) {
    }

    /** Row of the event list. */
    public record EventSummaryResponse(
            Integer id,
            String name,
            Integer brandId,
            String brandName,
            String slug,
            String location,
            LocalDate eventDate,
            OffsetDateTime registrationOpensAt,
            OffsetDateTime registrationClosesAt,
            EventStatus status,
            int modalityCount,
            long paidRegistrations,
            long pendingRegistrations,
            int serviceFeeCents,
            String imagePath) {
    }

    public record EventDetailResponse(
            Integer id,
            String name,
            Integer brandId,
            String brandName,
            String slug,
            String description,
            String location,
            LocalDate eventDate,
            OffsetDateTime registrationOpensAt,
            OffsetDateTime registrationClosesAt,
            OffsetDateTime sizeChangeClosesAt,
            EventStatus status,
            int reservationHours,
            int paymentToleranceCents,
            int serviceFeeCents,
            String waiverText,
            String imagePath,
            String runnerManualPath,
            String runnerManualName,
            List<ModalityResponse> modalities,
            List<AgeCategoryResponse> ageCategories) {
    }

    public record ModalityResponse(
            Integer id,
            Integer eventId,
            String name,
            int distanceMeters,
            Integer quota,
            int sortOrder,
            Integer minAge,
            boolean active,
            Integer bibFrom,
            Integer bibTo,
            long occupiedSeats,
            List<KitResponse> kits,
            List<PriceTierResponse> priceTiers,
            List<PaymentQrCodeReference> paymentQrCodes) {
    }

    public record KitResponse(
            Integer id,
            Integer modalityId,
            String name,
            String description,
            GarmentType requiredSizeType,
            int surchargeCents,
            int sortOrder,
            boolean active,
            boolean hasImage,
            List<KitItemResponse> items) {
    }

    public record KitItemResponse(
            Integer id,
            String name,
            int sortOrder,
            boolean active,
            GarmentType requiredSizeType) {
    }

    public record PriceTierResponse(
            Integer id,
            Integer modalityId,
            String name,
            int priceCents,
            OffsetDateTime validFrom,
            OffsetDateTime validTo) {
    }

    public record AgeCategoryResponse(
            Integer id,
            Integer eventId,
            String name,
            Sex sex,
            int minAge,
            int maxAge,
            Integer modalityId,
            int sortOrder) {
    }

    /** A price tier and kit combination that already has a payment QR code uploaded. */
    public record PaymentQrCodeReference(Integer priceTierId, Integer kitId) {
    }
    /** Body for creating or updating a kit. {@code itemIds} are the catalog items the kit includes. */
    public record SaveKitRequest(
            @NotBlank String name,
            String description,
            @NotNull Integer surchargeCents,
            @NotNull Integer sortOrder,
            @NotNull Boolean active,
            List<Integer> itemIds) {
    }

    /** Body for creating or updating an item of the global kit catalog. */
    public record SaveKitItemRequest(
            @NotBlank String name,
            @NotNull Integer sortOrder,
            @NotNull Boolean active,
            GarmentType requiredSizeType) {
    }

    /** Body for creating or updating a size of the global size catalog. */
    public record SaveSizeRequest(
            @NotBlank String measure,
            @NotNull GarmentType type,
            @NotNull Integer sortOrder,
            @NotNull Boolean active) {
    }

    /** Body for creating or updating a price tier. */
    public record SavePriceTierRequest(
            @NotBlank String name,
            @NotNull Integer priceCents,
            @NotNull OffsetDateTime validFrom,
            @NotNull OffsetDateTime validTo) {
    }

    /** Body for creating or updating an age category of one event. */
    public record SaveAgeCategoryRequest(
            @NotBlank String name,
            @NotNull Sex sex,
            @NotNull Integer minAge,
            @NotNull Integer maxAge,
            Integer modalityId,
            @NotNull Integer sortOrder) {
    }

    /** Body for creating or updating an age range of the global catalog. */
    public record SaveAgeCategoryTemplateRequest(
            @NotBlank String name,
            @NotNull Integer minAge,
            @NotNull Integer maxAge,
            @NotNull Integer sortOrder) {
    }

    public record SizeResponse(Integer id, String measure, GarmentType type, int sortOrder, boolean active) {
    }

    public record AgeCategoryTemplateResponse(
            Integer id, String name, int minAge, int maxAge, int sortOrder) {
    }
}