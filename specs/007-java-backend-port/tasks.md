# Tasks: Java Backend Port of the C# Reference Implementation

**Input**: [spec.md](spec.md), [plan.md](plan.md)

**Status legend**: `[ ]` not started. Nothing here is marked done until it is verified with tests.

## Phase 1: Foundations (blocking)

- [ ] T001 Confirm with the product owner: the panel keeps its Spanish types and the Java backend uses English
      routes and fields, with the adapter described in `plan.md` section 4 (decision recorded in `spec.md`).
- [ ] T002 Create `src/AEspejo.Inscripciones.Backend` parity test harness: script the payment sequence and
      record the C# JSON responses as fixtures (read-only against `AEspejo.InscripcionesBackupCSharp`).
- [ ] T003 Add `AmountComparator` (port of `ComparadorMontos.cs`) and `NameSimilarity` (port of
      `SimilitudNombres.cs`, including `Levenshtein`) in `domain/services`, with unit tests.
- [ ] T004 Add `Clock` bean and replace `OffsetDateTime.now()` in Java services so tests are deterministic.

## Phase 2: Payments parity (US1)

- [ ] T005 Fix items 1 to 9 of `plan.md` section 7 in `PaymentService`, one commit per item.
- [ ] T006 Add a test per item that asserts the C# text and result for the same input.
- [ ] T007 Add `PaymentController` update endpoint parity: `PUT /api/payments/{id}` with observations.
- [ ] T008 Replace hard-coded messages with English message keys (`plan.md` section 6); add the Spanish wording to the panel i18n files.

## Phase 3: Panel adapter (US2)

- [x] T009 Overwrite `src/AEspejo.Inscripciones.Web` with the C# reference panel (no adapter; decision approved).
- [x] T010 Rename the route segments in `src/api/endpoints.ts` to the English routes of `plan.md` section 4.
- [ ] T011 Set `VITE_API_URL` in `.env.*` to the Java backend. No page component is changed.
- [ ] T011b Final English pass (after the Java backend works): function names, query parameters, body keys,
      JSON fields in `tipos.ts`, and i18n keys.
- [ ] T012 Walk the screens: login, events list, event detail, registrants, registrant detail, register payment,
      revert payment, edit payment. Record any difference in `spec.md`.

## Phase 4: Missing C# features with logic (US1)

- [ ] T013 Port `ServicioReportes` to `MasterReportService` and expose `GET /api/events/{id}/reports/master`
      (JSON); tests compare with C# output for the same data.
- [ ] T014 Port `ServicioAdminInscripciones` list filters to `RegistrationService` (if not already equal).
- [ ] T015 Port athletes (`atletas`), athlete portal, configuration and money sport endpoints that the panel calls.
- [ ] T016 Port marketing (audience, segments, campaigns, WhatsApp inbox). In scope: it exists in the C# reference.

## Phase 5: Database and language

- [ ] T017 Confirm every migration uses English table, column, constraint and index names (`plan.md` section 3).
- [ ] T018 Grep `src/main` for Spanish identifiers; rename each hit. Only the strings in `plan.md` section 6 remain.
- [ ] T019 `./mvnw verify` passes against PostgreSQL 17.

## Phase 6: Documentation

- [ ] T020 Update `README.md` (Java backend commands, panel `VITE_API_URL`, PostgreSQL setup).
- [ ] T021 Update specs 001 to 005 to the Java paths in their `plan.md` and `tasks.md` (done with this feature).
