package com.aespejo.registrations.application.registration;

import com.aespejo.registrations.application.registration.RegistrationModels.BibRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.CancelRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.CreateRegistrationRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.RecalculationResponse;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationCreatedResponse;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationDetail;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationListItem;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationOrder;
import com.aespejo.registrations.application.registration.RegistrationModels.AthleteInfo;
import com.aespejo.registrations.application.registration.RegistrationModels.KitDeliveryInfo;
import com.aespejo.registrations.application.payment.PaymentService;
import com.aespejo.registrations.domain.entities.KitDelivery;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationRow;
import com.aespejo.registrations.common.PageResponse;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationPage;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationListing;
import com.aespejo.registrations.application.registration.RegistrationModels.RegistrationSummary;
import com.aespejo.registrations.application.registration.RegistrationFilter;
import com.aespejo.registrations.application.registration.RegistrationModels.ResultRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.BatchResultRequest;
import com.aespejo.registrations.application.registration.RegistrationModels.BibAssignmentResponse;
import com.aespejo.registrations.application.registration.RegistrationModels.BatchResultResponse;
import com.aespejo.registrations.domain.entities.SystemSettings;
import com.aespejo.registrations.domain.enums.ParticipationResult;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.entities.Kit;
import com.aespejo.registrations.domain.entities.KitItem;
import com.aespejo.registrations.domain.entities.MoneySportMovement;
import com.aespejo.registrations.domain.entities.Modality;
import com.aespejo.registrations.domain.entities.PriceTier;
import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.entities.Size;
import com.aespejo.registrations.domain.enums.EventStatus;
import com.aespejo.registrations.domain.enums.GarmentType;
import com.aespejo.registrations.domain.enums.MoneySportMovementType;
import com.aespejo.registrations.domain.services.AgeCalculator;
import com.aespejo.registrations.domain.enums.OptInSource;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.services.AgeCategoryResolver;
import com.aespejo.registrations.domain.services.DataNormalizer;
import com.aespejo.registrations.domain.services.RegistrationCodeGenerator;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.EventRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.KitRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.ModalityRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.MoneySportMovementRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.PaymentQrCodeRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.SettingsRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.SizeRepository;
import com.aespejo.registrations.application.catalog.CatalogViews;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registrations: the public sign-up form, and the back-office operations on existing registrations
 * (bib numbers, cancellation, reactivation, results and age-category recalculation).
 */
@Service
@Transactional
public class RegistrationService {

    /** Seat-occupying statuses: a pending, paid or under-review registration holds a seat. */
    static final List<RegistrationStatus> LIVE = List.of(
            RegistrationStatus.Pending, RegistrationStatus.Paid, RegistrationStatus.UnderReview);

    private final EventRepository events;
    private final ModalityRepository modalities;
    private final KitRepository kits;
    private final SizeRepository sizes;
    private final AthleteRepository athletes;
    private final RegistrationRepository registrations;
    private final MessageSource messages;
    private final MoneySportMovementRepository movements;
    private final PaymentQrCodeRepository qrCodes;
    private final SettingsRepository settings;

    public RegistrationService(
            EventRepository events,
            ModalityRepository modalities,
            KitRepository kits,
            SizeRepository sizes,
            AthleteRepository athletes,
            RegistrationRepository registrations,
            MessageSource messages,
            MoneySportMovementRepository movements,
            PaymentQrCodeRepository qrCodes,
            SettingsRepository settings) {
        this.events = events;
        this.modalities = modalities;
        this.kits = kits;
        this.sizes = sizes;
        this.athletes = athletes;
        this.registrations = registrations;
        this.messages = messages;
        this.movements = movements;
        this.qrCodes = qrCodes;
        this.settings = settings;
    }

    // ---- Public sign-up ----

    public RegistrationCreatedResponse signUp(String slug, CreateRegistrationRequest request, String ip) {
        OffsetDateTime now = OffsetDateTime.now();
        Event event = events.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("entity.event", slug));
        if (event.getStatus() != EventStatus.Published) {
            throw new BusinessRuleException("registration.signUp.notAccepting");
        }
        if (now.isBefore(event.getRegistrationOpensAt())) {
            throw new BusinessRuleException("registration.signUp.notOpenYet");
        }
        if (!now.isBefore(event.getRegistrationClosesAt())) {
            throw new BusinessRuleException("registration.signUp.closed");
        }
        if (!request.waiverAccepted()) {
            throw new BusinessRuleException("registration.signUp.waiverRequired");
        }

        Modality modality = modalities.findById(request.modalityId())
                .filter(m -> m.getEvent().getId().equals(event.getId()))
                .orElseThrow(() -> new BusinessRuleException("registration.modality.notInEvent"));
        if (!modality.isActive()) {
            throw new BusinessRuleException("registration.modality.unavailable", modality.getName());
        }
        Kit kit = kits.findById(request.kitId())
                .filter(k -> k.getModality().getId().equals(modality.getId()))
                .orElseThrow(() -> new BusinessRuleException("registration.kit.notInModality"));
        if (!kit.isActive()) {
            throw new BusinessRuleException("registration.kit.unavailable", kit.getName());
        }
        Size size = resolveSize(kit, request.sizeId());

        String documentNumber = normalizeDocument(request.documentNumber());
        var phone = DataNormalizer.normalizePhone(request.phoneCountryCode(), request.phoneNumber())
                .orElseThrow(() -> new BusinessRuleException("registration.phone.invalid"));

        if (!request.birthDate().isBefore(event.getEventDate().plusDays(1))) {
            throw new BusinessRuleException("registration.birthDate.afterEvent");
        }
        int age = AgeCalculator.age(request.birthDate(), event.getEventDate());
        if (modality.getMinAge() != null && age < modality.getMinAge()) {
            throw new BusinessRuleException("registration.modality.minAge", modality.getName(),
                    modality.getMinAge(), age);
        }

        checkQuota(modality);

        Athlete athlete = findOrCreateAthlete(request, documentNumber, phone, now);
        if (registrations.existsByEventIdAndAthleteIdAndStatusIn(event.getId(), athlete.getId(), LIVE)) {
            throw new ConflictException("registration.duplicate");
        }

        PriceTier tier = currentPriceTier(modality, now)
                .orElseThrow(() -> new BusinessRuleException("registration.price.noCurrentTier", modality.getName()));
        int amount = tier.getPriceCents() + kit.getSurchargeCents() + event.getServiceFeeCents();

        // Money Sport: the athlete can pay part of the registration with the virtual balance. Same rules as before:
        // the amount used cannot exceed the balance nor the total.
        int discount = request.useMoneySportBalanceCents() == null ? 0 : request.useMoneySportBalanceCents();
        int balance = (int) movements.balanceOf(athlete.getId());
        if (discount < 0 || discount > balance) {
            throw new ConflictException("registration.moneySport.exceedsBalance", discount, balance);
        }
        if (discount > amount) {
            throw new ConflictException("registration.moneySport.exceedsTotal", discount, amount);
        }
        int net = amount - discount;
        RegistrationStatus status = net == 0 ? RegistrationStatus.Paid : RegistrationStatus.Pending;

        var category = AgeCategoryResolver.resolve(event.getAgeCategories(), athlete.getSex(),
                athlete.getBirthDate(), event.getEventDate(), modality.getId()).orElse(null);

        Registration registration = new Registration();
        registration.setCode(newCode());
        registration.setEvent(event);
        registration.setAthlete(athlete);
        registration.setModality(modality);
        registration.setKit(kit);
        registration.setPriceTier(tier);
        registration.setSize(size);
        registration.setAgeCategory(category);
        registration.setStatus(status);
        registration.setAmountCents(net);
        registration.setMoneySportDiscountCents(discount);
        registration.setCreatedAt(now);
        registration.setReservationExpiresAt(status == RegistrationStatus.Paid
                ? null : now.plusHours(event.getReservationHours()));
        registration.setPaidAt(status == RegistrationStatus.Paid ? now : null);
        registration.setWaiverAccepted(true);
        registration.setWaiverAcceptedAt(now);
        registration.setWaiverIp(ip);
        registration.setAcquisitionChannel(blankToNull(request.acquisitionChannel()));
        registration.setReferralCode(blankToNull(request.referralCode()));
        registrations.save(registration);

        // The use of the balance is recorded as a negative movement, the usual convention.
        if (discount > 0) {
            MoneySportMovement use = new MoneySportMovement();
            use.setAthlete(athlete);
            use.setRegistration(registration);
            use.setType(MoneySportMovementType.Debit);
            use.setAmountCents(-discount);
            use.setDate(now);
            movements.save(use);
        }

        return new RegistrationCreatedResponse(
                registration.getId(),
                registration.getCode(),
                registration.getStatus(),
                event.getName(),
                athlete.getFullName(),
                modality.getName(),
                kit.getName(),
                size == null ? null : RegistrationModels.sizeLabel(size.getMeasure(), size.getType()),
                category == null ? null : category.getName(),
                net,
                registration.getReservationExpiresAt(),
                status == RegistrationStatus.Pending && hasPaymentQr(tier, kit, discount > 0),
                discount);
    }

    /**
     * Whether the athlete has a QR to pay with. With money sport credit the amount left is open, so the generic QR
     * applies; otherwise the QR of the tier and kit..
     */
    private boolean hasPaymentQr(PriceTier tier, Kit kit, boolean usesCredit) {
        if (usesCredit) {
            return settings.findById(1).map(s -> s.getGenericQrPath() != null).orElse(false);
        }
        return qrCodes.findByPriceTierIdAndKitId(tier.getId(), kit.getId()).isPresent();
    }

    // ---- Back office ----

    /**
     * Filtered, sorted and paged view of an event's registrations plus the event's totals. Filtering happens in
     * memory: an event has a few thousand registrations at most, so this stays simple and exact.
     */
    @Transactional(readOnly = true)
    public RegistrationListing listing(int eventId, RegistrationFilter filter, int page, int pageSize) {
        Event event = events.findById(eventId).orElseThrow(() -> new NotFoundException("entity.event", eventId));
        List<Registration> all = registrations.findByEventIdOrderByCreatedAtDesc(eventId);

        List<Registration> matching = all.stream()
                .filter(r -> matches(r, filter))
                .sorted(comparator(filter.order()))
                .toList();
        PageResponse<Registration> slice = PageResponse.of(matching, page, pageSize);
        List<RegistrationRow> items = slice.items().stream().map(r -> toRow(r, event)).toList();
        RegistrationPage pageView = new RegistrationPage(items, slice.page(), slice.pageSize(), slice.total(),
                slice.totalPages(), slice.hasPrevious(), slice.hasNext());
        return new RegistrationListing(pageView, summarize(all));
    }

    private static Comparator<Registration> comparator(RegistrationOrder order) {
        if (order == null) {
            order = RegistrationOrder.DateDesc;
        }
        return switch (order) {
            case DateDesc -> Comparator.comparing(Registration::getCreatedAt).reversed();
            case DateAsc -> Comparator.comparing(Registration::getCreatedAt);
            case LastName -> Comparator.comparing((Registration r) -> r.getAthlete().getLastNames(), String.CASE_INSENSITIVE_ORDER)
                    .thenComparing(r -> r.getAthlete().getFirstNames(), String.CASE_INSENSITIVE_ORDER);
            // Registrations without a bib go last, not first.
            case Bib -> Comparator.comparing(Registration::getBibNumber, Comparator.nullsLast(Comparator.naturalOrder()));
            case Modality -> Comparator.comparing((Registration r) -> r.getModality().getName(), String.CASE_INSENSITIVE_ORDER)
                    .thenComparing(Registration::getCreatedAt);
        };
    }

    private static boolean matches(Registration r, RegistrationFilter f) {
        if (f.status() != null && r.getStatus() != f.status()) return false;
        if (f.modalityId() != null && !r.getModality().getId().equals(f.modalityId())) return false;
        if (f.ageCategoryId() != null && (r.getAgeCategory() == null || !r.getAgeCategory().getId().equals(f.ageCategoryId()))) return false;
        if (f.sex() != null && r.getAthlete().getSex() != f.sex()) return false;
        // "Without size" keeps only the registrations whose kit needs a size and has none.
        if (Boolean.TRUE.equals(f.withoutSize()) && !(r.getSize() == null && kitNeedsSize(r))) return false;
        if (Boolean.TRUE.equals(f.withoutBib()) && r.getBibNumber() != null) return false;
        if (Boolean.TRUE.equals(f.withoutResult()) && r.getResult() != null) return false;
        if (f.kitDelivered() != null && (r.getKitDelivery() != null) != f.kitDelivered()) return false;
        if (f.withoutEmergencyContact() != null
                && isBlank(r.getAthlete().getEmergencyContactName()) != f.withoutEmergencyContact()) return false;
        if (f.text() != null && !f.text().isBlank()) {
            String needle = f.text().trim().toLowerCase(java.util.Locale.ROOT);
            Athlete a = r.getAthlete();
            boolean hit = r.getCode().toLowerCase(java.util.Locale.ROOT).contains(needle)
                    || a.getDocumentNumber().toLowerCase(java.util.Locale.ROOT).contains(needle)
                    || a.getFirstNames().toLowerCase(java.util.Locale.ROOT).contains(needle)
                    || a.getLastNames().toLowerCase(java.util.Locale.ROOT).contains(needle)
                    || (a.getPhoneCountryCode() + a.getPhoneNumber()).contains(needle)
                    || (r.getBibNumber() != null && String.valueOf(r.getBibNumber()).equals(needle));
            if (!hit) return false;
        }
        return true;
    }

    private static boolean kitNeedsSize(Registration r) {
        return r.getKit().getItems().stream().anyMatch(item -> item.getRequiredSizeType() != null);
    }

    private RegistrationSummary summarize(List<Registration> all) {
        long total = all.size();
        long paid = count(all, RegistrationStatus.Paid);
        long pending = count(all, RegistrationStatus.Pending);
        long underReview = count(all, RegistrationStatus.UnderReview);
        long expired = count(all, RegistrationStatus.Expired);
        long cancelled = count(all, RegistrationStatus.Cancelled) + count(all, RegistrationStatus.Refunded);
        long collected = all.stream().flatMap(r -> r.getPayments().stream()).mapToLong(p -> p.getAmountCents()).sum();
        long expected = all.stream().filter(r -> LIVE.contains(r.getStatus())).mapToLong(Registration::getAmountCents).sum();
        long withoutSize = all.stream().filter(r -> r.getSize() == null && kitNeedsSize(r) && LIVE.contains(r.getStatus())).count();
        long withoutBib = all.stream().filter(r -> r.getBibNumber() == null && LIVE.contains(r.getStatus())).count();
        long kitsDelivered = all.stream().filter(r -> r.getKitDelivery() != null).count();
        long withoutEmergencyContact = all.stream()
                .filter(r -> LIVE.contains(r.getStatus()) && isBlank(r.getAthlete().getEmergencyContactName()))
                .count();
        long withoutResult = all.stream().filter(r -> r.getResult() == null && r.getStatus() == RegistrationStatus.Paid).count();
        return new RegistrationSummary(total, paid, pending, underReview, expired, cancelled,
                collected, expected, withoutSize, withoutBib, kitsDelivered, withoutEmergencyContact, withoutResult);
    }

    private static long count(List<Registration> all, RegistrationStatus status) {
        return all.stream().filter(r -> r.getStatus() == status).count();
    }

    private static RegistrationRow toRow(Registration r, Event event) {
        Athlete a = r.getAthlete();
        Size size = r.getSize();
        Modality modality = r.getModality();
        return new RegistrationRow(
                r.getId(),
                r.getCode(),
                r.getStatus(),
                r.getBibNumber(),
                a.getDocumentType(),
                a.getDocumentNumber(),
                a.getFirstNames(),
                a.getLastNames(),
                a.getSex(),
                a.getBirthDate(),
                AgeCalculator.age(a.getBirthDate(), event.getEventDate()),
                "+" + a.getPhoneCountryCode() + a.getPhoneNumber(),
                a.getEmail(),
                a.getCity(),
                modality.getName(),
                modality.getDistanceMeters(),
                r.getKit().getName(),
                kitNeedsSize(r),
                size == null ? null : RegistrationModels.sizeLabel(size.getMeasure(), size.getType()),
                r.getAgeCategory() == null ? null : r.getAgeCategory().getName(),
                r.getAmountCents(),
                r.getPayments().stream().mapToLong(p -> p.getAmountCents()).sum(),
                r.getCreatedAt(),
                r.getReservationExpiresAt(),
                r.getKitDelivery() != null,
                modality.getBibFrom(),
                modality.getBibTo(),
                r.getReceiptPath() != null && !r.getReceiptPath().isBlank(),
                r.getResult(),
                r.getResultAt(),
                r.getMoneySportDiscountCents());
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Transactional(readOnly = true)
    public RegistrationDetail detail(int id) {
        Registration r = find(id);
        Athlete a = r.getAthlete();
        Size size = r.getSize();
        KitDelivery delivery = r.getKitDelivery();
        AthleteInfo athlete = new AthleteInfo(
                a.getId(),
                a.getDocumentType(),
                a.getDocumentNumber(),
                a.getDocumentNumberOriginal(),
                a.getNationality(),
                a.getFirstNames(),
                a.getLastNames(),
                a.getSex(),
                a.getBirthDate(),
                AgeCalculator.age(a.getBirthDate(), LocalDate.now()),
                "+" + a.getPhoneCountryCode() + a.getPhoneNumber(),
                a.getEmail(),
                a.getCity(),
                a.getClub(),
                a.getEmergencyContactName(),
                a.getEmergencyContactPhoneCountryCode() == null ? null
                        : "+" + a.getEmergencyContactPhoneCountryCode() + a.getEmergencyContactPhoneNumber(),
                a.getBloodType(),
                a.getAllergies(),
                a.isMarketingOptIn(),
                a.getMarketingOptInAt(),
                a.getUnsubscribedAt(),
                a.getRegistrations().size());
        return new RegistrationDetail(
                r.getId(),
                r.getCode(),
                r.getStatus(),
                r.getBibNumber(),
                r.getEvent().getName(),
                r.getEvent().getEventDate(),
                r.getModality().getName(),
                r.getKit().getName(),
                size == null ? null : RegistrationModels.sizeLabel(size.getMeasure(), size.getType()),
                r.getAgeCategory() == null ? null : r.getAgeCategory().getName(),
                r.getAmountCents(),
                r.getMoneySportDiscountCents(),
                r.getPayments().stream().mapToLong(p -> p.getAmountCents()).sum(),
                r.getCreatedAt(),
                r.getReservationExpiresAt(),
                r.getPaidAt(),
                r.isWaiverAccepted(),
                r.getWaiverAcceptedAt(),
                r.getWaiverIp(),
                r.getAcquisitionChannel(),
                r.getReferralCode(),
                r.isComplimentary(),
                r.getNotes(),
                r.getResult(),
                r.getResultAt(),
                athlete,
                r.getPayments().stream().map(PaymentService::toItem).toList(),
                delivery == null ? null : new KitDeliveryInfo(
                        delivery.getDeliveredAt(),
                        delivery.getUser() == null ? null : delivery.getUser().getName(),
                        delivery.getPickupPoint(),
                        delivery.getPickedUpBy()),
                r.getReceiptPath() != null && !r.getReceiptPath().isBlank());
    }

    /**
     * Assigns or clears the bib . A bib outside the modality's range is
     * accepted and returned with a warning, because replacements and courtesy bibs happen on race day.
     */
    public BibAssignmentResponse assignBib(int id, BibRequest request) {
        Registration registration = find(id);
        if (registration.getStatus() == RegistrationStatus.Cancelled
                || registration.getStatus() == RegistrationStatus.Refunded
                || registration.getStatus() == RegistrationStatus.Expired) {
            throw new ConflictException("registration.bib.notRunning", statusLabel(registration.getStatus()));
        }
        Integer bib = request.bibNumber();
        if (bib == null) {
            registration.setBibNumber(null);
            return new BibAssignmentResponse(registration.getId(), null, null, msg("registration.bib.cleared"));
        }
        if (bib < 1) {
            throw new BusinessRuleException("registration.bib.positive");
        }
        int eventId = registration.getEvent().getId();
        if (registrations.existsByEventIdAndBibNumberAndIdNot(eventId, bib, id)) {
            var holder = registrations.findFirstByEventIdAndBibNumber(eventId, bib).orElseThrow();
            throw new ConflictException("registration.bib.taken", bib, holder.getAthlete().getFullName(), holder.getCode());
        }
        registration.setBibNumber(bib);
        String warning = outOfRangeWarning(registration.getModality(), bib);
        return new BibAssignmentResponse(registration.getId(), bib, warning, msg("registration.bib.assigned", bib));
    }

    /** Null when the modality has no range or the bib is inside it; otherwise the warning text. */
    private String outOfRangeWarning(Modality modality, int bib) {
        Integer from = modality.getBibFrom();
        Integer to = modality.getBibTo();
        if (from == null || to == null || (bib >= from && bib <= to)) {
            return null;
        }
        return msg("registration.bib.outOfRange", bib, from, to, modality.getName());
    }

    /**
     * Cancels a registration that will not happen . Only pending, under-review or expired
     * registrations can be cancelled, a registration with money received must be refunded or have its payment removed
     * first, and the Money Sport debit of its discount is reversed so the athlete gets the balance back.
     */
    public RegistrationListItem cancel(int id, CancelRequest request) {
        Registration registration = find(id);
        if (request.reason() == null || request.reason().isBlank()) {
            throw new BusinessRuleException("registration.cancel.reasonRequired");
        }
        String reason = request.reason().trim();
        if (reason.length() < 3 || reason.length() > 500) {
            throw new BusinessRuleException("registration.cancel.reasonLength");
        }
        RegistrationStatus status = registration.getStatus();
        if (status != RegistrationStatus.Pending && status != RegistrationStatus.UnderReview
                && status != RegistrationStatus.Expired) {
            throw new ConflictException("registration.cancel.notAllowed", statusLabel(status).toLowerCase(Locale.ROOT));
        }
        long paid = registration.getTotalPaidCents();
        if (paid > 0) {
            throw new ConflictException("registration.cancel.hasPayments", PaymentService.bolivianos(paid));
        }

        registration.setStatus(RegistrationStatus.Cancelled);
        registration.setReservationExpiresAt(null);
        appendNote(registration, msg("registration.note.cancelled", reason));
        movements.findFirstByRegistrationIdAndType(registration.getId(), MoneySportMovementType.Debit)
                .ifPresent(movements::delete);
        return toItem(registration);
    }

    public RegistrationListItem reactivate(int id) {
        Registration registration = find(id);
        if (registration.getStatus() != RegistrationStatus.Expired && registration.getStatus() != RegistrationStatus.Cancelled) {
            throw new ConflictException("registration.reactivate.notAllowed", statusLabel(registration.getStatus()));
        }
        Integer eventId = registration.getEvent().getId();
        Integer athleteId = registration.getAthlete().getId();
        if (registrations.existsByEventIdAndAthleteIdAndStatusInAndIdNot(eventId, athleteId, LIVE, id)) {
            throw new ConflictException("registration.reactivate.duplicate");
        }
        long paid = registration.getTotalPaidCents();
        if (paid > 0) {
            throw new ConflictException("registration.reactivate.hasPayments", PaymentService.bolivianos(paid));
        }
        checkQuota(registration.getModality());
        OffsetDateTime now = OffsetDateTime.now();
        registration.setStatus(RegistrationStatus.Pending);
        registration.setReservationExpiresAt(now.plusHours(registration.getEvent().getReservationHours()));
        appendNote(registration, msg("registration.note.reactivated", now.toLocalDate()));
        return toItem(registration);
    }

    /**
     * Records the participation result of one registration : only
     * paid registrations, only from the event day onwards, and the Money Sport credit follows the result.
     */
    public RegistrationListItem setResult(int id, ResultRequest request) {
        Registration registration = find(id);
        if (registration.getStatus() != RegistrationStatus.Paid) {
            throw new ConflictException("registration.result.notPaid", statusLabel(registration.getStatus()));
        }
        if (registration.getEvent().getEventDate().isAfter(LocalDate.now())) {
            throw new ConflictException("registration.result.notStarted");
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (!applyResult(registration, request.result(), now, creditAmountCents())) {
            long balance = movements.balanceOf(registration.getAthlete().getId());
            long credit = movements.findFirstByRegistrationIdAndType(registration.getId(), MoneySportMovementType.Credit)
                    .map(MoneySportMovement::getAmountCents)
                    .orElse(0);
            throw new ConflictException("registration.result.negativeBalance", balance, credit, balance - credit);
        }
        return toItem(registration);
    }

    /**
     * Sets the result of a paid registration and keeps its Money Sport credit in step: a new "Finished"
     * gets a credit, and leaving "Finished" removes it. Returns false, changing nothing, when removing the
     * credit would leave the athlete's balance negative.
     */
    private boolean applyResult(Registration registration, ParticipationResult result, OffsetDateTime now, int creditCents) {
        ParticipationResult previous = registration.getResult();
        var credit = movements.findFirstByRegistrationIdAndType(registration.getId(), MoneySportMovementType.Credit);

        if (result == ParticipationResult.Finished && credit.isEmpty()) {
            MoneySportMovement newCredit = new MoneySportMovement();
            newCredit.setAthlete(registration.getAthlete());
            newCredit.setRegistration(registration);
            newCredit.setType(MoneySportMovementType.Credit);
            newCredit.setAmountCents(creditCents);
            newCredit.setDate(now);
            movements.save(newCredit);
        } else if (previous == ParticipationResult.Finished && result != ParticipationResult.Finished && credit.isPresent()) {
            long balanceAfterRemoval = movements.balanceOf(registration.getAthlete().getId()) - credit.get().getAmountCents();
            if (balanceAfterRemoval < 0) {
                return false;
            }
            movements.delete(credit.get());
        }

        registration.setResult(result);
        registration.setResultAt(result == null ? null : now);
        return true;
    }

    private int creditAmountCents() {
        return settings.findById(1)
                .map(SystemSettings::getMoneySportAmountCents)
                .orElseThrow(() -> new NotFoundException("entity.settings", 1));
    }

    /** Re-resolves every registration's age category after the event date or the ranges changed. */
    public RecalculationResponse recalculateAgeCategories(int eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> new NotFoundException("entity.event", eventId));
        int updated = 0;
        for (Registration registration : registrations.findByEventId(eventId)) {
            Athlete athlete = registration.getAthlete();
            var category = AgeCategoryResolver.resolve(event.getAgeCategories(), athlete.getSex(),
                    athlete.getBirthDate(), event.getEventDate(), registration.getModality().getId()).orElse(null);
            Integer current = registration.getAgeCategory() == null ? null : registration.getAgeCategory().getId();
            Integer next = category == null ? null : category.getId();
            if (!java.util.Objects.equals(current, next)) {
                registration.setAgeCategory(category);
                updated++;
            }
        }
        return new RecalculationResponse(updated);
    }

    /** Expires pending registrations whose reservation has run out. Called by {@link ReservationExpiryJob}. */
    public int expireDueReservations() {
        List<Registration> due = registrations.findByStatusAndReservationExpiresAtBefore(
                RegistrationStatus.Pending, OffsetDateTime.now());
        for (Registration registration : due) {
            // A reservation with money already credited is not simply expired: it goes to review.
            registration.setStatus(registration.getPayments().isEmpty()
                    ? RegistrationStatus.Expired
                    : RegistrationStatus.UnderReview);
        }
        return due.size();
    }

    /**
     * Records the same participation result for several registrations of one event, in one transaction
     * . A registration is skipped, not failed, when it is not
     * paid or when undoing a "Finished" credit would leave the Money Sport balance negative, so one bad
     * row does not block the batch. A result is only accepted from the event day onwards.
     */
    public BatchResultResponse setResults(int eventId, BatchResultRequest request) {
        if (request.registrationIds() == null || request.registrationIds().isEmpty()) {
            throw new BusinessRuleException("registration.result.batchEmpty");
        }
        Event event = events.findById(eventId).orElseThrow(() -> new NotFoundException("entity.event", eventId));
        if (event.getEventDate().isAfter(LocalDate.now())) {
            throw new ConflictException("registration.result.notStarted");
        }

        int creditCents = creditAmountCents();
        OffsetDateTime now = OffsetDateTime.now();
        List<Registration> found = registrations.findAllById(request.registrationIds()).stream()
                .filter(registration -> registration.getEvent().getId() == eventId)
                .toList();

        int updated = 0;
        int omitted = request.registrationIds().size() - found.size();
        for (Registration registration : found) {
            if (registration.getStatus() != RegistrationStatus.Paid
                    || !applyResult(registration, request.result(), now, creditCents)) {
                omitted++;
                continue;
            }
            updated++;
        }

        return new BatchResultResponse(updated, omitted, msg("registration.result.batchDone", updated, omitted));
    }

    // ---- Helpers ----

    private Registration find(int id) {
        return registrations.findById(id).orElseThrow(() -> new NotFoundException("entity.registration", id));
    }

    private void checkQuota(Modality modality) {
        if (modality.getQuota() == null) {
            return;
        }
        long occupied = registrations.countByModalityIdAndStatusIn(modality.getId(), LIVE);
        if (occupied >= modality.getQuota()) {
            throw new ConflictException("registration.quota.full", modality.getName(), modality.getQuota());
        }
    }

    private Size resolveSize(Kit kit, Integer sizeId) {
        GarmentType required = kit.getItems().stream()
                .map(KitItem::getRequiredSizeType)
                .filter(type -> type != null)
                .findFirst()
                .orElse(null);
        if (required == null) {
            return null;
        }
        String garment = msg("garment." + required.name());
        if (sizeId == null) {
            throw new BusinessRuleException("registration.size.required", kit.getName(), garment);
        }
        Size size = sizes.findById(sizeId)
                .filter(Size::isActive)
                .orElseThrow(() -> new BusinessRuleException("registration.size.unavailable"));
        if (size.getType() != required) {
            throw new BusinessRuleException("registration.size.mismatch", kit.getName());
        }
        return size;
    }

    private Athlete findOrCreateAthlete(CreateRegistrationRequest request, String documentNumber,
                                        DataNormalizer.Phone phone, OffsetDateTime now) {
        var existing = athletes.findByDocumentTypeAndDocumentNumber(request.documentType(), documentNumber);
        if (existing.isPresent() && !existing.get().getId().equals(request.athleteId())) {
            throw new ConflictException("registration.document.inUse");
        }
        Athlete athlete = existing.orElseGet(() -> {
            Athlete created = new Athlete();
            created.setDocumentType(request.documentType());
            created.setDocumentNumber(documentNumber);
            created.setCreatedAt(now);
            return created;
        });
        athlete.setDocumentNumberOriginal(request.documentNumber().trim());
        athlete.setFirstNames(DataNormalizer.normalizeName(request.firstNames()));
        athlete.setLastNames(DataNormalizer.normalizeName(request.lastNames()));
        athlete.setSex(request.sex());
        athlete.setBirthDate(request.birthDate());
        athlete.setPhoneCountryCode(phone.countryCode());
        athlete.setPhoneNumber(phone.number());
        athlete.setPhoneOriginal("+" + request.phoneCountryCode() + request.phoneNumber());
        athlete.setNationality(blankToNull(request.nationality()));
        athlete.setEmail(blankToNull(request.email()) != null ? request.email().trim() : athlete.getEmail());
        athlete.setCity(blankToNull(request.city()) != null ? request.city().trim() : athlete.getCity());
        athlete.setClub(blankToNull(request.club()) != null ? request.club().trim() : athlete.getClub());
        athlete.setEmergencyContactName(blankToNull(request.emergencyContactName()) != null
                ? request.emergencyContactName().trim() : athlete.getEmergencyContactName());
        var emergency = DataNormalizer.normalizePhone(request.emergencyContactPhoneCountryCode(),
                request.emergencyContactPhoneNumber());
        if (emergency.isPresent()) {
            athlete.setEmergencyContactPhoneCountryCode(emergency.get().countryCode());
            athlete.setEmergencyContactPhoneNumber(emergency.get().number());
        }
        athlete.setBloodType(blankToNull(request.bloodType()) != null ? request.bloodType().trim() : athlete.getBloodType());
        athlete.setAllergies(blankToNull(request.allergies()) != null ? request.allergies().trim() : athlete.getAllergies());
        athlete.setUpdatedAt(now);
        // Consent is granted here but never revoked by omission: unsubscribing is an explicit act.
        if (request.marketingOptIn() && !athlete.isMarketingOptIn()) {
            athlete.setMarketingOptIn(true);
            athlete.setMarketingOptInAt(now);
            athlete.setOptInSource(OptInSource.Form);
        }
        return athletes.save(athlete);
    }

    private java.util.Optional<PriceTier> currentPriceTier(Modality modality, OffsetDateTime now) {
        return modality.getPriceTiers().stream()
                .filter(tier -> !tier.getValidFrom().isAfter(now) && tier.getValidTo().isAfter(now))
                .min(Comparator.comparing(PriceTier::getValidFrom));
    }

    private String newCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String code = RegistrationCodeGenerator.generate();
            if (!registrations.existsByCode(code)) {
                return code;
            }
        }
        throw new ConflictException("registration.code.exhausted");
    }

    private static String normalizeDocument(String value) {
        String document = DataNormalizer.normalizeDocument(value);
        if (document.length() < 4) {
            throw new BusinessRuleException("registration.document.invalid");
        }
        return document;
    }

    private static void appendNote(Registration registration, String note) {
        String current = registration.getNotes();
        registration.setNotes(current == null || current.isBlank() ? note : current + "\n" + note);
    }

    private String statusLabel(RegistrationStatus status) {
        return msg("status.registration." + status.name());
    }

    private String msg(String key, Object... args) {
        return messages.getMessage(key, args, LocaleContextHolder.getLocale());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    static RegistrationListItem toItem(Registration registration) {
        Athlete athlete = registration.getAthlete();
        Size size = registration.getSize();
        return new RegistrationListItem(
                registration.getId(),
                registration.getCode(),
                athlete.getId(),
                athlete.getFullName(),
                athlete.getDocumentNumber(),
                registration.getModality().getName(),
                registration.getKit().getName(),
                size == null ? null : RegistrationModels.sizeLabel(size.getMeasure(), size.getType()),
                registration.getAgeCategory() == null ? null : registration.getAgeCategory().getName(),
                registration.getStatus(),
                registration.getAmountCents(),
                registration.getBibNumber(),
                registration.getResult(),
                registration.getCreatedAt(),
                registration.getReservationExpiresAt());
    }
}
