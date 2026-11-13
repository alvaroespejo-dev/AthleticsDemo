package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Modality;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ModalityRepository extends JpaRepository<Modality, Integer> {

    boolean existsByEventIdAndName(Integer eventId, String name);

    boolean existsByEventIdAndNameAndIdNot(Integer eventId, String name, Integer id);

    /** Other modalities of the same event whose bib range overlaps the given one. */
    @Query("""
            select m.name from Modality m
            where m.event.id = :eventId
              and m.id <> :excludedId
              and m.bibFrom is not null and m.bibTo is not null
              and m.bibFrom <= :to and m.bibTo >= :from
            """)
    List<String> findOverlappingBibRangeNames(
            @Param("eventId") Integer eventId,
            @Param("excludedId") Integer excludedId,
            @Param("from") Integer from,
            @Param("to") Integer to);
}