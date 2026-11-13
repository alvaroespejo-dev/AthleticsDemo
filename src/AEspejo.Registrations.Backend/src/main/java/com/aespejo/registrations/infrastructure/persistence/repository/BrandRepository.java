package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Brand;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Integer> {

    List<Brand> findAllByOrderByNameAsc();

    Optional<Brand> findByCode(String code);

    boolean existsByIdAndActiveTrue(Integer id);
}