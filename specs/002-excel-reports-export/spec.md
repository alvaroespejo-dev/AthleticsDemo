# Feature Specification: Excel Export for Reports

**Feature Branch**: `002-excel-reports-export`

**Created**: 2026-10-06

**Status**: Deferred. Not in the C# reference and not part of the interview demo (see `specs/007-java-backend-port/spec.md`, Scope).

**Input**: README phase 5 "Reports with Excel export" (status: Pending).

## Current State (audit)

- **C# reference (`AEspejo.InscripcionesBackupCSharp/src`)**:
  - Working: JSON master report (`ServicioReportes.ObtenerMaestroAsync`,
    `GET api/eventos/{eventoId}/reportes/maestro`) with totals by modality, distance, category and
    shirt size; registrant list with filters (`ServicioAdminInscripciones`); panel page `Reportes.tsx`.
  - Not in C#: any file export. The package references are present, but no code uses ClosedXML or
    QuestPDF. The Excel writer is *design required*.
- **Java target**: no master report service, no registrant export, no file export. Port the JSON report
  first (spec 007 task T013), then the export on top of it.
- Missing in both: Excel and PDF export.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download the master report as Excel (Priority: P1)

An event manager downloads the master report of an event as an `.xlsx` with one sheet per section.

**Why this priority**: It is the deliverable named by the phase and is needed for logistics (shirts, kits).

**Independent Test**: Call the export endpoint for a seeded event; open the workbook and compare
every sheet with the JSON report.

**Acceptance Scenarios**:

1. **Given** an event with registrations, **When** the user clicks "Export", **Then** an `.xlsx` is
   downloaded with sheets for modality, distance, category and shirts matching the on-screen numbers.
2. **Given** an event with no registrations, **When** exporting, **Then** the workbook has headers
   and zero rows (no error).

---

### User Story 2 - Export the registrant list (Priority: P2)

A cashier exports the filtered registrant list (the same filters as the screen) to Excel.

**Independent Test**: Apply a filter, export, verify the row count equals the filtered total.

**Acceptance Scenarios**:

1. **Given** filters applied on the registrants screen, **When** exporting, **Then** only matching
   rows are included, with personal data columns restricted by role.

---

### User Story 3 - PDF version (Priority: P3)

[NEEDS CLARIFICATION: is a PDF required (QuestPDF is already referenced) or is Excel enough?]

### Edge Cases

- Very large events (tens of thousands of rows): stream the file, do not build it twice in memory.
- Text starting with `=`, `+`, `-`, `@` must not execute as formulas (spreadsheet injection).
- Money columns formatted from cents, not floating point.
- File names with the event slug and UTC date.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST export the master report as `.xlsx` with data identical to the JSON report.
- **FR-002**: System MUST export the registrant list honoring the active filters.
- **FR-003**: Exports MUST be restricted to the `lectura` policy; personal data columns only for
  `caja` and above [NEEDS CLARIFICATION: confirm which columns are sensitive].
- **FR-004**: Cell values MUST be sanitized against formula injection.
- **FR-005**: The UI MUST show a download button and an error message on failure.
- **FR-006**: Access to personal data in exports MUST be audited [NEEDS CLARIFICATION: required?].

### Key Entities

- **Report row sets**: read models from `ReporteMaestroDto`; no new persisted entities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Export of an event with 5,000 registrations completes in under 10 seconds.
- **SC-002**: Exported totals equal the on-screen totals in 100% of tested events.
- **SC-003**: No exported cell is interpreted as a formula when opened in Excel.

## Assumptions

- Existing report definitions are final; new report sections are out of scope.
- ClosedXML (already a dependency) is the chosen library.
