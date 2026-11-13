package com.aespejo.registrations.domain.entities;

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
 * External identity from the athlete portal. It is not an administrative user. The link-attempt
 * counter lives in the database on purpose: the lock must survive a restart.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "AthleteAccounts")
public class AthleteAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String provider;
    private String providerSubject;
    private String email;

    @ManyToOne
    private Athlete athlete;

    private OffsetDateTime createdAt;
    private OffsetDateTime lastAccessAt;

    /** Failed attempts to claim an existing athlete with document number plus phone number. */
    private int linkAttempts;

    private OffsetDateTime lockedUntil;
}
