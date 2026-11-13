package com.aespejo.registrations.domain.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * WhatsApp thread between a brand (its WhatsApp Business number) and one phone number. Each brand has
 * its own account, so the same phone number can have a separate thread with each brand.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "WhatsAppConversations")
public class WhatsAppConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Brand (WhatsApp Business number) that received the message. */
    @ManyToOne
    private Brand brand;

    /** Phone number in E.164 format, for example +59170959177. */
    private String phoneE164;

    /** Raw wa_id sent by Meta, without the plus sign. */
    private String waId;

    /** WhatsApp profile name of the contact, when Meta provided it. */
    private String profileName;

    /** Link to the athlete base, resolved by phone number. Best effort only: it is never required, because anyone can write in. */
    @ManyToOne
    private Athlete athlete;

    private OffsetDateTime lastMessageAt;

    /** Summary of the last message, so the list can be shown without loading the whole thread. */
    private String lastMessageSummary;

    /** Timestamp of the last message sent by the customer. It anchors Meta's 24-hour customer-service window. */
    private OffsetDateTime lastInboundMessageAt;

    private int unreadCount;

    private boolean archived;

    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "conversation")
    private List<WhatsAppMessage> messages = new ArrayList<>();

    /** Moment the service window closes, or null if the contact never wrote. */
    public OffsetDateTime getWindowClosesAt() {
        return lastInboundMessageAt == null ? null : lastInboundMessageAt.plusHours(24);
    }
}
