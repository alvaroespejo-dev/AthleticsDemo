# Implementation Plan: Historical Athlete Import

**Branch**: `004-historical-athlete-import` | **Spec**: [spec.md](spec.md)

## Summary

Build an import pipeline in Java: file reader (infrastructure), pure classification rules (domain), an
`AthleteImportService` with preview, process, reprocess and undo, and a wizard in the panel. The code has the
entities and helpers only; the reader, classifier and service are *design required*.

## Target

| Concern | Java target |
| --- | --- |
| Batch entity | `domain/entities/AthleteImportBatch.java` (exists) |
| Row entity | `domain/entities/AthleteImportRow.java` (exists) |
| Equivalence entity | `domain/entities/ModalityEquivalence.java` (exists) |
| Text normalizing | `domain/services/DataNormalizer.java` (exists) |
| Name similarity | `domain/services/NameSimilarity.java` (to create) |
| Document validation | `domain/services/DocumentValidator.java` (to create) |
| Category calculation | `domain/services/AgeCategoryResolver.java` (exists) |
| Athlete search | `application/athlete/AthleteSearchService.java` (to create) |
| File reader, row classifier, import service | design required |

## UI (panel)

The navigation lists **Importar históricos** (route `/importacion`, role `Admin`), marked as pending.
No page or route exists yet.

## Technical Context

**Language/Version**: Java 21, Spring Boot 3.5; TypeScript / Next.js (panel)

**Primary Dependencies**: Apache POI for XLSX (proposed, not approved); JDK for CSV.

**Storage**: PostgreSQL; the schema exists. A migration is needed only for undo bookkeeping.

**Testing**: JUnit 5 for the classifier (five outcomes); integration tests with `@SpringBootTest`.

**Performance Goals**: 5,000 rows in under 2 minutes.

**Constraints**: one transaction per batch where possible; the file is not held in memory twice.

## Constitution Check

- Layers: reader behind the `AthleteFileReader` interface (application), implementation in infrastructure. PASS.
- Data: changes are audited; dates are normalized to UTC. PASS.
- Validation: file content checked, not the extension. PASS.
- Security: `Admin` role only. PASS.
- Language: English names, routes and tables. PASS.

## Project Structure (new files)

```text
src/AEspejo.Registrations.Backend/src/main/java/com/aespejo/registrations/
  application/athlete/AthleteFileReader.java                 (interface)
  application/athlete/AthleteImportService.java
  application/athlete/AthleteImportModels.java
  application/common/ImportFileValidator.java
  domain/services/ImportRowClassifier.java                   (design required)
  infrastructure/athlete/CsvAthleteFileReader.java
  infrastructure/athlete/XlsxAthleteFileReader.java          (design required)
  api/athlete/AthleteImportController.java
src/AEspejo.Registrations.Frontend/src/features/athlete-import/   (panel wizard)
src/test/java/.../ImportRowClassifierTest.java
src/test/java/.../AthleteImportApiTest.java
```

## Contracts (English routes)

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/api/athlete-imports/preview` (multipart) | Admin | Parse and classify; no writes |
| POST | `/api/athlete-imports` | Admin | Process with chosen mapping |
| GET | `/api/athlete-imports/{id}/rows?result=` | Admin | Review queue |
| POST | `/api/athlete-import-rows/{id}/resolve` | Admin | Resolve or merge |
| GET/POST/PUT/DELETE | `/api/modality-equivalences` | Admin | Manage equivalences |
| POST | `/api/athlete-imports/{id}/undo` | Admin | Undo |

## Data Model

Existing entities. Additions to decide: `AthleteImportBatch.undone`, and a batch marker on created
`Athlete` and `Registration` rows so undo removes only what the batch created (alternative: derive created
records from `AthleteImportRow.athleteId` and `registrationId`).

## Risks

- Undo safety when an imported athlete later registers or claims a portal account.
- Unknown source layout (FR-009) blocks mapping defaults.
- Duplicate-detection thresholds and merge precedence are not defined yet; they must be decided.