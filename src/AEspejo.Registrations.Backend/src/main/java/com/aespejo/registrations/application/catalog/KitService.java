package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.KitResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SaveKitRequest;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Kit;
import com.aespejo.registrations.domain.entities.KitItem;
import com.aespejo.registrations.domain.entities.Modality;
import com.aespejo.registrations.infrastructure.persistence.repository.KitItemRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.KitRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.ModalityRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Use cases for the kits of a modality: create, edit and delete, with their catalog items. */
@Service
@Transactional
public class KitService {

    private final KitRepository kits;
    private final KitItemRepository kitItems;
    private final ModalityRepository modalities;
    private final RegistrationRepository registrations;
    private final CatalogViews views;

    public KitService(
            KitRepository kits,
            KitItemRepository kitItems,
            ModalityRepository modalities,
            RegistrationRepository registrations,
            CatalogViews views) {
        this.kits = kits;
        this.kitItems = kitItems;
        this.modalities = modalities;
        this.registrations = registrations;
        this.views = views;
    }

    public KitResponse create(int modalityId, SaveKitRequest request) {
        Modality modality = modalities.findById(modalityId)
                .orElseThrow(() -> new NotFoundException("entity.modality", modalityId));
        String name = request.name().trim();
        if (kits.existsByModalityIdAndName(modalityId, name)) {
            throw new ConflictException("kit.name.taken", name);
        }
        Kit kit = new Kit();
        kit.setModality(modality);
        apply(kit, request, name, resolveItems(request.itemIds()));
        kits.save(kit);
        return views.toKit(kit);
    }

    public KitResponse update(int id, SaveKitRequest request) {
        Kit kit = kits.findById(id).orElseThrow(() -> new NotFoundException("entity.kit", id));
        String name = request.name().trim();
        if (kits.existsByModalityIdAndNameAndIdNot(kit.getModality().getId(), name, id)) {
            throw new ConflictException("kit.name.taken", name);
        }
        List<KitItem> newItems = resolveItems(request.itemIds());

        // Adding a size-requiring item to a kit that already has registrations would leave those
        // athletes without a size, which breaks the shirt production report.
        boolean requiredSizeBefore = kit.getItems().stream().anyMatch(item -> item.getRequiredSizeType() != null);
        boolean requiredSizeNow = newItems.stream().anyMatch(item -> item.getRequiredSizeType() != null);
        if (requiredSizeNow && !requiredSizeBefore) {
            long withoutSize = registrations.countByKitIdAndSizeIsNull(id);
            if (withoutSize > 0) {
                throw new ConflictException("kit.size.missing", withoutSize);
            }
        }

        apply(kit, request, name, newItems);
        return views.toKit(kit);
    }

    public void delete(int id) {
        Kit kit = kits.findById(id).orElseThrow(() -> new NotFoundException("entity.kit", id));
        if (registrations.existsByKitId(id)) {
            throw new ConflictException("kit.delete.inUse");
        }
        kits.delete(kit);
    }

    /** Unknown item ids are ignored, as in the previous backend. */
    private List<KitItem> resolveItems(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        return new ArrayList<>(kitItems.findByIdIn(ids));
    }

    private static void apply(Kit kit, SaveKitRequest request, String name, List<KitItem> items) {
        kit.setName(name);
        kit.setDescription(request.description() == null || request.description().isBlank()
                ? null : request.description().trim());
        kit.setSurchargeCents(request.surchargeCents());
        kit.setSortOrder(request.sortOrder());
        kit.setActive(request.active());
        kit.getItems().clear();
        kit.getItems().addAll(items);
    }
}
