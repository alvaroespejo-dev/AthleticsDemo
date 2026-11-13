package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Age range in the global award catalog, managed from the settings screen. It is the template used
 * to generate the {@link AgeCategory} rows of each new event. It has no sex: each template applies to
 * both sexes, so an organizer configures four rows instead of eight.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "AgeCategoryTemplates")
public class AgeCategoryTemplate implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Display name, for example {@code Open} or {@code Master A}. */
    private String name;

    /** Minimum age, inclusive, reached on the event date. */
    private int minAge;

    /** Maximum age, inclusive. The open-ended range is stored as 120. */
    private int maxAge;

    private int sortOrder;
}
