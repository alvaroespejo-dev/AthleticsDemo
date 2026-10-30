package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.PaymentSource;
import com.aespejo.registrations.domain.enums.ReconciliationRule;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Money actually credited against a registration. A screenshot never creates a payment on its own:
 * the movement must appear in the bank statement, or an operator must enter it by hand and leave an
 * audit trail.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Payments")
public class Payment implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Registration registration;

    /** Bank transaction identifier. It has a unique index, which prevents the same receipt from being used twice or a duplicate webhook from being processed twice. */
    private String transactionNumber;

    private int amountCents;

    private OffsetDateTime creditedAt;

    private String sourceBank;
    private String payerName;

    private PaymentSource source;
    private ReconciliationRule rule = ReconciliationRule.None;

    private String receiptPath;

    /** Amount above the expected price. It is kept as a credit balance instead of being lost. */
    private int surplusCents;

    /** Raw webhook payload or statement row. Kept as evidence in case of a dispute. */
    private String sourceData;

    private OffsetDateTime recordedAt;

    @ManyToOne
    @JoinColumn(name = "RecordedByUserId")
    private User recordedByUser;
}
