package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.AthleteAccount;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AthleteAccountRepository extends JpaRepository<AthleteAccount, Integer> {

    List<AthleteAccount> findByAthleteIdOrderByCreatedAtAsc(int athleteId);

    java.util.Optional<AthleteAccount> findByProviderAndProviderSubject(String provider, String providerSubject);
}
