package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.enums.DocumentType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AthleteRepository extends JpaRepository<Athlete, Integer> {

    java.util.List<Athlete> findByDocumentNumber(String documentNumber);

    Optional<Athlete> findFirstByEmail(String email);

    Optional<Athlete> findByDocumentTypeAndDocumentNumber(DocumentType documentType, String documentNumber);

    /** Athletes whose country code and number concatenated equal the WhatsApp id (digits only, no plus sign). */
    @Query("select a.id from Athlete a where concat(a.phoneCountryCode, a.phoneNumber) = :waId")
    java.util.List<Integer> findIdsByWhatsAppId(@Param("waId") String waId);
}