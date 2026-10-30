package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.PaymentQrCode;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentQrCodeRepository extends JpaRepository<PaymentQrCode, Integer> {

    List<PaymentQrCode> findByPriceTierModalityId(Integer modalityId);

    java.util.Optional<PaymentQrCode> findByPriceTierIdAndKitId(int priceTierId, int kitId);
}