package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Registration variant within a modality, for example {@code 10K Full Kit}. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Kits")
public class Kit implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Modality modality;

    private String name;
    private String description;

    /** Surcharge on top of the modality price, in cents. */
    private int surchargeCents;

    private int sortOrder;
    private boolean active = true;

    /** Kit photo shown in the public form when the athlete selects it. */
    private String imagePath;

    /** Items from the global catalog included in this kit. */
    @ManyToMany
    @JoinTable(
            name = "KitComposition",
            joinColumns = @JoinColumn(name = "KitId"),
            inverseJoinColumns = @JoinColumn(name = "KitItemId"))
    private List<KitItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "kit")
    private List<Registration> registrations = new ArrayList<>();
}
