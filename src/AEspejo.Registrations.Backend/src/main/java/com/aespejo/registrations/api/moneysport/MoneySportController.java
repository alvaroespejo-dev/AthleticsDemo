package com.aespejo.registrations.api.moneysport;

import com.aespejo.registrations.application.moneysport.MoneySportService;
import com.aespejo.registrations.application.moneysport.MoneySportService.Candidate;
import com.aespejo.registrations.application.moneysport.MoneySportService.Detail;
import com.aespejo.registrations.infrastructure.ratelimit.FixedWindowRateLimiter;
import java.time.Duration;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public Money Sport lookup. Anonymous, like the rest of {@code /api/public}. */
@RestController
@RequestMapping("/api/public/money-sport")
public class MoneySportController {

    private final MoneySportService moneySport;
    private final FixedWindowRateLimiter limiter;

    public MoneySportController(MoneySportService moneySport, FixedWindowRateLimiter limiter) {
        this.moneySport = moneySport;
        this.limiter = limiter;
    }

    @GetMapping
    public List<Candidate> search(@RequestParam String documentNumber) {
        limiter.acquire(FixedWindowRateLimiter.ATHLETE_SEARCH, 20, Duration.ofMinutes(1));
        return moneySport.searchByDocument(documentNumber);
    }

    @GetMapping("/{athleteId}")
    public Detail get(@PathVariable int athleteId, @RequestParam String documentNumber) {
        limiter.acquire(FixedWindowRateLimiter.ATHLETE_SEARCH, 20, Duration.ofMinutes(1));
        return moneySport.get(athleteId, documentNumber);
    }
}
