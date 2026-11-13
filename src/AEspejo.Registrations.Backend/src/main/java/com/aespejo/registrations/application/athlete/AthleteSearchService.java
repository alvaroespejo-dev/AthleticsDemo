package com.aespejo.registrations.application.athlete;

import com.aespejo.registrations.application.athlete.AthleteSearchModels.FoundAthlete;
import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.entities.MoneySportMovement;
import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.enums.MoneySportMovementType;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.services.DataNormalizer;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.MoneySportMovementRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lookup of an existing athlete for the public registration form, so the form can pre-fill the data. The match is exact on the document number, and athletes who withdrew from marketing
 * or were unsubscribed are not shown.
 */
@Service
@Transactional(readOnly = true)
public class AthleteSearchService {

    private static final List<RegistrationStatus> LIVE = List.of(
            RegistrationStatus.Pending, RegistrationStatus.Paid, RegistrationStatus.UnderReview);

    private final AthleteRepository athletes;
    private final MoneySportMovementRepository movements;

    public AthleteSearchService(AthleteRepository athletes, MoneySportMovementRepository movements) {
        this.athletes = athletes;
        this.movements = movements;
    }

    /**
     * Every athlete with that document number: the same number can exist for different document types or
     * nationalities, and the person picks their own. {@code eventSlug} is optional; when given, each result says whether
     * the athlete already has a live registration in that event.
     */
    public List<FoundAthlete> searchByDocument(String documentNumber, String eventSlug) {
        if (documentNumber == null || documentNumber.isBlank()) {
            return List.of();
        }
        String normalized = DataNormalizer.normalizeDocument(documentNumber);
        return athletes.findByDocumentNumber(normalized).stream()
                .filter(a -> a.getUnsubscribedAt() == null)
                // Ordered by the document type's numeric value, which follows declaration order.
                .sorted(java.util.Comparator.comparing((Athlete a) -> a.getDocumentType().ordinal()))
                .map(a -> toFound(a, eventSlug))
                .toList();
    }

    private FoundAthlete toFound(Athlete a, String eventSlug) {
        Boolean alreadyRegistered = eventSlug == null ? null : a.getRegistrations().stream()
                .anyMatch(r -> eventSlug.equals(r.getEvent().getSlug()) && LIVE.contains(r.getStatus()));
        return new FoundAthlete(
                a.getId(),
                a.getDocumentType(),
                a.getDocumentNumber(),
                a.getFirstNames(),
                a.getLastNames(),
                a.getSex(),
                a.getBirthDate(),
                a.getPhoneCountryCode(),
                a.getPhoneNumber(),
                a.getEmail(),
                a.getCity(),
                a.getClub(),
                a.getNationality(),
                a.getEmergencyContactName(),
                a.getEmergencyContactPhoneCountryCode(),
                a.getEmergencyContactPhoneNumber(),
                a.getBloodType(),
                a.getAllergies(),
                alreadyRegistered,
                balance(a.getId()));
    }

    /** Credits minus debits, the same balance the Money Sport page shows. */
    private long balance(int athleteId) {
        List<MoneySportMovement> history = movements.findByAthleteIdOrderByDateDesc(athleteId);
        long credited = history.stream().filter(m -> m.getType() == MoneySportMovementType.Credit)
                .mapToLong(MoneySportMovement::getAmountCents).sum();
        long used = history.stream().filter(m -> m.getType() == MoneySportMovementType.Debit)
                .mapToLong(m -> Math.abs(m.getAmountCents())).sum();
        return credited - used;
    }
}
