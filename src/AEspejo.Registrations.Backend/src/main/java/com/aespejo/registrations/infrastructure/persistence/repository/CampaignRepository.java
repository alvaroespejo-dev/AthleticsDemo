package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Campaign;
import com.aespejo.registrations.domain.enums.CampaignStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignRepository extends JpaRepository<Campaign, Integer> {

    Page<Campaign> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Campaigns of one brand, for deployments fixed to a brand (the C# {@code CodigoFijo}). */
    Page<Campaign> findByBrandCodeOrderByCreatedAtDesc(String brandCode, Pageable pageable);

    List<Campaign> findByStatusOrderByCreatedAtAsc(CampaignStatus status);
}
