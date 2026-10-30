# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## Project

AEspejo.Inscripciones: registration system for sports events. The backend is a new Java 21 +
Spring Boot 3.5 REST API backed by SQLite (default) or PostgreSQL (profile `postgresql`). It does not reuse the earlier .NET backend, and no
code, comments, documents or names should refer to it.

Folders:

- `src/AEspejo.Inscripciones.Backend`: Java REST API (Maven, Flyway, JPA).
- `src/AEspejo.Inscripciones.Web`: React admin panel that consumes the API.
- `src/AEspejo.Landing.EcoTrail`: public landing page.
- `src/landings-comun`: code shared by the landings.
- `deploy/`: Docker Compose for PostgreSQL.
- `specs/`: feature specifications (spec, plan, tasks).
- `.specify/`: spec-kit templates and the project constitution.

## Language rule (mandatory)

Everything in this project is written in **English**, with one exception: text rendered to end
users in the frontend UI, which may be Spanish or any other language through i18n.

English applies to:

- Source code identifiers: classes, methods, variables, fields, packages, folders, enums and enum
  values.
- File names of every kind: source, configuration, scripts, migrations, documents and assets.
- Source code comments and documentation comments (Javadoc, JSDoc, XML docs).
- Database objects: tables, columns, constraints, indexes, sequences, views, functions, and the
  migration files and their contents.
- Configuration keys, environment variable names, API routes, JSON field names and scripts.
- All Markdown documents: READMEs, specs, plans, tasks, checklists and this file.
- Git commit messages and pull request descriptions.

Domain terms are translated too: use `Athlete`, `Registration`, `Event`, `Payment`, not `Atleta`,
`Inscripcion`, `Evento`, `Pago`.

Exceptions:

- Text that the API returns to end users and the frontend displays is user-visible text and may
  stay Spanish.
- Names fixed by an external system keep the external name, and a comment says so. Examples: bank
  statement column headers, WhatsApp Cloud API payload fields.

Existing Spanish identifiers are not exempt. Rename them when you touch them.

## Backend commands

```bash
cd src/AEspejo.Inscripciones.Backend
./mvnw spring-boot:run       # Windows: mvnw.cmd spring-boot:run
./mvnw verify
```

Configuration comes from environment variables read in `application.yml`: `DB_URL`, `DB_USER`,
`DB_PASSWORD`, `JWT_SECRET`, `INITIAL_ADMIN_PASSWORD`. Flyway runs the migrations in
`src/main/resources/db/migration` at startup, and Hibernate validates the entities against the
schema (`ddl-auto: validate`).

## Working agreements

- Do not commit or push unless asked.
- Do not write secrets into files. Pass them as environment variables.
- Do not use Docker on the development machine: Docker Desktop fails with "Virtualization support
  not detected". Use SQLite (default) or the local PostgreSQL 18 service with SPRING_PROFILES_ACTIVE=postgresql.
- Verify changes: compile with `./mvnw compile`, and start the backend against a database when you
  touch entities or migrations.
