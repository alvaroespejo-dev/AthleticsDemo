package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    boolean existsByTransactionNumber(String transactionNumber);

    boolean existsByTransactionNumberAndIdNot(String transactionNumber, Integer id);

    List<Payment> findByRegistrationIdOrderByCreditedAtAsc(Integer registrationId);
}