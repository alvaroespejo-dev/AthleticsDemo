package com.aespejo.registrations.domain.entities;

import com.aespejo.registrations.domain.common.Auditable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One historical athlete import from an Excel or CSV file. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "AthleteImportBatches")
public class AthleteImportBatch implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String fileName;

    /** Event the imported registrations are attributed to, when applicable. */
    @ManyToOne
    private Event event;

    /** Column mapping chosen in the preview, serialized as JSON. */
    private String mappingJson;

    private OffsetDateTime importedAt;

    @ManyToOne
    private User user;

    private int rowsRead;
    private int rowsAccepted;
    private int rowsCorrected;
    private int rowsInReview;
    private int rowsDuplicated;
    private int rowsRejected;

    @OneToMany(mappedBy = "batch")
    private List<AthleteImportRow> rows = new ArrayList<>();
}
