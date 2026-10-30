package com.aespejo.registrations.application.registration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Expires pending registrations whose reservation window has passed, so their seats are released. */
@Component
public class ReservationExpiryJob {

    private static final Logger LOG = LoggerFactory.getLogger(ReservationExpiryJob.class);

    private final RegistrationService registrations;

    public ReservationExpiryJob(RegistrationService registrations) {
        this.registrations = registrations;
    }

    @Scheduled(fixedDelayString = "PT5M", initialDelayString = "PT1M")
    public void run() {
        int expired = registrations.expireDueReservations();
        if (expired > 0) {
            LOG.info("Expired {} pending registrations with an overdue reservation.", expired);
        }
    }
}