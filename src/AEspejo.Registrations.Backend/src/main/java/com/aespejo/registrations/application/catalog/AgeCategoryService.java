package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.AgeCategoryResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveAgeCategoryRequest;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.AgeCategory;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.entities.Modality;
import com.aespejo.registrations.domain.enums.Sex;
import com.aespejo.registrations.infrastructure.persistence.repository.AgeCategoryRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.AgeCategoryTemplateRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.EventRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.ModalityRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Age categories of one event. Age is evaluated on the event date. Categories of the same sex cannot
 * overlap, because an athlete would fall into two prize groups.
 */
@Service
@Transactional
public class AgeCategoryService {

    /** Used as the excluded id on create, so the "exclude itself" clause matches nothing. */
    private static final int NO_EXCLUDED_ID = 0;

    private final AgeCategoryRepository categories;
    private final AgeCategoryTemplateRepository templates;
    private final EventRepository events;
    private final ModalityRepository modalities;
    private final RegistrationRepository registrations;
    private final CatalogViews views;

    public AgeCategoryService(
            AgeCategoryRepository categories,
            AgeCategoryTemplateRepository templates,
            EventRepository events,
            ModalityRepository modalities,
            RegistrationRepository registrations,
            CatalogViews views) {
        this.categories = categories;
        this.templates = templates;
        this.events = events;
        this.modalities = modalities;
        this.registrations = registrations;
        this.views = views;
    }

    @Transactional(readOnly = true)
    public List<AgeCategoryResponse> list(int eventId) {
        requireEvent(eventId);
        return categories.findByEventIdOrderBySexAscSortOrderAsc(eventId).stream()
                .map(views::toAgeCategory)
                .toList();
    }

    public AgeCategoryResponse create(int eventId, SaveAgeCategoryRequest request) {
        Event event = requireEvent(eventId);
        validateRange(eventId, request.sex(), NO_EXCLUDED_ID, request.minAge(), request.maxAge());
        AgeCategory category = new AgeCategory();
        category.setEvent(event);
        category.setModality(requireModality(request.modalityId()));
        apply(category, request);
        categories.save(category);
        return views.toAgeCategory(category);
    }

    public AgeCategoryResponse update(int id, SaveAgeCategoryRequest request) {
        AgeCategory category = categories.findById(id)
                .orElseThrow(() -> new NotFoundException("entity.ageCategory", id));
        validateRange(category.getEvent().getId(), request.sex(), id, request.minAge(), request.maxAge());
        category.setModality(requireModality(request.modalityId()));
        apply(category, request);
        return views.toAgeCategory(category);
    }

    public void delete(int id) {
        AgeCategory category = categories.findById(id)
                .orElseThrow(() -> new NotFoundException("entity.ageCategory", id));
        if (registrations.existsByAgeCategoryId(id)) {
            throw new ConflictException("ageCategory.delete.inUse");
        }
        categories.delete(category);
    }

    /**
     * Creates one category per template and sex, from the global catalog. Refused when the event
     * already has categories, so it never duplicates them.
     */
    public List<AgeCategoryResponse> generateStandard(int eventId) {
        Event event = requireEvent(eventId);
        if (categories.existsByEventId(eventId)) {
            throw new ConflictException("ageCategory.standard.exists");
        }
        var ranges = templates.findAllByOrderBySortOrderAscMinAgeAsc();
        if (ranges.isEmpty()) {
            throw new BusinessRuleException("ageCategory.standard.noTemplates");
        }
        List<AgeCategoryResponse> created = new ArrayList<>();
        int order = 0;
        for (var range : ranges) {
            for (Sex sex : List.of(Sex.Female, Sex.Male)) {
                AgeCategory category = new AgeCategory();
                category.setEvent(event);
                category.setName(range.getName());
                category.setSex(sex);
                category.setMinAge(range.getMinAge());
                category.setMaxAge(range.getMaxAge());
                category.setSortOrder(order++);
                categories.save(category);
                created.add(views.toAgeCategory(category));
            }
        }
        return created;
    }

    private Event requireEvent(int eventId) {
        return events.findById(eventId).orElseThrow(() -> new NotFoundException("entity.event", eventId));
    }

    private Modality requireModality(Integer modalityId) {
        if (modalityId == null) {
            return null;
        }
        return modalities.findById(modalityId)
                .orElseThrow(() -> new NotFoundException("entity.modality", modalityId));
    }

    private void validateRange(int eventId, Sex sex, int excludedId, int minAge, int maxAge) {
        if (minAge > maxAge) {
            throw new BusinessRuleException("age.range.invalid");
        }
        var overlapping = categories.findOverlappingNames(eventId, sex, excludedId, minAge, maxAge);
        if (!overlapping.isEmpty()) {
            throw new ConflictException("ageCategory.overlap", minAge + "-" + maxAge, overlapping.get(0));
        }
    }

    private static void apply(AgeCategory category, SaveAgeCategoryRequest request) {
        category.setName(request.name().trim());
        category.setSex(request.sex());
        category.setMinAge(request.minAge());
        category.setMaxAge(request.maxAge());
        category.setSortOrder(request.sortOrder());
    }
}
