package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.WhatsAppConversation;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WhatsAppConversationRepository
        extends JpaRepository<WhatsAppConversation, Integer>, JpaSpecificationExecutor<WhatsAppConversation> {

    Optional<WhatsAppConversation> findByBrandIdAndPhoneE164(Integer brandId, String phoneE164);

    long countByArchivedFalseAndUnreadCountGreaterThan(int unreadCount);
}
