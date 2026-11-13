package com.aespejo.registrations.api.settings;

import com.aespejo.registrations.application.settings.SettingsModels.SaveSettingsRequest;
import com.aespejo.registrations.application.settings.SettingsModels.SettingsView;
import com.aespejo.registrations.application.settings.SettingsModels.SuggestedWaiver;
import com.aespejo.registrations.application.settings.SettingsService;
import com.aespejo.registrations.infrastructure.security.Policies;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Global settings. Readable by any signed-in user (the event form uses them as defaults); writable by admins only. */
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settings;

    public SettingsController(SettingsService settings) {
        this.settings = settings;
    }

    @GetMapping
    @PreAuthorize(Policies.READ)
    public SettingsView get() {
        return settings.get();
    }

    @PutMapping
    @PreAuthorize(Policies.ADMIN)
    public SettingsView update(@Valid @RequestBody SaveSettingsRequest request) {
        return settings.update(request);
    }

    /** Starting waiver text, so an admin can restore it from the settings screen. */
    @GetMapping("/suggested-waiver")
    @PreAuthorize(Policies.ADMIN)
    public SuggestedWaiver suggestedWaiver() {
        return settings.suggestedWaiver();
    }
}
