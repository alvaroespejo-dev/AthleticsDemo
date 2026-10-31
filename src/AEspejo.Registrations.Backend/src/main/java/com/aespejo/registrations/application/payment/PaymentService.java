package com.aespejo.registrations.application.payment;

import com.aespejo.registrations.application.payment.PaymentModels.PaymentItem;
import com.aespejo.registrations.application.payment.PaymentModels.PaymentOutcome;
import com.aespejo.registrations.application.payment.PaymentModels.RegisterPaymentRequest;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Payment;
import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.enums.PaymentSource;
import com.aespejo.registrations.domain.enums.ReconciliationRule;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.infrastructure.persistence.repository.KitDeliveryRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.PaymentRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.StatementMovementRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manual payments and their reversal.
 * An amount that covers the expected price (within the event's tolerance) marks the registration as paid,
 * a shortfall sends it to review, and an overpayment is kept as a credit balance instead of being lost.
 * Notes written to the registration are resolved in the language of the request.
 */
@Service
@Transactional
public class PaymentService {

    private static final DateTimeFormatter NOTE_TIMESTAMP = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private enum Comparison { EXACT, EXCESS, INSUFFICIENT }

    private final PaymentRepository payments;
    private final RegistrationRepository registrations;
    private final KitDeliveryRepository kitDeliveries;
    private final StatementMovementRepository statementMovements;
    private final UserRepository users;
    private final MessageSource messages;

    public PaymentService(
            PaymentRepository payments,
            RegistrationRepository registrations,
            KitDeliveryRepository kitDeliveries,
            StatementMovementRepository statementMovements,
            UserRepository users,
            MessageSource messages) {
        this.payments = payments;
        this.registrations = registrations;
        this.kitDeliveries = kitDeliveries;
        this.statementMovements = statementMovements;
        this.users = users;
        this.messages = messages;
    }

    @Transactional(readOnly = true)
    public List<PaymentItem> listByRegistration(int registrationId) {
        requireRegistration(registrationId);
        return payments.findByRegistrationIdOrderByCreditedAtAsc(registrationId).stream()
                .map(PaymentService::toItem)
                .toList();
    }

    public PaymentOutcome register(int registrationId, RegisterPaymentRequest request, int recordedByUserId) {
        Registration registration = requireRegistration(registrationId);
        if (registration.getStatus() == RegistrationStatus.Expired) {
            throw new ConflictException("payment.registration.expired");
        }
        if (registration.getStatus() == RegistrationStatus.Cancelled
                || registration.getStatus() == RegistrationStatus.Refunded) {
            throw new ConflictException("payment.registration.closed", statusLabel(registration.getStatus()));
        }
        String transactionNumber = request.transactionNumber().trim();
        if (payments.existsByTransactionNumber(transactionNumber)) {
            throw new ConflictException("payment.transactionNumber.duplicate", transactionNumber);
        }

        OffsetDateTime now = OffsetDateTime.now();
        Payment payment = new Payment();
        payment.setRegistration(registration);
        payment.setTransactionNumber(transactionNumber);
        payment.setAmountCents(request.amountCents());
        payment.setCreditedAt(request.creditedAt());
        payment.setSourceBank(blankToNull(request.sourceBank()));
        payment.setPayerName(blankToNull(request.payerName()));
        payment.setSource(PaymentSource.Manual);
        payment.setRule(ReconciliationRule.Manual);
        payment.setRecordedAt(now);
        payment.setRecordedByUser(users.findById(recordedByUserId).orElse(null));
        payments.save(payment);
        registration.getPayments().add(payment);

        long total = registration.getPayments().stream().mapToLong(Payment::getAmountCents).sum();
        Comparison comparison = compare(registration, total);
        payment.setSurplusCents((int) Math.max(0, total - registration.getAmountCents()));
        applyResult(registration, comparison, blankToNull(request.notes()), now);

        return outcome(payment.getId(), registration, total, registerMessage(registration, comparison, payment));
    }

    /** Reverts a payment that was loaded by mistake. The reason is required and is kept in the notes. */
    public PaymentOutcome revert(int paymentId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("payment.revert.reasonRequired");
        }
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("entity.payment", paymentId));
        Registration registration = payment.getRegistration();

        if (registration.getStatus() == RegistrationStatus.Refunded || registration.getStatus() == RegistrationStatus.Cancelled) {
            throw new ConflictException("payment.revert.closed", statusLabel(registration.getStatus()));
        }
        if (registration.getResult() != null) {
            throw new ConflictException("payment.revert.hasResult");
        }
        if (kitDeliveries.existsByRegistrationId(registration.getId())) {
            throw new ConflictException("payment.revert.kitDelivered");
        }
        if (statementMovements.existsByPaymentId(paymentId)) {
            throw new ConflictException("payment.revert.reconciled");
        }

        OffsetDateTime now = OffsetDateTime.now();
        String previousNotes = registration.getNotes();
        registration.getPayments().remove(payment);
        payments.delete(payment);

        long total = registration.getPayments().stream().mapToLong(Payment::getAmountCents).sum();
        String message;
        String automaticNote = null;
        if (total == 0) {
            // Without payments the registration returns to pending with a fresh reservation window:
            // charging the athlete for time that passed would not be fair.
            registration.setStatus(RegistrationStatus.Pending);
            registration.setPaidAt(null);
            registration.setReservationExpiresAt(now.plusHours(registration.getEvent().getReservationHours()));
            message = msg("payment.revert.pending");
        } else {
            Comparison comparison = compare(registration, total);
            applyResult(registration, comparison, null, now);
            automaticNote = registration.getNotes();
            message = msg("payment.revert.done", statusLabel(registration.getStatus()));
        }

        String line = msg("payment.note.reverted", now.format(NOTE_TIMESTAMP), payment.getTransactionNumber(),
                bolivianos(payment.getAmountCents()), reason.trim());
        String notes = previousNotes;
        if (automaticNote != null && !automaticNote.isBlank()) {
            notes = combine(notes, automaticNote);
        }
        registration.setNotes(combine(notes, line));

        return outcome(paymentId, registration, total, message);
    }

    /** Edits a registered payment. A changed amount recalculates the registration status. */
    public PaymentOutcome update(int paymentId, RegisterPaymentRequest request) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("entity.payment", paymentId));
        Registration registration = payment.getRegistration();
        String transactionNumber = request.transactionNumber().trim();
        if (payments.existsByTransactionNumberAndIdNot(transactionNumber, paymentId)) {
            throw new ConflictException("payment.transactionNumber.duplicateOnUpdate", transactionNumber);
        }
        OffsetDateTime now = OffsetDateTime.now();
        boolean amountChanged = payment.getAmountCents() != request.amountCents();
        payment.setTransactionNumber(transactionNumber);
        payment.setAmountCents(request.amountCents());
        payment.setCreditedAt(request.creditedAt());
        payment.setSourceBank(blankToNull(request.sourceBank()));
        payment.setPayerName(blankToNull(request.payerName()));

        long total = registration.getPayments().stream().mapToLong(Payment::getAmountCents).sum();
        String message = msg("payment.update.ok");
        if (amountChanged) {
            Comparison comparison = compare(registration, total);
            payment.setSurplusCents((int) Math.max(0, total - registration.getAmountCents()));
            applyResult(registration, comparison, null, now);
            message = msg("payment.update.statusChanged", statusLabel(registration.getStatus()));
        } else {
            // Without an amount change only the notes are updated, as.
            registration.setNotes(blankToNull(request.notes()));
        }
        return outcome(paymentId, registration, total, message);
    }

    // ---- Rules ----

    /** Exact or excess covers the price; a shortfall beyond the tolerance does not. */
    private static Comparison compare(Registration registration, long total) {
        long difference = total - registration.getAmountCents();
        if (difference > 0) {
            return Comparison.EXCESS;
        }
        return -difference <= registration.getEvent().getPaymentToleranceCents()
                ? Comparison.EXACT
                : Comparison.INSUFFICIENT;
    }

    /**
     * Moves the registration to the status that matches the money received. As, the notes
     * are replaced by the manual notes plus the automatic note of this result (not appended).
     */
    private void applyResult(Registration registration, Comparison comparison, String manualNotes, OffsetDateTime now) {
        long total = registration.getPayments().stream().mapToLong(Payment::getAmountCents).sum();
        int expected = registration.getAmountCents();
        switch (comparison) {
            case EXACT -> {
                registration.setStatus(RegistrationStatus.Paid);
                registration.setPaidAt(registration.getPaidAt() == null ? now : registration.getPaidAt());
                registration.setNotes(blankToNull(manualNotes));
            }
            case EXCESS -> {
                int surplus = (int) (total - expected);
                registration.setStatus(RegistrationStatus.Paid);
                registration.setPaidAt(registration.getPaidAt() == null ? now : registration.getPaidAt());
                registration.setNotes(combine(manualNotes, msg("payment.note.surplus", bolivianos(surplus))));
            }
            case INSUFFICIENT -> {
                // Money is in, so the registration is not paid, but it is not left pending either: someone has to resolve it.
                registration.setStatus(RegistrationStatus.UnderReview);
                registration.setPaidAt(null);
                registration.setNotes(combine(manualNotes,
                        msg("payment.note.shortfall", bolivianos(Math.max(0, expected - total)))));
            }
        }
    }

    private String registerMessage(Registration registration, Comparison comparison, Payment payment) {
        long missing = Math.max(0, registration.getAmountCents() - registration.getPayments().stream()
                .mapToLong(Payment::getAmountCents).sum());
        return switch (comparison) {
            case EXACT -> msg("payment.result.paid");
            case EXCESS -> msg("payment.result.paidWithSurplus", bolivianos(payment.getSurplusCents()));
            case INSUFFICIENT -> msg("payment.result.underReview", bolivianos((int) missing));
        };
    }

    private Registration requireRegistration(int id) {
        return registrations.findById(id).orElseThrow(() -> new NotFoundException("entity.registration", id));
    }

    private static PaymentOutcome outcome(Integer paymentId, Registration registration, long total, String message) {
        long expected = registration.getAmountCents();
        return new PaymentOutcome(
                paymentId,
                registration.getStatus(),
                total,
                (int) expected,
                Math.max(0, expected - total),
                Math.max(0, total - expected),
                message);
    }

    public static PaymentItem toItem(Payment payment) {
        return new PaymentItem(
                payment.getId(),
                payment.getTransactionNumber(),
                payment.getAmountCents(),
                payment.getCreditedAt(),
                payment.getSourceBank(),
                payment.getPayerName(),
                payment.getSource(),
                payment.getSurplusCents(),
                payment.getRecordedAt(),
                payment.getRule());
    }

    /** Joins a manual note and an automatic note, as {@code Combinar} does. */
    private String combine(String manual, String automatic) {
        if (manual == null || manual.isBlank()) {
            return automatic;
        }
        return manual.trim() + " — " + automatic;
    }

    /** Money formatted as: "USD 1,234.50" (N2 with thousands separator). */
    public static String bolivianos(long cents) {
        return "USD " + BigDecimal.valueOf(cents).movePointLeft(2).setScale(2, RoundingMode.HALF_UP)
                .toPlainString().replaceFirst("(\\d)(?=(\\d{3})+\\.)", "$1,");
    }

    private String statusLabel(RegistrationStatus status) {
        return msg("status.registration." + status.name());
    }

    private String msg(String key, Object... args) {
        return messages.getMessage(key, args, LocaleContextHolder.getLocale());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
