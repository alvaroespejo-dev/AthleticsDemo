package com.aespejo.registrations.api.publicsite;

import com.aespejo.registrations.application.catalog.CatalogModels.SizeResponse;
import com.aespejo.registrations.application.catalog.PublicEventService;
import com.aespejo.registrations.application.settings.SettingsModels.PublicOrganization;
import com.aespejo.registrations.application.settings.SettingsService;
import com.aespejo.registrations.application.catalog.PublicEventService.PublicEventResponse;
import com.aespejo.registrations.application.catalog.PublicEventService.PublicEventSummary;
import com.aespejo.registrations.application.catalog.SizeService;
import com.aespejo.registrations.application.athlete.AthleteSearchModels.FoundAthlete;
import com.aespejo.registrations.application.athlete.AthleteSearchService;
import com.aespejo.registrations.infrastructure.ratelimit.FixedWindowRateLimiter;
import java.time.Duration;
import java.util.List;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public, unauthenticated read routes used by the registration form and the landing pages. */
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final PublicEventService publicEvents;
    private final SizeService sizes;
    private final SettingsService settings;
    private final AthleteSearchService athleteSearch;
    private final FixedWindowRateLimiter limiter;

    public PublicController(PublicEventService publicEvents, SizeService sizes, SettingsService settings,
                            AthleteSearchService athleteSearch, FixedWindowRateLimiter limiter) {
        this.publicEvents = publicEvents;
        this.sizes = sizes;
        this.settings = settings;
        this.athleteSearch = athleteSearch;
        this.limiter = limiter;
    }

    /** Athletes with that document number, to pre-fill the registration form. Rate limited like the money sport lookup. */
    @GetMapping("/athletes")
    public List<FoundAthlete> athletes(@RequestParam String documentNumber,
                                       @RequestParam(required = false) String slug) {
        limiter.acquire(FixedWindowRateLimiter.ATHLETE_SEARCH, 20, Duration.ofMinutes(1));
        return athleteSearch.searchByDocument(documentNumber, slug);
    }

    /** The organization name only; nothing internal such as the waiver or the fees. */
    @GetMapping("/organization")
    public PublicOrganization organization() {
        return settings.publicOrganization();
    }

    /** The cards of the landing calendar. Each landing sends its own brand, so the calendars do not mix. */
    @GetMapping("/events")
    public List<PublicEventSummary> events(@RequestParam(required = false) String brand) {
        return publicEvents.listPublished(brand);
    }

    @GetMapping("/events/{slug}")
    public PublicEventResponse event(@PathVariable String slug) {
        return publicEvents.getPublished(slug);
    }

    @GetMapping("/sizes")
    public List<SizeResponse> sizes() {
        return sizes.list(true);
    }
}