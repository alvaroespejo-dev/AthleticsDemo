package com.aespejo.registrations.application.portal;

import com.aespejo.registrations.application.athlete.AthleteModels.AthleteDetail;
import com.aespejo.registrations.application.athlete.AthleteService;
import com.aespejo.registrations.application.portal.PortalModels.AccountView;
import com.aespejo.registrations.application.portal.PortalModels.ClaimRequest;
import com.aespejo.registrations.application.portal.PortalModels.Identity;
import com.aespejo.registrations.application.portal.PortalModels.SaveProfileRequest;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.entities.AthleteAccount;
import com.aespejo.registrations.domain.enums.OptInSource;
import com.aespejo.registrations.domain.services.DataNormalizer;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteAccountRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteRepository;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Athlete self-service through an external identity provider. Ported from {@code ServicioPortalAtleta}.
 *
 * The rules that protect the register: an external account is linked to an existing athlete only when the provider
 * verified the same e-mail; a claim needs document plus phone and stops after repeated failures; a document that is
 * already taken is never adopted by a different e-mail.
 */
@Service
@Transactional
public class PortalService {

    /** The identity provider this portal accepts. Stored on every linked account. */
    public static final String PROVIDER = "auth0";

    private static final int MAX_CLAIM_ATTEMPTS = 5;
    private static final Duration CLAIM_LOCK = Duration.ofHours(1);

    private final AthleteAccountRepository accounts;
    private final AthleteRepository athletes;
    private final AthleteService athleteService;

    public PortalService(AthleteAccountRepository accounts, AthleteRepository athletes, AthleteService athleteService) {
        this.accounts = accounts;
        this.athletes = athletes;
        this.athleteService = athleteService;
    }

    /** Current state of the signed-in account. Creates the account on first sign-in; never fails because the athlete is missing. */
    public AccountView account(String subject, Identity identity) {
        AthleteAccount account = findOrCreateAccount(subject, identity);
        return view(account, identity);
    }

    /** Creates the athlete profile for a signed-in account that has none yet. */
    public AccountView createProfile(String subject, Identity identity, SaveProfileRequest request) {
        AthleteAccount account = findOrCreateAccount(subject, identity);
        if (account.getAthlete() != null) {
            return view(account, identity);
        }

        String documentNumber = DataNormalizer.normalizeDocument(request.documentNumber());
        var phone = DataNormalizer.normalizePhone(request.phoneCountryCode(), request.phoneNumber())
                .orElseThrow(() -> new BusinessRuleException("athlete.phone.invalid"));
        var emergency = emergencyPhone(request);

        // The same document belongs to one athlete. A different e-mail does not get the history by typing the number.
        Optional<Athlete> taken = athletes.findByDocumentTypeAndDocumentNumber(request.documentType(), documentNumber);
        if (taken.isPresent()) {
            throw new ConflictException(
                    taken.get().getEmail() == null || taken.get().getEmail().isBlank()
                            ? "portal.document.takenNoEmail"
                            : "portal.document.taken", mask(taken.get().getEmail()));
        }

        OffsetDateTime now = OffsetDateTime.now();
        Athlete athlete = new Athlete();
        athlete.setDocumentType(request.documentType());
        athlete.setDocumentNumber(documentNumber);
        athlete.setDocumentNumberOriginal(request.documentNumber().trim());
        athlete.setNationality(blankToNull(request.nationality()) == null ? null : request.nationality().trim().toUpperCase(java.util.Locale.ROOT));
        athlete.setFirstNames(DataNormalizer.normalizeName(request.firstNames()));
        athlete.setLastNames(DataNormalizer.normalizeName(request.lastNames()));
        athlete.setSex(request.sex());
        athlete.setBirthDate(request.birthDate());
        athlete.setPhoneCountryCode(phone.countryCode());
        athlete.setPhoneNumber(phone.number());
        athlete.setPhoneOriginal("+" + request.phoneCountryCode() + request.phoneNumber());
        athlete.setEmail(account.getEmail());
        athlete.setCity(blankToNull(request.city()));
        athlete.setClub(blankToNull(request.club()));
        athlete.setEmergencyContactName(blankToNull(request.emergencyContactName()));
        athlete.setEmergencyContactPhoneCountryCode(emergency.map(DataNormalizer.Phone::countryCode).orElse(null));
        athlete.setEmergencyContactPhoneNumber(emergency.map(DataNormalizer.Phone::number).orElse(null));
        athlete.setBloodType(blankToNull(request.bloodType()));
        athlete.setAllergies(blankToNull(request.allergies()));
        athlete.setMarketingOptIn(request.acceptsMarketing());
        athlete.setMarketingOptInAt(request.acceptsMarketing() ? now : null);
        athlete.setOptInSource(request.acceptsMarketing() ? OptInSource.Form : null);
        athlete.setCreatedAt(now);
        athlete.setUpdatedAt(now);
        athletes.save(athlete);

        account.setAthlete(athlete);
        return view(account, identity);
    }

    /**
     * Links the signed-in identity with an athlete who already exists, verified with document plus phone. This is the
     * way out for someone who signs in with a second provider and a different e-mail (for example Apple's hidden e-mail).
     */
    public AccountView claim(String subject, Identity identity, ClaimRequest request) {
        AthleteAccount account = findOrCreateAccount(subject, identity);
        if (account.getAthlete() != null) {
            return view(account, identity);
        }
        if (account.getLockedUntil() != null && account.getLockedUntil().isAfter(OffsetDateTime.now())) {
            long minutes = Duration.between(OffsetDateTime.now(), account.getLockedUntil()).toMinutes() + 1;
            throw new BusinessRuleException("portal.claim.locked", minutes);
        }

        String documentNumber = DataNormalizer.normalizeDocument(request.documentNumber());
        var phone = DataNormalizer.normalizePhone(request.phoneCountryCode(), request.phoneNumber())
                .orElseThrow(() -> new BusinessRuleException("athlete.phone.invalid"));

        Optional<Athlete> match = athletes.findByDocumentTypeAndDocumentNumber(request.documentType(), documentNumber)
                .filter(a -> a.getPhoneCountryCode().equals(phone.countryCode())
                        && a.getPhoneNumber().equals(phone.number()));
        if (match.isEmpty()) {
            // The same message whether the document is unknown or the phone differs: telling them apart would let
            // someone find out which documents are registered and which phone each one has.
            account.setLinkAttempts(account.getLinkAttempts() + 1);
            if (account.getLinkAttempts() >= MAX_CLAIM_ATTEMPTS) {
                account.setLockedUntil(OffsetDateTime.now().plus(CLAIM_LOCK));
                account.setLinkAttempts(0);
            }
            throw new BusinessRuleException("portal.claim.notFound");
        }

        account.setAthlete(match.get());
        account.setLinkAttempts(0);
        account.setLockedUntil(null);
        return view(account, identity);
    }

    /** Edits the profile of the athlete linked to the signed-in account. Consent is revoked when the box is unchecked. */
    public AthleteDetail updateProfile(String subject, Identity identity, SaveProfileRequest request) {
        AthleteAccount account = findOrCreateAccount(subject, identity);
        Athlete athlete = account.getAthlete();
        if (athlete == null) {
            throw new BusinessRuleException("portal.noProfile");
        }
        var phone = DataNormalizer.normalizePhone(request.phoneCountryCode(), request.phoneNumber())
                .orElseThrow(() -> new BusinessRuleException("athlete.phone.invalid"));
        var emergency = emergencyPhone(request);

        athlete.setFirstNames(DataNormalizer.normalizeName(request.firstNames()));
        athlete.setLastNames(DataNormalizer.normalizeName(request.lastNames()));
        athlete.setBirthDate(request.birthDate());
        athlete.setSex(request.sex());
        athlete.setPhoneCountryCode(phone.countryCode());
        athlete.setPhoneNumber(phone.number());
        athlete.setNationality(blankToNull(request.nationality()) == null ? null : request.nationality().trim().toUpperCase(java.util.Locale.ROOT));
        athlete.setCity(blankToNull(request.city()));
        athlete.setClub(blankToNull(request.club()));
        athlete.setEmergencyContactName(blankToNull(request.emergencyContactName()));
        athlete.setEmergencyContactPhoneCountryCode(emergency.map(DataNormalizer.Phone::countryCode).orElse(null));
        athlete.setEmergencyContactPhoneNumber(emergency.map(DataNormalizer.Phone::number).orElse(null));
        athlete.setBloodType(blankToNull(request.bloodType()));
        athlete.setAllergies(blankToNull(request.allergies()));
        // Unlike the public form, here unchecking the box does revoke the consent: this is the athlete's own settings.
        if (request.acceptsMarketing() && !athlete.isMarketingOptIn()) {
            athlete.setMarketingOptIn(true);
            athlete.setMarketingOptInAt(OffsetDateTime.now());
            athlete.setOptInSource(OptInSource.Form);
        } else if (!request.acceptsMarketing() && athlete.isMarketingOptIn()) {
            athlete.setMarketingOptIn(false);
        }
        athlete.setUpdatedAt(OffsetDateTime.now());
        return athleteService.get(athlete.getId());
    }

    private AthleteAccount findOrCreateAccount(String subject, Identity identity) {
        String email = identity == null || identity.email() == null ? "" : identity.email().trim().toLowerCase(java.util.Locale.ROOT);
        AthleteAccount account = accounts.findByProviderAndProviderSubject(PROVIDER, subject).orElseGet(() -> {
            AthleteAccount created = new AthleteAccount();
            created.setProvider(PROVIDER);
            created.setProviderSubject(subject);
            created.setCreatedAt(OffsetDateTime.now());
            return created;
        });
        account.setLastAccessAt(OffsetDateTime.now());
        if (!email.isBlank()) {
            account.setEmail(email);
        }
        // Only a verified e-mail may claim an existing athlete: otherwise anyone could declare someone else's e-mail and
        // take their race history.
        if (account.getAthlete() == null && identity != null && identity.emailVerified() && !email.isBlank()) {
            athletes.findFirstByEmail(email).ifPresent(account::setAthlete);
        }
        return accounts.save(account);
    }

    private AccountView view(AthleteAccount account, Identity identity) {
        AthleteDetail profile = account.getAthlete() == null ? null : athleteService.get(account.getAthlete().getId());
        return new AccountView(account.getId(), account.getAthlete() == null ? null : account.getAthlete().getId(),
                account.getEmail(), profile,
                identity == null ? null : identity.firstNames(), identity == null ? null : identity.lastNames());
    }

    private static Optional<DataNormalizer.Phone> emergencyPhone(SaveProfileRequest request) {
        if (request.emergencyContactPhoneNumber() == null || request.emergencyContactPhoneNumber().isBlank()) {
            return Optional.empty();
        }
        return Optional.of(DataNormalizer.normalizePhone(request.emergencyContactPhoneCountryCode(),
                        request.emergencyContactPhoneNumber())
                .orElseThrow(() -> new BusinessRuleException("athlete.emergencyPhone.invalid")));
    }

    /**
     * "ana@gmail.com" becomes "a•••@gmail.com": enough for the owner to recognise the account, not enough to search.
     * The bullet is the same character the C# {@code Enmascarar} uses.
     */
    static String mask(String email) {
        if (email == null || email.isBlank()) {
            return "";
        }
        int at = email.indexOf('@');
        return at <= 0 ? "•••" : email.charAt(0) + "•••" + email.substring(at);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
