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
- Source code comments and documentation comments (Javadoc, JSDoc, XML docs).
- Database objects: tables, columns, constraints, indexes, sequences, views, functions, and the
  migration files and their contents.
- Configuration keys, environment variable names, API routes, JSON field names and scripts.
- All Markdown documents: READMEs, specs, plans, tasks, checklists and this constitution.
- Git commit messages and pull request descriptions.

Rules:
- Domain terms are translated too (`Athlete`, `Registration`, `Event`, `Payment`). Spanish domain
  names are not kept for continuity.
- Existing Spanish identifiers are not exempt. Rename them when you touch them.
- Exceptions: text the API returns to end users and the frontend displays is user-visible text and
  may stay Spanish. Names fixed by an external system (bank statement headers, WhatsApp Cloud API
  payload fields) keep the external name, with a comment that says so.

This rule supersedes the earlier language principle (2026-10-06), which exempted existing
identifiers.
### II. Layered architecture with dependencies pointing to the domain
The solution follows Domain / Application / Infrastructure / Api (`AEspejo.Inscripciones.slnx`):

- **Domain**: entities (`Entities/`), enums (`Enums/Enumeraciones.cs`), `IAuditable` and pure rules
  (`Services/`: `CalculadoraCategoria`, `Normalizador`, `SimilitudNombres`, `ComparadorMontos`).
  No project references and no NuGet packages.
- **Application**: use cases as `Servicio*` classes grouped by functional area (Atletas, Catalogo,
  Inscripciones, Pagos, Marketing, Reportes, Seguridad, Configuracion), DTOs (`Dtos*.cs`),
  interfaces in `Abstractions/` and exceptions in `Common/`. References only Domain and
  `Microsoft.EntityFrameworkCore`.
- **Infrastructure**: `InscripcionesDbContext`, EF configurations, interceptors, migrations, external
  providers (WhatsApp/Meta, ImageSharp, file store), `HostedService`s and the DI registration in
  `DependencyInjection.AgregarInfraestructura`.
- **Api**: controllers, authentication/authorization, middleware, Swagger, CORS and rate limiting.
  Exposes only `/api/*`; it serves no frontend.

Dependencies point inward. Application queries data through `IInscripcionesDbContext` (LINQ over
`DbSet<>`) and does not depend on the concrete `DbContext`. Services are registered as `Scoped` in
`AgregarInfraestructura`; Application services receive resolved options, not `IOptions<>`.
MediatR, AutoMapper and FluentValidation are not used (not present in the code).

### III. Data and persistence
- **.NET 10** (`net10.0`), `Nullable` and `ImplicitUsings` enabled in every project.
- **EF Core 10.0.10** with **SQLite** (`UseSqlite`), WAL mode by default; `Sqlite:ModoJournal=DELETE`
  when the database is on a network disk (Azure App Service, single instance).
- Migrations in `Infrastructure/Persistence/Migrations`, with `dotnet-ef` pinned in
  `dotnet-tools.json` (10.0.10). The API runs `MigrateAsync` and `SeedDatos` on startup.
- Amounts are **integer cents** (`MontoCentavos`), never `decimal`.
- A modality distance is an **integer in meters**.
- `DateTimeOffset` values are persisted as UTC (`ConversorDateTimeOffsetUtc`).
- The age category is computed with the age **on the event day**.
- No engine-specific SQL (a future move to PostgreSQL is documented in `docs/migracion-postgres.md`).
- Auditing lives in `AuditoriaInterceptor` (SaveChanges) for entities marked `IAuditable`; no use
  case may bypass it.
- Enums travel as text in JSON (`JsonStringEnumConverter`).

### IV. Errors and validation
- Expected errors are thrown as exceptions from `Application/Common/ExcepcionesAplicacion.cs`:
  `NoEncontradoException` (404), `ReglaNegocioException` (400), `ConflictoException` (409),
  `NoAutorizadoException` (401).
- `ManejadorExcepciones` (`IExceptionHandler` + `AddProblemDetails`) maps them to `ProblemDetails`.
  Any other exception is logged and returns a generic 500 without leaking internals.
- Business-rule messages are written so the user can fix their action; the frontend shows them as is.
- Input validation: `[ApiController]` with DataAnnotations (the web client expects per-field
  `errors`) and `ValidateDataAnnotations().ValidateOnStart()` for options (`OpcionesJwt`,
  `OpcionesWhatsApp`). Uploaded files are validated by content, not by declared type
  (`ValidadorImagen`, `ValidadorDocumento`, `ValidadorComprobante`).
- Enumerable anonymous endpoints use rate limiting (`AddRateLimiter`, e.g. athlete search and
  portal claim).

### V. Authentication, authorization and naming
**Authentication/authorization**
- **Staff/admin**: own JWT (default scheme, `OpcionesJwt`, symmetric key, zero `ClockSkew`) issued by
  `POST /api/auth/login`; passwords hashed with BCrypt (`HasheadorPasswordBCrypt`).
- **Athletes**: Auth0 as a second JWT Bearer scheme (`"Auth0"`) and the `AtletaAuth0` policy.
- **Roles** (`RolUsuario`): `Admin`, `Cajero`, `StaffKits`, `SoloLectura`, enforced through the
  policies centralized in `Api/Seguridad/Politicas.cs` (`administracion`, `caja`, `operacion`,
  `lectura`). Controllers use `[Authorize(Policy = Politicas.X)]`; no loose strings.
- Secrets (`Jwt__Clave`, `Seguridad__PasswordAdminInicial`, WhatsApp tokens) stay out of the
  repository: user-secrets locally, App Settings in Azure. The `admin` user is created only if
  `Seguridad:PasswordAdminInicial` is set.
- WhatsApp webhooks verify the signature (`FirmaWebhookMeta`; `Whatsapp:Webhook:ExigirFirma` must be
  `true` outside tests).

**Naming conventions**
- Existing code uses Spanish domain names; technical terms stay English (`Controller`, `Async`, `Dto`).
- Controllers: `<Resource>Controller` in `Api/Controllers`, route `api/<lowercase-resource>`.
- Services: `Servicio<Capability>`; DTOs: `Dtos<Area>.cs` / `...Dto`; interfaces prefixed `I`;
  EF configurations: `<Area>Configurations.cs`; background services: `...HostedService`.
- Async methods end in `Async` with `CancellationToken ct` as the last parameter.
- Namespaces `AEspejo.Inscripciones.<Layer>[.<Area>]`, one namespace per folder (file-scoped).
- Tests: `<Class>Tests.cs`.
- Language of new identifiers: English, keeping existing Spanish domain terms (see Principle I).

### VI. React frontend
- **React 19 + TypeScript 6 + Vite 8** (`type: module`), **React Router 7** (`react-router-dom`),
  **Tailwind CSS 3**, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
  Alias `@/` maps to `src/`. TypeScript uses `verbatimModuleSyntax`, `erasableSyntaxOnly` (no
  constructor parameter properties), `noUnusedLocals` and `noUnusedParameters`.
- Function components and hooks only. `src/` layout:
  - `paginas/` screens, sections (`Seccion*.tsx`) and dialogs (`Dialogo*.tsx`)
  - `components/ui/` reusable components (`primitives`, `dialog`, `estados`, `Campo*`, `Selector*`)
  - `auth/` session context, `RutaProtegida`, Auth0 integration
  - `api/` `cliente.ts` (fetch + `ErrorApi`), `endpoints.ts`, `tipos.ts`
  - `rutas/` layout and navigation; `comun/` and `lib/` utilities; `lib/i18n/` translations.
- Component files are `PascalCase.tsx`; hooks are `useXxx.ts`.
- **State**: server data with **TanStack Query** (`QueryClient` in `main.tsx`: no retry on 4xx,
  30 s `staleTime`, no refetch on window focus); local state with `useState`; session via Context
  (`ProveedorAuth`). No Redux/Zustand.
- All HTTP calls go through `api/cliente.ts`; errors are thrown as `ErrorApi` and a 401 ends the
  session. `RutaProtegida` is a UI aid only: real security is enforced by the API.
- **i18n (NON-NEGOTIABLE)**: every page and component, public or admin, MUST support the three
  languages Spanish (`es`), English (`en`) and Portuguese (`pt`) through `i18next`/`react-i18next`
  (JSON per area in `lib/i18n/locales/`, one file per language, registered in `lib/i18n/index.ts`).
  - No user-visible string may be hardcoded in a component: use `t('area.key')`, and add the key in
    all three languages in the same change. A page that only works in one language is not done.
  - Every page offers the language selector (`SelectorIdioma`) unless it is embedded in a layout
    that already provides it.
  - Brand names (e.g. "Money Sport") and data coming from the database are not translated.
  - Existing hardcoded Spanish strings (e.g. `RutaProtegida`) are legacy: translate them when the
    file is touched.
- Multi-brand frontend: one codebase built per brand (`build:ecotrail`, `build:onesport`) with
  `.env.<brand>`; the landings (`AEspejo.Landing.*`) are plain HTML/CSS/JS Vite projects sharing only
  `src/landings-comun/eventos.js`.
- Client-side form/validation library: none today; keep native controlled forms and rely on API
  validation. Introducing a library requires an amendment (**TBD**).

### VII. Testing strategy
- **xUnit 2.9.3** + `coverlet.collector` in both test projects.
- `tests/AEspejo.Inscripciones.UnitTests`: domain rules and isolated services.
- `tests/AEspejo.Inscripciones.IntegrationTests`: `WebApplicationFactory<Program>` (`FabricaApi`)
  against in-memory SQLite with the real interceptors, `Testing` environment; covers routing,
  authentication, role policies and persistence. Third-party calls (Meta template catalog) are
  replaced with test doubles; tests must not make real network calls.
- No mocking library is used (hand-written doubles).
- Any change touching money, registrations, auditing or authorization must include an integration test.
- Frontend tests: **Vitest + React Testing Library** (adopted, proposed; none configured yet,
  implemented by `specs/005-quality-baseline`). E2E tooling: **TBD**.
- Coverage: collected with coverlet and Vitest and published in CI, with no hard threshold at first;
  a threshold for Domain/Application is **TBD** (`specs/005-quality-baseline`).

### VIII. Quality, CI/CD and operations
- Backend: `dotnet restore`, `dotnet build -c Release` and `dotnet test` must pass. The API
  workflows (`deploy-ecotrailapi.yml`, `deploy-onesportapi.yml`) build and test before publishing to
  Azure App Service from `main`.
- Frontend: `npm run build` runs `tsc -b` before `vite build`; linter is **oxlint**
  (`rules-of-hooks` as error). The `deploy-*web.yml` workflows deploy to Azure Static Web Apps.
  Frontend lint, type-check and tests will run in a pull-request workflow (`pr-checks.yml`,
  `specs/005-quality-baseline`); the deploy workflows are not verified to run them.
- `.editorconfig`, extra Roslyn analyzers, `Directory.Build.props` and git hooks do **not exist yet**.
  Adopted direction: `.editorconfig` + `dotnet format --verify-no-changes` + `EnforceCodeStyleInBuild`
  in CI (to be implemented by `specs/005-quality-baseline`).
- Comments explain the *why* of non-obvious decisions, with `///` on relevant public types/members,
  written in English (Principle I).
- Logging with `ILogger<T>` and structured templates. External observability tooling (e.g. Application Insights): **TBD**, pending owner decision.
- Per-brand deployment: one Api and one Static Web App per brand (`Marca:CodigoFijo`); changing ports,
  domains, CORS or Auth0 lists requires updating the README, `vite.config.ts`, `launchSettings.json`
  and configuration in the same change.

## Additional Constraints

- SQLite supports a single writing instance; do not scale the API horizontally without changing engine.
- Uploaded files are stored outside static content (`Archivos:RutaBase`) and served by a controller.
- Shared between brands (athletes, registrations, payments, sizes, configuration); only `Evento` and
  `Campania` are segmented by `MarcaId`. Do not widen that filter without an explicit decision.
- The API is not versioned (no `v1` route prefix). Adopted policy: changes must be additive, because
  the landings and the SPA are deployed separately and call the API; a breaking change requires an
  amendment introducing versioning.

## Development Workflow

1. New features follow the Spec Kit cycle (specify, plan, tasks, implement), with all artifacts in English.
2. Changes respect the layers: pure rules in Domain, use cases in Application, technical details in
   Infrastructure, HTTP in Api.
3. Schema changes include their EF migration.
4. PRs must leave build and tests green. Adopted strategy (proposed): short-lived branches named
   `NNN-feature-name` (Spec Kit numbering) merged into `main` through a pull request with at least
   one review; `main` is deployed by the workflows, so it must always be releasable.
5. Specifications live in `specs/NNN-feature-name/` (`spec.md`, `plan.md`, `tasks.md`). Open specs:
   001 bank statement reconciliation, 002 Excel reports export, 003 event-day kit delivery,
   004 historical athlete import, 005 quality baseline.

## Governance

This constitution supersedes other project practices. Amendments must be documented here, justified,
and propagated to affected templates in `.specify/templates/`. Items marked "TBD" must be resolved
through an amendment once decided. Deviations must be justified in the relevant feature plan.
Operational deployment/configuration guidance lives in `README.md`.

**Version**: 1.3.0 | **Ratified**: 2026-10-06 | **Last Amended**: 2026-10-07
