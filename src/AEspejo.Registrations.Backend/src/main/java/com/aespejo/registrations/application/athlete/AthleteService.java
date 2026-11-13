package com.aespejo.registrations.application.athlete;

import com.aespejo.registrations.application.athlete.AthleteModels.AthleteDetail;
import com.aespejo.registrations.application.athlete.AthleteModels.AthleteFilter;
import com.aespejo.registrations.application.athlete.AthleteModels.AthleteListing;
import com.aespejo.registrations.application.athlete.AthleteModels.AthleteOrder;
import com.aespejo.registrations.application.athlete.AthleteModels.AthleteRow;
import com.aespejo.registrations.application.athlete.AthleteModels.AthleteSummary;
import com.aespejo.registrations.application.athlete.AthleteModels.LinkedAccount;
import com.aespejo.registrations.application.athlete.AthleteModels.ParticipationItem;
import com.aespejo.registrations.application.athlete.AthleteModels.SaveAthleteRequest;
import com.aespejo.registrations.common.PageResponse;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.entities.AthleteAccount;
import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.services.AgeCalculator;
import com.aespejo.registrations.domain.services.DataNormalizer;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteAccountRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The athlete register: one row per person across all events. and
 * {@code ServicioPortalAtleta} (linked accounts).
 *
 * Filtering and sorting happen in memory. The register is a few thousand people at most, which keeps the
 * rules exact and easy to read; move them to queries if the register grows.
 */
@Service
@Transactional
public class AthleteService {

    private final AthleteRepository athletes;
    private final AthleteAccountRepository accounts;

    public AthleteService(AthleteRepository athletes, AthleteAccountRepository accounts) {
        this.athletes = athletes;
        this.accounts = accounts;
    }

    @Transactional(readOnly = true)
    public AthleteListing list(AthleteFilter filter, int page, int pageSize) {
        LocalDate today = LocalDate.now();
        List<Athlete> matching = athletes.findAll().stream()
                .filter(a -> matches(a, filter, today))
                .sorted(comparator(filter.order()))
                .toList();

        AthleteSummary summary = summarize(matching);
        List<AthleteRow> rows = matching.stream().map(a -> toRow(a, today)).toList();
        return new AthleteListing(PageResponse.of(rows, page, pageSize), summary);
    }

    @Transactional(readOnly = true)
    public AthleteDetail get(int id) {
        return toDetail(find(id), LocalDate.now());
    }

    public AthleteDetail update(int id, SaveAthleteRequest request) {
        Athlete athlete = find(id);
        LocalDate today = LocalDate.now();

        if (request.birthDate().isAfter(today)) {
            throw new BusinessRuleException("athlete.birthDate.future");
        }
        String documentNumber = DataNormalizer.normalizeDocument(request.documentNumber());
        var phone = DataNormalizer.normalizePhone(request.phoneCountryCode(), request.phoneNumber())
                .orElseThrow(() -> new BusinessRuleException("athlete.phone.invalid"));

        // The emergency contact is optional, but a number that is given must be valid: a dirty number is worse
        // than none, because nobody finds out until it is needed.
        Optional<DataNormalizer.Phone> emergency = blank(request.emergencyContactPhoneNumber())
                ? Optional.empty()
                : Optional.of(DataNormalizer.normalizePhone(
                        request.emergencyContactPhoneCountryCode(), request.emergencyContactPhoneNumber())
                        .orElseThrow(() -> new BusinessRuleException("athlete.emergencyPhone.invalid")));

        String nationality = blank(request.nationality()) ? null : request.nationality().trim().toUpperCase(Locale.ROOT);

        // The same document of the same nationality must not belong to two athletes. Checked before saving so the
        // message can say who holds it, instead of a generic database error.
        Optional<Athlete> holder = athletes.findAll().stream()
                .filter(other -> !other.getId().equals(id)
                        && other.getDocumentType() == request.documentType()
                        && documentNumber.equals(other.getDocumentNumber())
                        && java.util.Objects.equals(nationality, other.getNationality()))
                .findFirst();
        if (holder.isPresent()) {
            Athlete other = holder.get();
            throw new ConflictException("athlete.document.duplicate", documentNumber,
                    other.getFirstNames() + " " + other.getLastNames(), other.getId());
        }

        athlete.setDocumentType(request.documentType());
        athlete.setDocumentNumber(documentNumber);
        athlete.setDocumentNumberOriginal(request.documentNumber().trim());
        athlete.setNationality(nationality);
        athlete.setFirstNames(DataNormalizer.normalizeName(request.firstNames()));
        athlete.setLastNames(DataNormalizer.normalizeName(request.lastNames()));
        athlete.setSex(request.sex());
        athlete.setBirthDate(request.birthDate());
        athlete.setPhoneCountryCode(phone.countryCode());
        athlete.setPhoneNumber(phone.number());
        athlete.setPhoneOriginal("+" + request.phoneCountryCode() + request.phoneNumber());
        athlete.setEmail(blank(request.email()) ? null : request.email().trim());
        athlete.setCity(blank(request.city()) ? null : request.city().trim());
        athlete.setClub(blank(request.club()) ? null : request.club().trim());
        athlete.setEmergencyContactName(blank(request.emergencyContactName())
                ? null : DataNormalizer.normalizeName(request.emergencyContactName()));
        athlete.setEmergencyContactPhoneCountryCode(emergency.map(DataNormalizer.Phone::countryCode).orElse(null));
        athlete.setEmergencyContactPhoneNumber(emergency.map(DataNormalizer.Phone::number).orElse(null));
        athlete.setBloodType(blank(request.bloodType()) ? null : request.bloodType().trim().toUpperCase(Locale.ROOT));
        athlete.setAllergies(blank(request.allergies()) ? null : request.allergies().trim());
        athlete.setUpdatedAt(OffsetDateTime.now());

        return toDetail(athlete, today);
    }

    /** Linked external sign-ins of the athlete. */
    @Transactional(readOnly = true)
    public List<LinkedAccount> linkedAccounts(int athleteId) {
        find(athleteId);
        return accounts.findByAthleteIdOrderByCreatedAtAsc(athleteId).stream()
                .map(a -> new LinkedAccount(a.getId(), a.getProvider(), a.getEmail(),
                        a.getCreatedAt(), a.getLastAccessAt()))
                .toList();
    }

    /**
     * Frees an external sign-in from its athlete. It is the undo of a wrong claim: the verification is document
     * plus phone, which someone who knows the athlete can supply. The account is kept, unlinked, so its next login
     * shows the sign-up again.
     */
    public void unlinkAccount(int accountId) {
        AthleteAccount account = accounts.findById(accountId)
                .orElseThrow(() -> new NotFoundException("entity.athleteAccount", accountId));
        account.setAthlete(null);
        account.setLinkAttempts(0);
        account.setLockedUntil(null);
    }

    // ---- Filtering and sorting ----

    private static boolean matches(Athlete a, AthleteFilter f, LocalDate today) {
        if (!blank(f.text())) {
            String needle = f.text().trim().toLowerCase(Locale.ROOT);
            boolean hit = a.getDocumentNumber().toLowerCase(Locale.ROOT).contains(needle)
                    || a.getFirstNames().toLowerCase(Locale.ROOT).contains(needle)
                    || a.getLastNames().toLowerCase(Locale.ROOT).contains(needle)
                    || (a.getPhoneCountryCode() + a.getPhoneNumber()).contains(needle)
                    || (a.getEmail() != null && a.getEmail().toLowerCase(Locale.ROOT).contains(needle));
            if (!hit) return false;
        }
        if (!blank(f.city()) && (a.getCity() == null || !a.getCity().contains(f.city().trim()))) return false;
        if (!blank(f.club()) && (a.getClub() == null || !a.getClub().contains(f.club().trim()))) return false;
        if (f.sex() != null && a.getSex() != f.sex()) return false;
        int age = AgeCalculator.age(a.getBirthDate(), today);
        if (f.minAge() != null && age < f.minAge()) return false;
        if (f.maxAge() != null && age > f.maxAge()) return false;
        if (f.marketingOptIn() != null && a.isMarketingOptIn() != f.marketingOptIn()) return false;
        if (f.withEmail() != null && (blank(a.getEmail()) == f.withEmail())) return false;
        if (f.eventId() != null && a.getRegistrations().stream()
                .noneMatch(r -> r.getEvent().getId().equals(f.eventId()))) return false;
        return true;
    }

    private static Comparator<Athlete> comparator(AthleteOrder order) {
        Comparator<Athlete> byName = Comparator.comparing(Athlete::getLastNames, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(Athlete::getFirstNames, String.CASE_INSENSITIVE_ORDER);
        if (order == null) return byName;
        return switch (order) {
            case LastNameAsc -> byName;
            case RecentDesc -> Comparator.comparing(Athlete::getCreatedAt).reversed();
            case MostEvents -> Comparator.comparingInt((Athlete a) -> a.getRegistrations().size()).reversed()
                    .thenComparing(Athlete::getLastNames, String.CASE_INSENSITIVE_ORDER);
            // Athletes who never raced go last, not first.
            case LastRaceDesc -> Comparator.comparing((Athlete a) -> lastEventDate(a),
                            Comparator.nullsLast(Comparator.<LocalDate>reverseOrder()))
                    .thenComparing(Athlete::getLastNames, String.CASE_INSENSITIVE_ORDER);
        };
    }

    private static AthleteSummary summarize(List<Athlete> matching) {
        long withWhatsApp = matching.stream().map(a -> a.getPhoneCountryCode() + a.getPhoneNumber()).distinct().count();
        long withEmail = matching.stream().filter(a -> !blank(a.getEmail())).count();
        long withOptIn = matching.stream().filter(a -> a.isMarketingOptIn() && a.getUnsubscribedAt() == null).count();
        long unsubscribed = matching.stream().filter(a -> a.getUnsubscribedAt() != null).count();
        return new AthleteSummary(matching.size(), withWhatsApp, withEmail, withOptIn, unsubscribed);
    }

    // ---- Mapping ----

    private static AthleteRow toRow(Athlete a, LocalDate today) {
        Registration last = lastRegistration(a);
        return new AthleteRow(
                a.getId(),
                a.getDocumentType(),
                a.getDocumentNumber(),
                a.getFirstNames(),
                a.getLastNames(),
                a.getSex(),
                a.getBirthDate(),
                AgeCalculator.age(a.getBirthDate(), today),
                "+" + a.getPhoneCountryCode() + a.getPhoneNumber(),
                a.getEmail(),
                a.getCity(),
                a.getClub(),
                a.getRegistrations().size(),
                (int) a.getRegistrations().stream().filter(r -> r.getStatus() == RegistrationStatus.Paid).count(),
                last == null ? null : last.getEvent().getName(),
                last == null ? null : last.getEvent().getEventDate(),
                a.isMarketingOptIn(),
                a.getUnsubscribedAt());
    }

    private AthleteDetail toDetail(Athlete a, LocalDate today) {
        List<ParticipationItem> participations = a.getRegistrations().stream()
                .sorted(Comparator.comparing((Registration r) -> r.getEvent().getEventDate()).reversed())
                .map(r -> new ParticipationItem(
                        r.getId(),
                        r.getEvent().getId(),
                        r.getCode(),
                        r.getEvent().getName(),
                        r.getEvent().getEventDate(),
                        r.getModality().getName(),
                        r.getStatus(),
                        r.getBibNumber(),
                        r.getModality().getDistanceMeters(),
                        r.getResult()))
                .toList();
        return new AthleteDetail(
                a.getId(),
                a.getDocumentType(),
                a.getDocumentNumber(),
                a.getDocumentNumberOriginal(),
                a.getNationality(),
                a.getFirstNames(),
                a.getLastNames(),
                a.getSex(),
                a.getBirthDate(),
                AgeCalculator.age(a.getBirthDate(), today),
                a.getPhoneCountryCode(),
                a.getPhoneNumber(),
                a.getEmail(),
                a.getCity(),
                a.getClub(),
                a.getEmergencyContactName(),
                a.getEmergencyContactPhoneCountryCode(),
                a.getEmergencyContactPhoneNumber(),
                a.getBloodType(),
                a.getAllergies(),
                a.isMarketingOptIn(),
                a.getMarketingOptInAt(),
                a.getUnsubscribedAt(),
                a.getCreatedAt(),
                a.getUpdatedAt(),
                participations);
    }

    private static LocalDate lastEventDate(Athlete a) {
        Registration last = lastRegistration(a);
        return last == null ? null : last.getEvent().getEventDate();
    }

    /** The registration of the most recent race, by race date and not by sign-up date. */
    private static Registration lastRegistration(Athlete a) {
        return a.getRegistrations().stream()
                .max(Comparator.comparing(r -> r.getEvent().getEventDate()))
                .orElse(null);
    }

    private Athlete find(int id) {
        return athletes.findById(id).orElseThrow(() -> new NotFoundException("entity.athlete", id));
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
