# AEspejo.Inscripciones Constitution

Registration system for sports events for two brands (EcoTrail and OneSport): event and modality
catalog, public registration form, reconcilable payments, reports, athlete portal and WhatsApp
campaigns/inbox. This constitution describes what the code **already does**, plus the language rule
below. Anything that could not be determined is marked **"TBD"**.

## Core Principles

### I. Language (NON-NEGOTIABLE)
Everything in this project is written in **English**, with one exception: text rendered to end users
in the frontend UI, which may be Spanish or any other language through i18n.

English applies to:
- Source code identifiers: classes, methods, variables, fields, packages, folders, enums and enum
  values.
- File names of every kind: source, configuration, scripts, migrations, documents and assets.
- Source code comments and documentation comments (Javadoc, JSDoc).
- Database objects: tables, columns, constraints, indexes, views, and the migration files and their contents.
- Configuration keys, environment variable names, API routes, JSON field names and scripts.
- All Markdown documents: READMEs, specs, plans, tasks, checklists and this constitution.
- Git commit messages and pull request descriptions.

Rules:
- Domain terms are translated too (`Athlete`, `Registration`, `Event`, `Payment`).
- Existing Spanish identifiers are not exempt. Rename them when you touch them.
- Exceptions: text the API returns to end users and the frontend displays may stay Spanish or any
  other language. Names fixed by an external system (bank statement headers, WhatsApp Cloud API
  payload fields) keep the external name, with a comment that says so.

### II. Layered architecture with dependencies pointing to the domain
The backend follows Domain / Application / Infrastructure / Api, in the packages under
`com.aespejo.registrations`:

- **Domain** (`domain/`): entities, enums and pure rules (`domain/services/`). No Spring or
  persistence dependencies in the rules.
- **Application** (`application/`): use cases as `*Service` classes grouped by functional area
  (athlete, catalog, registration, payment, marketing, report, security, settings), and the models
  (`*Models`) that carry data in and out of them.
- **Infrastructure** (`infrastructure/`): JPA repositories, external providers (WhatsApp/Meta, image
  processing, file store), rate limiting, security configuration and the wiring of the beans.
- **Api** (`api/`): REST controllers, authentication and authorization, error handling and CORS. Exposes
  only `/api/*`; it serves no frontend.

Dependencies point inward. Application services depend on repositories and domain types, never on
controllers. Business rules live in Application services, not in controllers or repositories.

### III. Data and persistence
- **Java 21** and **Spring Boot 3.5**, built with the Maven wrapper (`mvnw`).
- **Spring Data JPA** (Hibernate) with `ddl-auto: validate`: the schema is owned by the migrations.
- **Flyway** migrations in `src/main/resources/db/migration`: `common/` holds reference data for both
  engines, `sqlite/` and `postgresql/` hold each engine's schema. A migration that has been applied is
  never edited; schema changes go in a new version.
- **SQLite** by default (file database, WAL mode). PostgreSQL is selected with the `postgresql` profile.
- Amounts are **integer cents** (`AmountCents`), never `BigDecimal` or floating point.
- A modality distance is an **integer in meters** (`DistanceMeters`).
- Timestamps are persisted as UTC.
- The age category is computed with the age **on the event day**.
- No engine-specific SQL outside the engine's own migration folder.
- Auditing: changes to auditable entities are recorded as audit records; no use case may bypass them.
- Enums travel as text in JSON.

### IV. Errors and validation
- Expected errors are thrown as exceptions that map to HTTP status codes: not found (404), business
  rule (400), conflict (409) and not authorized (401).
- A global exception handler maps them to problem responses. Any other exception is logged and returns
  a generic 500 without leaking internals.
- Business-rule messages are written so the user can fix their action; the frontend shows them as is.
- Input validation uses Bean Validation annotations (`@NotBlank`, `@Size`, ...) on request records, and
  returns per-field errors. Configuration properties are validated at startup.
- Uploaded files are validated by content, not by declared type (image and document signatures).
- Anonymous endpoints that can be enumerated use rate limiting (athlete search, portal claim).

### V. Authentication, authorization and naming
**Authentication/authorization**
- **Staff/admin**: own JWT issued by `POST /api/auth/login`; passwords hashed with BCrypt (Spring
  Security). The initial admin is created from `INITIAL_ADMIN_PASSWORD` only when no user exists.
- **Athletes**: Auth0 tokens for the athlete portal, through a separate security chain.
- **Roles** (`UserRole`): `Admin`, `Cashier`, `KitStaff`, `ReadOnly`, enforced through the policies
  centralized in `infrastructure/security/Policies` (`administracion`, `caja`, `operacion`, `lectura`).
  Controllers use `@PreAuthorize` with those policy names; no loose strings.
- Secrets (`JWT_SECRET`, `INITIAL_ADMIN_PASSWORD`, WhatsApp tokens, database password) are environment
  variables. They never go in versioned files.
- WhatsApp webhooks verify the signature (`X-Hub-Signature-256`). Signature verification must stay on
  outside tests.

**Naming conventions**
- Controllers: `<Resource>Controller` in `api/<area>`, routes `/api/<lowercase-resource>`.
- Services: `<Capability>Service`; request and response records: `<Capability>Models` or `*Request` / `*Response`.
- Repositories: `<Entity>Repository` extending Spring Data interfaces.
- Tests: `<Class>Test`.
- Packages are lowercase, one package per folder; classes are `PascalCase`.
- Async work uses scheduled jobs (`*Job`) or the dispatcher classes, not ad hoc threads.

### VI. Frontend
Two frontends share the same API contract and the same brand configuration.

**Admin panel** (`src/AEspejo.Registrations.Frontend`)
- **Next.js 15** (App Router) with a **static export** (`output: 'export'`) in production; `next dev`
  renders dynamic routes on demand. **React 19 + TypeScript**, **Tailwind CSS 3**, `class-variance-authority`,
  `clsx`, `tailwind-merge`, `lucide-react`. Alias `@/` maps to `src/`.
- Function components and hooks only. `src/` layout:
  - `app/` routes (Next.js App Router); `features/` screens and their dialogs, one folder per area
  - `components/ui/` reusable components (`primitives`, dialogs, states, form fields, selectors)
  - `auth/` session context and Auth0 integration; `layout/` shell and navigation
  - `api/` client (`client.ts`), `endpoints.ts`, `types.ts`
  - `lib/` utilities, brand configuration and `lib/i18n/` translations
- Component files are `PascalCase.tsx`; hooks are `useXxx.ts`.
- **State**: server data with **TanStack Query**; local state with `useState`; session via Context. No
  Redux or Zustand.
- All HTTP calls go through `api/client.ts`; errors are thrown as typed errors and a 401 ends the
  session. Route guards are a UI aid only: real security is enforced by the API.
- **i18n (NON-NEGOTIABLE)**: every page and component MUST support Spanish (`es`), English (`en`) and
  Portuguese (`pt`) through `i18next` / `react-i18next` (JSON per area in `lib/i18n/locales/`, one file per
  language, registered in `lib/i18n/index.ts`).
  - No user-visible string may be hardcoded in a component: use `t('area.key')` and add the key in all
    three languages in the same change.
  - Every page offers the language selector unless a layout already provides it.
  - Brand names and data coming from the database are not translated.
- Multi-brand: one codebase built per brand (`build:ecotrail`, `build:onesport`) with `.env.<brand>`.
- Client-side form library: none today; native controlled forms plus API validation. Introducing a library
  requires an amendment (**TBD**).

**Landing pages** (`src/AEspejo.Landing.*`)
- Plain HTML, CSS and JavaScript projects built with **Vite**, with no framework.
- They share the event calendar module, `eventos.js`, which lives in the landing that uses it.

### VII. Testing strategy
- **JUnit 5** with the Spring Boot test support. Unit tests cover domain rules and isolated services;
  integration tests start the application context against the SQLite profile and cover routing,
  authentication, role policies and persistence.
- Third-party calls (WhatsApp/Meta) are replaced with test doubles; tests must not make real network calls.
- Any change touching money, registrations, auditing or authorization must include a test.
- Frontend tests: **Vitest + React Testing Library** (adopted, proposed; none configured yet, implemented
  by `specs/005-quality-baseline`). E2E tooling: **TBD**.
- Coverage: collected in CI, with no hard threshold at first; a threshold for Domain/Application is **TBD**.

### VIII. Quality, CI/CD and operations
- Backend: `./mvnw verify` must pass (compile, tests and the format check when it is added).
- Frontend: `npm run build` runs the type check before the build; the linter is **oxlint**
  (`rules-of-hooks` as error).
- Frontend lint, type-check and tests will run in a pull-request workflow (`specs/005-quality-baseline`).
- Logging with SLF4J and structured messages. External observability tooling: **TBD**.
- Per-brand deployment: one API and one static web app per brand. Changing ports, domains, CORS or Auth0
  lists requires updating the README, the Vite configuration and the environment files in the same change.

## Additional Constraints

- SQLite supports a single writing instance; do not scale the API horizontally without changing engine.
- Uploaded files are stored outside static content and served by a controller.
- Shared between brands (athletes, registrations, payments, sizes, configuration); only events and
  campaigns are segmented by brand. Do not widen that filter without an explicit decision.
- The API is not versioned (no `v1` route prefix). Adopted policy: changes must be additive, because the
  landings and the panel are deployed separately and call the API; a breaking change requires an amendment
  introducing versioning.

## Development Workflow

1. New features follow the Spec Kit cycle (specify, plan, tasks, implement), with all artifacts in English.
2. Changes respect the layers: pure rules in Domain, use cases in Application, technical details in
   Infrastructure, HTTP in Api.
3. Schema changes include their Flyway migration, as a new version.
4. PRs must leave build and tests green. Adopted strategy (proposed): short-lived branches named
   `NNN-feature-name` (Spec Kit numbering) merged into `main` through a pull request with at least one
   review; `main` is deployed by the workflows, so it must always be releasable.
5. Specifications live in `specs/NNN-feature-name/` (`spec.md`, `plan.md`, `tasks.md`). Open specs:
   001 bank statement reconciliation, 002 Excel reports export, 003 event-day kit delivery,
   004 historical athlete import, 005 quality baseline.

## Governance

This constitution supersedes other project practices. Amendments must be documented here, justified,
and propagated to affected templates in `.specify/templates/`. Items marked "TBD" must be resolved
through an amendment once decided. Deviations must be justified in the relevant feature plan.
Operational deployment and configuration guidance lives in `README.md`.

**Version**: 2.0.0 | **Ratified**: 2026-10-06 | **Last Amended**: 2026-10-26
