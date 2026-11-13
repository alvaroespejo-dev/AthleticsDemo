package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.CampaignMessage;
import com.aespejo.registrations.domain.enums.MessageStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CampaignMessageRepository extends JpaRepository<CampaignMessage, Integer> {

    /** All recipients of a campaign, failed first: those are the ones somebody has to look at. */
    @Query(value = "select m from CampaignMessage m where m.campaign.id = :campaignId "
            + "order by case when m.status = :failed then 0 else 1 end, m.id",
            countQuery = "select count(m) from CampaignMessage m where m.campaign.id = :campaignId")
    Page<CampaignMessage> findByCampaignFailedFirst(
            @Param("campaignId") Integer campaignId, @Param("failed") MessageStatus failed, Pageable pageable);

    Page<CampaignMessage> findByCampaignIdAndStatusOrderByIdAsc(Integer campaignId, MessageStatus status, Pageable pageable);

    long countByCampaignId(Integer campaignId);

    long countByCampaignIdAndStatus(Integer campaignId, MessageStatus status);

    List<CampaignMessage> findByCampaignIdAndStatus(Integer campaignId, MessageStatus status);

    /** The next messages to try: still pending and with attempts left. */
    List<CampaignMessage> findByCampaignIdAndStatusAndAttemptsLessThanOrderByIdAsc(
            Integer campaignId, MessageStatus status, int maxAttempts, Pageable pageable);

    boolean existsByCampaignIdAndStatusAndAttemptsLessThan(Integer campaignId, MessageStatus status, int maxAttempts);

    /** Athletes already handled by the campaign, so rebuilding its audience does not message them twice. */
    @Query("select m.athlete.id from CampaignMessage m where m.campaign.id = :campaignId and m.status <> :status")
    List<Integer> findAthleteIdsWithStatusNot(@Param("campaignId") Integer campaignId, @Param("status") MessageStatus status);

    Optional<CampaignMessage> findFirstByExternalId(String externalId);
}
