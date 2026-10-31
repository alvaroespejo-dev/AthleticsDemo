# Tasks: Per-Event Service Fee

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Backend (US1, US2)

- [x] T001 Add `ServiceFeeCents` to `domain/entities/Event.java`
- [x] T002 Expose/accept it in the event models and map/copy/update it in `EventService.java`
- [x] T003 Use the event fee in `PublicEventService.java` (both places)
- [x] T004 Generate migration `AddEventServiceFee` and add the backfill `UPDATE`
- [x] T005 Integration tests for the fee (independence, copy on create, update, omitted on update)

## Phase 2: Frontend

- [x] T006 Types in `api/types.ts` and default/mapping in the event form
- [x] T007 Fee input with QR warning in the event form
- [x] T008 The modalities section uses `event.serviceFeeCents`
- [x] T009 i18n keys (es, en, pt) and the Settings help text "applies to new events only"

## Phase 3: Verify

- [ ] T010 Run `./mvnw verify` and `npm run build`
