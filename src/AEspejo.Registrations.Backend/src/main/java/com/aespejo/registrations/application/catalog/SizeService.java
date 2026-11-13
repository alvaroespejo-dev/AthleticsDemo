package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.SaveSizeRequest;
import com.aespejo.registrations.application.catalog.CatalogModels.SizeResponse;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Size;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.SizeRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Global size catalog: a measure plus the garment type it belongs to. */
@Service
@Transactional
public class SizeService {

    private final SizeRepository sizes;
    private final RegistrationRepository registrations;
    private final MessageSource messages;

    public SizeService(SizeRepository sizes, RegistrationRepository registrations, MessageSource messages) {
        this.sizes = sizes;
        this.registrations = registrations;
        this.messages = messages;
    }

    @Transactional(readOnly = true)
    public List<SizeResponse> list(boolean activeOnly) {
        return sizes.findAll().stream()
                .filter(size -> !activeOnly || size.isActive())
                .sorted(Comparator.comparing(Size::getType).thenComparingInt(Size::getSortOrder))
                .map(SizeService::toResponse)
                .toList();
    }

    public SizeResponse create(SaveSizeRequest request) {
        String measure = request.measure().trim();
        if (sizes.existsByMeasureAndType(measure, request.type())) {
            throw new ConflictException("size.measure.taken", measure, garmentLabel(request));
        }
        Size size = new Size();
        apply(size, request, measure);
        sizes.save(size);
        return toResponse(size);
    }

    public SizeResponse update(int id, SaveSizeRequest request) {
        Size size = sizes.findById(id).orElseThrow(() -> new NotFoundException("entity.size", id));
        String measure = request.measure().trim();
        if (sizes.existsByMeasureAndTypeAndIdNot(measure, request.type(), id)) {
            throw new ConflictException("size.measure.taken", measure, garmentLabel(request));
        }
        apply(size, request, measure);
        return toResponse(size);
    }

    public void delete(int id) {
        Size size = sizes.findById(id).orElseThrow(() -> new NotFoundException("entity.size", id));
        if (registrations.existsBySizeId(id)) {
            throw new ConflictException("size.delete.inUse");
        }
        sizes.delete(size);
    }

    /** Garment type as shown to the user, in the request language. */
    private String garmentLabel(SaveSizeRequest request) {
        return messages.getMessage("garment." + request.type().name(), null, LocaleContextHolder.getLocale());
    }

    private static void apply(Size size, SaveSizeRequest request, String measure) {
        size.setMeasure(measure);
        size.setType(request.type());
        size.setSortOrder(request.sortOrder());
        size.setActive(request.active());
    }

    static SizeResponse toResponse(Size size) {
        return new SizeResponse(size.getId(), size.getMeasure(), size.getType(), size.getSortOrder(), size.isActive());
    }
}
