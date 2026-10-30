package com.aespejo.registrations.domain.enums;

import jakarta.persistence.Converter;

/**
 * JPA converters for every domain enum. All use {@code autoApply = true}, so entities only declare
 * the enum type and Hibernate applies the matching converter.
 */
public final class EnumConverters {

    private EnumConverters() {
    }

    @Converter(autoApply = true)
    public static class RegistrationStatusConverter extends ValueEnumConverter<RegistrationStatus> {
        public RegistrationStatusConverter() {
            super(RegistrationStatus.class);
        }
    }

    @Converter(autoApply = true)
    public static class EventStatusConverter extends ValueEnumConverter<EventStatus> {
        public EventStatusConverter() {
            super(EventStatus.class);
        }
    }

    @Converter(autoApply = true)
    public static class CampaignStatusConverter extends ValueEnumConverter<CampaignStatus> {
        public CampaignStatusConverter() {
            super(CampaignStatus.class);
        }
    }

    @Converter(autoApply = true)
    public static class ReconciliationStatusConverter extends ValueEnumConverter<ReconciliationStatus> {
        public ReconciliationStatusConverter() {
            super(ReconciliationStatus.class);
        }
    }

    @Converter(autoApply = true)
    public static class MessageStatusConverter extends ValueEnumConverter<MessageStatus> {
        public MessageStatusConverter() {
            super(MessageStatus.class);
        }
    }

    @Converter(autoApply = true)
    public static class DocumentTypeConverter extends ValueEnumConverter<DocumentType> {
        public DocumentTypeConverter() {
            super(DocumentType.class);
        }
    }

    @Converter(autoApply = true)
    public static class GarmentTypeConverter extends ValueEnumConverter<GarmentType> {
        public GarmentTypeConverter() {
            super(GarmentType.class);
        }
    }

    @Converter(autoApply = true)
    public static class SexConverter extends ValueEnumConverter<Sex> {
        public SexConverter() {
            super(Sex.class);
        }
    }

    @Converter(autoApply = true)
    public static class OptInSourceConverter extends ValueEnumConverter<OptInSource> {
        public OptInSourceConverter() {
            super(OptInSource.class);
        }
    }

    @Converter(autoApply = true)
    public static class PaymentSourceConverter extends ValueEnumConverter<PaymentSource> {
        public PaymentSourceConverter() {
            super(PaymentSource.class);
        }
    }

    @Converter(autoApply = true)
    public static class ReconciliationRuleConverter extends ValueEnumConverter<ReconciliationRule> {
        public ReconciliationRuleConverter() {
            super(ReconciliationRule.class);
        }
    }

    @Converter(autoApply = true)
    public static class ImportRowResultConverter extends ValueEnumConverter<ImportRowResult> {
        public ImportRowResultConverter() {
            super(ImportRowResult.class);
        }
    }

    @Converter(autoApply = true)
    public static class ParticipationResultConverter extends ValueEnumConverter<ParticipationResult> {
        public ParticipationResultConverter() {
            super(ParticipationResult.class);
        }
    }

    @Converter(autoApply = true)
    public static class UserRoleConverter extends ValueEnumConverter<UserRole> {
        public UserRoleConverter() {
            super(UserRole.class);
        }
    }

    @Converter(autoApply = true)
    public static class MessageDirectionConverter extends ValueEnumConverter<MessageDirection> {
        public MessageDirectionConverter() {
            super(MessageDirection.class);
        }
    }

    @Converter(autoApply = true)
    public static class WhatsAppContentTypeConverter extends ValueEnumConverter<WhatsAppContentType> {
        public WhatsAppContentTypeConverter() {
            super(WhatsAppContentType.class);
        }
    }

    @Converter(autoApply = true)
    public static class MoneySportMovementTypeConverter extends ValueEnumConverter<MoneySportMovementType> {
        public MoneySportMovementTypeConverter() {
            super(MoneySportMovementType.class);
        }
    }
}