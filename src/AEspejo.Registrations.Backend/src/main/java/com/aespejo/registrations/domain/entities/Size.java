package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.enums.GarmentType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Global size catalog. The pair of measure and garment type tells apart, for example, a medium
 * t-shirt from a medium singlet in the garment report.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Sizes")
public class Size {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** XS, S, M, L, XL, 2XL. */
    private String measure;

    private GarmentType type;

    private int sortOrder;
    private boolean active = true;

    @OneToMany(mappedBy = "size")
    private List<Registration> registrations = new ArrayList<>();
}
