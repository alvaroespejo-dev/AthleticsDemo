package com.aespejo.registrations.application.marketing;

import java.util.List;

/**
 * Approved templates of a brand's WhatsApp Business account. The panel
 * needs this list even while sending still goes through the simulated provider.
 */
public interface WhatsAppTemplateCatalog {

    /**
     * @param brandCode brand whose catalog is requested. Every brand has its own account, so its own templates.
     * @param refresh   skips the cache. The panel's "Refresh" button uses it.
     */
    List<Template> listApproved(String brandCode, boolean refresh);

    /**
     * An approved template. Body placeholders are positional, as Meta gives them ({@code {{1}}}, {@code {{2}}}).
     *
     * @param parameterCount highest placeholder index in the body: the number of values the Cloud API expects
     * @param bodyExamples   example values Meta stored for the body, in positional order
     */
    record Template(
            String name,
            String language,
            String status,
            String category,
            String header,
            String headerFormat,
            String body,
            String footer,
            int parameterCount,
            List<String> bodyExamples) {
    }
}
