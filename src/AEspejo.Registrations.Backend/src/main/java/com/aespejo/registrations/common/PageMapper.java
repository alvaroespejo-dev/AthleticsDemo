package com.aespejo.registrations.common;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

/**
 * Bridges Spring Data pages and the {@link PageResponse} the panel reads. Page numbers start at 1 on the wire; out of
 * range values are clamped, never rejected, as in {@link PageResponse#of}.
 */
public final class PageMapper {

    private PageMapper() {
    }

    /** A database page request for a 1-based page number and a clamped size. */
    public static PageRequest request(int page, int size) {
        int safeSize = Math.max(1, Math.min(size, PageResponse.MAX_PAGE_SIZE));
        int safePage = Math.max(1, page);
        return PageRequest.of(safePage - 1, safeSize);
    }

    /** The wire representation of a database page, with the items already mapped. */
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                Math.max(1, page.getTotalPages()),
                page.hasPrevious(),
                page.hasNext());
    }
}
