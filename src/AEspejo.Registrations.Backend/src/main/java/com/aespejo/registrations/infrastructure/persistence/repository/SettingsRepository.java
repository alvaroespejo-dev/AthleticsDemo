package com.aespejo.registrations.infrastructure.persistence.repository;

import com.aespejo.registrations.domain.entities.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;

/** The settings table holds a single row whose id is always 1. */
public interface SettingsRepository extends JpaRepository<SystemSettings, Integer> {
}