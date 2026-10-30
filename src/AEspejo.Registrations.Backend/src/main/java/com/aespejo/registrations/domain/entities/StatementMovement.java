package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.ReconciliationRule;
import com.aespejo.registrations.domain.enums.ReconciliationStatus;
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
 * One row of an imported bank statement. It is always stored, whether or not it is reconciled, so the
 * whole process can be audited and not just its result.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "StatementMovements")
public class StatementMovement implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "StatementBatchId")
    private StatementImportBatch statementBatch;

    /** Transaction number as reported by the bank. */
    private String transactionNumber;

    private int amountCents;
    private OffsetDateTime movementDate;

    private String payerName;
    private String memo;
    private String sourceBank;

    private ReconciliationStatus status = ReconciliationStatus.Pending;
    private ReconciliationRule rule = ReconciliationRule.None;

    /** Payment created when the movement was reconciled. Null while the movement is still unlinked. */
    @ManyToOne
    private Payment payment;

    /** Registration proposed by the amount-and-payer rule, waiting for an operator to confirm it with one click. */
    @ManyToOne
    @JoinColumn(name = "SuggestedRegistrationId")
    private Registration suggestedRegistration;

    /** Name-similarity score from 0 to 100. It orders the suggestions queue. */
    private Integer suggestionScore;

    /** Complete raw row, so the import can be redone if the mapping was wrong. */
    private String rawRow;

    private String discardReason;
}
