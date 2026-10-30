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

/** One bank statement import. It groups its movements and can be rolled back as a unit. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "StatementImportBatches")
public class StatementImportBatch implements Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String fileName;

    /** Column-mapping profile used, for example bnb or banco-union. */
    private String bankProfile;

    private OffsetDateTime importedAt;

    @ManyToOne
    private User user;

    private int rowsRead;
    private int rowsImported;
    private int rowsIgnored;

    @OneToMany(mappedBy = "statementBatch")
    private List<StatementMovement> movements = new ArrayList<>();
}
