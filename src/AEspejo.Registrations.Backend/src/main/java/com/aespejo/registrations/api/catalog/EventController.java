package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.catalog.CatalogModels.EventDetailResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.EventSummaryResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveEventRequest;
import com.aespejo.registrations.application.catalog.EventService;
import com.aespejo.registrations.domain.enums.EventStatus;
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
@RequestMapping("/api/events")
public class EventController {

    private final EventService events;

    public EventController(EventService events) {
        this.events = events;
    }

    @GetMapping
    public List<EventSummaryResponse> list(
            @RequestParam(defaultValue = "false") boolean includeFinished,
            @RequestParam(required = false) String brand) {
        return events.list(includeFinished, brand);
    }

    @GetMapping("/{id}")
    public EventDetailResponse get(@PathVariable int id) {
        return events.get(id);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping
    public EventDetailResponse create(@Valid @RequestBody SaveEventRequest request) {
        return events.create(request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/{id}")
    public EventDetailResponse update(@PathVariable int id, @Valid @RequestBody SaveEventRequest request) {
        return events.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/{id}/publish")
    public EventDetailResponse publish(@PathVariable int id) {
        return events.publish(id);
    }

    /** Sets the status to a value such as {@code Draft}, {@code Closed} or {@code Cancelled}. */
    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/{id}/status")
    public EventDetailResponse changeStatus(@PathVariable int id, @RequestBody EventStatus status) {
        return events.changeStatus(id, status);
    }

    @PreAuthorize(Policies.ADMIN)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        events.delete(id);
    }
}
