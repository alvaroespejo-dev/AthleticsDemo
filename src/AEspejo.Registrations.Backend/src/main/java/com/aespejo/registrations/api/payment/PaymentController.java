package com.aespejo.registrations.api.payment;

import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;

import com.aespejo.registrations.application.payment.PaymentModels.PaymentItem;
import com.aespejo.registrations.application.payment.PaymentModels.PaymentOutcome;
import com.aespejo.registrations.application.payment.PaymentModels.RegisterPaymentRequest;
import com.aespejo.registrations.application.payment.PaymentModels.RevertPaymentRequest;
import com.aespejo.registrations.application.payment.PaymentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Payments of a registration. Authenticated: only back-office users record money. */
@RestController
public class PaymentController {

    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @GetMapping("/api/registrations/{id}/payments")
    public List<PaymentItem> list(@PathVariable int id) {
        return payments.listByRegistration(id);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/registrations/{id}/payments")
    public PaymentOutcome register(@PathVariable int id, @AuthenticationPrincipal Jwt jwt,
                                   @Valid @RequestBody RegisterPaymentRequest request) {
        return payments.register(id, request, Integer.parseInt(jwt.getSubject()));
    }

    @PreAuthorize(Policies.ADMIN)
    @PutMapping("/api/payments/{id}")
    public PaymentOutcome update(@PathVariable int id, @Valid @RequestBody RegisterPaymentRequest request) {
        return payments.update(id, request);
    }

    @PreAuthorize(Policies.ADMIN)
    @PostMapping("/api/payments/{id}/revert")
    public PaymentOutcome revert(@PathVariable int id, @Valid @RequestBody RevertPaymentRequest request) {
        return payments.revert(id, request.reason());
    }
}