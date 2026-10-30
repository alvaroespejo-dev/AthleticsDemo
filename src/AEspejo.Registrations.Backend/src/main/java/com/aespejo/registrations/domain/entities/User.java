package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.enums.UserRole;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Back-office operator. Users are not audited themselves, but they sign every change they make. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String loginName;
    private String name;
    private String email;
    private String passwordHash;

    private UserRole role = UserRole.ReadOnly;

    private String preferredLanguage = "es";

    private boolean active = true;

    private OffsetDateTime createdAt;
    private OffsetDateTime lastAccessAt;
}
