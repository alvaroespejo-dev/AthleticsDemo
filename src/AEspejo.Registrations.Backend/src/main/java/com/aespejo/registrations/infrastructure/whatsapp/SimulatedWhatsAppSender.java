package com.aespejo.registrations.infrastructure.whatsapp;

import com.aespejo.registrations.application.marketing.WhatsAppSender;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Logs the send and reports it as delivered, without going to the network. It is not a test double: it is the default channel until Meta approves a brand's
 * marketing templates, so audiences, recipients and campaign states can be exercised without a batch of failures.
 */
@Component
public class SimulatedWhatsAppSender implements WhatsAppSender {

    private static final Logger LOG = LoggerFactory.getLogger(SimulatedWhatsAppSender.class);

    @Override
    public String providerNameFor(String brandCode) {
        return WhatsAppProperties.PROVIDER_SIMULATED;
    }

    @Override
    public SendResult sendTemplate(TemplateSend send) {
        LOG.info("[WhatsApp simulated] {} · template {} ({}): {}",
                send.phoneE164(), send.templateName(), send.language(), send.renderedBody());

        return SendResult.ok(simulatedId());
    }

    @Override
    public SendResult sendText(TextReply reply) {
        LOG.info("[WhatsApp simulated] Reply to {}: {}", reply.phoneE164(), reply.text());

        return SendResult.ok(simulatedId());
    }

    @Override
    public void markRead(String brandCode, String externalId) {
        LOG.info("[WhatsApp simulated] Marked as read {}.", externalId);
    }

    /** Same shape as a Meta id, so the panel looks the same and switching provider has no surprises. */
    private static String simulatedId() {
        return "simulated." + UUID.randomUUID().toString().replace("-", "");
    }
}
