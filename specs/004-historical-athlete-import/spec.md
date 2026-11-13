# Feature Specification: Historical Athlete Import

**Feature Branch**: `004-historical-athlete-import`

**Created**: 2026-10-06

**Status**: Deferred. Not implemented, and not part of the interview demo (see `specs/007-backend-api/spec.md`, Scope).

**Input**: README phase 9 "Historical import" (status: Pending).

## Current State

- **Schema only**: `AthleteImportBatch`, `AthleteImportRow` and `ModalityEquivalence`, with their JPA mapping, the
  enum `ImportRowResult` and the value `OptInSource.Imported`.
- **Helpers that exist and are reused by the import**: `DataNormalizer`, `NameSimilarity`, `DocumentValidator`,
  `AgeCategoryResolver` and `AthleteSearchService`.
- **Not implemented yet**: the file reader, the row classifier, the import service, the review queue and undo.
  *Design required.*
- No import code exists.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and preview with column mapping (Priority: P1)

An administrator uploads an Excel or CSV file from the previous system, maps its columns to athlete fields, and sees
a preview with the outcome predicted for each row before anything is saved.

**Why this priority**: It prevents bad data from entering the shared athlete base.

**Independent Test**: Upload a sample file and verify that the preview classifies rows without writing athletes.

**Acceptance Scenarios**:

1. **Given** a valid file, **When** the administrator maps the columns, **Then** the preview lists each row with its
   predicted result and reason.
2. **Given** an unreadable or oversized file, **When** it is uploaded, **Then** a clear error is shown.

---

### User Story 2 - Process the batch (Priority: P1)

The administrator confirms the import. Each row is accepted, corrected, flagged for review, marked as a duplicate or
rejected. No row is dropped silently.

**Independent Test**: Import a file that covers all five outcomes; verify the counters on the batch and that the
original row is preserved in `AthleteImportRow`.

**Acceptance Scenarios**:

1. **Given** a clean row, **When** it is processed, **Then** the athlete (and a registration, when an event is
   chosen) is created with `OptInSource.Imported`, and no consent is assumed.
2. **Given** a row that matches an existing athlete by document, **When** it is processed, **Then** it is marked
   `Duplicate` and linked to the existing athlete.
3. **Given** modality text such as `L 30K`, **When** an equivalence exists, **Then** the modality, category and kit
   are resolved; otherwise the row goes to `InReview`.

---

### User Story 3 - Review queue and manual merge (Priority: P2)

The administrator resolves the rows in review, edits the equivalences, and merges duplicates manually.

**Independent Test**: Resolve one row and one duplicate; verify the athlete counts and the audit entries.

**Acceptance Scenarios**:

1. **Given** a row in review, **When** the administrator creates an equivalence and reprocesses, **Then** the row
   becomes accepted or corrected, without uploading the file again.

---

### User Story 4 - Undo a batch (Priority: P3)

An administrator undoes a batch, removing what it created (athletes and registrations) when that is safe.

**Independent Test**: Import, then undo; verify that the created records are gone and the existing athletes are
untouched.

**Acceptance Scenarios**:

1. **Given** a batch, **When** it is undone, **Then** only the records created by that batch are removed.

### Edge Cases

- The same person written with different spellings, or with no document number. Use `NameSimilarity`, and never merge
  automatically below the threshold.
- Invalid or foreign documents (`DocumentType`, `DocumentValidator`).
- Dates of birth in several formats.
- The same file uploaded again.
- Athletes who already have a portal account (`AthleteAccount`): their data is never overwritten.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST accept `.xlsx` and `.csv` files and validate them by content, not by extension.
- **FR-002**: The system MUST provide a preview step with the column mapping stored in `MappingJson`.
- **FR-003**: The system MUST classify every row with an `ImportRowResult` and keep the raw row.
- **FR-004**: The system MUST NOT register marketing consent for imported athletes. `OptInSource.Imported` means
  that no consent is recorded.
- **FR-005**: Administrators MUST be able to manage the modality equivalences per event.
- **FR-006**: The system MUST support manual duplicate resolution and batch undo, and all of them are audited.
- **FR-007**: The endpoints MUST require the administrator policy.
- **FR-008**: Duplicate-detection thresholds and merge precedence. [NEEDS CLARIFICATION: which fields win on merge?]
- **FR-009**: Source file layout of the previous system. [NEEDS CLARIFICATION: provide sample files.]

### Key Entities

- **AthleteImportBatch**, **AthleteImportRow**, **ModalityEquivalence**: existing entities.
- **Athlete**, **Registration**: created or linked by the import.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A 5,000-row historical file is imported and classified in under 2 minutes.
- **SC-002**: 100% of rows end with an explicit result; none is dropped.
- **SC-003**: Zero athletes receive marketing messages because of imported data without recorded consent.
- **SC-004**: Uploading the same file again creates no duplicate athletes.

## Assumptions

- Only administrators run imports.
- The import runs only a few times, so a synchronous implementation is acceptable.
