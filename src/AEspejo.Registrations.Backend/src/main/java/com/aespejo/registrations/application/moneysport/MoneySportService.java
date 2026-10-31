package com.aespejo.registrations.application.moneysport;

import com.aespejo.registrations.application.athlete.AthleteModels.ParticipationItem;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.entities.MoneySportMovement;
import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.enums.MoneySportMovementType;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.services.DataNormalizer;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.MoneySportMovementRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Money Sport: the public page where an athlete checks the virtual money balance. The page is deliberately thin: no contact or medical data, and the balance is only shown
 * when the document number matches the athlete's, so consecutive ids cannot reveal other people's balances.
 */
@Service
@Transactional(readOnly = true)
public class MoneySportService {

    private final AthleteRepository athletes;
    private final MoneySportMovementRepository movements;

    public MoneySportService(AthleteRepository athletes, MoneySportMovementRepository movements) {
        this.athletes = athletes;
        this.movements = movements;
    }

    /** Athletes with that document number, to pick one when several share it. No balance here. */
    public List<Candidate> searchByDocument(String documentNumber) {
        if (documentNumber == null || documentNumber.isBlank()) {
            return List.of();
        }
        String normalized = DataNormalizer.normalizeDocument(documentNumber);
        return athletes.findByDocumentNumber(normalized).stream()
                .filter(a -> a.getUnsubscribedAt() == null)
                .sorted(Comparator.comparing((Athlete a) -> a.getDocumentType().name())
                        .thenComparing(Athlete::getLastNames))
                .map(a -> new Candidate(a.getId(), a.getDocumentType(), a.getDocumentNumber(),
                        a.getFirstNames(), a.getLastNames(), a.getNationality()))
                .toList();
    }

    /** Balance, history and paid races of the chosen athlete. The document number must match. */
    public Detail get(int athleteId, String documentNumber) {
        if (documentNumber == null || documentNumber.isBlank()) {
            throw new NotFoundException("entity.athlete", athleteId);
        }
        String normalized = DataNormalizer.normalizeDocument(documentNumber);
        Athlete athlete = athletes.findById(athleteId)
                .filter(a -> normalized.equals(a.getDocumentNumber()) && a.getUnsubscribedAt() == null)
                .orElseThrow(() -> new NotFoundException("entity.athlete", athleteId));

        List<MoneySportMovement> history = movements.findByAthleteIdOrderByDateDesc(athlete.getId());
        long credited = history.stream()
                .filter(m -> m.getType() == MoneySportMovementType.Credit)
                .mapToLong(MoneySportMovement::getAmountCents).sum();
        long used = history.stream()
                .filter(m -> m.getType() == MoneySportMovementType.Debit)
                .mapToLong(m -> Math.abs(m.getAmountCents())).sum();

        List<ParticipationItem> participations = athlete.getRegistrations().stream()
                .filter(r -> r.getStatus() == RegistrationStatus.Paid)
                .sorted(Comparator.comparing((Registration r) -> r.getEvent().getEventDate()).reversed())
                .map(r -> new ParticipationItem(r.getId(), r.getEvent().getId(), r.getCode(), r.getEvent().getName(),
                        r.getEvent().getEventDate(), r.getModality().getName(), r.getStatus(), r.getBibNumber(),
                        r.getModality().getDistanceMeters(), r.getResult()))
                .toList();

        return new Detail(
                athlete.getDocumentType(),
                athlete.getFirstNames(),
                athlete.getLastNames(),
                athlete.getDocumentNumber(),
                credited - used,
                credited,
                used,
                participations,
                history.stream().map(MoneySportService::toMovement).toList());
    }

    private static Movement toMovement(MoneySportMovement m) {
        Optional<Registration> registration = Optional.ofNullable(m.getRegistration());
        return new Movement(
                m.getType(),
                Math.abs(m.getAmountCents()),
                m.getDate(),
                registration.map(r -> r.getEvent().getName()).orElse(""));
    }

    public record Candidate(
            int id,
            com.aespejo.registrations.domain.enums.DocumentType documentType,
            String documentNumber,
            String firstNames,
            String lastNames,
            String nationality) {
    }

    public record Movement(MoneySportMovementType type, int amountCents, java.time.OffsetDateTime date, String eventName) {
    }

    public record Detail(
            com.aespejo.registrations.domain.enums.DocumentType documentType,
            String firstNames,
            String lastNames,
            String documentNumber,
            long balanceCents,
            long creditedCents,
            long usedCents,
            List<ParticipationItem> participations,
            List<Movement> movements) {
    }
}
