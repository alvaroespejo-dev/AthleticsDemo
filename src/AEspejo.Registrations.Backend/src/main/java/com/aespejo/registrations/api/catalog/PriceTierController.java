package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.catalog.CatalogModels.PriceTierResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SavePriceTierRequest;
import com.aespejo.registrations.application.catalog.PriceTierService;
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
public class PriceTierController {

    private final PriceTierService priceTiers;

    public PriceTierController(PriceTierService priceTiers) {
        this.priceTiers = priceTiers;
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/modalities/{modalityId}/price-tiers")
    public PriceTierResponse create(@PathVariable int modalityId, @Valid @RequestBody SavePriceTierRequest request) {
        return priceTiers.create(modalityId, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/api/price-tiers/{id}")
    public PriceTierResponse update(@PathVariable int id, @Valid @RequestBody SavePriceTierRequest request) {
        return priceTiers.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @DeleteMapping("/api/price-tiers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        priceTiers.delete(id);
    }
}