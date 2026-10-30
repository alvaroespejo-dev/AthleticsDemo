package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.infrastructure.whatsapp.WhatsAppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Empties the campaign queue at a controlled pace, ported from {@code DespachoCampaniasHostedService}. Every pass sends at
 * most a quarter of the configured messages per minute, so the real rate stays close to the limit without sleeping
 * inside a send. A failing campaign never stops the application: the error is logged and the next pass runs.
 */
@Component
public class CampaignDispatchJob {

    private static final Logger LOG = LoggerFactory.getLogger(CampaignDispatchJob.class);

    private final CampaignDispatcher dispatcher;
    private final WhatsAppProperties properties;

    public CampaignDispatchJob(CampaignDispatcher dispatcher, WhatsAppProperties properties) {
        this.dispatcher = dispatcher;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "PT15S", initialDelayString = "PT30S")
    public void run() {
        // Four passes fit in one minute, so each takes a quarter of the per-minute quota.
        int limit = Math.max(1, properties.messagesPerMinute() / 4);

        try {
            int processed = dispatcher.dispatch(limit);

            if (processed > 0) {
                LOG.info("Dispatched {} campaign messages.", processed);
            }
        } catch (RuntimeException ex) {
            LOG.error("The campaign dispatch pass failed.", ex);
        }
    }
}
