# Feature Specification: Java Backend Port of the C# Reference Implementation

**Feature Branch**: `007-java-backend-port`

**Status**: Draft

**Reference implementation**: `AEspejo.InscripcionesBackupCSharp/` (C# / .NET). It is the source of
business behaviour. It is working code and must not be changed by this feature.

## Goal

Build a Java 21 / Spring Boot backend that produces the same business results as the C# reference
for every feature, and let the existing React panel (`AEspejo.InscripcionesBackupCSharp/src/AEspejo.Inscripciones.Web`,
reused as-is in its pages and components) run against it.

## Scope

**In scope**: every feature that exists in the C# reference (`AEspejo.InscripcionesBackupCSharp`), including
its code and its markdown documents, plus spec 006 (per-event service fee, done in C#). The goal is a working
Java backend and panel for an interview demo.

**Out of scope (deferred)**: any logic that does not exist in the C# reference or its documents. This covers
specs 001 (statement reconciliation engine), 002 (Excel and PDF export), 003 (kit delivery write side and live
board), 004 (historical athlete import) and 005 (quality tooling). Their specs stay as documentation and are
marked *Deferred*. Panel entries that point to them (`/pagos`, `/importacion`, `/dia-evento`) stay disabled or
hidden for the demo.

## Rules that apply to this feature

1. **Same behaviour, Java code.** Every rule, validation, message and state transition in the C# code
   is ported. No behaviour is invented, simplified or "improved" without a written decision in this spec.
2. **Backend is English only.** Class names, methods, fields, DTOs, enums and enum values, packages,
   file names, database tables and columns, constraint and index names, configuration keys, API routes,
   JSON field names and code comments are all English. Domain terms are translated:
   `Athlete`, `Registration`, `Event`, `Payment`, `Modality`, `Kit`.
3. **Messages in three languages.** Code, comments, identifiers and file names are English only. Every
   message a user can see is available in `es`, `en` and `pt`, the three languages the panel supports. Business
   rules throw English message keys (for example `payment.transactionNumber.duplicate`). The backend resolves
   each key to text in the user's preferred language (`idiomaPreferido` in the session, or the
   `Accept-Language` header) from resource bundles `messages_es`, `messages_en` and `messages_pt`. The Spanish
   text is copied from the C# reference (`plan.md` section 6); the English and Portuguese texts are written in
   this feature.
4. **One panel, English calls.** `src/AEspejo.Inscripciones.Web` is the frontend for the Java backend. It is
   an exact copy of the C# reference panel (`AEspejo.InscripcionesBackupCSharp/src/AEspejo.Inscripciones.Web`)
   before this change. The only change in this stage is renaming the route segments of the API calls to the
   English routes in `plan.md` section 4. Pages, components, function names, types, query parameter names and
   i18n keys keep their current names. Renaming the rest to English is the final stage, after the Java backend
   works.

## Current State (verified)

Verified against the Java tree in `src/AEspejo.Inscripciones.Backend` and the C# reference:

- **Java already has**: entities for most of the domain, Flyway migration `V1__initial_schema.sql`,
  REST controllers for events, modalities, kits, kit items, price tiers, sizes, brands, age categories,
  registrations (list, detail, bib, cancel, reactivate, result), payments (register, update, revert),
  public event and registration endpoints, JWT login, and `PaymentService`.
- **Java is not identical to C#** in the payment rules (see `plan.md` section 7 for the exact list).
- **Java does not have**: athletes (`atletas`), athlete portal, WhatsApp inbox, marketing audience and
  campaigns, segments, money sport, public registration QR, configuration, reports, proof-of-payment
  upload, event image, and the features in specs 001 to 005.
- **C# has the logic for**: payments (`ServicioPagos`), amount comparison (`ComparadorMontos`), name
  similarity (`SimilitudNombres`), master report (`ServicioReportes`), registrant list
  (`ServicioAdminInscripciones`), and the entities of features 001 to 005.
- **C# does not have the logic for** the matching engine of 001, the Excel export of 002, the kit delivery
  write side of 003, or the athlete import of 004. Only their entities exist. Those parts must be designed
  and are marked in the feature specs as *design required*.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Same payment outcomes (Priority: P1)

An administrator or cashier registers, edits and reverts payments in the panel. The Java backend produces
the same registration status, the same surplus, the same notes and the same messages as the C# backend
for the same input.

**Independent Test**: Run the same scripted sequence (register exact, register short, register over,
revert, edit amount) against both backends and compare the JSON responses and the database rows.

### User Story 2 - Panel runs unchanged against Java (Priority: P1)

The React panel logs in, lists events, opens registrations, registers a payment and reverts it, using the
Java backend at the URL set in `VITE_API_URL`.

**Independent Test**: Start the Java backend with an empty database, start the panel with
`VITE_API_URL` pointing at it, and walk through the screens listed in `tasks.md` phase 2.

### User Story 3 - Same schema meaning, English names (Priority: P2)

The Flyway migrations create English table and column names, and Hibernate validates them with
`ddl-auto: validate`. No Spanish names appear in the database.

**Independent Test**: `./mvnw verify` passes with a PostgreSQL instance, and a grep for Spanish identifiers
in `src/main` returns only the allowed user-visible messages.

## Requirements *(mandatory)*

- **FR-001**: Every C# feature with working logic is ported to Java with the same rules and results.
- **FR-002**: Every Java class, method, field, enum value, DTO, route, table, column and comment is in English.
- **FR-003**: Every user-visible backend message is available in `es`, `en` and `pt` through resource bundles.
  The Spanish text matches the C# wording (`plan.md` section 6).
- **FR-004**: The panel reuses its existing pages and types. Only the API access layer is adapted.
- **FR-005**: Each ported rule has a test that fails on the C# behaviour it protects.
- **FR-006**: Features whose logic does not exist in C# are implemented only after their design is approved
  (see the *design required* items in specs 001 to 005).

## Success Criteria *(mandatory)*

- **SC-001**: For the scripted payment sequence, Java and C# return identical status, totals, surplus and
  message text in 100% of cases.
- **SC-002**: The panel completes its main flows against Java with no change to page components.
- **SC-003**: No Spanish identifiers exist in `src/AEspejo.Inscripciones.Backend`.

## Assumptions

- PostgreSQL is the target database for Java; the C# reference uses SQLite in development. Business
  results do not depend on the engine.
- The C# reference is not modified. Any fix found in it is recorded here and applied to Java only after
  approval.
