package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.ModalityResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveModalityRequest;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.entities.Modality;
import com.aespejo.registrations.infrastructure.persistence.repository.EventRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.ModalityRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Use cases for modalities: creating, editing and deleting distances within an event. */
@Service
@Transactional
public class ModalityService {

    /** Used as the excluded id on create, so the "exclude itself" clause matches nothing. */
    private static final int NO_EXCLUDED_ID = 0;

    private final ModalityRepository modalities;
    private final EventRepository events;
    private final RegistrationRepository registrations;
    private final CatalogViews views;

    public ModalityService(
            ModalityRepository modalities,
            EventRepository events,
            RegistrationRepository registrations,
            CatalogViews views) {
        this.modalities = modalities;
        this.events = events;
        this.registrations = registrations;
        this.views = views;
    }

    public ModalityResponse get(int id) {
        return views.toModality(modalities.findById(id)
                .orElseThrow(() -> new NotFoundException("entity.modality", id)));
    }

    public ModalityResponse create(int eventId, SaveModalityRequest request) {
        Event event = events.findById(eventId)
                .orElseThrow(() -> new NotFoundException("entity.event", eventId));
        validateBibRange(request);
        String name = request.name().trim();
        validateNameAvailable(eventId, name, NO_EXCLUDED_ID);
        validateBibRangeAvailable(eventId, NO_EXCLUDED_ID, request);

        Modality modality = new Modality();
        modality.setEvent(event);
        apply(modality, request, name);
        modalities.save(modality);
        return views.toModality(modality);
    }

    public ModalityResponse update(int id, SaveModalityRequest request) {
        Modality modality = modalities.findById(id)
                .orElseThrow(() -> new NotFoundException("entity.modality", id));
        int eventId = modality.getEvent().getId();
        validateBibRange(request);
        String name = request.name().trim();
        validateNameAvailable(eventId, name, id);
        validateBibRangeAvailable(eventId, id, request);

        long occupied = registrations.countByModalityIdAndStatusIn(id, CatalogViews.OCCUPYING_STATUSES);
        if (request.quota() != null && request.quota() < occupied) {
            throw new ConflictException("modality.quota.belowOccupied", occupied, request.quota());
        }
        // Changing the distance after registrations exist would make the recorded results meaningless.
        if (request.distanceMeters() != modality.getDistanceMeters() && occupied > 0) {
            throw new ConflictException("modality.distance.locked");
        }

        apply(modality, request, name);
        return views.toModality(modality);
    }

    public void delete(int id) {
        Modality modality = modalities.findById(id)
                .orElseThrow(() -> new NotFoundException("entity.modality", id));
        if (registrations.existsByModalityId(id)) {
            throw new ConflictException("modality.delete.inUse");
        }
        modalities.delete(modality);
    }

    private static void apply(Modality modality, SaveModalityRequest request, String name) {
        modality.setName(name);
        modality.setDistanceMeters(request.distanceMeters());
        modality.setQuota(request.quota());
        modality.setSortOrder(request.sortOrder());
        modality.setMinAge(request.minAge());
        modality.setActive(request.active());
        modality.setBibFrom(request.bibFrom());
        modality.setBibTo(request.bibTo());
    }

    /** Both ends of a bib range must be given together, and the start cannot be after the end. */
    private static void validateBibRange(SaveModalityRequest request) {
        boolean hasFrom = request.bibFrom() != null;
        boolean hasTo = request.bibTo() != null;
        if (hasFrom != hasTo) {
            throw new BusinessRuleException("modality.bibRange.incomplete");
        }
        if (hasFrom && request.bibFrom() > request.bibTo()) {
            throw new BusinessRuleException("modality.bibRange.reversed");
        }
    }

    private void validateNameAvailable(int eventId, String name, int excludedId) {
        boolean taken = excludedId == NO_EXCLUDED_ID
                ? modalities.existsByEventIdAndName(eventId, name)
                : modalities.existsByEventIdAndNameAndIdNot(eventId, name, excludedId);
        if (taken) {
            throw new ConflictException("modality.name.taken", name);
        }
    }

    /** Two modalities of the same event cannot share bib numbers, or nobody could tell who owns a number at the finish. */
    private void validateBibRangeAvailable(int eventId, int excludedId, SaveModalityRequest request) {
        if (request.bibFrom() == null || request.bibTo() == null) {
            return;
        }
        var overlapping = modalities.findOverlappingBibRangeNames(
                eventId, excludedId, request.bibFrom(), request.bibTo());
        if (!overlapping.isEmpty()) {
            throw new ConflictException("modality.bibRange.overlap",
                    request.bibFrom() + "-" + request.bibTo(), overlapping.get(0));
        }
    }
}
