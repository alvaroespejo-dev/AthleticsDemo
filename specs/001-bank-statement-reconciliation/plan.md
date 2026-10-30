# Implementation Plan: Bank Statement Import and Payment Reconciliation

**Branch**: `001-bank-statement-reconciliation` | **Spec**: [spec.md](spec.md) | **Port**: [007](../007-java-backend-port/plan.md)

## Summary

Add statement import and a rule-based reconciliation engine to the Java backend. Payment creation reuses
`PaymentService` so registration-state recalculation stays in one place. The C# reference has the entities
and the payment service only; the matching engine and the parser are *design required*.

## Reference and target

| Concern | C# reference (`AEspejo.InscripcionesBackupCSharp/src`) | Java target (`src/AEspejo.Inscripciones.Backend`) |
|---|---|---|
| Batch entity | `AEspejo.Inscripciones.Domain/Entities/LoteImportacionExtracto.cs` | `domain/entities/StatementImportBatch.java` (exists) |
| Row entity | `AEspejo.Inscripciones.Domain/Entities/MovimientoExtracto.cs` | `domain/entities/StatementMovement.java` (exists) |
| Enums | `Domain/Enums/Enumeraciones.cs` (`EstadoConciliacion`, `ReglaConciliacion`) | `domain/enums/ReconciliationStatus.java`, `ReconciliationRule.java` (exist) |
| Mapping | `Infrastructure/Persistence/Configurations/ConciliacionConfigurations.cs` | JPA annotations and migration |
| Payment creation | `Application/Pagos/ServicioPagos.cs` | `application/payment/PaymentService.java` |
| Amount rule | `Domain/Services/ComparadorMontos.cs` | `domain/services/AmountComparator.java` (to create, spec 007 T003) |
| Name rule | `Domain/Services/SimilitudNombres.cs` | `domain/services/NameSimilarity.java` (to create, spec 007 T003) |
| Matching engine | **not in C#** | `domain/services/ReconciliationRules.java` (design required) |
| Parser | **not in C#** | `application/statement/StatementFileReader.java` interface, `infrastructure/statement/` implementation (design required) |

## UI reference (panel, from the C# reference)

`AEspejo.InscripcionesBackupCSharp/src/AEspejo.Inscripciones.Web/src/rutas/navegacion.ts` lists the section
**Pagos y conciliación** (route `/pagos`, roles `Admin` and `Cajero`), marked `pendiente: true`. No page file
exists and `App.tsx` defines no route for it. The rules are not in the code; they are the open questions in `spec.md`.

## Technical Context

**Language/Version**: Java 21, Spring Boot 3.5; TypeScript / React 19 (panel)

**Primary Dependencies**: Spring Data JPA, Flyway. CSV by the JDK; XLSX library to be chosen
(Apache POI is the proposed option, not yet approved).

**Storage**: PostgreSQL; one migration only if undo columns are needed (`StatementImportBatch.undone`, `undoneAt`).

**Testing**: JUnit 5 unit tests for the matching rules; integration tests with `@SpringBootTest` and Testcontainers
or the local PostgreSQL.

**Performance Goals**: 500-row statement processed in under 10 seconds.

**Constraints**: each batch processed in one transaction; PostgreSQL unique index on `Payments.TransactionNumber`.

## Constitution Check

- Layers: rules are pure (`domain/services`); orchestration in `application/statement`; parsing behind an
  interface in `infrastructure`. PASS.
- Data: amounts in cents, UTC timestamps, audit through `Auditable`. PASS.
- Errors: `BusinessRuleException` for invalid files, `ConflictException` for duplicates. PASS.
- Security: `Cashier` and `Admin` roles; undo restricted to `Admin`. PASS.
- Language: all new Java names, comments and tables in English (spec 007 rule 2). PASS.
- Testing: integration test per rule and for undo, including money and audit. PASS.

## Project Structure (new files)

```text
src/AEspejo.Inscripciones.Backend/src/main/java/com/aespejo/registrations/
  domain/services/ReconciliationRules.java          (design required)
  application/statement/StatementReconciliationService.java
  application/statement/StatementFileReader.java    (interface)
  infrastructure/statement/CsvStatementReader.java  (first bank profile)
  api/statement/StatementController.java
src/main/resources/db/migration/V2__statement_undo.sql   (only if undo columns are needed)
src/test/java/com/aespejo/registrations/.../ReconciliationRulesTest.java
src/test/java/com/aespejo/registrations/.../StatementApiTest.java
```

Panel: `src/AEspejo.Inscripciones.Web/src/paginas/Conciliacion.tsx` (same project as the C# reference, route
added to `App.tsx`, adapter entries in `src/api/endpoints.ts`).

## Contracts (proposed, English routes)

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/api/statement-batches` (multipart) | Cashier, Admin | Import and auto-reconcile |
| GET | `/api/statement-batches` | Cashier, Admin | Batch history |
| GET | `/api/statement-movements?status=` | Cashier, Admin | Review queue |
| POST | `/api/statement-movements/{id}/confirm` | Cashier, Admin | Confirm suggestion |
| POST | `/api/statement-movements/{id}/link` | Cashier, Admin | Manual link |
| POST | `/api/statement-movements/{id}/discard` | Cashier, Admin | Discard |
| POST | `/api/statement-batches/{id}/undo` | Admin | Undo batch |

## Risks

- Bank file formats are unknown (spec FR-009); start with one profile behind `StatementFileReader`.
- Rule 1 needs a transaction number declared by the athlete (FR-010); without it only rule 3 works.
- The C# reference has no matching engine; the rules must be specified and approved before coding.
