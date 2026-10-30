package com.aespejo.registrations.api.registration;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.registration.RegistrationModels.BatchResultRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.BatchResultResponse;
import com.aespejo.registrations.application.registration.RegistrationModels.BibAssignmentResponse;
import com.aespejo.registrations.application.registration.RegistrationModels.BibRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.CancelRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.RecalculationResponse;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationDetail;
import com.aespejo.registrations.application.registration.RegistrationFilter;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationOrder;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationListItem;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationListing;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.enums.Sex;
import com.aespejo.registrations.application.registration.RegistrationModels.ResultRequest;
import com.aespejo.registrations.application.registration.RegistrationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Back-office operations on registrations. All routes require an authenticated user. */
@RestController
public class RegistrationController {

    private final RegistrationService registrations;

    public RegistrationController(RegistrationService registrations) {
        this.registrations = registrations;
    }

    @GetMapping("/api/events/{eventId}/registrations")
    public RegistrationListing listByEvent(
            @PathVariable int eventId,
            @RequestParam(required = false) String text,
            @RequestParam(required = false) RegistrationStatus status,
            @RequestParam(required = false) Integer modalityId,
            @RequestParam(required = false) Integer ageCategoryId,
            @RequestParam(required = false) Sex sex,
            @RequestParam(required = false) Boolean withoutSize,
            @RequestParam(required = false) Boolean withoutBib,
            @RequestParam(required = false) Boolean kitDelivered,
            @RequestParam(required = false) Boolean withoutEmergencyContact,
            @RequestParam(required = false) Boolean withoutResult,
            @RequestParam(required = false) RegistrationOrder order,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "25") int size) {
        RegistrationFilter filter = new RegistrationFilter(text, status, modalityId, ageCategoryId, sex,
                withoutSize, withoutBib, kitDelivered, withoutEmergencyContact, withoutResult, order);
        return registrations.listing(eventId, filter, page, size);
    }

    @GetMapping("/api/registrations/{id}")
    public RegistrationDetail detail(@PathVariable int id) {
        return registrations.detail(id);
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/api/registrations/{id}/bib")
    public BibAssignmentResponse assignBib(@PathVariable int id, @RequestBody BibRequest request) {
        return registrations.assignBib(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/registrations/{id}/cancel")
    public RegistrationListItem cancel(@PathVariable int id, @RequestBody CancelRequest request) {
        return registrations.cancel(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/registrations/{id}/reactivate")
    public RegistrationListItem reactivate(@PathVariable int id) {
        return registrations.reactivate(id);
    }

    @PreAuthorize(Policies.OPERATIONS)
    @PutMapping("/api/registrations/{id}/result")
    public RegistrationListItem setResult(@PathVariable int id, @RequestBody ResultRequest request) {
        return registrations.setResult(id, request);
    }

    /** Records one result for several registrations of the event, in one transaction. */
    @PreAuthorize(Policies.OPERATIONS)
    @PutMapping("/api/events/{eventId}/registrations/result")
    public BatchResultResponse setResults(@PathVariable int eventId, @RequestBody BatchResultRequest request) {
        return registrations.setResults(eventId, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/events/{id}/recalculate-age-categories")
    public RecalculationResponse recalculate(@PathVariable int id) {
        return registrations.recalculateAgeCategories(id);
    }
}