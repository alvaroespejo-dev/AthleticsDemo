package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Named targeting criteria, saved so they can be reused across campaigns. It stores the criteria,
 * not the list of athletes: the recipient snapshot is frozen only when a campaign is built, in
 * {@link CampaignMessage}.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Segments")
public class Segment implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String description;

    /** Targeting criteria as JSON, the same format as {@link Campaign#getFilterJson()}. */
    private String filterJson;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "CreatedByUserId")
    private User createdByUser;
}
