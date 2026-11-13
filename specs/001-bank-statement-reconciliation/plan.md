# Implementation Plan: Bank Statement Import and Payment Reconciliation

**Branch**: `001-bank-statement-reconciliation` | **Spec**: [spec.md](spec.md)

## Summary

Add statement import and a rule-based reconciliation engine to the backend. Payment creation reuses
`PaymentService` so registration-state recalculation stays in one place. The code has the entities and the
payment service only; the matching engine and the parser are *design required*.

## Target

| Concern | Java target (`src/AEspejo.Registrations.Backend`) |
| --- | --- |
| Batch entity | `domain/entities/StatementImportBatch.java` (exists) |
| Row entity | `domain/entities/StatementMovement.java` (exists) |
| Enums | `domain/enums/ReconciliationStatus.java`, `ReconciliationRule.java` (exist) |
| Mapping | JPA annotations and migration |
| Payment creation | `application/payment/PaymentService.java` |
| Amount rule | `domain/services/AmountComparator.java` (to create) |
| Name rule | `domain/services/NameSimilarity.java` (to create) |
| Matching engine | `domain/services/ReconciliationRules.java` (design required) |
| Parser | `application/statement/StatementFileReader.java` interface, `infrastructure/statement/` implementation (design required) |

## UI (panel)

`src/AEspejo.Registrations.Frontend/src/layout/navigation.ts` lists the section
**Pagos y conciliación** (route `/pagos`, roles `Admin` and `Cajero`), marked `pendiente: true`. No page file exists and the app defines no route for it. The rules are not in the code; they are the open questions in `spec.md`.

## Technical Context

**Language/Version**: Java 21, Spring Boot 3.5; TypeScript / Next.js (panel)

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
- Language: all new Java names, comments and tables in English. PASS.
- Testing: integration test per rule and for undo, including money and audit. PASS.

## Project Structure (new files)

```text
src/AEspejo.Registrations.Backend/src/main/java/com/aespejo/registrations/
  domain/services/ReconciliationRules.java          (design required)
  application/statement/StatementReconciliationService.java
  application/statement/StatementFileReader.java    (interface)
  infrastructure/statement/CsvStatementReader.java  (first bank profile)
  api/statement/StatementController.java
src/main/resources/db/migration/V2__statement_undo.sql   (only if undo columns are needed)
src/test/java/com/aespejo/registrations/.../ReconciliationRulesTest.java
src/test/java/com/aespejo/registrations/.../StatementApiTest.java
```

Panel: `src/AEspejo.Registrations.Frontend/src/features/reconciliation/ReconciliationPage.tsx`, with its route in
`src/app/` and the calls in `src/api/endpoints.ts`.

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
- No matching engine exists yet; the rules must be specified and approved before coding.