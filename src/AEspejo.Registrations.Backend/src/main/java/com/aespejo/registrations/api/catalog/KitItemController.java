package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.catalog.CatalogModels.KitItemResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveKitItemRequest;
import com.aespejo.registrations.application.catalog.KitItemService;
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
@RequestMapping("/api/kit-items")
public class KitItemController {

    private final KitItemService items;

    public KitItemController(KitItemService items) {
        this.items = items;
    }

    @GetMapping
    public List<KitItemResponse> list(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return items.list(activeOnly);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping
    public KitItemResponse create(@Valid @RequestBody SaveKitItemRequest request) {
        return items.create(request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/{id}")
    public KitItemResponse update(@PathVariable int id, @Valid @RequestBody SaveKitItemRequest request) {
        return items.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        items.delete(id);
    }
}