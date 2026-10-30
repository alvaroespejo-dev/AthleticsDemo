package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.AgeCategoryTemplate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgeCategoryTemplateRepository extends JpaRepository<AgeCategoryTemplate, Integer> {

    List<AgeCategoryTemplate> findAllByOrderBySortOrderAscMinAgeAsc();

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Integer id);

    @Query("""
            select t.name from AgeCategoryTemplate t
            where t.id <> :excludedId
              and t.minAge <= :maxAge and t.maxAge >= :minAge
            """)
    List<String> findOverlappingNames(
            @Param("excludedId") Integer excludedId,
            @Param("minAge") int minAge,
            @Param("maxAge") int maxAge);
}