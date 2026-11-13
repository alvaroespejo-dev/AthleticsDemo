package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationRepository extends JpaRepository<Registration, Integer> {

    boolean existsByEventId(Integer eventId);

    boolean existsByModalityId(Integer modalityId);

    long countByEventIdAndStatus(Integer eventId, RegistrationStatus status);

    long countByModalityIdAndStatusIn(Integer modalityId, Collection<RegistrationStatus> statuses);

    boolean existsByKitId(Integer kitId);

    long countByKitIdAndSizeIsNull(Integer kitId);

    boolean existsBySizeId(Integer sizeId);

    boolean existsByPriceTierId(Integer priceTierId);

    boolean existsByAgeCategoryId(Integer ageCategoryId);
    boolean existsByCode(String code);

    java.util.Optional<Registration> findByCode(String code);

    List<Registration> findByEventIdOrderByCreatedAtDesc(Integer eventId);

    List<Registration> findByEventId(Integer eventId);

    Optional<Registration> findFirstByEventIdAndBibNumber(Integer eventId, Integer bibNumber);

    boolean existsByEventIdAndBibNumberAndIdNot(Integer eventId, Integer bibNumber, Integer id);

    boolean existsByEventIdAndAthleteIdAndStatusIn(Integer eventId, Integer athleteId, Collection<RegistrationStatus> statuses);

    boolean existsByEventIdAndAthleteIdAndStatusInAndIdNot(
            Integer eventId, Integer athleteId, Collection<RegistrationStatus> statuses, Integer id);

    List<Registration> findByStatusAndReservationExpiresAtBefore(RegistrationStatus status, OffsetDateTime cutoff);
}