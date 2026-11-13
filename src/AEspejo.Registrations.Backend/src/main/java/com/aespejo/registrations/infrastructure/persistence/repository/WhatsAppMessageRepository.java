package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.WhatsAppMessage;
import com.aespejo.registrations.domain.enums.MessageDirection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WhatsAppMessageRepository extends JpaRepository<WhatsAppMessage, Integer> {

    boolean existsByExternalId(String externalId);

    Optional<WhatsAppMessage> findFirstByExternalIdAndDirection(String externalId, MessageDirection direction);

    Page<WhatsAppMessage> findByConversationIdOrderByMessageAtDesc(Integer conversationId, Pageable pageable);

    Optional<WhatsAppMessage> findFirstByConversationIdAndDirectionAndExternalIdIsNotNullOrderByMessageAtDesc(
            Integer conversationId, MessageDirection direction);

    /** Media still to be downloaded that has attempts left. */
    List<WhatsAppMessage> findTop10ByMediaMetaIdIsNotNullAndMediaDownloadedFalseAndDownloadAttemptsLessThanOrderByIdAsc(
            int maxAttempts);
}
