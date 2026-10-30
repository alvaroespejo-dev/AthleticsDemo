package com.aespejo.registrations.api.publicsite;

import com.aespejo.registrations.application.registration.RegistrationModels.CreateRegistrationRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationCreatedResponse;
import com.aespejo.registrations.application.registration.RegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public sign-up. No authentication: the athlete registers from the event's public page. */
@RestController
@RequestMapping("/api/public/events/{slug}/registrations")
public class PublicRegistrationController {

    private final RegistrationService registrations;

    public PublicRegistrationController(RegistrationService registrations) {
        this.registrations = registrations;
    }

    @PostMapping
    public RegistrationCreatedResponse signUp(
            @PathVariable String slug,
            @Valid @RequestBody CreateRegistrationRequest request,
            HttpServletRequest http) {
        return registrations.signUp(slug, request, http.getRemoteAddr());
    }
}