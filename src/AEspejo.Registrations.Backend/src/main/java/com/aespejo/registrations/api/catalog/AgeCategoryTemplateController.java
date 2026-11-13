package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.catalog.AgeCategoryTemplateService;
import com.aespejo.registrations.application.catalog.CatalogModels.AgeCategoryTemplateResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveAgeCategoryTemplateRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/age-category-templates")
public class AgeCategoryTemplateController {

    private final AgeCategoryTemplateService templates;

    public AgeCategoryTemplateController(AgeCategoryTemplateService templates) {
        this.templates = templates;
    }

    @GetMapping
    public List<AgeCategoryTemplateResponse> list() {
        return templates.list();
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping
    public AgeCategoryTemplateResponse create(@Valid @RequestBody SaveAgeCategoryTemplateRequest request) {
        return templates.create(request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/{id}")
    public AgeCategoryTemplateResponse update(@PathVariable int id, @Valid @RequestBody SaveAgeCategoryTemplateRequest request) {
        return templates.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        templates.delete(id);
    }
}