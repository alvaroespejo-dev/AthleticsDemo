package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.application.athlete.AthleteModels.AthleteRow;
import com.aespejo.registrations.application.marketing.AudienceModels.Condition;
import com.aespejo.registrations.application.marketing.AudienceModels.Estimate;
import com.aespejo.registrations.application.marketing.AudienceModels.Field;
import com.aespejo.registrations.application.marketing.AudienceModels.Filter;
import com.aespejo.registrations.application.marketing.AudienceModels.Operator;
import com.aespejo.registrations.application.marketing.AudienceModels.Recipient;
import com.aespejo.registrations.application.marketing.AudienceModels.Scope;
import com.aespejo.registrations.common.PageResponse;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Athlete;
import com.aespejo.registrations.domain.entities.Registration;
import com.aespejo.registrations.domain.entities.Segment;
import com.aespejo.registrations.domain.enums.RegistrationStatus;
import com.aespejo.registrations.domain.enums.Sex;
import com.aespejo.registrations.domain.services.AgeCalculator;
import com.aespejo.registrations.infrastructure.persistence.repository.AthleteRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.SegmentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Who receives a campaign: the audience built from a {@link Filter}.. Consent is
 * always required, unsubscribed athletes are never included, and one message goes per phone number.
 *
 * Conditions are translated to in-memory predicates. The register is a few thousand people at most, which keeps every
 * rule exact and readable.
 */
@Service
@Transactional(readOnly = true)
public class AudienceService {

    private static final List<RegistrationStatus> PAID = List.of(RegistrationStatus.Paid);

    private final AthleteRepository athletes;
    private final SegmentRepository segments;
    private final MessageSource messages;
    private final ObjectMapper json;

    public AudienceService(AthleteRepository athletes, SegmentRepository segments, MessageSource messages,
                           ObjectMapper json) {
        this.athletes = athletes;
        this.segments = segments;
        this.messages = messages;
        this.json = json;
    }

    /** Athletes that match the filter, one per phone number, before any paging. */
    public List<Athlete> resolve(Filter filter) {
        return deduplicate(build(filter, LocalDate.now()));
    }

    public Estimate estimate(Filter filter) {
        List<Athlete> audience = build(filter, LocalDate.now());
        long withWhatsApp = audience.stream().map(AudienceService::phoneKey).distinct().count();
        long withEmail = audience.stream().filter(a -> !blank(a.getEmail())).map(Athlete::getEmail).distinct().count();
        return new Estimate(audience.size(), withWhatsApp, withEmail);
    }

    public PageResponse<AthleteRow> preview(Filter filter, int page, int size) {
        LocalDate today = LocalDate.now();
        List<AthleteRow> rows = deduplicate(build(filter, today)).stream()
                .sorted(Comparator.comparing(Athlete::getLastNames, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Athlete::getFirstNames, String.CASE_INSENSITIVE_ORDER))
                .map(a -> toRow(a, today))
                .toList();
        return PageResponse.of(rows, page, size);
    }

    public List<Recipient> recipients(Filter filter) {
        return deduplicate(build(filter, LocalDate.now())).stream()
                .sorted(Comparator.comparing(Athlete::getId))
                .map(a -> new Recipient(a.getId(), a.getFirstNames(), a.getLastNames(), a.getCity(),
                        "+" + a.getPhoneCountryCode() + a.getPhoneNumber()))
                .toList();
    }

    // ---- Building the audience ----

    /** Athletes that match the scope and every condition, with consent and without withdrawn ones. */
    List<Athlete> build(Filter filter, LocalDate today) {
        Predicate<Athlete> predicate = a -> a.isMarketingOptIn() && a.getUnsubscribedAt() == null;
        List<Condition> conditions = filter.conditions();

        switch (filter.scope()) {
            case Participants -> predicate = predicate.and(a -> a.getRegistrations().size() > 0);
            case Event -> {
                Integer eventId = filter.eventId();
                if (eventId == null) throw new BusinessRuleException("audience.event.required");
                predicate = predicate.and(a -> a.getRegistrations().stream()
                        .anyMatch(r -> r.getEvent().getId().equals(eventId)));
            }
            case Segment -> {
                Integer segmentId = filter.segmentId();
                if (segmentId == null) throw new BusinessRuleException("audience.segment.required");
                Segment segment = segments.findById(segmentId)
                        .orElseThrow(() -> new NotFoundException("entity.segment", segmentId));
                Filter base = parse(segment.getFilterJson());
                // The saved segment is the base and this query's conditions are added on top. It is not nested: only the
                // base's event and conditions are taken.
                if (base.scope() == Scope.Event && base.eventId() != null) {
                    Integer baseEvent = base.eventId();
                    predicate = predicate.and(a -> a.getRegistrations().stream()
                            .anyMatch(r -> r.getEvent().getId().equals(baseEvent)));
                }
                List<Condition> combined = new java.util.ArrayList<>(base.conditions());
                combined.addAll(conditions);
                conditions = combined;
            }
            case All -> { }
        }

        for (Condition condition : conditions) {
            predicate = predicate.and(translate(condition, today));
        }
        if (!filter.excludedAthleteIds().isEmpty()) {
            List<Integer> excluded = filter.excludedAthleteIds();
            predicate = predicate.and(a -> !excluded.contains(a.getId()));
        }
        return athletes.findAll().stream().filter(predicate).toList();
    }

    /** One athlete per phone number: the lowest id wins, so repeated runs pick the same person. */
    private static List<Athlete> deduplicate(List<Athlete> audience) {
        return audience.stream()
                .collect(Collectors.toMap(AudienceService::phoneKey, a -> a, (x, y) -> x.getId() <= y.getId() ? x : y))
                .values().stream()
                .toList();
    }

    private static String phoneKey(Athlete a) {
        return a.getPhoneCountryCode() + a.getPhoneNumber();
    }

    // ---- Translating conditions ----

    private Predicate<Athlete> translate(Condition condition, LocalDate today) {
        String value = condition.value() == null ? "" : condition.value().trim();
        return switch (condition.field()) {
            case City -> text(condition, value, Athlete::getCity);
            case Club -> text(condition, value, Athlete::getClub);
            case Nationality -> {
                String code = value.toUpperCase(Locale.ROOT);
                yield switch (condition.operator()) {
                    case Equal -> a -> code.equals(a.getNationality());
                    case NotEqual -> a -> !code.equals(a.getNationality());
                    default -> throw invalidOperator(condition);
                };
            }
            case Sex -> {
                Sex sex = parseSex(value);
                yield switch (condition.operator()) {
                    case Equal -> a -> a.getSex() == sex;
                    case NotEqual -> a -> a.getSex() != sex;
                    default -> throw invalidOperator(condition);
                };
            }
            case Age -> {
                Range range = range(condition, value);
                yield a -> range.matches(AgeCalculator.age(a.getBirthDate(), today));
            }
            case Participated -> {
                boolean wanted = bool(condition, value);
                yield a -> hasPaid(a) == wanted;
            }
            case LastRaceYear -> {
                Range range = range(condition, value);
                yield a -> {
                    Integer year = lastPaidYear(a);
                    return year != null && range.matches(year);
                };
            }
            case EventsParticipated -> {
                Range range = range(condition, value);
                yield a -> range.matches((int) a.getRegistrations().stream()
                        .filter(r -> r.getStatus() == RegistrationStatus.Paid).count());
            }
            case HasEmail -> {
                boolean wanted = bool(condition, value);
                yield a -> (!blank(a.getEmail())) == wanted;
            }
        };
    }

    /** Text fields: the value is compared as it is, so accents matter (the same limit as before). */
    private Predicate<Athlete> text(Condition condition, String value, java.util.function.Function<Athlete, String> field) {
        return switch (condition.operator()) {
            case Equal -> a -> value.equals(field.apply(a));
            case NotEqual -> a -> !value.equals(field.apply(a));
            case Contains -> a -> field.apply(a) != null && field.apply(a).contains(value);
            default -> throw invalidOperator(condition);
        };
    }

    /** A numeric range built from the operator: the same mapping as {@code ARango}. */
    private Range range(Condition condition, String value) {
        int number;
        try {
            number = Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw new BusinessRuleException("audience.number.expected", label(condition.field()), value);
        }
        return switch (condition.operator()) {
            case Equal -> new Range(number, number, null);
            case NotEqual -> new Range(null, null, number);
            case Greater -> new Range(number + 1, null, null);
            case GreaterOrEqual -> new Range(number, null, null);
            case Less -> new Range(null, number - 1, null);
            case LessOrEqual -> new Range(null, number, null);
            default -> throw invalidOperator(condition);
        };
    }

    private boolean bool(Condition condition, String value) {
        boolean affirmative = switch (value.toLowerCase(Locale.ROOT)) {
            case "true", "si", "sí", "yes", "1" -> true;
            case "false", "no", "0" -> false;
            default -> throw new BusinessRuleException("audience.boolean.expected", label(condition.field()), value);
        };
        return switch (condition.operator()) {
            case Equal -> affirmative;
            case NotEqual -> !affirmative;
            default -> throw invalidOperator(condition);
        };
    }

    private Sex parseSex(String value) {
        for (Sex sex : Sex.values()) {
            if (sex.name().equalsIgnoreCase(value)) return sex;
        }
        throw new BusinessRuleException("audience.sex.invalid", value);
    }

    private static boolean hasPaid(Athlete a) {
        return a.getRegistrations().stream().anyMatch(r -> PAID.contains(r.getStatus()));
    }

    private static Integer lastPaidYear(Athlete a) {
        return a.getRegistrations().stream()
                .filter(r -> PAID.contains(r.getStatus()))
                .map(r -> r.getEvent().getEventDate().getYear())
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    private BusinessRuleException invalidOperator(Condition condition) {
        return new BusinessRuleException("audience.operator.invalid", condition.operator().name(), label(condition.field()));
    }

    private String label(Field field) {
        return messages.getMessage("audience.field." + field.name(), null, LocaleContextHolder.getLocale());
    }

    /** Inclusive bounds; a null bound is open. A "not equal" filter is an exclusion of one value. */
    private record Range(Integer minimum, Integer maximum, Integer different) {
        boolean matches(int value) {
            if (different != null) return value != different;
            return (minimum == null || value >= minimum) && (maximum == null || value <= maximum);
        }
    }

    // ---- Filter serialization ----

    /** Reads a stored filter. An unreadable one gives an empty filter, so an old campaign can still be opened. */
    public Filter parse(String text) {
        if (text == null || text.isBlank()) {
            return new Filter(Scope.All, null, null, List.of(), List.of());
        }
        try {
            return json.readValue(text, Filter.class);
        } catch (JsonProcessingException e) {
            return new Filter(Scope.All, null, null, List.of(), List.of());
        }
    }

    public String serialize(Filter filter) {
        try {
            return json.writeValueAsString(filter);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("The filter could not be serialized.", e);
        }
    }

    private AthleteRow toRow(Athlete a, LocalDate today) {
        Registration last = a.getRegistrations().stream()
                .max(Comparator.comparing(r -> r.getEvent().getEventDate()))
                .orElse(null);
        return new AthleteRow(a.getId(), a.getDocumentType(), a.getDocumentNumber(), a.getFirstNames(), a.getLastNames(),
                a.getSex(), a.getBirthDate(), AgeCalculator.age(a.getBirthDate(), today),
                "+" + a.getPhoneCountryCode() + a.getPhoneNumber(), a.getEmail(), a.getCity(), a.getClub(),
                a.getRegistrations().size(),
                (int) a.getRegistrations().stream().filter(r -> r.getStatus() == RegistrationStatus.Paid).count(),
                last == null ? null : last.getEvent().getName(),
                last == null ? null : last.getEvent().getEventDate(),
                a.isMarketingOptIn(), a.getUnsubscribedAt());
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
