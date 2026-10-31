# Feature Specification: Backend API

**Feature Branch**: `007-backend-api`

**Status**: Implemented for the features in scope; deferred features are marked below.

## Goal

A Java 21 / Spring Boot REST API that serves the admin panel (`src/AEspejo.Registrations.Frontend`), the
public registration pages and the two brand landings. The API implements the business rules, validations,
messages and state transitions described in this spec.

## Scope

**In scope**: events, modalities, kits and kit items, price tiers, sizes, age categories, brands, public
registration, registrations (list, detail, bib, cancel, reactivate, result), payments (register, update, revert),
athletes and the athlete portal, Money Sport, configuration, reports (JSON), WhatsApp inbox, audience and
campaigns, event images and uploads, JWT login.

**Deferred** (their logic is not implemented and their design needs approval; their specs stay as documentation,
marked *Deferred*): the statement reconciliation engine (spec 001), the Excel and PDF export (spec 002), the kit
delivery write side and live board (spec 003), the historical athlete import (spec 004) and the quality tooling
(spec 005). Panel entries that point to them (`/pagos`, `/importacion`, `/dia-evento`) stay hidden.

## Rules that apply to this feature

1. **Business rules are the source of truth.** Every rule, validation, message and state transition is
   documented in this spec and tested. Changing a rule requires a written decision here first.
2. **English identifiers only.** Classes, methods, fields, DTOs, enums and enum values, packages, file names,
   database tables and columns, constraint and index names, configuration keys, API routes, JSON field names and
   code comments are English. Domain terms are English: `Athlete`, `Registration`, `Event`, `Payment`,
   `Modality`, `Kit`.
3. **Messages in three languages.** Every message a user can see is available in `es`, `en` and `pt`. Business
   rules throw English message keys (for example `payment.transactionNumber.duplicate`), and the backend resolves
   each key to text in the user's preferred language (`preferredLanguage` in the session, or the `Accept-Language`
   header) from the resource bundles `messages_es`, `messages_en` and `messages_pt`.
4. **The panel calls the API with English routes.** Pages, components, types and i18n keys follow the same naming
   rule as the API.

## Current state

- The API provides all the endpoints listed in *Scope*, with the Flyway schema in `db/migration`.
- Payment rules (`PaymentService`), amount comparison, name similarity, the master report (`MasterReportService`)
  and the registrant list (`RegistrationService`) are implemented.
- The entities of the deferred features exist as schema only. Their behaviour is not implemented.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Payment outcomes (Priority: P1)

An administrator or cashier registers, edits and reverts payments in the panel. The API returns the registration
status, the surplus, the notes and the messages described in the payment rules.

**Independent Test**: Run a scripted sequence (register exact, register short, register over, revert, edit amount)
and check the JSON responses and the database rows.

### User Story 2 - Panel workflows (Priority: P1)

The panel logs in, lists events, opens registrations, registers a payment and reverts it, using the API at the URL
set in `VITE_API_URL`.

**Independent Test**: Start the API with an empty database, start the panel pointing at it, and walk through the
main screens.

### User Story 3 - English schema (Priority: P2)

The Flyway migrations create English table and column names, and Hibernate validates them with
`ddl-auto: validate`.

**Independent Test**: `./mvnw verify` passes, and a search for Spanish identifiers in `src/main` returns only
user-visible messages.

## Requirements *(mandatory)*

- **FR-001**: Every feature in scope behaves as described in its spec and in the tests.
- **FR-002**: Every Java class, method, field, enum value, DTO, route, table, column and comment is in English.
- **FR-003**: Every user-visible backend message is available in `es`, `en` and `pt` through resource bundles.
- **FR-004**: The panel uses the API routes and JSON field names defined here.
- **FR-005**: Each business rule has a test that fails when the rule is broken.
- **FR-006**: Deferred features are implemented only after their design is approved (see specs 001 to 005).

## Success Criteria *(mandatory)*

- **SC-001**: The scripted payment sequence returns the same status, totals, surplus and message text on every run.
- **SC-002**: The panel completes its main flows against the API with no change to page components.
- **SC-003**: No Spanish identifiers exist in `src/AEspejo.Registrations.Backend`.

## Assumptions

- PostgreSQL is the production database; SQLite is the default for local development. Business results do not
  depend on the engine.
