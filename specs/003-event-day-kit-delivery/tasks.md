# Tasks: Event Day Kit Delivery

**Input**: [spec.md](spec.md), [plan.md](plan.md).

## Phase 1: Clarification

- [ ] T001 Resolve unpaid override, offline mode and QR camera scanning; update spec.md
- [ ] T002 Approve the delivery rules in writing (no delivery write path exists yet)

## Phase 2: Foundational

- [ ] T003 Verify unique index on `KitDeliveries.RegistrationId`; add `V*__kit_delivery_index.sql` if missing
- [ ] T004 [P] Request and response records in `application/kitdelivery/KitDeliveryModels.java`

## Phase 3: US1 - Deliver a kit (P1) MVP

- [ ] T005 [US1] `KitDeliveryService.search` and `deliver`
- [ ] T006 [US1] `KitDeliveryController` search and deliver endpoints (role `KitStaff`)
- [ ] T007 [US1] Tests: success, double delivery, non-deliverable state, role access
- [ ] T008 [US1] Mobile-first delivery page in the panel, its route and a nav entry for `KitStaff`
- [ ] T009 [P] [US1] Spanish, English and Portuguese strings in the panel i18n files

## Phase 4: US2 - Live board (P2)

- [ ] T010 [US2] Counters per modality and delivery point
- [ ] T011 [US2] Summary endpoint and board component with `refetchInterval` (30 s)
- [ ] T012 [US2] Test: counters equal database totals

## Phase 5: US3 - Revert (P3)

- [ ] T013 [US3] `revert` and endpoint restricted to `Admin`
- [ ] T014 [US3] Test asserting an audit entry

## Phase 6: Polish

- [ ] T015 Update README and operations notes
- [ ] T016 `./mvnw verify` and panel `npm run build` pass