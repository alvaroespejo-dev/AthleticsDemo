# AEspejo.Registrations

Registration system for sports events: event and modality catalog, public registration form,
reconcilable payments, reports, and a reusable athlete base across editions for WhatsApp campaigns.

The backend is a REST API written in **Java 21 + Spring Boot 3.5** on **SQLite** by default, with **PostgreSQL** as an option by configuration. It is a new
implementation and does not reuse any earlier backend.

## Language

Everything in this repository is in English: classes, methods, folders, file names, enums, comments,
tables, columns, configuration keys, API routes, Markdown documents and commit messages. The only
exception is text shown to end users in the frontend UI, which may be Spanish or any other language
through i18n. The full rule and its exceptions are in [`CLAUDE.md`](CLAUDE.md) and
`.specify/memory/constitution.md` (Principle I). Canonical names are in [`docs/glossary.md`](docs/glossary.md).

## Structure

| Folder | Contents |
|---|---|
| `src/AEspejo.Registrations.Backend` | REST API (Spring Boot, JPA, Flyway) |
| `src/AEspejo.Registrations.Frontend` | Admin panel (Next.js), consumes the API |
| `src/AEspejo.Landing.AthleticsDemo` | Public landing page (Vite) |
| `deploy/` | Docker Compose file for PostgreSQL |
| `docs/` | Project documentation and glossary |
| `specs/` | Feature specifications (spec, plan, tasks) |

## Requirements

- JDK 21
- Node.js 22+
- Nothing else for SQLite. PostgreSQL 17 or 18 only for the `postgresql` profile

## Database

The backend uses **SQLite by default**: the database is the file `App_Data/registrations.db`, created on the first start,
with no installation needed. To use **PostgreSQL** instead, start the backend with the `postgresql` profile:

```bash
SPRING_PROFILES_ACTIVE=postgresql DB_URL=jdbc:postgresql://localhost:5432/registrations DB_USER=registrations DB_PASSWORD=... ./mvnw spring-boot:run
```

The Windows development machine does not use Docker: Docker Desktop fails to start with
"Virtualization support not detected". PostgreSQL 18 runs as a local Windows service on port 5432. On a machine
where Docker works, the Compose file in `deploy/` starts PostgreSQL:

```bash
cd deploy
# Create a .env file next to the compose file with POSTGRES_PASSWORD=...
docker compose -f docker-compose.postgres.yml up -d
```

Flyway applies the migrations of the selected database: `db/migration/sqlite` or `db/migration/postgresql`, plus the
shared reference data in `db/migration/common` (the two brands).

## Backend

Environment variables read by `application.yml`:

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | empty (SQLite) | Set to `postgresql` to use PostgreSQL |
| `DB_URL` | `jdbc:sqlite:App_Data/registrations.db` | Database URL. With the `postgresql` profile, use `jdbc:postgresql://…` |
| `DB_USER` | empty | Database user (PostgreSQL profile only) |
| `DB_PASSWORD` | empty | Database password |
| `JWT_SECRET` | empty | Secret used to sign tokens |
| `INITIAL_ADMIN_PASSWORD` | empty | Password of the initial administrator |
| `WHATSAPP_PROVIDER` | `simulated` | `meta` sends through the WhatsApp Cloud API; `simulated` only logs the send |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | empty | WhatsApp Business account id (default for every brand) |
| `WHATSAPP_PHONE_NUMBER_ID` | empty | Sending number id (default for every brand) |
| `WHATSAPP_TOKEN` | empty | Access token of the Meta app |
| `WHATSAPP_BRANDS_<CODE>_PHONE_NUMBER_ID` | empty | Per-brand override, for example `WHATSAPP_BRANDS_ECOTRAIL_PHONE_NUMBER_ID`. The same pattern applies to `_TOKEN`, `_BUSINESS_ACCOUNT_ID`, `_PROVIDER` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | empty | Token of the webhook handshake configured in Meta |
| `WHATSAPP_WEBHOOK_APP_SECRET` | empty | App secret used to verify the `X-Hub-Signature-256` signature of webhook calls |
| `CORS_ORIGINS` | empty | Comma-separated origins allowed to call the API from a browser, for example the landing pages in development: `https://localhost:5173,https://localhost:5174` |

```bash
cd src/AEspejo.Registrations.Backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

The API listens on `http://localhost:5183`. OpenAPI documentation is provided by springdoc.

Compile and run the tests:

```bash
./mvnw verify
```

## Admin panel

```bash
cd src/AEspejo.Registrations.Frontend
npm install
npm run dev
```

The panel runs on `http://localhost:5173` and forwards `/api/*` to the backend on port 5183.
Per-brand builds: `npm run build:ecotrail` and `npm run build:onesport`.

## Landing page

```bash
cd src/AEspejo.Landing.AthleticsDemo
npm install
npm run dev
```

The event calendar is loaded from `src/AEspejo.Landing.AthleticsDemo/landing/eventos.js`.

## Migration status

- Backend: 30 JPA entities and the enum converters are implemented. Schema validation against
  the selected database (`ddl-auto: validate`) is checked at startup.
- Feature status and requirements are described in `specs/`.
