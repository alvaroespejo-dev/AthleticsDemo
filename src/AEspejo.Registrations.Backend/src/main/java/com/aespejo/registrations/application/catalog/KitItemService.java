package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.KitItemResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveKitItemRequest;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.KitItem;
import com.aespejo.registrations.infrastructure.persistence.repository.KitItemRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Global catalog of kit items (official shirt, medal, and so on), shared by all events. */
@Service
@Transactional
public class KitItemService {

    private final KitItemRepository kitItems;

    public KitItemService(KitItemRepository kitItems) {
        this.kitItems = kitItems;
    }

    @Transactional(readOnly = true)
    public List<KitItemResponse> list(boolean activeOnly) {
        return kitItems.findAll().stream()
                .filter(item -> !activeOnly || item.isActive())
                .sorted(Comparator.comparingInt(KitItem::getSortOrder).thenComparing(KitItem::getName))
                .map(KitItemService::toResponse)
                .toList();
    }

    public KitItemResponse create(SaveKitItemRequest request) {
        String name = request.name().trim();
        if (kitItems.existsByName(name)) {
            throw new ConflictException("kitItem.name.taken", name);
        }
        KitItem item = new KitItem();
        apply(item, request, name);
        kitItems.save(item);
        return toResponse(item);
    }

    public KitItemResponse update(int id, SaveKitItemRequest request) {
        KitItem item = kitItems.findById(id).orElseThrow(() -> new NotFoundException("entity.kitItem", id));
        String name = request.name().trim();
        if (kitItems.existsByNameAndIdNot(name, id)) {
            throw new ConflictException("kitItem.name.taken", name);
        }
        apply(item, request, name);
        return toResponse(item);
    }

    public void delete(int id) {
        KitItem item = kitItems.findById(id).orElseThrow(() -> new NotFoundException("entity.kitItem", id));
        long kitCount = kitItems.countKitsContaining(id);
        if (kitCount > 0) {
            throw new ConflictException("kitItem.delete.inUse", kitCount);
        }
        kitItems.delete(item);
    }

    private static void apply(KitItem item, SaveKitItemRequest request, String name) {
        item.setName(name);
        item.setSortOrder(request.sortOrder());
        item.setActive(request.active());
        item.setRequiredSizeType(request.requiredSizeType());
    }

    static KitItemResponse toResponse(KitItem item) {
        return new KitItemResponse(item.getId(), item.getName(), item.getSortOrder(),
                item.isActive(), item.getRequiredSizeType());
    }
}
