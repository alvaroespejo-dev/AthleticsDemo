package com.aespejo.registrations.application.payment;

import com.aespejo.registrations.domain.enums.PaymentSource;
import com.aespejo.registrations.domain.enums.ReconciliationRule;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/** Request and response contracts of the payment endpoints. */
public final class PaymentModels {

    private PaymentModels() {
    }

    /** Body for registering a manual payment. Amounts are in cents. */
    /** Limits: transaction 3-100 characters, amount up to USD 100,000. */
    public record RegisterPaymentRequest(
            @NotBlank @Size(min = 3, max = 100) String transactionNumber,
            @NotNull @Min(1) @Max(10_000_000) Integer amountCents,
            @NotNull OffsetDateTime creditedAt,
            @Size(max = 100) String sourceBank,
            @Size(max = 200) String payerName,
            @Size(max = 2000) String notes) {
    }

    /** Reason of a reversal: required, at most 500 characters . */
    public record RevertPaymentRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record PaymentItem(
            Integer id,
            String transactionNumber,
            int amountCents,
            OffsetDateTime creditedAt,
            String sourceBank,
            String payerName,
            PaymentSource source,
            int surplusCents,
            OffsetDateTime recordedAt,
            ReconciliationRule rule) {
    }

    /** Outcome of a payment change: the new status and the money position of the registration. */
    public record PaymentOutcome(
            Integer paymentId,
            RegistrationStatus registrationStatus,
            long totalPaidCents,
            int expectedCents,
            long missingCents,
            long surplusCents,
            String message) {
    }
}