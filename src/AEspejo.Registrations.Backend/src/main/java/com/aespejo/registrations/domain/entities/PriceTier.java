package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
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

/** Time-bounded price of a modality. It supports early-bird, regular and late pricing without manual changes on the cut-off date. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "PriceTiers")
public class PriceTier implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Modality modality;

    private String name;

    /** Base price of the modality in cents. The kit surcharge is added separately. */
    private int priceCents;

    private OffsetDateTime validFrom;
    private OffsetDateTime validTo;
}
