package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.catalog.AgeCategoryService;
import com.aespejo.registrations.application.catalog.CatalogModels.AgeCategoryResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveAgeCategoryRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AgeCategoryController {

    private final AgeCategoryService categories;

    public AgeCategoryController(AgeCategoryService categories) {
        this.categories = categories;
    }

    @GetMapping("/api/events/{eventId}/age-categories")
    public List<AgeCategoryResponse> list(@PathVariable int eventId) {
        return categories.list(eventId);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/events/{eventId}/age-categories")
    public AgeCategoryResponse create(@PathVariable int eventId, @Valid @RequestBody SaveAgeCategoryRequest request) {
        return categories.create(eventId, request);
    }

    /** Generates the standard categories from the global age-range catalog. */
    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/events/{eventId}/age-categories/standard")
    public List<AgeCategoryResponse> generateStandard(@PathVariable int eventId) {
        return categories.generateStandard(eventId);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/api/age-categories/{id}")
    public AgeCategoryResponse update(@PathVariable int id, @Valid @RequestBody SaveAgeCategoryRequest request) {
        return categories.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @DeleteMapping("/api/age-categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        categories.delete(id);
    }
}