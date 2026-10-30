# Tasks: Per-Event Service Fee

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Backend (US1, US2)

- [x] T001 Add `MontoServicioCentavos` to `Domain/Entities/Evento.cs`
- [x] T002 Expose/accept it in `DtosCatalogo.cs` and map/copy/update it in `ServicioEventos.cs`
- [x] T003 Use the event fee in `ServicioInscripcionPublica.cs` (both places)
- [x] T004 Generate migration `AgregarMontoServicioEvento` and add the backfill `UPDATE`
- [x] T005 Rewrite `ConfiguracionApiTests` (independence, copy on create, update, omitted on update)

## Phase 2: Frontend

- [x] T006 Types in `api/tipos.ts` and default/mapping in `FormularioEvento.tsx`
- [x] T007 Fee input with QR warning in `FormularioEvento.tsx`
- [x] T008 `SeccionModalidades.tsx` uses `evento.montoServicioCentavos`
- [x] T009 i18n keys (es, en, pt) and Configuration help text "applies to new events only"

## Phase 3: Verify

- [ ] T010 Run `dotnet test` and `npm run build`
