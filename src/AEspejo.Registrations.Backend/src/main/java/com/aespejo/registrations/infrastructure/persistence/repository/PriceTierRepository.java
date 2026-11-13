package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.PriceTier;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PriceTierRepository extends JpaRepository<PriceTier, Integer> {

    List<PriceTier> findByModalityIdOrderByValidFromAsc(Integer modalityId);

    /** Other tiers of the same modality whose validity window overlaps the given one. */
    @Query("""
            select t.name from PriceTier t
            where t.modality.id = :modalityId
              and t.id <> :excludedId
              and t.validFrom < :validTo and t.validTo > :validFrom
            """)
    List<String> findOverlappingNames(
            @Param("modalityId") Integer modalityId,
            @Param("excludedId") Integer excludedId,
            @Param("validFrom") OffsetDateTime validFrom,
            @Param("validTo") OffsetDateTime validTo);
}