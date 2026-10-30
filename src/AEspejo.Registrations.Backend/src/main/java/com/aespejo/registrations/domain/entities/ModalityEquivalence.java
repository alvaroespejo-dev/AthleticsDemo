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

/**
 * Maps messy modality text found in imported files to normalized data, for example {@code L 30K} or
 * {@code 10K Ki}. Editable from the admin screen, because every event brings new variants.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "ModalityEquivalences")
public class ModalityEquivalence implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Text as it appears in the source file, normalized to uppercase. */
    private String sourceText;

    @ManyToOne
    private Event event;

    @ManyToOne
    private Modality modality;

    /** Age category implied by the text, when the prefix encoded it (for example L means Open). */
    @ManyToOne
    private AgeCategory ageCategory;

    @ManyToOne
    private Kit kit;

    private OffsetDateTime createdAt;
}
