package com.aespejo.registrations.application.settings;

import com.aespejo.registrations.application.settings.SettingsModels.PublicOrganization;
import com.aespejo.registrations.application.settings.SettingsModels.SaveSettingsRequest;
import com.aespejo.registrations.application.settings.SettingsModels.SettingsView;
import com.aespejo.registrations.application.settings.SettingsModels.SuggestedWaiver;
import com.aespejo.registrations.domain.entities.SystemSettings;
import com.aespejo.registrations.infrastructure.persistence.repository.SettingsRepository;
import java.time.OffsetDateTime;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Organization-wide defaults.. The row is created on first read, so a fresh
 * installation can always be queried.
 */
@Service
@Transactional
public class SettingsService {

    private static final int ROW_ID = 1;

    private final SettingsRepository settings;
    private final MessageSource messages;

    public SettingsService(SettingsRepository settings, MessageSource messages) {
        this.settings = settings;
        this.messages = messages;
    }

    public SettingsView get() {
        return view(row());
    }

    public SettingsView update(SaveSettingsRequest request) {
        SystemSettings row = row();
        row.setOrganizationName(blankToNull(request.organizationName()));
        row.setDefaultWaiverText(blankToNull(request.defaultWaiverText()));
        row.setDefaultReservationHours(request.defaultReservationHours());
        row.setDefaultPaymentToleranceCents(request.defaultPaymentToleranceCents());
        row.setServiceFeeCents(request.serviceFeeCents());
        row.setMoneySportAmountCents(request.moneySportAmountCents());
        row.setUpdatedAt(OffsetDateTime.now());
        return view(row);
    }

    @Transactional(readOnly = true)
    public PublicOrganization publicOrganization() {
        return settings.findById(ROW_ID)
                .map(s -> new PublicOrganization(s.getOrganizationName()))
                .orElse(new PublicOrganization(null));
    }

    /** The starting waiver text. It is a reasonable draft, not legal advice: a lawyer should review it before the first event. */
    public SuggestedWaiver suggestedWaiver() {
        return new SuggestedWaiver(messages.getMessage("settings.suggestedWaiver", null, LocaleContextHolder.getLocale()));
    }

    private SystemSettings row() {
        return settings.findById(ROW_ID).orElseGet(() -> {
            SystemSettings created = new SystemSettings();
            created.setDefaultWaiverText(suggestedWaiver().text());
            created.setUpdatedAt(OffsetDateTime.now());
            return settings.save(created);
        });
    }

    private static SettingsView view(SystemSettings s) {
        return new SettingsView(
                s.getOrganizationName(),
                s.getDefaultWaiverText(),
                s.getDefaultReservationHours(),
                s.getDefaultPaymentToleranceCents(),
                s.getServiceFeeCents(),
                s.getMoneySportAmountCents(),
                s.getUpdatedAt());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
