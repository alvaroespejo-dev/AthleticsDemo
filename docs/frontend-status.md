# Frontend status: `src/AEspejo.Registrations.Frontend` (Next.js)

Status of the admin panel. Code identifiers and files are in English; only user-visible text goes through i18n
(es, en, pt).

## Done

- Foundation: Next.js config (static export), Tailwind, providers, Auth0 wrapper, i18n (SSR-safe), brand module,
  API client, endpoints and types (`src/api/`).
- Shell: panel layout, navigation, sidebar, language selector, route guard (`src/layout/`, `src/auth/`).
- Login (`features/login`).
- Events: list with create, detail with window, edit, publish (`features/events`).
- Event detail sections: cover image, runner guide, modalities (modalities, kits with photo, price tiers, final
  price matrix with payment QR), age categories (`features/events/modalities`, `EventMediaSections`,
  `AgeCategoriesSection`).
- Settings page, admin only: organization, billing defaults, waiver, generic QR, age templates, sizes, kit items
  (`features/settings`, `app/(panel)/settings`).
- Shared UI: primitives, states, dialogs, `ActionTable`, `KitImageField`, `Metric`, `AccordionItem`,
  `PhoneField`, `BirthDateField`, `CountrySelector` (`components/ui`).
- Registrations (`features/registrations`): list with filters, summary, paging, row actions; detail dialog;
  payments (record, edit, revert with reason, receipt preview); cancel and reactivate, bib (with range warning),
  single result, and batch result through the batch endpoint.
- Athlete register (`features/athletes`): list with filters, summary, paging, edit dialog with linked accounts
  and unlink. Phone, birth date and nationality use the same widgets as the public form.
- Reports (`features/reports`): master report with the totals by modality, distance, category and shirt size.
- Audience builder (`features/marketing/audience`): scope (all, participants, race, saved segment), condition
  builder with the operators the API accepts, estimate card with the shared-number notice, preview with per-row
  exclusion and a tri-state header checkbox, save as segment, send.
- Campaigns (`features/marketing/campaigns`): list with progress bars and paging, detail with counters and
  recipients filtered by status, send and cancel. Send dialog: brand, event, approved WhatsApp template, body
  with named variables, parameter check against the template, preview. The campaign is created as a draft and
  then queued (`/marketing/campaigns?campaign=id`).
- WhatsApp inbox (`features/inbox`): conversations, thread, 24-hour window, reply and template reply, media.
- Public registration (`features/public`, route `/register/[slug]`): event page, distance and kit steps, size,
  price breakdown, Money Sport discount, document search with pre-filled form, consents, missing-field list,
  confirmation with QR and receipt upload.
- Money Sport (`features/public`, route `/money-sport`): document lookup, choice between several people with the
  same number, balance, movements and races.
- Athlete portal (`features/portal`, routes `/portal` and `/portal/login`): login, sign-up or claim of an existing
  athlete, account with panels for personal, emergency, clinical and communication data.

## Decisions

- Athlete portal: no session shows the login, a session without an athlete shows the sign-up or claim form, and
  otherwise the account.
- Athlete import and statement reconciliation: schema only in the backend (see `docs/feature-status.md`).
- Backend API paths and JSON field names are the ones in `api/endpoints.ts` and `api/types.ts`.
- Dates in the UI follow the selected language (`lib/format.ts`).
- Dynamic routes (`/events/[id]`, `/register/[slug]`) are exported with a placeholder (`_`). Both pages read the
  real value from `usePathname()`, and `public/staticwebapp.config.json` rewrites the request to the placeholder.
- Campaign and public registration both show the brand's logo as a WhatsApp header image. It is sent as an
  absolute URL built from the panel origin, because WhatsApp fetches it from the internet.
- The Money Sport discount is reset when a different athlete is picked, so a value typed for one person does not
  carry over to the next.

## Not yet verified

- Azure Static Web Apps routing for `/events/{id}` and `/register/{slug}`: the rewrites are in
  `public/staticwebapp.config.json`, but they can only be checked on a deployed site.
- Full run against the backend: the build passes and types match the controllers, but no browser session has
  been run end to end yet.
- `.env.ecotrail` and `.env.onesport` (used by `build:ecotrail` and `build:onesport`) do not exist: they need the
  public values of each brand (API URL, Auth0 domain, client ID, audience). `.env.example` documents the keys.
