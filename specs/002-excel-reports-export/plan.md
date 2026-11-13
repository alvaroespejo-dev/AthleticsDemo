# Implementation Plan: Excel Export for Reports

**Branch**: `002-excel-reports-export` | **Spec**: [spec.md](spec.md)

## Summary

Build on the JSON master report, then add `.xlsx` export on top of it. The export
reuses the same report service, so the numbers in the file cannot differ from the screen. The Excel writer
is not implemented yet; it is *design required*.

## Target

| Concern | Java target |
| --- | --- |
| Master report | `application/report/MasterReportService.java` (to create) |
| Report DTOs | `application/report/MasterReport.java` records |
| Registrant list filters | `application/registration/RegistrationService.java` |
| Excel writer | `infrastructure/export/ExcelWorkbookWriter.java` (design required) |

## UI (panel)

The panel has the page `features/reports` (report title `reports.title`, generating message `reports.generating`)
showing the JSON master report. No export button exists yet, and no export call is defined in `api/endpoints.ts`.

## Technical Context

**Language/Version**: Java 21, Spring Boot 3.5; TypeScript / Next.js (panel)

**Primary Dependencies**: Apache POI (SXSSF streaming writer) proposed; not yet approved.

**Storage**: N/A (read-only)

**Testing**: JUnit 5; integration tests open the returned workbook with POI and compare with the JSON report.

**Performance Goals**: 5,000 rows under 10 s.

**Constraints**: stream the response; no temporary files on shared disk.

## Constitution Check

- Layers: export abstraction in `application/export`; POI only in `infrastructure/export`. PASS.
- Data: money formatted from integer cents, never from floating point. PASS.
- Security: `ReadOnly` role and above for master report; sensitive columns only for `Cashier` and above. PASS.
- Language: names, comments and file names in English. PASS.

## Project Structure (new files)

```text
src/AEspejo.Registrations.Backend/src/main/java/com/aespejo/registrations/
  application/report/MasterReportService.java
  application/report/MasterReport.java
  application/export/WorkbookWriter.java           (interface)
  infrastructure/export/ExcelWorkbookWriter.java   (design required)
  api/report/ReportController.java
src/AEspejo.Registrations.Frontend/src/api/endpoints.ts (blob download helper)
src/AEspejo.Registrations.Frontend/src/features/reports and the registrants feature (existing; export buttons to add)
```

## Contracts (English routes)

| Method | Route | Role | Response |
|---|---|---|---|
| GET | `/api/events/{eventId}/reports/master` | ReadOnly+ | JSON |
| GET | `/api/events/{eventId}/reports/master/excel` | ReadOnly+ | `.xlsx` |
| GET | `/api/events/{eventId}/registrations/excel?{filters}` | Cashier+ | `.xlsx` |

No schema changes and no migration.

## Risks

- Large exports: read-only, so acceptable; use streaming to avoid building the file twice in memory.
- PDF scope (US3) is undecided; the plan covers Excel only.
- No export code exists yet, so column layouts need approval before implementation.