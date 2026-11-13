package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.AgeCategoryResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.EventDetailResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.EventSummaryResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.KitItemResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.KitResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.ModalityResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.PaymentQrCodeReference;
import com.aespejo.registrations.application.catalog.CatalogModels.PriceTierResponse;
import com.aespejo.registrations.domain.entities.AgeCategory;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.entities.Kit;
import com.aespejo.registrations.domain.entities.KitItem;
import com.aespejo.registrations.domain.entities.Modality;
import com.aespejo.registrations.domain.entities.PriceTier;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.infrastructure.persistence.repository.PaymentQrCodeRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Component;

/**
 * Builds the response records of the catalog from entities. Seat counts and payment QR codes come
 * from the database, because they depend on registrations rather than on relations of the catalog.
 */
@Component
public class CatalogViews {

    /** Statuses of registrations that occupy a seat. */
    static final List<RegistrationStatus> OCCUPYING_STATUSES = List.of(
            RegistrationStatus.Pending, RegistrationStatus.Paid, RegistrationStatus.UnderReview);

    private final RegistrationRepository registrations;
    private final PaymentQrCodeRepository paymentQrCodes;

    public CatalogViews(RegistrationRepository registrations, PaymentQrCodeRepository paymentQrCodes) {
        this.registrations = registrations;
        this.paymentQrCodes = paymentQrCodes;
    }

    public EventSummaryResponse toEventSummary(Event event) {
        return new EventSummaryResponse(
                event.getId(),
                event.getName(),
                event.getBrand().getId(),
                event.getBrand().getName(),
                event.getSlug(),
                event.getLocation(),
                event.getEventDate(),
                event.getRegistrationOpensAt(),
                event.getRegistrationClosesAt(),
                event.getStatus(),
                event.getModalities().size(),
                registrations.countByEventIdAndStatus(event.getId(), RegistrationStatus.Paid),
                registrations.countByEventIdAndStatus(event.getId(), RegistrationStatus.Pending),
                event.getServiceFeeCents(),
                event.getImagePath());
    }

    public EventDetailResponse toEventDetail(Event event) {
        List<ModalityResponse> modalities = event.getModalities().stream()
                .sorted(Comparator.comparingInt(Modality::getSortOrder))
                .map(this::toModality)
                .toList();
        List<AgeCategoryResponse> ageCategories = event.getAgeCategories().stream()
                .sorted(Comparator.comparingInt(AgeCategory::getSortOrder))
                .map(this::toAgeCategory)
                .toList();
        return new EventDetailResponse(
                event.getId(),
                event.getName(),
                event.getBrand().getId(),
                event.getBrand().getName(),
                event.getSlug(),
                event.getDescription(),
                event.getLocation(),
                event.getEventDate(),
                event.getRegistrationOpensAt(),
                event.getRegistrationClosesAt(),
                event.getSizeChangeClosesAt(),
                event.getStatus(),
                event.getReservationHours(),
                event.getPaymentToleranceCents(),
                event.getServiceFeeCents(),
                event.getWaiverText(),
                event.getImagePath(),
                event.getRunnerManualPath(),
                event.getRunnerManualName(),
                modalities,
                ageCategories);
    }

    public ModalityResponse toModality(Modality modality) {
        long occupiedSeats = registrations.countByModalityIdAndStatusIn(
                modality.getId(), OCCUPYING_STATUSES);
        List<KitResponse> kits = modality.getKits().stream()
                .sorted(Comparator.comparingInt(Kit::getSortOrder))
                .map(this::toKit)
                .toList();
        List<PriceTierResponse> priceTiers = modality.getPriceTiers().stream()
                .sorted(Comparator.comparing(PriceTier::getValidFrom))
                .map(this::toPriceTier)
                .toList();
        List<PaymentQrCodeReference> qrCodes = paymentQrCodes
                .findByPriceTierModalityId(modality.getId()).stream()
                .map(qr -> new PaymentQrCodeReference(qr.getPriceTier().getId(), qr.getKit().getId()))
                .toList();
        return new ModalityResponse(
                modality.getId(),
                modality.getEvent().getId(),
                modality.getName(),
                modality.getDistanceMeters(),
                modality.getQuota(),
                modality.getSortOrder(),
                modality.getMinAge(),
                modality.isActive(),
                modality.getBibFrom(),
                modality.getBibTo(),
                occupiedSeats,
                kits,
                priceTiers,
                qrCodes);
    }

    public KitResponse toKit(Kit kit) {
        // A kit requires a size as soon as any of its items does.
        var requiredSizeType = kit.getItems().stream()
                .map(KitItem::getRequiredSizeType)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        List<KitItemResponse> items = kit.getItems().stream()
                .sorted(Comparator.comparingInt(KitItem::getSortOrder))
                .map(item -> new KitItemResponse(
                        item.getId(),
                        item.getName(),
                        item.getSortOrder(),
                        item.isActive(),
                        item.getRequiredSizeType()))
                .toList();
        return new KitResponse(
                kit.getId(),
                kit.getModality().getId(),
                kit.getName(),
                kit.getDescription(),
                requiredSizeType,
                kit.getSurchargeCents(),
                kit.getSortOrder(),
                kit.isActive(),
                kit.getImagePath() != null && !kit.getImagePath().isBlank(),
                items);
    }

    public PriceTierResponse toPriceTier(PriceTier tier) {
        return new PriceTierResponse(
                tier.getId(),
                tier.getModality().getId(),
                tier.getName(),
                tier.getPriceCents(),
                tier.getValidFrom(),
                tier.getValidTo());
    }

    public AgeCategoryResponse toAgeCategory(AgeCategory category) {
        return new AgeCategoryResponse(
                category.getId(),
                category.getEvent().getId(),
                category.getName(),
                category.getSex(),
                category.getMinAge(),
                category.getMaxAge(),
                category.getModality() == null ? null : category.getModality().getId(),
                category.getSortOrder());
    }
}
