package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.AgeCategoryTemplateResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveAgeCategoryTemplateRequest;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.AgeCategoryTemplate;
import com.aespejo.registrations.infrastructure.persistence.repository.AgeCategoryTemplateRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Age ranges of the global award catalog, managed from the settings screen. */
@Service
@Transactional
public class AgeCategoryTemplateService {

    /** Used as the excluded id on create, so the "exclude itself" clause matches nothing. */
    private static final int NO_EXCLUDED_ID = 0;

    private final AgeCategoryTemplateRepository templates;

    public AgeCategoryTemplateService(AgeCategoryTemplateRepository templates) {
        this.templates = templates;
    }

    @Transactional(readOnly = true)
    public List<AgeCategoryTemplateResponse> list() {
        return templates.findAllByOrderBySortOrderAscMinAgeAsc().stream()
                .map(AgeCategoryTemplateService::toResponse)
                .toList();
    }

    public AgeCategoryTemplateResponse create(SaveAgeCategoryTemplateRequest request) {
        String name = request.name().trim();
        validate(name, NO_EXCLUDED_ID, request);
        AgeCategoryTemplate template = new AgeCategoryTemplate();
        apply(template, request, name);
        templates.save(template);
        return toResponse(template);
    }

    public AgeCategoryTemplateResponse update(int id, SaveAgeCategoryTemplateRequest request) {
        AgeCategoryTemplate template = templates.findById(id)
                .orElseThrow(() -> new NotFoundException("entity.ageCategoryTemplate", id));
        String name = request.name().trim();
        validate(name, id, request);
        apply(template, request, name);
        return toResponse(template);
    }

    public void delete(int id) {
        AgeCategoryTemplate template = templates.findById(id)
                .orElseThrow(() -> new NotFoundException("entity.ageCategoryTemplate", id));
        templates.delete(template);
    }

    private void validate(String name, int excludedId, SaveAgeCategoryTemplateRequest request) {
        boolean nameTaken = excludedId == NO_EXCLUDED_ID
                ? templates.existsByName(name)
                : templates.existsByNameAndIdNot(name, excludedId);
        if (nameTaken) {
            throw new ConflictException("ageCategoryTemplate.name.taken", name);
        }
        if (request.minAge() > request.maxAge()) {
            throw new BusinessRuleException("age.range.invalid");
        }
        var overlapping = templates.findOverlappingNames(excludedId, request.minAge(), request.maxAge());
        if (!overlapping.isEmpty()) {
            throw new ConflictException("ageCategoryTemplate.overlap",
                    request.minAge() + "-" + request.maxAge(), overlapping.get(0));
        }
    }

    private static void apply(AgeCategoryTemplate template, SaveAgeCategoryTemplateRequest request, String name) {
        template.setName(name);
        template.setMinAge(request.minAge());
        template.setMaxAge(request.maxAge());
        template.setSortOrder(request.sortOrder());
    }

    static AgeCategoryTemplateResponse toResponse(AgeCategoryTemplate template) {
        return new AgeCategoryTemplateResponse(template.getId(), template.getName(),
                template.getMinAge(), template.getMaxAge(), template.getSortOrder());
    }
}
