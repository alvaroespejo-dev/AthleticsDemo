'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { brands, campaigns, whatsAppTemplates } from '@/api/endpoints'
import type { AudienceEstimate, AudienceFilter, EventSummary, WhatsAppTemplate } from '@/api/types'
import { Badge, Button, Field, Input, Select } from '@/components/ui/primitives'
import { FormDialog } from '@/components/ui/dialog'
import { ErrorNotice, InfoNotice, Loading } from '@/components/ui/states'
import { brandByCode, brandFromHost } from '@/lib/brand'

/**
 * Variables the body may use. They mirror the ones the backend renderer admits and validates
 * (MessageTemplateRenderer.ADMITTED): offering one the backend does not know would make the save fail.
 */
const VARIABLES = ['nombre', 'apellido', 'nombre_completo', 'ciudad', 'evento', 'fecha_evento', 'lugar_evento'] as const

/** Sample values for the preview. */
const EXAMPLE: Record<string, string> = {
  nombre: 'María',
  apellido: 'Gutiérrez',
  nombre_completo: 'María Gutiérrez',
  ciudad: 'Santa Cruz',
  evento: 'Eco Trail 2026',
  fecha_evento: '15/11/2026',
  lugar_evento: 'Parque Urbano El Arenal',
}

const NAMED_VARIABLE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g
const POSITIONAL_VARIABLE = /\{\{\s*(\d+)\s*\}\}/g

/**
 * Order in which the named variables are suggested when translating the body approved by Meta
 * ({{1}}, {{2}}…). It is a reasonable guess for a typical promotion, not an equivalence: Meta does
 * not say what each position means, so from position 7 on, "name" repeats instead of inventing more
 * rules without a basis.
 */
const SUGGESTED_ORDER = ['nombre', 'evento', 'fecha_evento', 'lugar_evento', 'ciudad', 'apellido', 'nombre_completo']

const LOOKS_LIKE_DATE = /^\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s*$/

/**
 * Translates the body approved by Meta ({{1}}, {{2}}…) into the app's named variables. It is a
 * suggestion so the operator does not have to write the message from scratch, not an exact
 * translation: each suggestion has to be checked against what the position really means.
 */
function translateBody(metaBody: string, examples: string[]): string {
  return metaBody.replace(POSITIONAL_VARIABLE, (_match, position: string) => {
    const index = Number(position) - 1
    const variable = LOOKS_LIKE_DATE.test(examples[index] ?? '')
      ? 'fecha_evento'
      : (SUGGESTED_ORDER[index] ?? 'nombre')

    return `{{${variable}}}`
  })
}

function templateKey(template: WhatsAppTemplate) {
  return `${template.name}|${template.language}`
}

/** The logo is sent to WhatsApp as a header image, and WhatsApp fetches it from the internet, so it needs an absolute URL. */
function publicLogoUrl(code: string): string {
  return new URL(brandByCode(code).registrationLogo, window.location.origin).href
}

interface Draft {
  name: string
  body: string
  templateName: string
  templateLanguage: string
  header: string
  headerMediaUrl: string
  brandId: number
  eventId: number | null
}

interface Props {
  filter: AudienceFilter
  events: EventSummary[]
  estimate?: AudienceEstimate
  onClose: () => void
  onCreated: (id: number) => void
}

/**
 * Creates the campaign and queues it. Nothing is sent here: the backend builds the recipients, moves
 * the campaign to "Sending", and the background dispatcher makes the calls to Meta.
 */
export function SendCampaignDialog({ filter, events, estimate, onClose, onCreated }: Props) {
  const { t, i18n } = useTranslation()
  const defaultBody = t('campaignsPage.send.defaultBody', {
    nombre: '{{nombre}}',
    evento: '{{evento}}',
    fecha_evento: '{{fecha_evento}}',
    lugar_evento: '{{lugar_evento}}',
  })

  const [draft, setDraft] = useState<Draft>({
    name: '',
    body: defaultBody,
    templateName: '',
    templateLanguage: '',
    header: '',
    headerMediaUrl: '',
    // 0 means "not resolved yet": the effect below fills it as soon as the brand catalog loads, and the
    // backend's minimum of 1 would reject it if it were ever sent as is.
    brandId: 0,
    eventId: filter.eventId ?? null,
  })
  const [chosenTemplate, setChosenTemplate] = useState('')

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const brandList = useQuery({
    queryKey: ['brands'],
    queryFn: () => brands.list(),
    // The brand catalog changes with a deployment, not on the fly.
    staleTime: Infinity,
  })

  // The code (for the template catalogue and the header logo) is derived from the list, which is the
  // source of truth; the id lives in the form state.
  const brandCode = brandList.data?.find((b) => b.id === draft.brandId)?.code

  // Preselection: if the audience filter already pointed at a specific event, that event's brand wins
  // over the host's, because the operator already said which race they are talking about.
  useEffect(() => {
    if (draft.brandId !== 0 || !brandList.data) return

    const fromEvent = events.find((e) => e.id === filter.eventId)?.brandId
    const fromHost = brandList.data.find((b) => b.code === brandFromHost().code)?.id

    update('brandId', fromEvent ?? fromHost ?? brandList.data[0]?.id ?? 0)
    // The effect runs only when the catalog arrives; the rest of the form state must not retrigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandList.data])

  const templates = useQuery({
    queryKey: ['whatsapp-templates', brandCode],
    queryFn: () => whatsAppTemplates.list(brandCode!),
    enabled: !!brandCode,
    // A bad token does not get better by retrying three times: the panel offers a button to retry by
    // hand once it is fixed.
    retry: false,
  })

  const template = templates.data?.find((t) => templateKey(t) === chosenTemplate)

  const chooseTemplate = (key: string) => {
    setChosenTemplate(key)
    const picked = templates.data?.find((t) => templateKey(t) === key)

    setDraft((d) => ({
      ...d,
      templateName: picked?.name ?? '',
      templateLanguage: picked?.language ?? '',
      header: picked?.header ?? '',
      // Pre-filled with the chosen brand's logo rather than a dropdown of options: it is almost always
      // the right value, and the field stays free text in case a different image is needed.
      headerMediaUrl: picked?.headerFormat === 'IMAGE' && brandCode ? publicLogoUrl(brandCode) : '',
      body: picked ? translateBody(picked.body, picked.bodyExamples) : defaultBody,
    }))
  }

  // Changing the brand changes the WhatsApp Business account, and with it the whole catalogue: the
  // chosen template may not exist on the other side, so it is deselected instead of being dragged
  // along. The event too, if it belonged to the previous brand.
  const changeBrand = (brandId: number) => {
    chooseTemplate('')
    setDraft((d) => ({
      ...d,
      brandId,
      eventId: events.some((e) => e.id === d.eventId && e.brandId === brandId) ? d.eventId : null,
    }))
  }

  const brandEvents = useMemo(() => events.filter((e) => e.brandId === draft.brandId), [events, draft.brandId])

  // Creating and sending are two calls: the first leaves the campaign as a draft with its recipients
  // already built, the second queues it. They are chained so the button is a single one, but if the
  // second fails the campaign stays as a draft and can be retried from the campaigns screen without
  // building the audience again.
  const send = useMutation({
    mutationFn: async () => {
      const created = await campaigns.create({
        name: draft.name.trim(),
        body: draft.body.trim(),
        templateName: draft.templateName || null,
        templateLanguage: draft.templateLanguage || null,
        header: draft.header || null,
        headerMediaUrl: draft.headerMediaUrl || null,
        brandId: draft.brandId,
        eventId: draft.eventId,
        filter,
      })
      await campaigns.send(created.id)

      return created.id
    },
    onSuccess: onCreated,
  })

  const preview = draft.body.replace(NAMED_VARIABLE, (match, variable: string) => EXAMPLE[variable.toLowerCase()] ?? match)

  // One entry per occurrence in the body, in order: exactly what the backend renderer sends as
  // positional parameters, duplicates included.
  const usedVariables = useMemo(
    () => [...draft.body.matchAll(NAMED_VARIABLE)].map((m) => m[1].toLowerCase()),
    [draft.body],
  )

  const mismatch = template != null && usedVariables.length !== template.parameterCount
  const total = estimate?.withWhatsApp ?? 0
  const formattedTotal = total.toLocaleString(i18n.language)

  const canSend =
    !!brandCode && !!template && !mismatch && total > 0 && !templates.isPending && !templates.isError

  const noun = (amount: number) =>
    t(amount === 1 ? 'campaignsPage.send.paramOne' : 'campaignsPage.send.paramMany')

  return (
    <FormDialog
      open
      title={t('campaignsPage.send.title')}
      className="max-w-2xl"
      saveText={t('campaignsPage.send.saveButton', { total: formattedTotal })}
      onClose={onClose}
      onSave={() => canSend && send.mutate()}
      saving={send.isPending}
      disabled={!canSend}
    >
      {send.isError && <ErrorNotice error={send.error} />}

      <InfoNotice>{t('campaignsPage.send.notice', { total: formattedTotal })}</InfoNotice>

      <Field id="campaign-brand" label={t('marketing.brand')} hint={t('marketing.brandHelp')}>
        <Select
          id="campaign-brand"
          required
          // Empty string and not 0: that is what makes the browser block the submit until a brand is picked.
          value={draft.brandId || ''}
          onChange={(e) => changeBrand(Number(e.target.value))}
        >
          <option value="">{t('operation.brandChoose')}</option>
          {brandList.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="campaign-name" label={t('campaignsPage.send.nameLabel')} hint={t('campaignsPage.send.nameHelp')}>
        <Input
          id="campaign-name"
          required
          autoFocus
          minLength={2}
          maxLength={200}
          placeholder={t('campaignsPage.send.namePlaceholder')}
          value={draft.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </Field>

      <Field
        id="campaign-event"
        label={t('campaignsPage.send.eventLabel')}
        hint={
          brandEvents.length === 0 && draft.brandId
            ? t('marketing.noEventsForBrand')
            : t('campaignsPage.send.eventHelp', { variables: '{{evento}} y {{fecha_evento}}' })
        }
      >
        <Select
          id="campaign-event"
          value={draft.eventId ?? ''}
          onChange={(e) => update('eventId', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">{t('campaignsPage.send.noEvent')}</option>
          {brandEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="campaign-template"
          label={t('campaignsPage.send.templateLabel')}
          hint={!brandCode || templates.isError ? undefined : t('campaignsPage.send.templateHelp')}
        >
          {!brandCode ? (
            <InfoNotice>{t('marketing.chooseBrandFirst')}</InfoNotice>
          ) : templates.isPending ? (
            <Loading text={t('campaignsPage.send.templatesLoading')} />
          ) : templates.isError ? (
            <div className="space-y-2">
              <ErrorNotice error={templates.error} />
              <Button type="button" variant="outline" size="sm" onClick={() => templates.refetch()}>
                {t('campaignsPage.send.retry')}
              </Button>
            </div>
          ) : templates.data.length === 0 ? (
            <InfoNotice>{t('campaignsPage.send.noTemplates')}</InfoNotice>
          ) : (
            <Select id="campaign-template" required value={chosenTemplate} onChange={(e) => chooseTemplate(e.target.value)}>
              <option value="">{t('campaignsPage.send.chooseTemplate')}</option>
              {templates.data.map((item) => (
                <option key={templateKey(item)} value={templateKey(item)}>
                  {item.name} · {item.language}
                  {item.category ? ` · ${item.category}` : ''}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field id="campaign-language" label={t('campaignsPage.send.languageLabel')} hint={t('campaignsPage.send.languageHelp')}>
          <p id="campaign-language" className="flex h-9 items-center px-1 font-mono text-sm">
            {draft.templateLanguage || '—'}
          </p>
        </Field>
      </div>

      {template && (
        <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-semibold">{template.name}</code>
            <Badge variant="success">{t('campaignsPage.send.approved')}</Badge>
            {template.category && <Badge>{template.category}</Badge>}
          </div>

          {template.header && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('campaignsPage.send.headerTitle')}
              </p>
              <p>{template.header}</p>
            </div>
          )}

          {template.headerFormat === 'IMAGE' && (
            <Field
              id="campaign-header-image"
              label={t('campaignsPage.send.headerImageLabel')}
              hint={t('campaignsPage.send.headerImageHelp')}
            >
              <Input
                id="campaign-header-image"
                type="url"
                required
                placeholder="https://..."
                value={draft.headerMediaUrl}
                onChange={(e) => update('headerMediaUrl', e.target.value)}
              />
            </Field>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('campaignsPage.send.approvedBody')}
            </p>
            <p className="whitespace-pre-wrap font-mono text-xs">{template.body}</p>
          </div>

          {template.footer && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('campaignsPage.send.footer')}</p>
              <p>{template.footer}</p>
            </div>
          )}

          {template.bodyExamples.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('campaignsPage.send.metaExamples')}
              </p>
              <ul className="list-disc space-y-0.5 pl-5">
                {template.bodyExamples.map((example, i) => (
                  <li key={i}>
                    <code>{`{{${i + 1}}}`}</code> → «{example}»
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('campaignsPage.send.noExamples')}</p>
          )}

          <p>
            {t('campaignsPage.send.requires', { amount: template.parameterCount, noun: noun(template.parameterCount) })}
          </p>

          <p className="text-xs text-muted-foreground">{t('campaignsPage.send.autoTaken')}</p>
        </div>
      )}

      <div className="rounded-md border bg-muted/40 p-3 text-sm">
        <p className="mb-2 font-semibold">{t('campaignsPage.send.paramsTitle')}</p>
        {usedVariables.length === 0 ? (
          <p className="text-muted-foreground">{t('campaignsPage.send.noVariables')}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {usedVariables.map((variable, i) => {
              const admitted = (VARIABLES as readonly string[]).includes(variable)

              return (
                <li key={i} className={admitted ? undefined : 'text-destructive'}>
                  <code>{`{{${i + 1}}}`}</code> = <code>{`{{${variable}}}`}</code>
                  {admitted
                    ? ` (${t(`campaignsPage.send.variables.${variable}`)})`
                    : ` ${t('campaignsPage.send.notAdmitted')}`}
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-2">
          {t('campaignsPage.send.usage', { used: usedVariables.length, usedNoun: noun(usedVariables.length) })}
          {template && ` ${t('campaignsPage.send.expectation', { expected: template.parameterCount, expectedNoun: noun(template.parameterCount) })}`}
        </p>
      </div>

      {mismatch && template && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {t('campaignsPage.send.mismatch', {
            used: usedVariables.length,
            usedNoun: noun(usedVariables.length),
            template: template.name,
            expected: template.parameterCount,
          })}
        </div>
      )}

      <div className="rounded-md border bg-muted/40 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('campaignsPage.send.preview')}</p>
        <p className="whitespace-pre-wrap text-sm">{preview}</p>
      </div>
    </FormDialog>
  )
}
