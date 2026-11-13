package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.catalog.CatalogModels.KitResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveKitRequest;
import com.aespejo.registrations.application.catalog.KitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class KitController {

    private final KitService kits;

    public KitController(KitService kits) {
        this.kits = kits;
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/modalities/{modalityId}/kits")
    public KitResponse create(@PathVariable int modalityId, @Valid @RequestBody SaveKitRequest request) {
        return kits.create(modalityId, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/api/kits/{id}")
    public KitResponse update(@PathVariable int id, @Valid @RequestBody SaveKitRequest request) {
        return kits.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @DeleteMapping("/api/kits/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        kits.delete(id);
    }
}