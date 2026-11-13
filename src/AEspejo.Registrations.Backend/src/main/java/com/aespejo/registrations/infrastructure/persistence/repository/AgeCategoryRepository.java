package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.AgeCategory;
import com.aespejo.registrations.domain.enums.Sex;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgeCategoryRepository extends JpaRepository<AgeCategory, Integer> {

    List<AgeCategory> findByEventIdOrderBySexAscSortOrderAsc(Integer eventId);

    boolean existsByEventId(Integer eventId);

    /** Other categories of the same event and sex whose age range overlaps the given one. */
    @Query("""
            select c.name from AgeCategory c
            where c.event.id = :eventId
              and c.sex = :sex
              and c.id <> :excludedId
              and c.minAge <= :maxAge and c.maxAge >= :minAge
            """)
    List<String> findOverlappingNames(
            @Param("eventId") Integer eventId,
            @Param("sex") Sex sex,
            @Param("excludedId") Integer excludedId,
            @Param("minAge") int minAge,
            @Param("maxAge") int maxAge);
}