package com.aespejo.registrations.application.report;

import com.aespejo.registrations.application.report.MasterReportModels.CategoryRow;
import com.aespejo.registrations.application.report.MasterReportModels.DistanceRow;
import com.aespejo.registrations.application.report.MasterReportModels.MasterReport;
import com.aespejo.registrations.application.report.MasterReportModels.ModalityRow;
import com.aespejo.registrations.application.report.MasterReportModels.ShirtRow;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.entities.Size;
import com.aespejo.registrations.domain.enums.GarmentType;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.enums.Sex;
import com.aespejo.registrations.infrastructure.persistence.repository.EventRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The master report of an event: totals by modality, distance, category and shirt size. Only live registrations count: pending, paid and under review.
 */
@Service
@Transactional(readOnly = true)
public class MasterReportService {

    private static final List<RegistrationStatus> LIVE = List.of(
            RegistrationStatus.Pending, RegistrationStatus.Paid, RegistrationStatus.UnderReview);

    private final EventRepository events;
    private final RegistrationRepository registrations;
    private final MessageSource messages;

    public MasterReportService(EventRepository events, RegistrationRepository registrations, MessageSource messages) {
        this.events = events;
        this.registrations = registrations;
        this.messages = messages;
    }

    public MasterReport build(int eventId) {
        if (!events.existsById(eventId)) {
            throw new NotFoundException("entity.event", eventId);
        }
        // One read feeds every grouping, so the totals of the sections always agree with each other.
        List<Registration> live = registrations.findByEventId(eventId).stream()
                .filter(r -> LIVE.contains(r.getStatus()))
                .toList();

        return new MasterReport(
                live.size(),
                byModality(live),
                byDistance(live),
                byCategory(live),
                shirts(live));
    }

    private static List<ModalityRow> byModality(List<Registration> live) {
        return live.stream()
                .collect(Collectors.groupingBy(r -> new ModalityKey(
                        r.getModality().getSortOrder(), r.getModality().getName(), r.getKit().getName())))
                .entrySet().stream()
                .sorted(Map.Entry.<ModalityKey, List<Registration>>comparingByKey(
                        Comparator.comparingInt(ModalityKey::order).thenComparing(ModalityKey::kit)))
                .map(e -> new ModalityRow(
                        e.getKey().modality(),
                        e.getKey().kit(),
                        e.getValue().size(),
                        e.getValue().stream().mapToLong(Registration::getAmountCents).sum()))
                .toList();
    }

    private static List<DistanceRow> byDistance(List<Registration> live) {
        return live.stream()
                .collect(Collectors.groupingBy(r -> r.getModality().getDistanceMeters()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new DistanceRow(formatDistance(e.getKey()), e.getValue().size()))
                .toList();
    }

    private List<CategoryRow> byCategory(List<Registration> live) {
        String noCategory = messages.getMessage("report.noCategory", null, LocaleContextHolder.getLocale());
        return live.stream()
                .collect(Collectors.groupingBy(r -> r.getAgeCategory() == null ? noCategory : r.getAgeCategory().getName()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new CategoryRow(e.getKey(), e.getValue().size()))
                .toList();
    }

    /** Shirts only: registrations whose size belongs to a shirt. Female first, then by size. */
    private List<ShirtRow> shirts(List<Registration> live) {
        return live.stream()
                .filter(r -> r.getSize() != null && r.getSize().getType() == GarmentType.TShirt)
                .collect(Collectors.groupingBy(r -> new ShirtKey(r.getAthlete().getSex(), r.getSize())))
                .entrySet().stream()
                .sorted(Map.Entry.<ShirtKey, List<Registration>>comparingByKey(
                        Comparator.comparing(ShirtKey::sex).thenComparing(k -> k.size().getMeasure())))
                .map(e -> new ShirtRow(
                        e.getKey().sex() == Sex.Female ? "F" : "M",
                        messages.getMessage("report.shirtLabel", new Object[] {e.getKey().size().getMeasure()},
                                LocaleContextHolder.getLocale()),
                        e.getValue().size()))
                .toList();
    }

    /** Kilometres with at most one decimal, for example "10K" or "21.1K". */
    static String formatDistance(int meters) {
        String kilometres = BigDecimal.valueOf(meters).movePointLeft(3).setScale(1, RoundingMode.HALF_UP)
                .stripTrailingZeros().toPlainString();
        return kilometres + "K";
    }

    private record ModalityKey(int order, String modality, String kit) {
    }

    private record ShirtKey(Sex sex, Size size) {
    }
}
