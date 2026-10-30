package com.aespejo.registrations.application.report;

import java.util.List;

/** Contracts of the master report, ported from {@code DtosReporteMaestro.cs}. */
public final class MasterReportModels {

    private MasterReportModels() {
    }

    public record MasterReport(
            long totalRegistrations,
            List<ModalityRow> byModality,
            List<DistanceRow> byDistance,
            List<CategoryRow> byCategory,
            List<ShirtRow> shirts) {
    }

    public record ModalityRow(String modality, String kit, long count, long collectedCents) {
    }

    public record DistanceRow(String distance, long count) {
    }

    public record CategoryRow(String category, long count) {
    }

    public record ShirtRow(String sex, String size, long count) {
    }
}
