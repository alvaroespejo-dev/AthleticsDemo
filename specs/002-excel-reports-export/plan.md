# Implementation Plan: Excel Export for Reports

**Branch**: `002-excel-reports-export` | **Spec**: [spec.md](spec.md) | **Port**: [007](../007-java-backend-port/plan.md)

## Summary

Port the JSON master report from C# to Java first, then add `.xlsx` export on top of it. The export
reuses the same report service, so the numbers in the file cannot differ from the screen. The Excel writer
is not in C#; it is *design required*.

## Reference and target

| Concern | C# reference (`AEspejo.InscripcionesBackupCSharp/src`) | Java target |
|---|---|---|
| Master report | `Application/Reportes/ServicioReportes.cs` (`ObtenerMaestroAsync`) | `application/report/MasterReportService.java` (to create, spec 007 T013) |
| Report DTOs | `ReporteMaestroDto`, `ReporteModalidadDto`, `ReporteDistanciaDto`, `ReporteCategoriaDto`, `ReportePoleraDto` | `application/report/MasterReport.java` records |
| Registrant list filters | `Application/Inscripciones/ServicioAdminInscripciones.cs` | `application/registration/RegistrationService.java` |
| Excel writer | **not in C#** (ClosedXML is referenced but unused) | `infrastructure/export/ExcelWorkbookWriter.java` (design required) |

## UI reference (panel, from the C# reference)

The panel has the page `paginas/Reportes.tsx` (report title `reports.title`, generating message
`reports.generating`) showing the JSON master report. No export button exists in the code, and no export
call is defined in `api/endpoints.ts`.

## Technical Context

**Language/Version**: Java 21, Spring Boot 3.5; TypeScript / React 19 (panel)

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
src/AEspejo.Inscripciones.Backend/src/main/java/com/aespejo/registrations/
  application/report/MasterReportService.java
  application/report/MasterReport.java
  application/export/WorkbookWriter.java           (interface)
  infrastructure/export/ExcelWorkbookWriter.java   (design required)
  api/report/ReportController.java
src/AEspejo.Inscripciones.Web/src/api/endpoints.ts (blob download helper)
src/AEspejo.Inscripciones.Web/src/paginas/Reportes.tsx and Inscritos.tsx (existing; export buttons)
```

## Contracts (English routes)

| Method | Route | Role | Response |
|---|---|---|---|
| GET | `/api/events/{eventId}/reports/master` | ReadOnly+ | JSON (port of C#) |
| GET | `/api/events/{eventId}/reports/master/excel` | ReadOnly+ | `.xlsx` |
| GET | `/api/events/{eventId}/registrations/excel?{filters}` | Cashier+ | `.xlsx` |

No schema changes and no migration.

## Risks

- Large exports: read-only, so acceptable; use streaming to avoid building the file twice in memory.
- PDF scope (US3) is undecided; the plan covers Excel only.
- The C# reference has no export code, so column layouts need approval before implementation.
