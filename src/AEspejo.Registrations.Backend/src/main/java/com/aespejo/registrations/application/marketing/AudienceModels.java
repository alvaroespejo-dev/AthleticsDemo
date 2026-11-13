package com.aespejo.registrations.application.marketing;

import java.util.List;

/**
 * Audience contracts and {@code DtosMarketing.cs}. Enums are stored and sent by
 * name, so the panel and the saved JSON use the same English values.
 */
public final class AudienceModels {

    private AudienceModels() {
    }

    /** Where the audience starts. */
    public enum Scope { All, Event, Segment, Participants }

    /** Athlete field a condition filters on. */
    public enum Field { City, Club, Nationality, Sex, Age, Participated, LastRaceYear, EventsParticipated, HasEmail }

    public enum Operator { Equal, NotEqual, Greater, GreaterOrEqual, Less, LessOrEqual, Contains }

    /** One row of the filter builder. The value travels as text and is converted to the field's type. */
    public record Condition(Field field, Operator operator, String value) {
    }

    /**
     * The whole segmentation criterion. Conditions are combined with a logical AND. Stored as JSON in segments and in
     * campaigns, so a campaign can always be rebuilt with the criterion it was made with.
     */
    public record Filter(
            Scope scope,
            Integer eventId,
            Integer segmentId,
            List<Condition> conditions,
            List<Integer> excludedAthleteIds) {

        public Filter {
            scope = scope == null ? Scope.All : scope;
            conditions = conditions == null ? List.of() : List.copyOf(conditions);
            excludedAthleteIds = excludedAthleteIds == null ? List.of() : List.copyOf(excludedAthleteIds);
        }
    }

    /** What the estimate card shows. */
    public record Estimate(long total, long withWhatsApp, long withEmail) {
    }

    /** One person who will receive a campaign. */
    public record Recipient(int athleteId, String firstNames, String lastNames, String city, String phone) {
    }

    /** Body of the audience preview: the filter plus the page to show. */
    public record PreviewRequest(Filter filter, Integer page, Integer size) {
    }
}
