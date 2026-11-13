package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Size;
import com.aespejo.registrations.domain.enums.GarmentType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SizeRepository extends JpaRepository<Size, Integer> {

    boolean existsByMeasureAndType(String measure, GarmentType type);

    boolean existsByMeasureAndTypeAndIdNot(String measure, GarmentType type, Integer id);
}