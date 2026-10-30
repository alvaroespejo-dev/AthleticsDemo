# Feature Specification: Engineering Quality Baseline

**Feature Branch**: `005-quality-baseline`

**Created**: 2026-10-06

**Status**: Deferred. Not in the C# reference and not part of the interview demo (see `specs/007-java-backend-port/spec.md`, Scope).

**Input**: "TBD" items of the constitution (testing, style, CI, observability).

## Current State (audit)

- **C# reference**: `.editorconfig` absent; no `Directory.Build.props`; no frontend test framework
  (the panel has `oxlint` only); CI runs `dotnet test` only; no coverage threshold.
- **Java target**: the Maven build (`pom.xml`) has JUnit through `spring-boot-starter-test` and no
  formatter, coverage report or lint step. No CI workflow for Java exists in `.github/workflows`.
- The panel is the same project in both cases, so its frontend test setup applies to both backends.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent C# style enforced by the build (Priority: P1)

A developer gets the same formatting and analyzer warnings locally and in CI.

**Independent Test**: Introduce a style violation; the build/CI check fails.

**Acceptance Scenarios**:

1. **Given** an `.editorconfig`, **When** `dotnet format --verify-no-changes` runs, **Then** a violation fails the check.

---

### User Story 2 - Frontend automated tests (Priority: P1)

A developer runs unit/component tests for the React app with one command.

**Independent Test**: `npm test` runs at least tests for `api/cliente.ts` (`ErrorApi`, 401 handling) and `RutaProtegida`.

**Acceptance Scenarios**:

1. **Given** Vitest + React Testing Library, **When** `npm test` runs, **Then** the suite passes headlessly.

---

### User Story 3 - Pull request gate in CI (Priority: P2)

Every pull request runs backend build/tests, format check, frontend lint, type-check and tests.

**Independent Test**: Open a PR with a failing test; the workflow fails.

**Acceptance Scenarios**:

1. **Given** a PR to `main`, **When** the workflow runs, **Then** all checks must pass before merge.

---

### User Story 4 - Coverage reporting (Priority: P3)

Coverage is collected (coverlet and Vitest) and published as a CI artifact, without a hard gate initially.

### Edge Cases

- Existing code violating new style rules: apply the format once in a dedicated commit.
- Spanish identifiers/comments in existing code must not fail the build.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Repository MUST contain an `.editorconfig` for C#, TS and Markdown.
- **FR-002**: CI MUST run `dotnet format --verify-no-changes`, build and tests.
- **FR-003**: Frontend MUST have Vitest + React Testing Library with a `test` script.
- **FR-004**: CI MUST run `npm run lint`, `tsc -b` and `npm test` on pull requests.
- **FR-005**: Coverage reports MUST be generated; threshold [NEEDS CLARIFICATION: start gate-less, then 70% on Domain/Application?].
- **FR-006**: Observability [NEEDS CLARIFICATION: adopt Application Insights?].

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pull requests run all checks automatically.
- **SC-002**: Frontend suite runs in under 60 seconds in CI.
- **SC-003**: Style violations are caught before review.

## Assumptions

- GitHub Actions remains the CI platform (existing workflows).
- No change to the deployment workflows beyond adding a PR workflow.
