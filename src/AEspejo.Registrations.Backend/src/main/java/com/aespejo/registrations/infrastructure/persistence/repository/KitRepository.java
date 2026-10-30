package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Kit;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KitRepository extends JpaRepository<Kit, Integer> {

    boolean existsByModalityIdAndName(Integer modalityId, String name);

    boolean existsByModalityIdAndNameAndIdNot(Integer modalityId, String name, Integer id);

    List<Kit> findByModalityIdOrderBySortOrderAsc(Integer modalityId);
}