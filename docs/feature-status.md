# Feature status: backend API

Review of the Java API (`src/AEspejo.Registrations.Backend`) by functional area. Each area was checked against its
business rules, validations and messages.

## Status legend

- **Done**: implemented and reviewed.
- **Fixed**: a gap found in review, now closed.
- **Intentional difference**: the API is stricter or differs on purpose; see the notes.
- **Schema only**: the tables and mappings exist, but no service or endpoint uses them yet.

## Routes

The API groups its endpoints by area under `/api`: events, modalities, kits, price tiers, registrations, payments,
athletes, Money Sport, campaigns, WhatsApp inbox, reports, settings and authentication. Public endpoints live under
`/api/public`.

## Area status

| Area | Status | Notes |
|---|---|---|
| Authentication | Done | Constant-time check for unknown users, same messages for every failure, inactive accounts rejected, login length limits. |
| Events | Done | Dates, brand, slug, default waiver and fee, publish checklist, date-change lock, delete rule, fixed brand. |
| Modalities, kits, price tiers | Done | Name uniqueness, bib-range overlap, quota, distance lock, size rule, tier overlap. A tier with registrations cannot be deleted. |
| Registrations: bibs | Fixed | Out-of-range warning and the holder's code in the conflict message. |
| Registrations: cancel and reactivate | Fixed | Status rules, payment checks, Money Sport reversal on cancel, bib kept. |
| Registrations: results | Fixed | Single and batch share one rule set: paid only, event day, Money Sport credit. |
| Public sign-up | Done | Order of checks, amount with service fee, Money Sport discount, categories, QR flag. A birth date after the event day is rejected. |
| Payments | Fixed | Length and amount limits on the request, revert validated. |
| Athlete portal | Fixed | Masked e-mail, claim lock, unified not-found message, verified-e-mail rule. |
| Athlete register | Done | Filters, sorting, summary, duplicate check, search with Money Sport balance. |
| Money Sport | Done | Credits, debits and the negative-balance rule in results. |
| Campaigns and dispatch | Done | Batch sending, three attempts, missing configuration does not spend an attempt, provider stamped on close. Campaigns narrowed by fixed brand. The scheduler has no cancellation token. |
| WhatsApp inbox | Done | 24-hour window, free-text and template replies, archive, unread summary, media. |
| QR codes | Done | Per tier and kit, generic QR when Money Sport credit applies, same-modality rule. |
| Images and uploads | Fixed | WebP can be resized (TwelveMonkeys ImageIO plugin). |
| Reports | Done | JSON only. No PDF report exists. |

## Schema only

- **Athlete import and statement reconciliation.** The tables and mappings exist. No service or endpoint uses them
  yet, so they are kept as schema only.

## Not reviewed line by line yet

- Audience builder rules and campaign creation and template rendering (`AudienceService`, `CampaignService`). The
  frontend screens for both exist, but their backend rules have not been reviewed.
- WhatsApp webhook payload handling beyond the routing.
- Plain catalog CRUD: age category templates, sizes, kit items and segments.
- Settings and category recalculation details.
