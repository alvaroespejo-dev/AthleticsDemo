package com.aespejo.registrations.application.catalog;

import com.aespejo.registrations.application.catalog.CatalogModels.BrandResponse;
import com.aespejo.registrations.infrastructure.persistence.repository.BrandRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-only access to brands, the commercial identities that publish events. */
@Service
@Transactional(readOnly = true)
public class BrandService {

    private final BrandRepository brands;

    public BrandService(BrandRepository brands) {
        this.brands = brands;
    }

    public List<BrandResponse> list() {
        return brands.findAllByOrderByNameAsc().stream()
                .map(brand -> new BrandResponse(brand.getId(), brand.getCode(), brand.getName(), brand.isActive()))
                .toList();
    }
}
