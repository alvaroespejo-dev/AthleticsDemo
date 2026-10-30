package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.application.marketing.WhatsAppSender.SendResult;
import com.aespejo.registrations.application.marketing.WhatsAppSender.TemplateSend;
import com.aespejo.registrations.domain.entities.Campaign;
import com.aespejo.registrations.domain.entities.CampaignMessage;
import com.aespejo.registrations.domain.enums.CampaignStatus;
import com.aespejo.registrations.domain.enums.MessageStatus;
import com.aespejo.registrations.infrastructure.persistence.repository.CampaignMessageRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.CampaignRepository;
import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sends the pending messages of the campaigns in progress, ported from {@code ServicioDespachoCampanias}. It works in
 * batches because the Cloud API has a rate limit, and a campaign of thousands cannot depend on the process staying alive
 * until the end: whatever was sent is recorded and the next pass continues where it stopped.
 */
@Service
@Transactional
public class CampaignDispatcher {

    /** After this many failed attempts a message is given up on. Retrying forever against a number without WhatsApp only fills the log. */
    public static final int MAX_ATTEMPTS = 3;

    private static final String DEFAULT_LANGUAGE = "es";
    private static final int MAX_ERROR_LENGTH = 1000;
    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };

    private final CampaignRepository campaigns;
    private final CampaignMessageRepository messages;
    private final WhatsAppSender sender;
    private final ObjectMapper json;

    public CampaignDispatcher(CampaignRepository campaigns, CampaignMessageRepository messages, WhatsAppSender sender,
                              ObjectMapper json) {
        this.campaigns = campaigns;
        this.messages = messages;
        this.sender = sender;
        this.json = json;
    }

    /**
     * Processes up to {@code limit} messages and returns how many were tried. The caller uses that number to decide
     * whether another pass is worth it right away.
     */
    public int dispatch(int limit) {
        int processed = 0;

        for (Campaign campaign : campaigns.findByStatusOrderByCreatedAtAsc(CampaignStatus.Sending)) {
            if (processed >= limit) {
                break;
            }

            List<CampaignMessage> pending = messages.findByCampaignIdAndStatusAndAttemptsLessThanOrderByIdAsc(
                    campaign.getId(), MessageStatus.Pending, MAX_ATTEMPTS, PageRequest.of(0, limit - processed));

            boolean missingConfiguration = false;

            for (CampaignMessage message : pending) {
                missingConfiguration = attempt(message, campaign);
                processed++;

                // The brand lacks its number or token: the rest of its messages would fail the same way, so leave them for the next pass.
                if (missingConfiguration) {
                    break;
                }
            }

            if (!missingConfiguration) {
                closeIfFinished(campaign);
            }
        }

        return processed;
    }

    /** Returns true if the message stayed pending because the brand is not configured. */
    private boolean attempt(CampaignMessage message, Campaign campaign) {
        TemplateSend send = new TemplateSend(
                campaign.getBrand().getCode(),
                message.getPhone(),
                campaign.getTemplateName(),
                notBlank(campaign.getTemplateLanguage()) ? campaign.getTemplateLanguage() : DEFAULT_LANGUAGE,
                parameters(message.getHeaderParametersJson()),
                message.getHeaderImageUrl(),
                parameters(message.getParametersJson()),
                message.getRenderedBody());

        SendResult result;

        try {
            result = sender.sendTemplate(send);
        } catch (RuntimeException ex) {
            result = SendResult.transientFailure(ex.getMessage());
        }

        if (result.success()) {
            message.setStatus(MessageStatus.Sent);
            message.setExternalId(result.externalId());
            message.setSentAt(OffsetDateTime.now());
            message.setLastError(null);
            return false;
        }

        message.setLastError(truncate(result.error()));

        // A missing configuration is a brand problem, not a message problem, so no attempt is spent. Otherwise a brand
        // with no number would burn the three attempts of all its messages in the first few seconds.
        if (result.missingConfiguration()) {
            return true;
        }

        message.setAttempts(message.getAttempts() + 1);

        // A permanent error does not improve by insisting; a temporary one does, up to the limit.
        if (!result.retryLater() || message.getAttempts() >= MAX_ATTEMPTS) {
            message.setStatus(MessageStatus.Failed);
        }

        return false;
    }

    /** Closes the campaign once nothing is left to try, and records which provider resolved it. */
    private void closeIfFinished(Campaign campaign) {
        boolean stillPending = messages.existsByCampaignIdAndStatusAndAttemptsLessThan(
                campaign.getId(), MessageStatus.Pending, MAX_ATTEMPTS);

        if (stillPending || campaign.getStatus() != CampaignStatus.Sending) {
            return;
        }

        campaign.setStatus(CampaignStatus.Sent);
        campaign.setSentAt(OffsetDateTime.now());

        // With one number per brand the channel is no longer unique, so the provider that resolved this campaign is recorded.
        campaign.setProvider(sender.providerNameFor(campaign.getBrand().getCode()));
    }

    private List<String> parameters(String jsonValue) {
        if (!notBlank(jsonValue)) {
            return List.of();
        }

        try {
            return json.readValue(jsonValue, STRING_LIST);
        } catch (JacksonException ex) {
            return List.of();
        }
    }

    private static String truncate(String error) {
        return error == null || error.length() <= MAX_ERROR_LENGTH ? error : error.substring(0, MAX_ERROR_LENGTH);
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
