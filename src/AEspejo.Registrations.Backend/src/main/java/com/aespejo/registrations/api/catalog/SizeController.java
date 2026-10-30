package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.catalog.CatalogModels.SaveSizeRequest;
import com.aespejo.registrations.application.catalog.CatalogModels.SizeResponse;
import com.aespejo.registrations.application.catalog.SizeService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sizes")
public class SizeController {

    private final SizeService sizes;

    public SizeController(SizeService sizes) {
        this.sizes = sizes;
    }

    @GetMapping
    public List<SizeResponse> list(@RequestParam(defaultValue = "true") boolean activeOnly) {
        return sizes.list(activeOnly);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping
    public SizeResponse create(@Valid @RequestBody SaveSizeRequest request) {
        return sizes.create(request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/{id}")
    public SizeResponse update(@PathVariable int id, @Valid @RequestBody SaveSizeRequest request) {
        return sizes.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        sizes.delete(id);
    }
}