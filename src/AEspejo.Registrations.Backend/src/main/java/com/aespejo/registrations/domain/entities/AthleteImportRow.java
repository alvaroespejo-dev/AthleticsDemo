package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.enums.ImportRowResult;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Outcome of processing one import row. No row is dropped silently: rows the importer cannot resolve
 * stay in review here, together with the reason.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "AthleteImportRows")
public class AthleteImportRow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private AthleteImportBatch batch;

    private int rowNumber;

    /** Complete raw row, so it can be reprocessed without asking for the file again. */
    private String rawRow;

    private ImportRowResult result;

    /** What was corrected, or why the row is in review. */
    private String detail;

    @ManyToOne
    private Athlete athlete;

    @ManyToOne
    private Registration registration;

    /** Existing athlete the row collided with, used by the manual merge screen. */
    private Integer duplicateAthleteId;
}
