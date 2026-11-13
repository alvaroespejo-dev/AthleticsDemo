package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.PriceTierResponse;
import com.aespejo.registrations.application.catalog.CatalogModels.SavePriceTierRequest;
import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.ConflictException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.domain.entities.Modality;
import com.aespejo.registrations.domain.entities.PriceTier;
import com.aespejo.registrations.infrastructure.persistence.repository.ModalityRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.PriceTierRepository;
import com.aespejo.registrations.infrastructure.persistence.repository.RegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Use cases for the price tiers of a modality (early-bird, regular, late). */
@Service
@Transactional
public class PriceTierService {

    /** Used as the excluded id on create, so the "exclude itself" clause matches nothing. */
    private static final int NO_EXCLUDED_ID = 0;

    private final PriceTierRepository priceTiers;
    private final ModalityRepository modalities;
    private final RegistrationRepository registrations;
    private final CatalogViews views;

    public PriceTierService(
            PriceTierRepository priceTiers,
            ModalityRepository modalities,
            RegistrationRepository registrations,
            CatalogViews views) {
        this.priceTiers = priceTiers;
        this.modalities = modalities;
        this.registrations = registrations;
        this.views = views;
    }

    public PriceTierResponse create(int modalityId, SavePriceTierRequest request) {
        Modality modality = modalities.findById(modalityId)
                .orElseThrow(() -> new NotFoundException("entity.modality", modalityId));
        validate(modalityId, NO_EXCLUDED_ID, request);
        PriceTier tier = new PriceTier();
        tier.setModality(modality);
        apply(tier, request);
        priceTiers.save(tier);
        return views.toPriceTier(tier);
    }

    public PriceTierResponse update(int id, SavePriceTierRequest request) {
        PriceTier tier = priceTiers.findById(id).orElseThrow(() -> new NotFoundException("entity.priceTier", id));
        validate(tier.getModality().getId(), id, request);
        apply(tier, request);
        return views.toPriceTier(tier);
    }

    public void delete(int id) {
        PriceTier tier = priceTiers.findById(id).orElseThrow(() -> new NotFoundException("entity.priceTier", id));
        if (registrations.existsByPriceTierId(id)) {
            throw new ConflictException("priceTier.delete.inUse");
        }
        priceTiers.delete(tier);
    }

    /** The validity window must be ordered, and two tiers of a modality cannot be valid at the same time. */
    private void validate(int modalityId, int excludedId, SavePriceTierRequest request) {
        if (!request.validFrom().isBefore(request.validTo())) {
            throw new BusinessRuleException("priceTier.validity.reversed");
        }
        var overlapping = priceTiers.findOverlappingNames(
                modalityId, excludedId, request.validFrom(), request.validTo());
        if (!overlapping.isEmpty()) {
            throw new ConflictException("priceTier.overlap", overlapping.get(0));
        }
    }

    private static void apply(PriceTier tier, SavePriceTierRequest request) {
        tier.setName(request.name().trim());
        tier.setPriceCents(request.priceCents());
        tier.setValidFrom(request.validFrom());
        tier.setValidTo(request.validTo());
    }
}
