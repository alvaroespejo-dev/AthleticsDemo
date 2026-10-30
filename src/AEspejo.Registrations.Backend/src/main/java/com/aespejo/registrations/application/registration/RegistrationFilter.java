package com.aespejo.registrations.application.registration;

import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationOrder;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.enums.Sex;

/** Optional filters of the registrant list. Null means "no filter". */
public record RegistrationFilter(
        String text,
        RegistrationStatus status,
        Integer modalityId,
        Integer ageCategoryId,
        Sex sex,
        Boolean withoutSize,
        Boolean withoutBib,
        Boolean kitDelivered,
        Boolean withoutEmergencyContact,
        Boolean withoutResult,
        RegistrationOrder order) {
}
