# Parity audit: legacy C# backend vs Java backend

Compares the legacy C# API (`AEspejo.InscripcionesBackupCSharp`) with the new Java API
(`src/AEspejo.Registrations.Backend`).

## Method

1. Routes: every `[Http*]` and `[Route]` attribute of the 15 C# controllers was matched with the Java
   controllers' mappings by function (the names differ: Spanish in C#, English in Java).
2. Services: every `Servicio*` class of the C# application layer was matched with a Java service.
3. Behaviour: business rules, validations and messages were compared service by service. Large services
   were checked by sampling their rules, not exhaustively (about 214 rule sites in C#).

## Status legend

- **Done**: checked against the original, equivalent.
- **Fixed**: a gap found by this audit, now closed.
- **Intentional difference**: Java is stricter or differs on purpose; listed below.
- **Shared gap**: modelled in both backends, used in neither.

## Routes

About 109 endpoints in C#. Every one has a Java equivalent. Notable mappings:
`campanias` → `campaigns`, `atletas/cuentas` → `athletes/{id}/accounts`, `publico/moneysport` →
`public/money-sport`, `qr-generico` → `settings/generic-qr`, `tramos/{id}/kits/{id}/qr` →
`price-tiers/{id}/kits/{id}/qr`, `modalidades/{id}` → `modalities/{id}`.

## Services

Every C# application service has a Java counterpart (see the service table in the Java packages
`application/*`).

## Area status

| Area | Status | Notes |
|---|---|---|
| Authentication | Done | Decoy hash, same messages, inactive accounts rejected. Login length limits added (fixed). |
| Events | Done | Dates, brand, slug, default waiver and fee, publish checklist, date-change lock, delete rule, fixed brand (fixed). |
| Modalities, kits, price tiers | Done | Name uniqueness, bib-range overlap, quota, distance lock, size rule, tier overlap. Java also refuses to delete a tier that has registrations (intentional, the C# would fail on the foreign key). |
| Registrations: bibs | Fixed | Out-of-range warning and the holder's code in the conflict message. |
| Registrations: cancel / reactivate | Fixed | Status rules, payment checks, Money Sport reversal on cancel, bib kept (as C#). |
| Registrations: results | Fixed | Single and batch share one rule set (paid only, event day, Money Sport credit). |
| Public sign-up | Done | Same order of checks, amount with service fee, Money Sport discount, categories, QR flag. Intentional difference: Java rejects a birth date after the event day; C# does not. |
| Payments | Fixed | Length and amount limits on the request (as C# DataAnnotations), revert validated. |
| Athlete portal | Fixed | Masked e-mail uses the same bullet character as C#. Claim lock, unified not-found message, verified-e-mail rule: done. |
| Athlete register | Done | Filters, sorting, summary, duplicate check, search with Money Sport balance. |
| Money Sport | Done | Credits, debits and the negative-balance rule in results. |
| Campaigns and dispatch | Done (dispatch) | Batch sending, three attempts, missing configuration does not spend an attempt, provider stamped on close. Campaign list narrowed by fixed brand (fixed). Intentional difference: no cancellation token in the scheduler; the C# adds an attempt when cancelled mid-send. |
| WhatsApp inbox | Done | 24-hour window, free-text vs template replies, archive, unread summary, media. |
| QR codes | Done | Per tier and kit, generic QR when Money Sport credit applies, same-modality rule. |
| Images and uploads | Fixed | WebP can now be resized (TwelveMonkeys ImageIO plugin, as ImageSharp in C#). |
| Reports | Done | JSON only: C# references QuestPDF but never uses it, so no PDF report exists in the original. |

## Shared gap

- **Athlete import and statement reconciliation.** The tables and mappings exist in both backends. No
  service or endpoint uses them in the original, so Java keeps them as schema only, matching the original.

## Not compared line by line yet

- Audience builder rules (`ServicioAudiencia`) and campaign creation and template rendering
  (`ServicioCampanias`, `RenderizadorPlantilla`). The Java `AudienceService` and `CampaignService` exist.
  The frontend screens for both are ported (`docs/frontend-port-status.md`), but their backend rules are not
  reviewed against the original yet.
- WhatsApp webhook payload handling beyond the routing (`ServicioWebhookWhatsApp`).
- Plain catalog CRUD: `ServicioPlantillasCategorias`, `ServicioTallas`, `ServicioItemsKit`, `ServicioSegmentos`.
- Settings (`ServicioConfiguracion`) and category recalculation details (`ServicioCategorias`).
