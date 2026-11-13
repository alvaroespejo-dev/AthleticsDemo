package com.aespejo.registrations.domain.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Language available for the interface and translatable content. Its key is the language code. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Languages")
public class Language {

    @Id
    private String code;

    private String name;
    private boolean active = true;
}
