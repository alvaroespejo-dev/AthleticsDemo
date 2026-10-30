package com.aespejo.registrations.domain.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Trail of every change made to an auditable entity. It is written by the persistence interceptor,
 * not by application code, so there is no way to skip it.
 *
 * <p>The id is {@code int} because the column is {@code integer} in {@code V1__initial_schema.sql}.
 * If the table ever needs {@code bigint}, that change is made through a new migration.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "AuditRecords")
public class AuditRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String tableName;
    private String recordId;

    /** Insert, Update or Delete. */
    private String operation;

    /** Modified fields with their old and new values, as JSON. */
    private String changes;

    private Integer userId;
    private String userName;
    private String ipAddress;

    private OffsetDateTime date;
}
