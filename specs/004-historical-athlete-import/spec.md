# Feature Specification: Historical Athlete Import

**Feature Branch**: `004-historical-athlete-import`

**Created**: 2026-10-06

**Status**: Deferred. Not in the C# reference and not part of the interview demo (see `specs/007-java-backend-port/spec.md`, Scope).

**Input**: README phase 9 "Historical import" (status: Pending).

## Current State (audit)

- **C# reference (`AEspejo.InscripcionesBackupCSharp/src`)**:
  - Entities only: `LoteImportacionAtletas`, `FilaImportacionAtleta`, `EquivalenciaModalidad`, with
    EF configuration in `ImportacionConfigurations.cs`. Enums `ResultadoFilaImportacion` and
    `OrigenOptIn.Importado`.
  - Helpers that exist and are reused by the import: `Normalizador`, `SimilitudNombres`,
    `ValidadorDocumento` (`Application/Common`), `CalculadoraCategoria`, `ServicioBusquedaAtleta`.
  - Not in C#: the file reader, the row classifier, the import service, the review queue and undo.
    *Design required.*
- **Java target**: `AthleteImportBatch`, `AthleteImportRow`, `ModalityEquivalence` entities exist;
  `DataNormalizer` and `AgeCategoryResolver` exist. `SimilitudNombres` and `ValidadorDocumento` must be
  ported first (spec 007 tasks T003 and the document validator). No import code exists.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and preview with column mapping (Priority: P1)

An administrator uploads an Excel or CSV file from the previous system, maps its columns to athlete
fields and sees a preview with the outcome predicted for each row before anything is saved.

**Why this priority**: Prevents bad data from entering the shared athlete base.

**Independent Test**: Upload a sample file; verify the preview classifies rows without writing athletes.

**Acceptance Scenarios**:

1. **Given** a valid file, **When** the administrator maps columns, **Then** a preview lists each row
   with its predicted result and reason.
2. **Given** an unreadable or oversized file, **When** uploading, **Then** a clear error is shown.

---

### User Story 2 - Process the batch (Priority: P1)

The administrator confirms the import; rows are accepted, corrected, flagged for review, marked as
duplicates or rejected. No row is dropped silently.

**Independent Test**: Import a file covering all five outcomes; verify counters on the batch and the
original row preserved in `FilaImportacionAtleta`.

**Acceptance Scenarios**:

1. **Given** a clean row, **When** processing, **Then** the athlete (and registration when an event is
   chosen) is created with `OrigenOptIn.Importado` and no consent assumed.
2. **Given** a row matching an existing athlete by document, **When** processing, **Then** it is
   `Duplicada` and linked to the existing athlete.
3. **Given** dirty modality text such as `L 30K`, **When** an equivalence exists, **Then** modality,
   category and kit are resolved; otherwise the row goes to `EnRevision`.

---

### User Story 3 - Review queue and manual merge (Priority: P2)

The administrator resolves in-review rows, edits equivalences, and merges duplicates manually.

**Independent Test**: Resolve one row and one duplicate; verify athlete counts and audit entries.

**Acceptance Scenarios**:

1. **Given** an in-review row, **When** the administrator creates an equivalence and reprocesses,
   **Then** the row becomes accepted/corrected without re-uploading the file.

---

### User Story 4 - Undo a batch (Priority: P3)

An administrator undoes a batch, removing what it created (athletes and registrations) when safe.

**Independent Test**: Import then undo; verify created records are gone and pre-existing athletes untouched.

**Acceptance Scenarios**:

1. **Given** a batch, **When** undone, **Then** only records created by that batch are removed.

### Edge Cases

- Same person with different spellings or missing document (use `SimilitudNombres`, never auto-merge below threshold).
- Invalid or foreign documents (`TipoDocumento`, `ValidadorDocumento`).
- Dates of birth in several formats.
- Re-uploading the same file.
- Athletes who already have a portal account (`CuentaAtleta`): never overwrite their data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept `.xlsx` and `.csv` and validate by content, not extension.
- **FR-002**: System MUST provide a preview step with column mapping stored in `MapeoJson`.
- **FR-003**: System MUST classify every row with a `ResultadoFilaImportacion` and keep the raw row.
- **FR-004**: System MUST NOT register marketing consent for imported athletes (`OrigenOptIn.Importado` = no consent recorded).
- **FR-005**: System MUST let administrators manage modality equivalences per event.
- **FR-006**: System MUST support manual duplicate resolution and batch undo, all audited.
- **FR-007**: Endpoints MUST require the `administracion` policy.
- **FR-008**: Duplicate-detection thresholds and merge precedence [NEEDS CLARIFICATION: which fields win on merge?].
- **FR-009**: Source file layout of the previous system [NEEDS CLARIFICATION: provide sample files].

### Key Entities

- **LoteImportacionAtletas**, **FilaImportacionAtleta**, **EquivalenciaModalidad** (existing).
- **Atleta**, **Inscripcion** (created or linked).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A 5,000-row historical file is imported and classified in under 2 minutes.
- **SC-002**: 100% of rows end with an explicit result; none is dropped.
- **SC-003**: Zero athletes receive marketing messages because of imported data without recorded consent.
- **SC-004**: Re-uploading the same file creates no duplicate athletes.

## Assumptions

- Only administrators run imports.
- The import is run a limited number of times (migration), so a synchronous implementation is acceptable.
