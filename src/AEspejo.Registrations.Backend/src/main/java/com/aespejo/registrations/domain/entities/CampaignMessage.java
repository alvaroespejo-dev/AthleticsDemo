package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.enums.MessageStatus;
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

/** One recipient within a campaign, with its delivery status and retry count. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "CampaignMessages")
public class CampaignMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private Campaign campaign;

    @ManyToOne
    private Athlete athlete;

    /** Phone number frozen at the moment the campaign was built. */
    private String phone;

    /** Body with the athlete's variables already resolved. */
    private String renderedBody;

    private String parametersJson;
    private String renderedHeader;
    private String headerParametersJson;
    private String headerImageUrl;

    private MessageStatus status = MessageStatus.Pending;

    /** Identifier returned by the provider, used to track the message later. */
    private String externalId;

    private int attempts;
    private String lastError;

    private OffsetDateTime sentAt;
}
