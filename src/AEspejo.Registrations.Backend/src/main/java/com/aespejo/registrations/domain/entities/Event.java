package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.EventStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Events")
public class Event implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    /** Brand that publishes the event. It decides which landing page shows the event. */
    @ManyToOne
    private Brand brand;

    /** Identifier used in the public registration URL. Unique across the whole system, not per brand. */
    private String slug;

    private String description;
    private String location;

    /** Race date. It is the reference date for computing the age category. */
    private LocalDate eventDate;

    private OffsetDateTime registrationOpensAt;
    private OffsetDateTime registrationClosesAt;

    /** Until when an athlete can change their shirt size through self-service. */
    private OffsetDateTime sizeChangeClosesAt;

    private EventStatus status = EventStatus.Draft;

    /** Hours a seat stays reserved for a registration that is awaiting payment. */
    private int reservationHours = 48;

    /** Difference in cents accepted between the expected and the credited amount before a registration goes to review. */
    private int paymentToleranceCents;

    /** Service fee in cents, copied from the global settings when the event is created. */
    private int serviceFeeCents;

    /** Text of the liability waiver that the athlete accepts when registering. */
    private String waiverText;

    /** Cover image path, shown in the listing and in the public registration form. */
    private String imagePath;

    /** Path of the runner's manual document (PDF or Word). */
    private String runnerManualPath;

    /** Original file name of the uploaded runner's manual, shown when downloading it. */
    private String runnerManualName;

    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "event")
    private List<Modality> modalities = new ArrayList<>();

    @OneToMany(mappedBy = "event")
    private List<AgeCategory> ageCategories = new ArrayList<>();

    @OneToMany(mappedBy = "event")
    private List<Registration> registrations = new ArrayList<>();
}
