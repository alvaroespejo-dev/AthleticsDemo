package com.aespejo.registrations.api.catalog;

import com.aespejo.registrations.application.catalog.BrandService;
import com.aespejo.registrations.application.catalog.CatalogModels.BrandResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandService brands;

    public BrandController(BrandService brands) {
        this.brands = brands;
    }

    @GetMapping
    public List<BrandResponse> list() {
        return brands.list();
    }
}
