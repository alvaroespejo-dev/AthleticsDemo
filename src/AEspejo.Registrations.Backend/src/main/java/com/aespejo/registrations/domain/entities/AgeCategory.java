package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.Sex;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Award category by sex and age range. Age is always evaluated on the event date, never on the
 * registration date.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "AgeCategories")
public class AgeCategory implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Event event;

    /** Display name, for example {@code Open} or {@code Master A}. */
    private String name;

    private Sex sex;

    /** Minimum age, inclusive, reached on the event date. */
    private int minAge;

    /** Maximum age, inclusive, reached on the event date. */
    private int maxAge;

    /** When set, the category applies only to this modality. */
    @ManyToOne
    private Modality modality;

    private int sortOrder;

    @OneToMany(mappedBy = "ageCategory")
    private List<Registration> registrations = new ArrayList<>();
}
