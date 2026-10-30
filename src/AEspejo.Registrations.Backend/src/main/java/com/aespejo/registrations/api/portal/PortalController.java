package com.aespejo.registrations.api.portal;

import com.aespejo.registrations.application.athlete.AthleteModels.AthleteDetail;
import com.aespejo.registrations.application.portal.PortalModels.AccountView;
import com.aespejo.registrations.application.portal.PortalModels.ClaimRequest;
import com.aespejo.registrations.application.portal.PortalModels.Identity;
import com.aespejo.registrations.application.portal.PortalModels.SaveProfileRequest;
import com.aespejo.registrations.application.portal.PortalService;
import com.aespejo.registrations.infrastructure.ratelimit.FixedWindowRateLimiter;
import com.aespejo.registrations.infrastructure.security.Auth0UserInfo;
import java.time.Duration;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

/**
 * Athlete portal. Only Auth0 tokens are accepted here (see {@code PortalSecurityConfig}); the signed-in person
 * is identified by the {@code sub} claim.
 */
@RestController
@RequestMapping("/api/athlete-portal")
public class PortalController {

    private final PortalService portal;
    private final Auth0UserInfo userInfo;
    private final FixedWindowRateLimiter limiter;

    public PortalController(PortalService portal, Auth0UserInfo userInfo, FixedWindowRateLimiter limiter) {
        this.portal = portal;
        this.userInfo = userInfo;
        this.limiter = limiter;
    }

    @GetMapping("/my-account")
    public AccountView account(@AuthenticationPrincipal Jwt jwt) {
        return portal.account(jwt.getSubject(), identity(jwt));
    }

    @PostMapping("/my-account")
    public AccountView createProfile(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SaveProfileRequest request) {
        return portal.createProfile(jwt.getSubject(), identity(jwt), request);
    }

    @PostMapping("/claim")
    public AccountView claim(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ClaimRequest request) {
        // Brakes rapid guessing before it reaches the database; the account lock in PortalService is the hard limit.
        limiter.acquire("reclamo-atleta:" + jwt.getSubject(), 10, Duration.ofMinutes(5));
        return portal.claim(jwt.getSubject(), identity(jwt), request);
    }

    @PutMapping("/my-account")
    public AthleteDetail updateProfile(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SaveProfileRequest request) {
        return portal.updateProfile(jwt.getSubject(), identity(jwt), request);
    }

    /**
     * The access token of Auth0 carries no e-mail, so it is read from /userinfo when the token has none. Without an
     * identity the account is still stored and the athlete is asked to fill in the form.
     */
    private Identity identity(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            return new Identity(email, Boolean.TRUE.equals(jwt.getClaim("email_verified")),
                    jwt.getClaimAsString("given_name"), jwt.getClaimAsString("family_name"));
        }
        return userInfo.fetch(jwt.getTokenValue()).orElse(null);
    }
}
