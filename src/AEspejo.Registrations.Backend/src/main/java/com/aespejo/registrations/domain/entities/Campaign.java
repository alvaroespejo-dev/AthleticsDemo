package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import com.aespejo.registrations.domain.enums.CampaignStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Mass message sent to a segment of the athlete base. The messaging provider is pluggable. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Campaigns")
public class Campaign implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    /** Name of the template approved with the provider, when applicable. */
    private String templateName;

    /** Language the template was approved in, for example es or es_MX. Meta treats each language as a separate template. */
    private String templateLanguage;

    private String header;
    private String headerMediaUrl;

    /** Body with variables in double braces, for example {{name}}. */
    private String body;

    /** Targeting criteria serialized as JSON. */
    private String filterJson;

    private CampaignStatus status = CampaignStatus.Draft;

    /** Brand the campaign is sent from. It decides the sending number and which approved templates are available. */
    @ManyToOne
    private Brand brand;

    /** Event being promoted, when the campaign is about a specific event. */
    @ManyToOne
    private Event event;

    private OffsetDateTime createdAt;
    private OffsetDateTime scheduledAt;
    private OffsetDateTime sentAt;

    @ManyToOne
    @JoinColumn(name = "CreatedByUserId")
    private User createdByUser;

    /** Identifier of the provider that handled the sending, for example csv. */
    private String provider;

    @OneToMany(mappedBy = "campaign")
    private List<CampaignMessage> messages = new ArrayList<>();
}
