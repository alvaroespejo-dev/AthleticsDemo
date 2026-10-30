package com.aespejo.registrations.application.marketing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Runs {@link InboxMediaService#downloadPending()} on a short interval. A failing pass is logged and the next one runs. */
@Component
public class InboxMediaJob {

    private static final Logger LOG = LoggerFactory.getLogger(InboxMediaJob.class);

    private final InboxMediaService media;

    public InboxMediaJob(InboxMediaService media) {
        this.media = media;
    }

    @Scheduled(fixedDelayString = "PT20S", initialDelayString = "PT40S")
    public void run() {
        try {
            media.downloadPending();
        } catch (RuntimeException ex) {
            LOG.error("The WhatsApp media download pass failed.", ex);
        }
    }
}
