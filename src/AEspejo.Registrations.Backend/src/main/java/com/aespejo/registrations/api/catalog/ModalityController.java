package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.catalog.CatalogModels.ModalityResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveModalityRequest;
import com.aespejo.registrations.application.catalog.ModalityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Modalities are created under their event, but are edited and deleted directly by id. */
@RestController
public class ModalityController {

    private final ModalityService modalities;

    public ModalityController(ModalityService modalities) {
        this.modalities = modalities;
    }

    /** Read-only accounts can see a modality. */
    @PreAuthorize(Policies.READ)
    @GetMapping("/api/modalities/{id}")
    public ModalityResponse get(@PathVariable int id) {
        return modalities.get(id);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/events/{eventId}/modalities")
    public ModalityResponse create(@PathVariable int eventId, @Valid @RequestBody SaveModalityRequest request) {
        return modalities.create(eventId, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/api/modalities/{id}")
    public ModalityResponse update(@PathVariable int id, @Valid @RequestBody SaveModalityRequest request) {
        return modalities.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @DeleteMapping("/api/modalities/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        modalities.delete(id);
    }
}
