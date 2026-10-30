package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.application.marketing.AudienceModels.Filter;
import com.aespejo.registrations.domain.enums.CampaignStatus;
import com.aespejo.registrations.domain.enums.MessageStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/** What the campaign screens read and write. Ported from {@code DtosMarketing}, with English field names. */
public final class CampaignModels {

    private CampaignModels() {
    }

    /** Counters of the progress bar. They always add up to the total number of recipients. */
    public record Progress(int total, int pending, int sent, int delivered, int read, int failed) {
    }

    /** A campaign row in the list. */
    public record CampaignSummary(
            Integer id,
            String name,
            CampaignStatus status,
            String brandName,
            String eventName,
            String templateName,
            String provider,
            OffsetDateTime createdAt,
            OffsetDateTime sentAt,
            String createdBy,
            Progress progress) {
    }

    /** A campaign with everything the detail screen needs. */
    public record CampaignDetail(
            Integer id,
            String name,
            CampaignStatus status,
            Integer brandId,
            String brandName,
            String body,
            String templateName,
            String templateLanguage,
            String header,
            Integer eventId,
            String eventName,
            Filter filter,
            String provider,
            OffsetDateTime createdAt,
            OffsetDateTime scheduledAt,
            OffsetDateTime sentAt,
            String createdBy,
            Progress progress) {
    }

    /** One recipient, with its delivery status and last error. */
    public record RecipientView(
            Integer id,
            Integer athleteId,
            String athleteName,
            String phone,
            MessageStatus status,
            String renderedBody,
            String externalId,
            int attempts,
            String lastError,
            OffsetDateTime sentAt) {
    }

    /** Body of create. The campaign is created as a draft and nothing is sent. */
    public record SaveCampaignRequest(
            @NotBlank @Size(min = 2, max = 200) String name,
            @NotBlank @Size(max = 4000) String body,
            @Size(max = 150) String templateName,
            @Size(max = 10) String templateLanguage,
            @Size(max = 1000) String header,
            @Size(max = 2000) String headerMediaUrl,
            Integer brandId,
            Integer eventId,
            @NotNull Filter filter) {
    }
}
