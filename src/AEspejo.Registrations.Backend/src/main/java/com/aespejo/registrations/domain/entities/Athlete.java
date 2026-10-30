package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.DocumentType;
import com.aespejo.registrations.domain.enums.OptInSource;
import com.aespejo.registrations.domain.enums.Sex;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Person, independent of any event. This is the core asset of the system: WhatsApp campaigns and
 * the repeat-participation reports are built on this table.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Athletes")
public class Athlete implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Document type the athlete was identified with. The number is unique only within its type. */
    private DocumentType documentType;

    /** Clean document number: uppercase, without separators. Together with the type it is the deduplication key. */
    private String documentNumber;

    /** Document exactly as it was entered or imported. Kept because historical data has irregular formats. */
    private String documentNumberOriginal;

    /** ISO 3166 alpha-2 country code (for example BO or AR). Optional. */
    private String nationality;

    private String firstNames;
    private String lastNames;

    private Sex sex;
    private LocalDate birthDate;

    /** International dialing prefix without the leading plus sign (for example 591). This is the WhatsApp channel. */
    private String phoneCountryCode;

    /** National number without the country prefix. */
    private String phoneNumber;

    private String phoneOriginal;
    private String email;
    private String city;
    private String club;

    private String emergencyContactName;

    /** Dialing prefix of the emergency contact, in the same format as {@code phoneCountryCode}. */
    private String emergencyContactPhoneCountryCode;

    /** National number of the emergency contact, in the same format as {@code phoneNumber}. */
    private String emergencyContactPhoneNumber;

    private String bloodType;
    private String allergies;

    /** Consent to receive announcements. Without {@code true} the athlete is excluded from every campaign. */
    private boolean marketingOptIn;

    private OffsetDateTime marketingOptInAt;
    private OptInSource optInSource;

    /** When the athlete asked to unsubscribe. Excludes the athlete from campaigns permanently. */
    private OffsetDateTime unsubscribedAt;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "athlete")
    private List<Registration> registrations = new ArrayList<>();

    public String getFullName() {
        return (firstNames + " " + lastNames).trim();
    }

    /** An athlete can be contacted only if they gave consent and have not unsubscribed. */
    public boolean canReceiveCampaigns() {
        return marketingOptIn && unsubscribedAt == null;
    }
}
