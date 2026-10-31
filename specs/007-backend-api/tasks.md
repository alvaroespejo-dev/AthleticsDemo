# Tasks: Backend API

**Input**: [spec.md](spec.md), [plan.md](plan.md)

**Status legend**: `[ ]` not started, `[x]` done. A task is marked done only after it is verified with tests or
a manual check.

## Phase 1: Domain rules

- [ ] T001 Add unit tests for `AmountComparator` and `NameSimilarity` (including the Levenshtein distance) in
      `domain/services`.
- [ ] T002 Add a `Clock` bean and use it in the services instead of `OffsetDateTime.now()`, so tests are deterministic.

## Phase 2: Payments

- [ ] T003 Add unit and integration tests for every payment message key in `plan.md` section 5.
- [ ] T004 Add a test for each payment rule in `plan.md` section 6.
- [ ] T005 Cover `PUT /api/payments/{id}` (observations and amount) with an integration test.

## Phase 3: Panel

- [x] T006 Use the current panel code with the English API routes (`plan.md` section 4).
- [ ] T007 Set `VITE_API_URL` in `.env.*` to the API. No page component changes.
- [ ] T008 Final English pass: function names, query parameters, body keys, JSON fields in `types.ts` and i18n keys.
- [ ] T009 Walk the screens: login, events list, event detail, registrants, registrant detail, register payment,
      revert payment, edit payment. Record any difference in `spec.md`.

## Phase 4: Remaining features

- [ ] T010 Add unit tests for the master report (`MasterReportService`).
- [ ] T011 Add generic payment QR upload and download (settings).
- [ ] T012 Add the registrant detail endpoint to the English contract used by the panel.
- [ ] T013 Add the WebP resize path for event covers and kit photos, or document the refusal in the panel.
- [ ] T014 Test the athlete portal with a real Auth0 login.
- [ ] T015 Test the Meta WhatsApp sender against the Cloud API with real credentials.

## Phase 5: Database and language

- [ ] T016 Confirm every migration uses English table, column, constraint and index names (`plan.md` section 3).
- [ ] T017 Search `src/main` for Spanish identifiers and rename each hit. Only the user-visible strings in
      `plan.md` section 5 remain.
- [ ] T018 `./mvnw verify` passes against PostgreSQL 17.

## Phase 6: Documentation

- [ ] T019 Update `README.md` (backend commands, panel `VITE_API_URL`, PostgreSQL setup).
- [ ] T020 Keep the specs 001 to 006 in step with the code they describe.
