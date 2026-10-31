package com.aespejo.registrations.infrastructure.whatsapp;

import com.aespejo.registrations.infrastructure.whatsapp.WhatsAppProperties.BrandProperties;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Resolves each brand's WhatsApp credentials. A brand without its own
 * section inherits the global block. The account id, phone number id and token are inherited as a group: a brand that
 * declares only part of its account would send from one number with another brand's approved templates.
 */
@Component
public class WhatsAppBrandResolver {

    private static final Logger LOG = LoggerFactory.getLogger(WhatsAppBrandResolver.class);

    private final WhatsAppProperties properties;
    private final Set<String> warnedBrands = ConcurrentHashMap.newKeySet();

    public WhatsAppBrandResolver(WhatsAppProperties properties) {
        this.properties = properties;
        validate();
    }

    /** Never null: an unknown or missing brand code falls back to the global block. */
    public WhatsAppCredentials resolve(String brandCode) {
        String code = brandCode == null ? "" : brandCode.trim();
        BrandProperties brand = findBrand(code).orElse(null);

        if (brand == null && !code.isEmpty() && warnedBrands.add(code)) {
            LOG.warn("Brand {} has no whatsapp.brands section: it sends from the global number.", code);
        }

        boolean declaresAccount = brand != null && (notBlank(brand.businessAccountId())
                || notBlank(brand.phoneNumberId()) || notBlank(brand.token()));

        return new WhatsAppCredentials(
                code,
                firstNotBlank(brand == null ? null : brand.provider(), properties.provider()),
                firstNotBlank(brand == null ? null : brand.version(), properties.version()),
                declaresAccount ? brand.businessAccountId() : properties.businessAccountId(),
                declaresAccount ? brand.phoneNumberId() : properties.phoneNumberId(),
                declaresAccount ? brand.token() : properties.token(),
                firstNotBlank(brand == null ? null : brand.templateLanguage(), properties.templateLanguage()));
    }

    /** Reverse routing of the webhook: Meta sends every brand to the same callback; only the phone number id differs. */
    public Optional<WhatsAppCredentials> findByPhoneNumberId(String phoneNumberId) {
        if (phoneNumberId == null || phoneNumberId.isBlank()) {
            return Optional.empty();
        }

        return properties.brands().entrySet().stream()
                .filter(e -> phoneNumberId.equals(e.getValue().phoneNumberId()))
                .findFirst()
                .map(e -> resolve(e.getKey()))
                .or(() -> phoneNumberId.equals(properties.phoneNumberId()) ? Optional.of(resolve(null)) : Optional.empty());
    }

    /** The app secrets that may have signed a webhook POST: the global one plus each brand's own, if any. */
    public List<String> appSecrets() {
        return Stream.concat(
                        Stream.of(properties.webhook().appSecret()),
                        properties.brands().values().stream().map(BrandProperties::appSecret))
                .filter(WhatsAppBrandResolver::notBlank)
                .distinct()
                .toList();
    }

    private Optional<BrandProperties> findBrand(String code) {
        if (code.isEmpty()) {
            return Optional.empty();
        }

        return properties.brands().entrySet().stream()
                .filter(e -> e.getKey().equalsIgnoreCase(code))
                .map(Map.Entry::getValue)
                .findFirst();
    }

    /** Checks what the data annotations of the properties cannot check: the values of each brand. */
    private void validate() {
        if (!isKnownProvider(properties.provider())) {
            throw new IllegalStateException("whatsapp.provider must be 'meta' or 'simulated', not '" + properties.provider() + "'.");
        }

        properties.brands().forEach((code, brand) -> {
            if (notBlank(brand.provider()) && !isKnownProvider(brand.provider())) {
                throw new IllegalStateException("whatsapp.brands." + code + ".provider must be 'meta' or 'simulated'.");
            }
        });

        boolean usesMeta = WhatsAppProperties.PROVIDER_META.equalsIgnoreCase(properties.provider())
                || properties.brands().values().stream()
                .anyMatch(b -> WhatsAppProperties.PROVIDER_META.equalsIgnoreCase(b.provider()));

        // Not a startup failure on purpose: some deployments send through Meta before the webhook is registered.
        if (usesMeta && properties.webhook().verifyToken().isEmpty()) {
            LOG.warn("whatsapp.webhook.verify-token is empty: the incoming webhook cannot be registered in Meta yet.");
        }
    }

    private static boolean isKnownProvider(String value) {
        return WhatsAppProperties.PROVIDER_META.equalsIgnoreCase(value)
                || WhatsAppProperties.PROVIDER_SIMULATED.equalsIgnoreCase(value);
    }

    private static String firstNotBlank(String own, String global) {
        return notBlank(own) ? own.trim() : global;
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
