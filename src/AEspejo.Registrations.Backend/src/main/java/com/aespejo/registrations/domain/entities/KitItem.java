package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.GarmentType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Item of the global catalog used to build kits, for example the official shirt, a medal or a
 * hydration pack. When {@code requiredSizeType} is set, a kit that includes this item requires the
 * athlete to choose a size of that garment type.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "KitItems")
public class KitItem implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    private int sortOrder;
    private boolean active = true;

    /** When set, athletes must pick a size of this garment type to register for a kit that includes this item. */
    private GarmentType requiredSizeType;

    @ManyToMany(mappedBy = "items")
    private List<Kit> kits = new ArrayList<>();
}
