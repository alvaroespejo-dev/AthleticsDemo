package com.aespejo.registrations.infrastructure.whatsapp;

import com.aespejo.registrations.application.marketing.WhatsAppSender;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Picks the channel for each message from the brand that sends it.
 * With one number per brand the provider is no longer a single global decision: one brand can already send for real
 * while the other is still simulated.
 */
@Primary
@Component
public class WhatsAppSenderRouter implements WhatsAppSender {

    private final WhatsAppBrandResolver resolver;
    private final MetaWhatsAppSender meta;
    private final SimulatedWhatsAppSender simulated;

    public WhatsAppSenderRouter(WhatsAppBrandResolver resolver, MetaWhatsAppSender meta,
                                SimulatedWhatsAppSender simulated) {
        this.resolver = resolver;
        this.meta = meta;
        this.simulated = simulated;
    }

    @Override
    public String providerNameFor(String brandCode) {
        return choose(brandCode).providerNameFor(brandCode);
    }

    @Override
    public SendResult sendTemplate(TemplateSend send) {
        return choose(send.brandCode()).sendTemplate(send);
    }

    @Override
    public SendResult sendText(TextReply reply) {
        return choose(reply.brandCode()).sendText(reply);
    }

    @Override
    public void markRead(String brandCode, String externalId) {
        choose(brandCode).markRead(brandCode, externalId);
    }

    private WhatsAppSender choose(String brandCode) {
        return resolver.resolve(brandCode).usesMeta() ? meta : simulated;
    }
}
