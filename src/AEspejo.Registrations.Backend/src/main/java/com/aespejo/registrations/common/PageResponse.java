package com.aespejo.registrations.common;

import java.util.List;

/** One page of a list, with the navigation data the panel needs. Page numbers start at 1. */
public record PageResponse<T>(
        List<T> items,
        int page,
        int pageSize,
        long total,
        int totalPages,
        boolean hasPrevious,
        boolean hasNext) {

    public static final int MAX_PAGE_SIZE = 200;

    /** Slices {@code all} into the requested page. Out-of-range values are clamped, never rejected. */
    public static <T> PageResponse<T> of(List<T> all, int requestedPage, int requestedSize) {
        int safeSize = Math.max(1, Math.min(requestedSize, MAX_PAGE_SIZE));
        int totalPages = Math.max(1, (int) Math.ceil(all.size() / (double) safeSize));
        int safePage = Math.max(1, Math.min(requestedPage, totalPages));
        List<T> items = all.stream()
                .skip((long) (safePage - 1) * safeSize)
                .limit(safeSize)
                .toList();
        return new PageResponse<>(items, safePage, safeSize, all.size(), totalPages,
                safePage > 1, safePage < totalPages);
    }
}
