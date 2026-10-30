package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.KitItem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KitItemRepository extends JpaRepository<KitItem, Integer> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Integer id);

    List<KitItem> findByIdIn(Collection<Integer> ids);

    @Query("select count(k) from Kit k join k.items i where i.id = :itemId")
    long countKitsContaining(@Param("itemId") Integer itemId);
}