# REST API contract

Base path: `/api`. Every body is JSON. Dates are ISO 8601 (`2026-10-16T08:00:00-04:00`) for instants
and `YYYY-MM-DD` for calendar dates. Enum values are sent as their English names, for example
`"Draft"` or `"Published"`.

Authentication: `Authorization: Bearer <token>`, except for the routes marked *public*.

## Errors

Errors use RFC 9457 problem details. The `detail` field holds the user-facing message, which is in
Spanish because the panel displays it directly.

| HTTP | Meaning |
|---|---|
| 400 | Invalid request body. `fields` maps each invalid field to its message. |
| 401 | Missing or invalid token, or wrong credentials. |
| 404 | The record does not exist. |
| 409 | The change clashes with existing data, for example a duplicate name or a delete blocked by registrations. |
| 422 | A business rule was violated, for example publishing an incomplete event. |

## Authentication

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/login` *(public)* | `{ loginName, password }` | `200` `{ token, expiresAt, userId, loginName, name, role, preferredLanguage }` |
| GET | `/api/auth/me` | — | `200` `{ userId, loginName, name, role, preferredLanguage }` |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` (new password ≥ 10 characters) | `204` |

`role` is one of `Admin`, `Cashier`, `KitStaff`, `ReadOnly`.

## Brands

| Method | Path | Response |
|---|---|---|
| GET | `/api/brands` | `200` `[{ id, code, name, active }]` |

## Events

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/events?includeFinished=false&brand={code}` | — | `200` `[EventSummary]` |
| GET | `/api/events/{id}` | — | `200` `EventDetail` |
| POST | `/api/events` | `SaveEvent` | `200` `EventDetail` |
| PUT | `/api/events/{id}` | `SaveEvent` | `200` `EventDetail` |
| POST | `/api/events/{id}/publish` | — | `200` `EventDetail` |
| POST | `/api/events/{id}/status` | JSON string, for example `"Closed"` | `200` `EventDetail` |
| DELETE | `/api/events/{id}` | — | `204` |

`publish` (and `status: "Published"`) requires: at least one active modality, every active modality
with at least one active kit and at least one price tier, at least one age category, and a waiver
text. Otherwise it returns `422` listing what is missing.

`SaveEvent`:

```json
{
  "name": "string (required)",
  "brandId": "integer (required)",
  "slug": "string, optional; derived from the name when blank",
  "description": "string | null",
  "location": "string | null",
  "eventDate": "YYYY-MM-DD (required)",
  "registrationOpensAt": "instant (required)",
  "registrationClosesAt": "instant (required)",
  "sizeChangeClosesAt": "instant | null",
  "reservationHours": "integer (required)",
  "paymentToleranceCents": "integer (required)",
  "serviceFeeCents": "integer | null; null on create copies the global setting",
  "waiverText": "string | null; blank on create copies the global setting",
  "imagePath": "string | null",
  "runnerManualPath": "string | null",
  "runnerManualName": "string | null"
}
```

Rules enforced on create and update: registrations open before they close; registrations close no
later than the event date; the size-change deadline is no later than the registration close; the
brand must exist and be active; the slug must be unique. Changing the event date is rejected with
`409` while registrations exist.

`EventSummary`:

```json
{
  "id": 1, "name": "string", "brandId": 1, "brandName": "string", "slug": "string",
  "location": "string | null", "eventDate": "YYYY-MM-DD",
  "registrationOpensAt": "instant", "registrationClosesAt": "instant",
  "status": "Draft", "modalityCount": 0, "paidRegistrations": 0, "pendingRegistrations": 0,
  "serviceFeeCents": 400, "imagePath": "string | null"
}
```

`EventDetail` has the same identity fields plus `description`, `sizeChangeClosesAt`,
`reservationHours`, `paymentToleranceCents`, `waiverText`, `runnerManualPath`, `runnerManualName`,
`modalities` (see `Modality`) and `ageCategories`:

```json
{ "id": 1, "eventId": 1, "name": "string", "sex": "Female", "minAge": 18, "maxAge": 39,
  "modalityId": null, "sortOrder": 1 }
```

## Modalities

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/events/{eventId}/modalities` | `SaveModality` | `200` `Modality` |
| PUT | `/api/modalities/{id}` | `SaveModality` | `200` `Modality` |
| DELETE | `/api/modalities/{id}` | — | `204` |

`SaveModality`:

```json
{
  "name": "string (required, unique within the event)",
  "distanceMeters": "integer (required)",
  "quota": "integer | null (null = no limit)",
  "sortOrder": "integer (required)",
  "minAge": "integer | null",
  "active": "boolean (required)",
  "bibFrom": "integer | null",
  "bibTo": "integer | null"
}
```

Rules: `bibFrom` and `bibTo` are both set or both null, and `bibFrom ≤ bibTo`. Bib ranges cannot
overlap another modality of the same event. On update, the quota cannot drop below the seats already
occupied, and the distance cannot change while registrations exist. Deleting a modality with
registrations is rejected with `409`; deactivate it instead.

`Modality`:

```json
{
  "id": 1, "eventId": 1, "name": "string", "distanceMeters": 10000, "quota": null,
  "sortOrder": 1, "minAge": null, "active": true, "bibFrom": null, "bibTo": null,
  "occupiedSeats": 0,
  "kits": ["Kit"],
  "priceTiers": ["PriceTier"],
  "paymentQrCodes": [{ "priceTierId": 1, "kitId": 1 }]
}
```

`occupiedSeats` counts registrations with status `Pending`, `Paid` or `UnderReview`.

`Kit`, `KitItem` and `PriceTier` are returned inside a modality. Their own endpoints come in the next
slice.

```json
{ "id": 1, "modalityId": 1, "name": "string", "description": "string | null",
  "requiredSizeType": "TShirt | Singlet | null", "surchargeCents": 0, "sortOrder": 1,
  "active": true, "hasImage": false,
  "items": [{ "id": 1, "name": "string", "sortOrder": 1, "active": true, "requiredSizeType": null }] }

{ "id": 1, "modalityId": 1, "name": "string", "priceCents": 35000,
  "validFrom": "instant", "validTo": "instant" }
```

## Not in this slice

Kits, price tiers, sizes, kit items, age categories, age category templates, age category
recalculation, registrations, payments, athletes, campaigns, WhatsApp, reports and settings.
