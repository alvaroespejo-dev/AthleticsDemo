package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.Event;
import com.aespejo.registrations.domain.enums.EventStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Integer> {

    List<Event> findAllByOrderByEventDateDesc();

    List<Event> findByStatusNotInOrderByEventDateDesc(Collection<EventStatus> excludedStatuses);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Integer id);

    java.util.Optional<Event> findBySlug(String slug);
}
