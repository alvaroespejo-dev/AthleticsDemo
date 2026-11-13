# Tasks: Engineering Quality Baseline

**Input**: [spec.md](spec.md), [plan.md](plan.md).

## Phase 1: Clarification

- [ ] T001 Resolve FR-005 (coverage threshold) and FR-006 (observability); update spec.md
- [ ] T002 Choose the Java formatter plugin and record it in plan.md

## Phase 2: US1 - Style enforcement (P1)

- [ ] T003 [US1] Add `.editorconfig` at the repository root
- [ ] T004 [US1] Add formatter plugin to `pom.xml` with a check goal bound to `verify`
- [ ] T005 [US1] Apply the formatter once in an isolated commit

## Phase 3: US2 - Frontend tests (P1)

- [ ] T006 [US2] Install Vitest, React Testing Library and jsdom in `src/AEspejo.Registrations.Frontend`
- [ ] T007 [US2] Configure test environment and `test` script in `package.json`
- [ ] T008 [P] [US2] Tests for `src/api/cliente.ts` (`ErrorApi`, error extraction, 401)
- [ ] T009 [P] [US2] Tests for `src/auth/RutaProtegida.tsx`
- [ ] T010 [P] [US2] Tests for the API route and enum mapping in `src/api/endpoints.ts`

## Phase 4: US3 - PR gate (P2)

- [ ] T011 [US3] Create `.github/workflows/pr-checks.yml` (Java `./mvnw verify`, panel lint, type-check, test, build)
- [ ] T012 [US3] Document required status checks for `main` in README

## Phase 5: US4 - Coverage (P3)

- [ ] T013 [US4] Publish JaCoCo and Vitest coverage as CI artifacts

## Phase 6: Polish

- [ ] T014 Update the constitution TBD items that this feature resolves
- [ ] T015 Run `./mvnw verify`, `npm run lint`, `npm run build`, `npm test`