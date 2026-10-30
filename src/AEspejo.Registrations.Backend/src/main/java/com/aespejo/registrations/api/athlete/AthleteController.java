package com.aespejo.registrations.api.athlete;

import com.aespejo.registrations.application.athlete.AthleteModels.AthleteDetail;
import com.aespejo.registrations.application.athlete.AthleteModels.AthleteFilter;
import com.aespejo.registrations.application.athlete.AthleteModels.AthleteListing;
import com.aespejo.registrations.application.athlete.AthleteModels.AthleteOrder;
import com.aespejo.registrations.application.athlete.AthleteModels.LinkedAccount;
import com.aespejo.registrations.application.athlete.AthleteModels.SaveAthleteRequest;
import com.aespejo.registrations.application.athlete.AthleteService;
import com.aespejo.registrations.domain.enums.Sex;
import com.aespejo.registrations.infrastructure.security.Policies;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The athlete register. Read by any signed-in user; corrections by operations staff; account links by admins. */
@RestController
@RequestMapping("/api")
public class AthleteController {

    private final AthleteService athletes;

    public AthleteController(AthleteService athletes) {
        this.athletes = athletes;
    }

    /** One row per person across all events, filtered and paged. */
    @GetMapping("/athletes")
    @PreAuthorize(Policies.READ)
    public AthleteListing list(
            @RequestParam(required = false) String text,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String club,
            @RequestParam(required = false) Sex sex,
            @RequestParam(required = false) Integer minAge,
            @RequestParam(required = false) Integer maxAge,
            @RequestParam(required = false) Boolean marketingOptIn,
            @RequestParam(required = false) Boolean withEmail,
            @RequestParam(required = false) Integer eventId,
            @RequestParam(required = false) AthleteOrder order,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "25") int size) {
        AthleteFilter filter = new AthleteFilter(text, city, club, sex, minAge, maxAge,
                marketingOptIn, withEmail, eventId, order == null ? AthleteOrder.LastNameAsc : order);
        return athletes.list(filter, page, size);
    }

    @GetMapping("/athletes/{id}")
    @PreAuthorize(Policies.READ)
    public AthleteDetail get(@PathVariable int id) {
        return athletes.get(id);
    }

    /** Corrects personal and contact data. Does not touch registrations, payments or marketing consent. */
    @PutMapping("/athletes/{id}")
    @PreAuthorize(Policies.OPERATIONS)
    public AthleteDetail update(@PathVariable int id, @Valid @RequestBody SaveAthleteRequest request) {
        return athletes.update(id, request);
    }

    /** External sign-ins linked to the athlete. */
    @GetMapping("/athletes/{id}/accounts")
    @PreAuthorize(Policies.ADMIN)
    public List<LinkedAccount> linkedAccounts(@PathVariable int id) {
        return athletes.linkedAccounts(id);
    }

    /** Frees a sign-in from its athlete: the undo of a wrong claim. */
    @DeleteMapping("/athletes/accounts/{accountId}")
    @PreAuthorize(Policies.ADMIN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlinkAccount(@PathVariable int accountId) {
        athletes.unlinkAccount(accountId);
    }
}
