package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.entities.Kit;
import com.aespejo.registrations.domain.entities.Modality;
import com.aespejo.registrations.domain.entities.PriceTier;
import com.aespejo.registrations.domain.enums.EventStatus;
import com.aespejo.registrations.domain.enums.GarmentType;
import com.aespejo.registrations.infrastructure.persistence.repository.EventRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read-only view of a published event for the public registration form and the landing pages. It
 * exposes only what an athlete needs: prices (current tier, kit surcharge and service fee), seats
 * left and the registration window. Nothing internal, such as payments or other athletes, is included.
 */
@Service
@Transactional(readOnly = true)
public class PublicEventService {

    public record PublicEventResponse(
            Integer id,
            String name,
            String brandCode,
            String slug,
            String description,
            String location,
            java.time.LocalDate eventDate,
            OffsetDateTime registrationOpensAt,
            OffsetDateTime registrationClosesAt,
            boolean registrationOpen,
            String closedReason,
            String waiverText,
            int reservationHours,
            boolean hasImage,
            boolean hasRunnerManual,
            String runnerManualName,
            List<PublicModalityResponse> modalities) {
    }

    /** One card of the landing calendar., with English field names. */
    public record PublicEventSummary(
            Integer id,
            String name,
            String brandCode,
            String slug,
            String description,
            String location,
            java.time.LocalDate eventDate,
            OffsetDateTime registrationOpensAt,
            OffsetDateTime registrationClosesAt,
            boolean registrationOpen,
            String closedReason,
            boolean hasImage) {
    }

    public record PublicModalityResponse(
            Integer id,
            String name,
            int distanceMeters,
            Integer minAge,
            boolean available,
            Long seatsLeft,
            Integer priceCents,
            String priceTierName,
            int serviceFeeCents,
            List<PublicKitResponse> kits) {
    }

    public record PublicKitResponse(
            Integer id,
            String name,
            String description,
            GarmentType requiredSizeType,
            int surchargeCents,
            boolean hasImage,
            List<String> items,
            Integer totalPriceCents) {
    }

    private final EventRepository events;
    private final RegistrationRepository registrations;
    private final MessageSource messages;

    public PublicEventService(EventRepository events, RegistrationRepository registrations, MessageSource messages) {
        this.events = events;
        this.registrations = registrations;
        this.messages = messages;
    }

    /**
     * The published events of one brand, newest first, for the landing calendar.: each landing asks for its own brand, so one calendar never shows the other
     * brand's events. Drafts are never listed.
     */
    public List<PublicEventSummary> listPublished(String brandCode) {
        OffsetDateTime now = OffsetDateTime.now();

        return events.findAllByOrderByEventDateDesc().stream()
                .filter(e -> e.getStatus() == EventStatus.Published)
                .filter(e -> brandCode == null || brandCode.isBlank() || brandCode.equalsIgnoreCase(e.getBrand().getCode()))
                .map(event -> {
                    boolean open = isOpen(event, now);
                    return new PublicEventSummary(
                            event.getId(),
                            event.getName(),
                            event.getBrand().getCode(),
                            event.getSlug(),
                            event.getDescription(),
                            event.getLocation(),
                            event.getEventDate(),
                            event.getRegistrationOpensAt(),
                            event.getRegistrationClosesAt(),
                            open,
                            open ? null : closedReason(event, now),
                            event.getImagePath() != null && !event.getImagePath().isBlank());
                })
                .toList();
    }

    /** Returns the event only if it is published; drafts and closed events look like missing ones. */
    public PublicEventResponse getPublished(String slug) {
        Event event = events.findBySlug(slug)
                .filter(e -> e.getStatus() == EventStatus.Published)
                .orElseThrow(() -> new NotFoundException("entity.event", slug));
        OffsetDateTime now = OffsetDateTime.now();
        boolean open = isOpen(event, now);
        String closedReason = open ? null : closedReason(event, now);

        List<PublicModalityResponse> modalities = event.getModalities().stream()
                .filter(Modality::isActive)
                .sorted(Comparator.comparingInt(Modality::getSortOrder))
                .map(modality -> toModality(modality, event, now))
                .toList();

        return new PublicEventResponse(
                event.getId(),
                event.getName(),
                event.getBrand().getCode(),
                event.getSlug(),
                event.getDescription(),
                event.getLocation(),
                event.getEventDate(),
                event.getRegistrationOpensAt(),
                event.getRegistrationClosesAt(),
                open,
                closedReason,
                event.getWaiverText(),
                event.getReservationHours(),
                event.getImagePath() != null && !event.getImagePath().isBlank(),
                event.getRunnerManualPath() != null && !event.getRunnerManualPath().isBlank(),
                event.getRunnerManualName(),
                modalities);
    }

    private static boolean isOpen(Event event, OffsetDateTime now) {
        return !now.isBefore(event.getRegistrationOpensAt()) && now.isBefore(event.getRegistrationClosesAt());
    }

    private String closedReason(Event event, OffsetDateTime now) {
        return now.isBefore(event.getRegistrationOpensAt()) ? msg("publicEvent.notOpenYet") : msg("publicEvent.closed");
    }

    private PublicModalityResponse toModality(Modality modality, Event event, OffsetDateTime now) {
        PriceTier current = modality.getPriceTiers().stream()
                .filter(tier -> !tier.getValidFrom().isAfter(now) && tier.getValidTo().isAfter(now))
                .min(Comparator.comparing(PriceTier::getValidFrom))
                .orElse(null);
        long occupied = registrations.countByModalityIdAndStatusIn(
                modality.getId(), CatalogViews.OCCUPYING_STATUSES);
        Long seatsLeft = modality.getQuota() == null ? null : Math.max(0, modality.getQuota() - occupied);
        boolean hasSeats = seatsLeft == null || seatsLeft > 0;

        List<PublicKitResponse> kits = modality.getKits().stream()
                .filter(Kit::isActive)
                .sorted(Comparator.comparingInt(Kit::getSortOrder))
                .map(kit -> toKit(kit, current, event.getServiceFeeCents()))
                .toList();

        return new PublicModalityResponse(
                modality.getId(),
                modality.getName(),
                modality.getDistanceMeters(),
                modality.getMinAge(),
                current != null && hasSeats,
                seatsLeft,
                current == null ? null : current.getPriceCents(),
                current == null ? null : current.getName(),
                event.getServiceFeeCents(),
                kits);
    }

    private static PublicKitResponse toKit(Kit kit, PriceTier current, int serviceFeeCents) {
        var requiredSizeType = kit.getItems().stream()
                .map(item -> item.getRequiredSizeType())
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        Integer total = current == null ? null : current.getPriceCents() + kit.getSurchargeCents() + serviceFeeCents;
        return new PublicKitResponse(
                kit.getId(),
                kit.getName(),
                kit.getDescription(),
                requiredSizeType,
                kit.getSurchargeCents(),
                kit.getImagePath() != null && !kit.getImagePath().isBlank(),
                kit.getItems().stream().filter(item -> item.isActive())
                        .sorted(Comparator.comparingInt(item -> item.getSortOrder()))
                        .map(item -> item.getName()).toList(),
                total);
    }

    private String msg(String key) {
        return messages.getMessage(key, null, LocaleContextHolder.getLocale());
    }
}
