package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.MoneySportMovementType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Movement in an athlete's Money Sport virtual wallet: a credit for a finished event, or a debit when
 * registering for a new event. The amount is signed: positive for credits, negative for debits.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "MoneySportMovements")
public class MoneySportMovement implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Athlete athlete;

    @ManyToOne
    private Registration registration;

    private MoneySportMovementType type;

    /** Copy of the amount in effect when the credit was recorded, so changing the settings does not rewrite history. */
    private int amountCents;

    private OffsetDateTime date;
}
