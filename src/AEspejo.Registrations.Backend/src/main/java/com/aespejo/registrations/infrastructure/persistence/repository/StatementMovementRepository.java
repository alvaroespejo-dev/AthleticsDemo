package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.StatementMovement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatementMovementRepository extends JpaRepository<StatementMovement, Integer> {

    boolean existsByPaymentId(Integer paymentId);
}