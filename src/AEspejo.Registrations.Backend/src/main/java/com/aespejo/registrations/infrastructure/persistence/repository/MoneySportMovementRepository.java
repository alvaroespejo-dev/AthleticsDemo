package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.MoneySportMovement;
import com.aespejo.registrations.domain.enums.MoneySportMovementType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MoneySportMovementRepository extends JpaRepository<MoneySportMovement, Integer> {

    List<MoneySportMovement> findByAthleteIdOrderByDateDesc(int athleteId);

    /** The movement of a given type recorded for one registration, if any (the credit of a finished event). */
    Optional<MoneySportMovement> findFirstByRegistrationIdAndType(int registrationId, MoneySportMovementType type);

    /** Virtual balance of an athlete: the sum of all its movements, credits positive and uses negative. */
    @Query("select coalesce(sum(m.amountCents), 0) from MoneySportMovement m where m.athlete.id = :athleteId")
    long balanceOf(@Param("athleteId") int athleteId);
}
