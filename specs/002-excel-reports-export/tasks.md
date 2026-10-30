# Tasks: Excel Export for Reports

**Input**: [spec.md](spec.md), [plan.md](plan.md). Port rules: [007 spec](../007-java-backend-port/spec.md).

## Phase 1: Clarification

- [ ] T001 Resolve FR-003, FR-006 and US3 (PDF); update spec.md
- [ ] T002 Approve the Excel column layout per sheet (the C# reference has no export layout to copy)

## Phase 2: Prerequisite - master report port

- [ ] T003 Port `ServicioReportes.ObtenerMaestroAsync` to `MasterReportService` (spec 007 T013)
- [ ] T004 Tests: totals by modality, distance, category and shirt size equal the C# output for the same data

## Phase 3: Foundational

- [ ] T005 Define `WorkbookWriter` interface in `application/export`
- [ ] T006 [P] Implement `ExcelWorkbookWriter` with cell sanitizing against formula injection
- [ ] T007 [P] Blob download helper in `src/api/endpoints.ts` (panel)

## Phase 4: US1 - Master report export (P1) MVP

- [ ] T008 [US1] `ReportExportService.exportMaster` reusing `MasterReportService`
- [ ] T009 [US1] `GET /api/events/{eventId}/reports/master/excel` in `ReportController`
- [ ] T010 [US1] Tests: sheet contents equal JSON report; empty event; formula injection
- [ ] T011 [US1] Export button in `Reportes.tsx` (existing page); i18n keys in es, en and pt

## Phase 5: US2 - Registrant list export (P2)

- [ ] T012 [US2] Export honoring the list filters from `RegistrationService`
- [ ] T013 [US2] `GET /api/events/{eventId}/registrations/excel` with role-based column set
- [ ] T014 [US2] Button in `Inscritos.tsx`; test on filtered row count

## Phase 6: US3 - PDF (P3, only if confirmed)

- [ ] T015 [US3] Decide; if approved, add a PDF writer behind the same `WorkbookWriter`-style interface

## Phase 7: Polish

- [ ] T016 Update README
- [ ] T017 `./mvnw verify` and panel `npm run build` pass
