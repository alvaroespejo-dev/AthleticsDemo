# Implementation Plan: Backend API

**Branch**: `007-backend-api` | **Spec**: [spec.md](spec.md)

## 1. Stack and layout

| Item | Value |
| --- | --- |
| Folder | `src/AEspejo.Registrations.Backend` |
| Language | Java 21 / Spring Boot 3.5 |
| Persistence | JPA / Hibernate, SQLite (default) or PostgreSQL (profile `postgresql`), Flyway |
| Layers | `domain`, `application`, `infrastructure`, `api` (package root `com.aespejo.registrations`) |
| Tests | JUnit 5, `spring-boot-starter-test` |
| Front end | `src/AEspejo.Registrations.Frontend` (Next.js), calling the API with the routes in section 4 |

```text
com.aespejo.registrations
  api/             controllers and request/response mapping
  application/     use cases (PaymentService, RegistrationService, ...)
  domain/entities  JPA entities
  domain/enums     enums with stored numeric values
  domain/services  pure rules (AmountComparator, NameSimilarity, DataNormalizer)
  infrastructure/  repositories, security, file store, WhatsApp providers, rate limiting
  common/          shared exceptions and i18n
```

## 2. Naming

Domain terms: `Event`, `Registration`, `Athlete`, `Modality`, `Kit`, `KitItem`, `Size`, `PriceTier`,
`AgeCategory`, `Payment`, `KitDelivery`, `StatementImportBatch`, `StatementMovement`, `AthleteImportBatch`,
`AthleteImportRow`, `ModalityEquivalence`, `AthleteAccount`, `AuditRecord`, `User`.

Services keep the responsibility of their name:

| Class | Responsibility |
|---|---|
| `PaymentService` | Register, update and revert payments; registration status and notes |
| `RegistrationService` | Registrant list and filters, bib, cancel, reactivate, result |
| `MasterReportService` | Master report of an event (JSON) |
| `AmountComparator` | Compare a payment with the amount due (pure) |
| `NameSimilarity` | Name similarity (pure) |
| `DataNormalizer` | Normalization of text and phone data (pure) |
| `AgeCategoryResolver` | Age category from the age on the event day (pure) |
| `DocumentValidator` | Document number validation by type |

Enums keep their stored numbers, so a copied database keeps its meaning:

| Enum | Values |
|---|---|
| `RegistrationStatus` | Draft, Pending, Paid, UnderReview, Expired, Cancelled, Refunded |
| `EventStatus` | Draft, Published, Closed, Finished, Cancelled |
| `Sex` | Female, Male |
| `GarmentType` | TShirt, Singlet |
| `DocumentType` | Ci, Dni, Passport, ForeignerId, Rut, Cpf, Other |
| `UserRole` | Admin, Cashier, KitStaff, ReadOnly |
| `PaymentSource` | Statement, Receipt, Manual, Webhook |
| `ReconciliationRule` | None, TransactionNumber, AmountAndPayer, Manual |
| `ReconciliationStatus` | Pending, AutoReconciled, Suggested, ManuallyReconciled, Discarded |
| `ImportRowResult` | Accepted, Corrected, InReview, Duplicate, Rejected |
| `OptInSource` | Form, Imported, Manual |

## 3. Database

- Tables and columns are English and PascalCase (`Payments`, `Registrations`, `StatementMovements`). The Flyway
  migrations follow this convention; do not mix styles.
- Indexes and constraints use the `IX_<Table>_<Column>` and `UQ_<Table>_<Column>` pattern.
- Money is stored as integer cents (`*Cents`). Dates are UTC.
- Applied migrations are never edited. A schema change is a new migration.

## 4. API routes used by the panel

| Panel call | API route |
|---|---|
| `POST /auth/login` | `POST /api/auth/login` |
| `GET /auth/me` | `GET /api/auth/me` |
| `POST /auth/change-password` | `POST /api/auth/change-password` |
| `GET /brands` | `GET /api/brands` |
| `GET/POST /events` | `GET/POST /api/events` |
| `GET/PUT/DELETE /events/{id}` | `GET/PUT/DELETE /api/events/{id}` |
| `POST /events/{id}/publish` | `POST /api/events/{id}/publish` |
| `POST /events/{id}/status` | `POST /api/events/{id}/status` |
| `POST /events/{id}/recalculate-age-categories` | `POST /api/events/{id}/recalculate-age-categories` |
| `/events/{id}/age-categories` | `/api/events/{id}/age-categories` |
| `/age-categories/{id}` | `/api/age-categories/{id}` |
| `/events/{id}/modalities` | `/api/events/{id}/modalities` |
| `/modalities/{id}` | `/api/modalities/{id}` |
| `/modalities/{id}/kits`, `/kits/{id}` | `/api/modalities/{id}/kits`, `/api/kits/{id}` |
| `/modalities/{id}/price-tiers`, `/price-tiers/{id}` | `/api/modalities/{id}/price-tiers`, `/api/price-tiers/{id}` |
| `/sizes` | `/api/sizes` |
| `/kit-items` | `/api/kit-items` |
| `/age-category-templates` | `/api/age-category-templates` |
| `GET /events/{eventId}/registrations` | `GET /api/events/{eventId}/registrations` |
| `GET /registrations/{id}` | `GET /api/registrations/{id}` |
| `PUT /registrations/{id}/bib` | `PUT /api/registrations/{id}/bib` |
| `POST /registrations/{id}/cancel` | `POST /api/registrations/{id}/cancel` |
| `POST /registrations/{id}/reactivate` | `POST /api/registrations/{id}/reactivate` |
| `PUT /registrations/{id}/result` | `PUT /api/registrations/{id}/result` |
| `POST /registrations/{id}/payments` | `POST /api/registrations/{id}/payments` |
| `POST /payments/{id}/revert` | `POST /api/payments/{id}/revert` |
| `PUT /payments/{id}` | `PUT /api/payments/{id}` |
| `GET /public/events/{slug}` | `GET /api/public/events/{slug}` |
| `POST /public/events/{slug}/registrations` | `POST /api/public/events/{slug}/registrations` |

## 5. Messages

Each business message is an English key of the form `area.item.reason` (for example
`payment.transactionNumber.duplicate`). The backend resolves each key through `messages_es.properties`,
`messages_en.properties` and `messages_pt.properties`, using the user's preferred language or the
`Accept-Language` header.

Payment messages (Spanish text shown; English and Portuguese are in the bundles):

- `payment.transactionNumber.duplicate`: `El número de transacción '{numero}' ya está registrado en otra inscripción. Verifique que no se esté cargando dos veces el mismo depósito.`
- `payment.registration.expired`: `La inscripción está expirada y no admite pagos. Reactívela primero: al vencer liberó su cupo y hay que comprobar que la modalidad todavía tenga lugar.`
- `payment.registration.closed`: `La inscripción está {estado} y no admite pagos.`
- `payment.revert.reasonRequired`: `Indique el motivo de la reversión.`
- `payment.revert.hasResult`: `La inscripción ya tiene un resultado registrado. Quite primero el resultado antes de revertir el pago.`
- `payment.revert.kitDelivered`: `El kit ya fue entregado. No se puede revertir el pago de una inscripción cuyo kit fue entregado.`
- `payment.revert.reconciled`: `El pago está conciliado con un extracto bancario. Desconcílelo primero en el módulo de tesorería.`
- `payment.result.paid`: `Pago registrado. La inscripción quedó pagada.`
- `payment.result.paidWithSurplus`: `Pago registrado. La inscripción quedó pagada con {monto} a favor.`
- `payment.result.underReview`: `Pago registrado, pero faltan {monto}. La inscripción quedó observada.`
- `payment.revert.pending`: `Se revirtió el pago. La inscripción volvió a quedar pendiente.`
- `payment.update.ok`: `Pago actualizado correctamente.`
- `payment.notFound`: `el pago` (the panel shows this text in its not-found message)

## 6. Payment rules

- An exact payment replaces the registration notes with the manual note from the request.
- An overpayment adds the note `Se pagó {x} de más. Queda como saldo a favor.` and records the surplus.
- A shortfall adds the note `Pago incompleto: faltan {x}.`
- A revert records the date in the format `dd/MM/yyyy HH:mm`, and adds the automatic status note when a balance
  remains.
- An update without an amount change still updates the observations sent in the request.
- Amounts in messages use the `N2` format with a thousands separator.
- The surplus is recalculated on every update.

## 7. Demo status of the features in scope

Read from the Java controllers and services; the features marked *JUnit pending* work but have no unit tests yet.

| Feature | Status | Remaining work |
|---|---|---|
| Login, session, change password | Present | none |
| Events: list, detail, create, update, publish, status, delete | Present | event image upload and delete, runner manual |
| Modalities, kits, kit items, price tiers, sizes, brands, age categories and templates | Present | QR per price tier and kit (present), age category standard generation check |
| Registrations: list, detail, bib, cancel, reactivate, result, bulk result | Present | receipt download and upload, public QR by code |
| Payments: register, update, revert | Present, covered by the rules in section 6 | JUnit tests |
| Public registration form, public event, public sizes | Present | public event list, public organization |
| Athletes: list, detail, update, linked accounts, unlink | Present | JUnit tests |
| Registrant list: filters, sort, summary, paging | Present | registrant detail to the English contract |
| Money Sport lookup and balance | Present; search rate-limited | JUnit tests |
| Athlete portal (Auth0 token chain, account, profile, claim with lock after 5 failures) | Present | end-to-end test with a real Auth0 login |
| Public athlete lookup | Present | JUnit tests |
| Uploads: event cover, runner manual, kit photo, QR codes, receipts | Present; validation by file signature | WebP cover or kit photo is refused (the JDK codecs cannot resize WebP) |
| Marketing: audience and segments | Present | campaign-only panel fields |
| Marketing: campaigns, WhatsApp templates, inbox, webhook | Present; `meta` and `simulated` senders | not verified against the real Meta API (no credentials); unit tests |
| Rate limits | Present (single instance) | none |
| Master report (JSON) | Present | JUnit tests |
| Settings, suggested waiver, public organization | Present | generic QR upload and download, JUnit tests |
| Roles per endpoint | Applied through the policies in `Policies` | none |
| Per-event service fee (spec 006) | Present | verify the 9 completed tasks |

## 8. Test strategy

- Unit tests (JUnit 5) for the domain rules and isolated services.
- Integration tests start the application against the SQLite profile, covering routing, authentication, role
  policies and persistence.
- `./mvnw verify` must pass before a feature is marked complete. A PostgreSQL run is required before a release.
- Third-party calls (WhatsApp, Auth0) are replaced with test doubles; tests make no network calls.
