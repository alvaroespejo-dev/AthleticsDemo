package com.aespejo.registrations.application.marketing;

import com.aespejo.registrations.application.marketing.AudienceModels.Filter;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Segment;
import com.aespejo.registrations.infrastructure.persistence.repository.SegmentRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Saved audiences.. */
@Service
@Transactional
public class SegmentService {

    /** The saved segment as the screen shows it. */
    public record SegmentView(Integer id, String name, String description, Filter filter,
                              OffsetDateTime createdAt, OffsetDateTime updatedAt, String createdBy) {
    }

    /** Body of create and update. */
    public record SaveSegmentRequest(String name, String description, Filter filter) {
    }

    private final SegmentRepository segments;
    private final UserRepository users;
    private final AudienceService audience;

    public SegmentService(SegmentRepository segments, UserRepository users, AudienceService audience) {
        this.segments = segments;
        this.users = users;
        this.audience = audience;
    }

    @Transactional(readOnly = true)
    public List<SegmentView> list() {
        return segments.findAllByOrderByNameAsc().stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public SegmentView get(int id) {
        return view(find(id));
    }

    public SegmentView create(SaveSegmentRequest request, int userId) {
        String name = request.name().trim();
        if (segments.existsByName(name)) {
            throw new ConflictException("segment.name.taken", name);
        }
        OffsetDateTime now = OffsetDateTime.now();
        Segment segment = new Segment();
        segment.setName(name);
        segment.setDescription(blankToNull(request.description()));
        segment.setFilterJson(audience.serialize(request.filter()));
        segment.setCreatedAt(now);
        segment.setUpdatedAt(now);
        segment.setCreatedByUser(users.findById(userId).orElse(null));
        segments.save(segment);
        return view(segment);
    }

    public SegmentView update(int id, SaveSegmentRequest request) {
        Segment segment = find(id);
        String name = request.name().trim();
        if (segments.existsByNameAndIdNot(name, id)) {
            throw new ConflictException("segment.name.taken", name);
        }
        segment.setName(name);
        segment.setDescription(blankToNull(request.description()));
        segment.setFilterJson(audience.serialize(request.filter()));
        segment.setUpdatedAt(OffsetDateTime.now());
        return view(segment);
    }

    public void delete(int id) {
        segments.delete(find(id));
    }

    private Segment find(int id) {
        return segments.findById(id).orElseThrow(() -> new NotFoundException("entity.segment", id));
    }

    private SegmentView view(Segment s) {
        return new SegmentView(s.getId(), s.getName(), s.getDescription(), audience.parse(s.getFilterJson()),
                s.getCreatedAt(), s.getUpdatedAt(),
                s.getCreatedByUser() == null ? "" : s.getCreatedByUser().getName());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
