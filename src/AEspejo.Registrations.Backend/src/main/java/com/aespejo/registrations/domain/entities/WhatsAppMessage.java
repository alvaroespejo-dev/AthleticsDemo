package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.enums.MessageDirection;
import com.aespejo.registrations.domain.enums.MessageStatus;
import com.aespejo.registrations.domain.enums.WhatsAppContentType;
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

/** One message, inbound or outbound, within a {@link WhatsAppConversation}. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "WhatsAppMessages")
public class WhatsAppMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private WhatsAppConversation conversation;

    private MessageDirection direction;

    /** Meta's wamid. Idempotency key for the webhook. */
    private String externalId;

    /** The context.id when this message quotes or reacts to another one. */
    private String externalRepliedId;

    private WhatsAppContentType contentType;

    private String text;

    private String mediaMetaId;
    private String mediaFilePath;
    private String mediaMimeType;
    private String mediaFileName;
    private Long mediaSizeBytes;
    private boolean mediaDownloaded;
    private int downloadAttempts;

    private MessageStatus status = MessageStatus.Pending;

    private String error;

    /** Time of the message according to Meta (its epoch timestamp). */
    private OffsetDateTime messageAt;

    private OffsetDateTime createdAt;

    /** User who replied from the panel. Null for inbound messages. */
    @ManyToOne
    @JoinColumn(name = "SentByUserId")
    private User sentByUser;

    /** Template name, when the outbound message reopened a conversation outside the service window. */
    private String templateName;
}
