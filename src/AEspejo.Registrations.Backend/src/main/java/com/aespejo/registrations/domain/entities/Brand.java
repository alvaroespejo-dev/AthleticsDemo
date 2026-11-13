package com.aespejo.registrations.domain.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Commercial brand that publishes events. It is not a tenant: it does not isolate data, it only
 * decides which events each public site shows.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Brands")
public class Brand {

    /** Atletics Demo (ecotrail). Default value of {@code Events.BrandId} for events that existed before the brand column. */
    public static final int ID_ECOTRAIL = 1;

    public static final int ID_ONESPORT = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Stable identifier used by the public API and the landing pages, for example {@code ecotrail}. */
    private String code;

    /** Display name in the panel, for example {@code Atletics Demo}. */
    private String name;

    private boolean active = true;
}
