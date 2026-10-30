package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.EventDetailResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.EventSummaryResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveEventRequest;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Brand;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.entities.SystemSettings;
import com.aespejo.registrations.domain.enums.EventStatus;
import com.aespejo.registrations.domain.services.SlugGenerator;
import com.aespejo.registrations.infrastructure.persistence.repository.BrandRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.EventRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.SettingsRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.MessageSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Use cases for events: listing, editing, publishing and deleting. */
@Service
@Transactional
public class EventService {

    private static final List<EventStatus> HIDDEN_BY_DEFAULT = List.of(EventStatus.Finished, EventStatus.Cancelled);
    private static final int SETTINGS_ROW_ID = 1;

    private final EventRepository events;
    private final BrandRepository brands;
    private final SettingsRepository settings;
    private final RegistrationRepository registrations;
    private final CatalogViews views;
    private final MessageSource messages;
    private final String fixedBrandCode;

    public EventService(
            EventRepository events,
            BrandRepository brands,
            SettingsRepository settings,
            RegistrationRepository registrations,
            CatalogViews views,
            MessageSource messages,
            @Value("${brand.fixed-code:}") String fixedBrandCode) {
        this.events = events;
        this.brands = brands;
        this.settings = settings;
        this.registrations = registrations;
        this.views = views;
        this.messages = messages;
        this.fixedBrandCode = fixedBrandCode;
    }

    /**
     * Lists events. When this deployment is fixed to one brand ({@code brand.fixed-code}, as the C# {@code CodigoFijo}),
     * that brand wins over whatever the request asks for.
     */
    @Transactional(readOnly = true)
    public List<EventSummaryResponse> list(boolean includeFinished, String brandCode) {
        List<Event> found = includeFinished
                ? events.findAllByOrderByEventDateDesc()
                : events.findByStatusNotInOrderByEventDateDesc(HIDDEN_BY_DEFAULT);
        String effectiveBrand = fixedBrandCode == null || fixedBrandCode.isBlank() ? brandCode : fixedBrandCode;
        List<EventSummaryResponse> result = new ArrayList<>();
        for (Event event : found) {
            if (effectiveBrand == null || effectiveBrand.isBlank() || effectiveBrand.equals(event.getBrand().getCode())) {
                result.add(views.toEventSummary(event));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public EventDetailResponse get(int id) {
        return views.toEventDetail(findEvent(id));
    }

    public EventDetailResponse create(SaveEventRequest request) {
        validateDates(request);
        Brand brand = requireActiveBrand(request.brandId());
        String slug = resolveSlug(request.slug(), request.name(), null);
        SystemSettings globalSettings = currentSettings();

        // The waiver and the service fee are copied from the global settings only at creation time,
        // so later changes to the settings never alter an existing event.
        String waiver = blankToNull(request.waiverText());
        if (waiver == null) {
            waiver = globalSettings.getDefaultWaiverText();
        }
        int serviceFee = request.serviceFeeCents() != null
                ? request.serviceFeeCents()
                : globalSettings.getServiceFeeCents();

        Event event = new Event();
        applyFields(event, request, brand, slug, serviceFee, waiver);
        event.setStatus(EventStatus.Draft);
        event.setCreatedAt(OffsetDateTime.now());
        events.save(event);
        return views.toEventDetail(event);
    }

    public EventDetailResponse update(int id, SaveEventRequest request) {
        Event event = findEvent(id);
        validateDates(request);
        Brand brand = requireActiveBrand(request.brandId());

        // Moving the event date changes every athlete's age category, because age is evaluated on
        // that date. The change is allowed, but only with an explicit recalculation afterwards.
        if (registrations.existsByEventId(id) && !event.getEventDate().equals(request.eventDate())) {
            throw new ConflictException("event.dates.hasRegistrations");
        }

        String slug = resolveSlug(request.slug(), request.name(), id);
        int serviceFee = request.serviceFeeCents() != null
                ? request.serviceFeeCents()
                : event.getServiceFeeCents();
        applyFields(event, request, brand, slug, serviceFee, blankToNull(request.waiverText()));
        return views.toEventDetail(event);
    }

    /** Publishes the event after checking that it is complete enough to take registrations. */
    public EventDetailResponse publish(int id) {
        Event event = findEvent(id);
        List<String> missing = new ArrayList<>();

        var activeModalities = event.getModalities().stream().filter(m -> m.isActive()).toList();
        if (activeModalities.isEmpty()) {
            missing.add(msg("event.publish.noActiveModality"));
        }
        if (activeModalities.stream().anyMatch(m -> m.getKits().stream().noneMatch(k -> k.isActive()))) {
            missing.add(msg("event.publish.modalityWithoutKit"));
        }
        if (activeModalities.stream().anyMatch(m -> m.getPriceTiers().isEmpty())) {
            missing.add(msg("event.publish.modalityWithoutPrice"));
        }
        // Without age categories, the category report collapses every athlete into one group.
        if (event.getAgeCategories().isEmpty()) {
            missing.add(msg("event.publish.noAgeCategories"));
        }
        if (event.getWaiverText() == null || event.getWaiverText().isBlank()) {
            missing.add(msg("event.publish.noWaiver"));
        }
        if (!missing.isEmpty()) {
            throw new BusinessRuleException("event.publish.incomplete", String.join("; ", missing));
        }

        event.setStatus(EventStatus.Published);
        return views.toEventDetail(event);
    }

    public EventDetailResponse changeStatus(int id, EventStatus status) {
        if (status == EventStatus.Published) {
            return publish(id);
        }
        Event event = findEvent(id);
        event.setStatus(status);
        return views.toEventDetail(event);
    }

    public void delete(int id) {
        Event event = findEvent(id);
        if (registrations.existsByEventId(id)) {
            throw new ConflictException("event.delete.hasRegistrations");
        }
        events.delete(event);
    }

    private Event findEvent(int id) {
        return events.findById(id).orElseThrow(() -> new NotFoundException("entity.event", id));
    }

    private Brand requireActiveBrand(int brandId) {
        return brands.findById(brandId)
                .filter(Brand::isActive)
                .orElseThrow(() -> new BusinessRuleException("event.brand.inactive"));
    }

    private SystemSettings currentSettings() {
        return settings.findById(SETTINGS_ROW_ID).orElseGet(SystemSettings::new);
    }

    private String resolveSlug(String requested, String name, Integer eventId) {
        String slug = requested == null || requested.isBlank()
                ? SlugGenerator.generate(name)
                : requested.trim();
        if (slug.isEmpty()) {
            throw new BusinessRuleException("event.slug.underivable");
        }
        boolean taken = eventId == null
                ? events.existsBySlug(slug)
                : events.existsBySlugAndIdNot(slug, eventId);
        if (taken) {
            throw new ConflictException("event.slug.taken", slug);
        }
        return slug;
    }

    private void validateDates(SaveEventRequest request) {
        if (!request.registrationOpensAt().isBefore(request.registrationClosesAt())) {
            throw new BusinessRuleException("event.dates.openAfterClose");
        }
        var closeDate = request.registrationClosesAt().withOffsetSameInstant(ZoneOffset.UTC).toLocalDate();
        if (closeDate.isAfter(request.eventDate())) {
            throw new BusinessRuleException("event.dates.closeAfterEvent");
        }
        if (request.sizeChangeClosesAt() != null
                && request.sizeChangeClosesAt().isAfter(request.registrationClosesAt())) {
            throw new BusinessRuleException("event.dates.sizeChangeAfterClose");
        }
    }

    private static void applyFields(
            Event event, SaveEventRequest request, Brand brand, String slug, int serviceFee, String waiver) {
        event.setName(request.name().trim());
        event.setBrand(brand);
        event.setSlug(slug);
        event.setDescription(blankToNull(request.description()));
        event.setLocation(blankToNull(request.location()));
        event.setEventDate(request.eventDate());
        event.setRegistrationOpensAt(request.registrationOpensAt());
        event.setRegistrationClosesAt(request.registrationClosesAt());
        event.setSizeChangeClosesAt(request.sizeChangeClosesAt());
        event.setReservationHours(request.reservationHours());
        event.setPaymentToleranceCents(request.paymentToleranceCents());
        event.setServiceFeeCents(serviceFee);
        event.setWaiverText(waiver);
        event.setImagePath(blankToNull(request.imagePath()));
        event.setRunnerManualPath(blankToNull(request.runnerManualPath()));
        event.setRunnerManualName(blankToNull(request.runnerManualName()));
    }

    private String msg(String key) {
        return messages.getMessage(key, null, LocaleContextHolder.getLocale());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
