# Implementation Plan: Java Backend Port of the C# Reference Implementation

**Branch**: `007-java-backend-port` | **Spec**: [spec.md](spec.md)

## 1. Source and target

| Item | Reference (C#) | Target (Java) |
|---|---|---|
| Folder | `AEspejo.InscripcionesBackupCSharp/src` | `src/AEspejo.Inscripciones.Backend` |
| Language | C# / .NET | Java 21 / Spring Boot 3.5 |
| Persistence | EF Core, SQLite (dev) | JPA / Hibernate, PostgreSQL, Flyway |
| Layers | `Domain`, `Application`, `Infrastructure`, `Api` | `domain`, `application`, `infrastructure`, `api` (package root `com.aespejo.registrations`) |
| Tests | xUnit, `IntegrationTests`, `UnitTests` (35 files) | JUnit 5, `spring-boot-starter-test` |
| Front end | `AEspejo.InscripcionesBackupCSharp/src/AEspejo.Inscripciones.Web` | `src/AEspejo.Inscripciones.Web` (copy of the reference, English route segments in the API calls) |

Porting is done class by class: each C# class maps to one Java class with the same responsibility, and the
method names are translated to English with the same meaning.

## 2. Naming map (C# to English Java)

Domain terms:

| C# (reference) | Java (target) |
|---|---|
| `Evento` | `Event` |
| `Inscripcion` | `Registration` |
| `Atleta` | `Athlete` |
| `Modalidad` | `Modality` |
| `Kit`, `ItemKit`, `Talla` | `Kit`, `KitItem`, `Size` |
| `TramoPrecio` | `PriceTier` |
| `CategoriaEdad` | `AgeCategory` |
| `Pago` | `Payment` |
| `EntregaKit` | `KitDelivery` |
| `LoteImportacionExtracto` | `StatementImportBatch` |
| `MovimientoExtracto` | `StatementMovement` |
| `LoteImportacionAtletas` | `AthleteImportBatch` |
| `FilaImportacionAtleta` | `AthleteImportRow` |
| `EquivalenciaModalidad` | `ModalityEquivalence` |
| `CuentaAtleta` | `AthleteAccount` |
| `RegistroAuditoria` | `AuditRecord` |
| `Usuario` | `User` |

Services and helpers (the Java class keeps the responsibility of the C# class):

| C# | Java |
|---|---|
| `ServicioPagos` | `application.payment.PaymentService` |
| `ServicioAdminInscripciones` | `application.registration.RegistrationService` (list and filters) |
| `ServicioReportes` | `application.report.MasterReportService` (to create) |
| `ComparadorMontos` | `domain.services.AmountComparator` (to create, pure) |
| `SimilitudNombres` | `domain.services.NameSimilarity` (to create, pure) |
| `Normalizador` | `domain.services.DataNormalizer` (exists) |
| `ValidadorDocumento` | `domain.services.DocumentValidator` (to create) |
| `CalculadoraCategoria` | `domain.services.AgeCategoryResolver` (exists) |
| `IRelojSistema` | `java.time.Clock` injected as a bean |
| `IUsuarioActual` | Spring Security principal |
| `NoEncontradoException` | `common.exception.NotFoundException` (exists) |
| `ConflictoException` | `common.exception.ConflictException` (exists) |
| `ReglaNegocioException` | `common.exception.BusinessRuleException` (exists) |

Enums (C# value numbers are kept, so stored data and comparisons stay the same):

| C# enum | Java enum (exists) | Values (C# to Java) |
|---|---|---|
| `EstadoInscripcion` | `RegistrationStatus` | `Borrador`=Draft, `Pendiente`=Pending, `Pagada`=Paid, `Observada`=UnderReview, `Expirada`=Expired, `Anulada`=Cancelled, `Reembolsada`=Refunded |
| `EstadoEvento` | `EventStatus` | `Borrador`=Draft, `Publicado`=Published, `Cerrado`=Closed, `Finalizado`=Finished, `Cancelado`=Cancelled |
| `Sexo` | `Sex` | `Femenino`=Female, `Masculino`=Male |
| `TipoPrenda` | `GarmentType` | `Polera`=Shirt, `Malla`=Swimsuit |
| `TipoDocumento` | `DocumentType` | `Ci`, `Dni`, `Pasaporte`=Passport, `CarneExtranjeria`=ForeignIdCard, `Rut`, `Cpf`, `Otro`=Other |
| `RolUsuario` | `UserRole` | `Admin`, `Cajero`=Cashier, `StaffKits`=KitStaff, `SoloLectura`=ReadOnly |
| `OrigenPago` | `PaymentSource` | `Extracto`=Statement, `Comprobante`=Receipt, `Manual`, `Webhook` |
| `ReglaConciliacion` | `ReconciliationRule` | `Ninguna`=None, `NumeroTransaccion`=TransactionNumber, `MontoYOrdenante`=AmountAndPayer, `Manual` |
| `EstadoConciliacion` | `ReconciliationStatus` | `Pendiente`=Pending, `ConciliadoAutomatico`=AutoReconciled, `ConciliadoSugerido`=Suggested, `ConciliadoManual`=ManuallyReconciled, `Descartado`=Discarded |
| `ResultadoFilaImportacion` | `ImportRowResult` | `Aceptada`=Accepted, `Corregida`=Corrected, `EnRevision`=InReview, `Duplicada`=Duplicate, `Rechazada`=Rejected |
| `OrigenOptIn` | `OptInSource` | `Formulario`=Form, `Importado`=Imported, `Manual` |

Rule: the enum value numbers in Java are the same as in C#, so a database copied from the C# system keeps its
meaning. Java enum names are English; the numbers are not changed.

## 3. Database naming

- Tables and columns are English, PascalCase as in the existing `V1__initial_schema.sql`
  (`Payments`, `Registrations`, `StatementMovements`). Keep the existing convention; do not mix styles.
- Column names from C# Spanish properties are translated: `MontoCentavos` becomes `AmountCents`,
  `FechaAcreditacion` becomes `CreditedAt`, `NumeroTransaccion` becomes `TransactionNumber`.
  The existing migration already uses these English names; new migrations must follow them.
- Indexes and constraints use the `IX_<Table>_<Column>` and `UQ_<Table>_<Column>` pattern.
- Money is stored as integer cents (`*_cents`). Dates are UTC `timestamptz`.

## 4. React panel: same project, Java backend

Decision (approved): no adapter. The panel calls the Java backend directly, so the English routes are written
into the calls.

Steps:

1. `src/AEspejo.Inscripciones.Web` is overwritten with the C# reference panel (done; both trees were verified
   identical before the change, and the previous copy was saved outside the repository).
2. `src/api/endpoints.ts`: the route segments of each call are renamed to the English routes in the table
   below (done for all route segments; `tsc -p tsconfig.app.json` passes).
3. `src/api/cliente.ts`: `BASE` keeps reading `VITE_API_URL`. Pointing it at the Java server is a
   configuration change only (`.env.*`).
4. Not renamed in this stage (final English pass): function names (`revertir`, `responder`), query parameter
   names sent through `aQuery` (`numeroDocumento`, `soloActivos`, `pagina`, `tamano`, `estado`,
   `incluirFinalizados`, `marca`, `refrescar`, `archivar`), request body keys (`motivo`, `cuerpo` fields), JSON
   response fields in `tipos.ts`, and i18n keys. The Java controllers must bind the query parameter names
   listed here until that pass renames them.

Route mapping for endpoints that exist in both backends:

| Panel call (C# route) | Java route |
|---|---|
| `POST /auth/login` | `POST /api/auth/login` |
| `GET /auth/yo` | `GET /api/auth/me` |
| `POST /auth/cambiar-password` | `POST /api/auth/change-password` |
| `GET /marcas` | `GET /api/brands` |
| `GET/POST /eventos` | `GET/POST /api/events` |
| `GET/PUT/DELETE /eventos/{id}` | `GET/PUT/DELETE /api/events/{id}` |
| `POST /eventos/{id}/publicar` | `POST /api/events/{id}/publish` |
| `POST /eventos/{id}/estado` | `POST /api/events/{id}/status` |
| `POST /eventos/{id}/recalcular-categorias` | `POST /api/events/{id}/recalculate-age-categories` |
| `/eventos/{id}/categorias` | `/api/events/{id}/age-categories` |
| `/categorias/{id}` | `/api/age-categories/{id}` |
| `/eventos/{id}/modalidades` | `/api/events/{id}/modalities` |
| `/modalidades/{id}` | `/api/modalities/{id}` |
| `/modalidades/{id}/kits`, `/kits/{id}` | `/api/modalities/{id}/kits`, `/api/kits/{id}` |
| `/modalidades/{id}/tramos`, `/tramos/{id}` | `/api/modalities/{id}/price-tiers`, `/api/price-tiers/{id}` |
| `/tallas` | `/api/sizes` |
| `/items-kit` | `/api/kit-items` |
| `/plantillas-categorias` | `/api/age-category-templates` |
| `GET /eventos/{eventoId}/inscritos` | `GET /api/events/{eventId}/registrations` |
| `GET /inscritos/{id}` | `GET /api/registrations/{id}` |
| `PUT /inscritos/{id}/dorsal` | `PUT /api/registrations/{id}/bib` |
| `POST /inscritos/{id}/anular` | `POST /api/registrations/{id}/cancel` |
| `POST /inscritos/{id}/reactivar` | `POST /api/registrations/{id}/reactivate` |
| `PUT /inscritos/{id}/resultado` | `PUT /api/registrations/{id}/result` |
| `POST /inscritos/{id}/pagos` | `POST /api/registrations/{id}/payments` |
| `POST /pagos/{id}/revertir` | `POST /api/payments/{id}/revert` |
| `PUT /pagos/{id}` | `PUT /api/payments/{id}` |
| `GET /publico/eventos/{slug}` | `GET /api/public/events/{slug}` |
| `POST /publico/eventos/{slug}/inscripciones` | `POST /api/public/events/{slug}/registrations` |

Endpoints the panel calls that Java does not have yet (must be ported before the panel works fully):
athletes (`/atletas`), athlete portal (`/portal-atleta`), WhatsApp inbox (`/marketing/bandeja`), audience,
segments and campaigns (`/marketing`), money sport (`/publico/moneysport`), configuration
(`/configuracion`), registration proof upload (`/comprobante`), event image, manual runner (`/manual-corredor`),
generic payment QR, and the master report (`/reportes`).

## 5. Java package structure

Follow the existing structure. New code goes in the matching package:

```text
com.aespejo.registrations
  api/             controllers and request/response mapping
  application/     use cases (PaymentService, RegistrationService, ...)
  domain/entities  JPA entities
  domain/enums     enums with stored numeric values
  domain/services  pure rules (AmountComparator, NameSimilarity, DataNormalizer)
  infrastructure/  repositories, security, configuration
  common/exception shared exceptions
```

## 6. Message keys and the Spanish wording the panel keeps

Each business message is an English key of the form `area.item.reason`, for example
`payment.transactionNumber.duplicate`, defined as a constant in one class with an English comment that names the
C# source. The backend resolves each key through the resource bundles `messages_es.properties`,
`messages_en.properties` and `messages_pt.properties`. The Spanish text below is copied from `ServicioPagos.cs`,
so the user sees the same Spanish as today. The English and Portuguese texts are written in this feature.

Spanish wording and key (key first):

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

- `El número de transacción '{numero}' ya está registrado en otra inscripción. Verifique que no se esté cargando dos veces el mismo depósito.`
- `La inscripción está expirada y no admite pagos. Reactívela primero: al vencer liberó su cupo y hay que comprobar que la modalidad todavía tenga lugar.`
- `La inscripción está {estado} y no admite pagos.`
- `Indique el motivo de la reversión.`
- `La inscripción ya tiene un resultado registrado. Quite primero el resultado antes de revertir el pago.`
- `El kit ya fue entregado. No se puede revertir el pago de una inscripción cuyo kit fue entregado.`
- `El pago está conciliado con un extracto bancario. Desconcílelo primero en el módulo de tesorería.`
- Payment result messages: `Pago registrado. La inscripción quedó pagada.`, `... pagada con {monto} a favor.`,
  `Pago registrado, pero faltan {monto}. La inscripción quedó observada.`, `Se revirtió el pago. La inscripción volvió a quedar pendiente.`, `Pago actualizado correctamente.`

Any other message in the reference that is not in this list is translated to English.

## 7. Known differences in the current Java `PaymentService` (to fix)

Status: all 10 items approved by the product owner.

Compared line by line with `ServicioPagos.cs`:

| # | Behaviour | C# (reference) | Java (current) | Fix |
|---|---|---|---|---|
| 1 | Note on exact payment | Replaces `Observaciones` with the manual note | Appends to notes | Replace, as C# does |
| 2 | Note on overpayment | Adds `Se pagó {x} de más. Queda como saldo a favor.` | Not added | Add the note |
| 3 | Note on shortfall | Adds `Pago incompleto: faltan {x}.` | Not added | Add the note |
| 4 | Note date format on revert | `dd/MM/yyyy HH:mm` | `yyyy-MM-dd` | Use C# format |
| 5 | Revert with remaining balance | Adds the automatic status note | Not added | Add the note |
| 6 | Update without amount change | Updates observations from the request | Does not touch notes | Add observations to update request |
| 7 | Amount text | `N2` format with thousands separator | `%.2f`, no separator | Match C# format (Locale rules) |
| 8 | Typo in message | `Desconcílelo` | `Desconíliello` | Key `payment.revert.reconciled`; panel wording from section 6 |
| 9 | Not-found message | Spanish text, e.g. `el pago` | English text `the payment` | Key `payment.notFound`; panel shows `el pago` |
| 10 | Excess stored on update | `ExcedenteCentavos` recalculated | Recalculated | Same, no change |

Items 1 to 9 are changes to Java only. The C# reference is not modified. Each item gets a test that compares
the Java result with the C# result for the same input.

## 8. C# reference file map

| Area | C# file (under `AEspejo.InscripcionesBackupCSharp/src`) | Java target |
|---|---|---|
| Payments | `AEspejo.Inscripciones.Application/Pagos/ServicioPagos.cs` | `application/payment/PaymentService.java` |
| Amount rule | `AEspejo.Inscripciones.Domain/Services/ComparadorMontos.cs` | `domain/services/AmountComparator.java` (new) |
| Name rule | `AEspejo.Inscripciones.Domain/Services/SimilitudNombres.cs` | `domain/services/NameSimilarity.java` (new) |
| Master report | `AEspejo.Inscripciones.Application/Reportes/ServicioReportes.cs` | `application/report/MasterReportService.java` (new) |
| Registrant list | `AEspejo.Inscripciones.Application/Inscripciones/ServicioAdminInscripciones.cs` | `application/registration/RegistrationService.java` |
| Kit delivery entity | `AEspejo.Inscripciones.Domain/Entities/EntregaKit.cs` | `domain/entities/KitDelivery.java` |
| Statement entities | `.../Domain/Entities/LoteImportacionExtracto.cs`, `MovimientoExtracto.cs` | `StatementImportBatch.java`, `StatementMovement.java` (exist) |
| Athlete import entities | `.../Domain/Entities/LoteImportacionAtletas.cs`, `EquivalenciaModalidad.cs` | `AthleteImportBatch.java`, `ModalityEquivalence.java` (exist) |
| Payments controller | `AEspejo.Inscripciones.Api/Controllers/PagosController.cs` | `api/payment/PaymentController.java` |
| Entity configuration | `AEspejo.Inscripciones.Infrastructure/Persistence/Configurations/*.cs` | JPA annotations and `V*.sql` migrations |

## 9. Test strategy

- Port each C# test in `tests/AEspejo.Inscripciones.UnitTests` and `tests/AEspejo.Inscripciones.IntegrationTests`
  to JUnit 5 with the same names translated to English.
- Add a parity suite that runs the same scripted payment sequence against both backends and compares responses.
- `./mvnw verify` must pass against PostgreSQL before any feature is marked complete.

## 10. Demo status of in-scope features (C# reference to Java)

Based on the Java controllers present in `src/AEspejo.Inscripciones.Backend` and the routes the C# controllers
expose. Java status was read from the code; it was not run.

| Feature (C# source) | Java status | Routes still missing in Java |
|---|---|---|
| Login, session, change password (`AuthController`) | Present | none |
| Events: list, detail, create, update, publish, status, delete (`EventosController`) | Present | event image upload/delete, event list for public site (`publico/eventos`), runner manual |
| Modalities, kits, kit items, price tiers, sizes, brands, age categories and templates | Present | kit image, QR per price tier and kit, age category standard generation (check) |
| Registrations: list, detail, bib, cancel, reactivate, result, bulk result | Partial | bulk result (`eventos/{id}/inscritos/resultado`), receipt download and upload, public QR by code |
| Payments: register, update, revert (`ServicioPagos`) | Present; the 10 approved parity fixes are applied (section 7). Not yet covered by JUnit tests | none |
| Messages in es, en, pt (all business and validation errors) | Done: keys in `PaymentService`, catalog, registration and auth; bundles `messages*.properties`; `Accept-Language` sent by the panel | messages for the ported features still to come |
| Public registration form, public event, public sizes | Present | public event list, public organization, public athlete search, public receipt upload |
| Athletes: register list (filters, summary, paging), detail, update, linked accounts, unlink | Done in Java (`AthleteService`, `AthleteController`); panel types and `Atletas.tsx` renamed to the English contract. Not yet covered by JUnit tests | opt-out (`/marketing/athletes/{id}/opt-out`, part of marketing) |
| Registrant list: filters (incl. kit delivered, emergency contact), sort, summary, paging | Done in Java (`RegistrationService.listing`), panel `Inscritos.tsx` and types renamed. The `sinTalla` filter bug of the previous Java code (inverted) is fixed | registrant detail (`InscritoDetalle`) still has the old contract |
| Field names of the panel | Renamed to the English contract in: enums (all unions), pagination, athletes, registrant list and detail, events, modalities, kits, kit items, sizes, price tiers, age categories, payments (register, update, revert, body key `reason`). Still Spanish: marketing, portal, Money Sport, configuration, public form types | rename the rest, screen by screen |
| Money Sport (`ServicioMoneySport`) | Done: `GET /api/public/money-sport?documentNumber=`, `GET /api/public/money-sport/{id}?documentNumber=` (404 if the document does not match). Movement types are `Credit`/`Debit` (C# `Abono`/`Uso`). Panel `MoneySport.tsx` renamed. Rate limiting of C# not ported | JUnit pending |
| Athlete portal (`ServicioPortalAtleta`) | Done in Java: Auth0 token chain for `/api/athlete-portal/**` (`PortalSecurityConfig`), account, profile creation, claim with lock after 5 failures, profile update, `/userinfo` fallback. **Not tested end to end**: no Auth0 account was available; only the rejection paths (401 without token or with an internal token) were verified. Suggested names at sign-up come from the identity (`suggestedFirstNames`/`suggestedLastNames`). Claims are limited to 10 per 5 minutes per subject. | end-to-end test with a real Auth0 login |
| Public athlete lookup (`ServicioBusquedaAtleta`) | Done: `GET /api/public/athletes?documentNumber=&slug=`. Exact match on document, unsubscribed athletes hidden, `alreadyRegisteredInEvent` only when `slug` is given, Money Sport balance included. Shares the rate-limit policy `busqueda-atleta` with money sport. Panel `AtletaEncontrado` and `InscripcionPublica.tsx` renamed | JUnit pending |
| File uploads (`ServicioImagenEvento`, `ServicioManualCorredor`, `ServicioImagenKit`, `ServicioQrCobro`, `ServicioComprobantePago`) | Done: event cover (fitted to 500x500 JPEG, not cropped), runner manual (PDF/DOC/DOCX), kit photo, QR per tier and kit, generic QR, receipts (image or PDF). Validation by file signature; files under `files.base-path`. Upload field `archivo`; upload responses `{ path }`. **Limitation**: WebP is accepted and stored, but cannot be resized by the JDK codecs, so an event cover or kit photo in WebP is refused with a message | JUnit pending |
| Marketing: audience and segments (`ServicioAudiencia`, `ServicioSegmentos`, `FiltroAudiencia`) | Done in Java: `POST /api/marketing/audience/estimate`, `POST /api/marketing/audience/preview`, `GET/POST /api/marketing/segments`, `GET/PUT/DELETE /api/marketing/segments/{id}`. Consent required, unsubscribed hidden, one message per phone, all conditions combined with AND, same validation messages as C#. Segment filters are stored as English JSON. Panel `Audiencia.tsx` and `ConstructorAudiencia.tsx` renamed. Campaign-only fields (`DialogoEnviarCampania`) stay Spanish until campaigns are ported | JUnit pending |
| Marketing: campaigns, WhatsApp templates, inbox and webhook (`CampaignService`, `CampaignDispatcher`, `InboxService`, `WhatsAppWebhookService`) | Done in Java with the C# logic: `/api/marketing/campaigns`, `/api/marketing/whatsapp-templates`, `/api/marketing/inbox/...` (English routes and JSON names), `/api/webhooks/whatsapp` (signed POST, handshake GET). Senders: `meta` through the Cloud API and `simulated` (default), chosen per brand by `WhatsAppBrandResolver`. Not verified against the real Meta API: no credentials here, so only the simulated channel and signed webhook payloads were exercised. Panel renamed to the English contract. Campaign-only text stays Spanish (UI) | Unit tests pending |
| Rate limits (C# `AddRateLimiter`) | Done: `FixedWindowRateLimiter`. Public money sport search and detail share one global window of 20 per minute (as in C#); exceeding it returns 429 with `Retry-After`. Single instance only. Tested: the 21st request gets 429 | none |
| Master report (`ServicioReportes`) | Done in Java (`MasterReportService`, `GET /api/events/{id}/reports/master`); panel `Reportes.tsx` renamed. Shirt label keeps "POLERA" in Spanish | JUnit tests pending |
| Settings (`ServicioConfiguracion`) | Done: `GET/PUT /api/settings`, `GET /api/settings/suggested-waiver` (admin), `GET /api/public/organization`. The suggested waiver is Spanish text in all languages until it is reviewed by a lawyer. Generic QR (upload/download) waits for the upload step | JUnit tests pending |
| Catalog and payments screens | Done: `Eventos`, `EventoDetalle`, `FormularioEvento`, `Seccion*`, `DialogoRegistrarPago`, `DetalleInscrito` renamed; query parameters `includeFinished`, `brand`, `activeOnly` aligned with Java | JUnit tests pending |
| Roles per endpoint | Applied: `Policies` (ADMIN, CASH, OPERATIONS, READ) mapped from the C# `Politicas`; token `role` claim becomes the authority | none |
| Athlete portal (`portal-atleta`) | Missing | all |
| Marketing: audience, segments, campaigns, WhatsApp templates, inbox | Missing | all |
| Money Sport (public lookup and balance) | Missing | all |
| Configuration: settings, suggested waiver, generic QR | Missing | all |
| Master report, JSON (`ServicioReportes`) | Missing | all |
| Per-event service fee (spec 006) | Not verified | verify `MontoServicioCentavos` in Java `Event` and the 9 done C# tasks |

Note: `CAMBIOS_PENDIENTES.md` in the C# panel says Money Sport and result registration are "implemented in the
backend". The table above reflects what the Java code contains; the C# backend code was not re-checked for that note.
