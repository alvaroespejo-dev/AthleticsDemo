package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
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
 * Official distance of an event. The distance is stored in meters, as an integer on purpose, so
 * that values such as {@code 10.5K} cannot appear in the distance report.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Modalities")
public class Modality implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Event event;

    /** Display name in the registration form, for example {@code 10K}. */
    private String name;

    private int distanceMeters;

    /** Maximum number of registrations. {@code null} means no limit. */
    private Integer quota;

    private int sortOrder;

    /** Minimum age allowed on the event date. */
    private Integer minAge;

    private boolean active = true;

    /** Bib number range assigned to the modality. */
    private Integer bibFrom;
    private Integer bibTo;

    @OneToMany(mappedBy = "modality")
    private List<Kit> kits = new ArrayList<>();

    @OneToMany(mappedBy = "modality")
    private List<PriceTier> priceTiers = new ArrayList<>();

    @OneToMany(mappedBy = "modality")
    private List<Registration> registrations = new ArrayList<>();
}
