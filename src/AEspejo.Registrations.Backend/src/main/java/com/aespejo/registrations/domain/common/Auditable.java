package com.aespejo.registrations.domain.common;

/**
 * Marks an entity whose changes must be recorded in {@code AuditRecords}. The persistence
 * interceptor relies on this marker, because auditing is mandatory wherever money or personal data
 * is involved.
 */
public interface Auditable {
}
