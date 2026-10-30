package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.KitDelivery;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KitDeliveryRepository extends JpaRepository<KitDelivery, Integer> {

    boolean existsByRegistrationId(Integer registrationId);
}