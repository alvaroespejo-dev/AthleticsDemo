'use client'

import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  AudienceCondition,
  AudienceField,
  AudienceFilter,
  AudienceOperator,
  AudienceScope,
  EventSummary,
  SegmentView,
} from '@/api/types'
import { Button, Card, Input, Label, Select } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

/** Kind of value a field takes: decides the operators and the input control shown. */
type Kind = 'text' | 'number' | 'boolean' | 'sex'

const FIELDS: { field: AudienceField; kind: Kind }[] = [
  { field: 'City', kind: 'text' },
  { field: 'Club', kind: 'text' },
  { field: 'Nationality', kind: 'text' },
  { field: 'Sex', kind: 'sex' },
  { field: 'Age', kind: 'number' },
  { field: 'Participated', kind: 'boolean' },
  { field: 'LastRaceYear', kind: 'number' },
  { field: 'EventsParticipated', kind: 'number' },
  { field: 'HasEmail', kind: 'boolean' },
]

const OPERATOR_SYMBOL: Record<AudienceOperator, string> = {
  Equal: '=',
  NotEqual: '≠',
  Greater: '>',
  GreaterOrEqual: '≥',
  Less: '<',
  LessOrEqual: '≤',
  Contains: 'contains',
}

/**
 * Operators the API accepts per kind of value. Offering one it rejects would only fail after the
 * whole condition was built.
 */
const OPERATORS: Record<Kind, AudienceOperator[]> = {
  text: ['Equal', 'NotEqual', 'Contains'],
  number: ['Equal', 'NotEqual', 'Greater', 'GreaterOrEqual', 'Less', 'LessOrEqual'],
  boolean: ['Equal'],
  sex: ['Equal', 'NotEqual'],
}

function kindOf(field: AudienceField): Kind {
  return FIELDS.find((f) => f.field === field)?.kind ?? 'text'
}

/** Default value when a field is picked, so the new condition is usable straight away. */
function initialValue(kind: Kind): string {
  switch (kind) {
    case 'boolean':
      return 'true'
    case 'sex':
      return 'Female'
    case 'number':
      return '0'
    default:
      return ''
  }
}

interface Props {
  filter: AudienceFilter
  onChange: (filter: AudienceFilter) => void
  events: EventSummary[]
  segments: SegmentView[]
}

/**
 * The two halves of the audience selection: who is contacted, and the conditions that narrow them.
 * It is a controlled component with no state of its own, so the screen using it can estimate, save
 * as a segment and send on exactly the same filter.
 */
export function AudienceBuilder({ filter, onChange, events, segments }: Props) {
  const { t } = useTranslation()
  const set = <K extends keyof AudienceFilter>(key: K, value: AudienceFilter[K]) =>
    onChange({ ...filter, [key]: value })

  const changeScope = (scope: AudienceScope) =>
    onChange({
      ...filter,
      scope,
      // Drops the reference that no longer applies: a segmentId under scope Event would be noise in
      // the criterion that is saved with the campaign.
      eventId: scope === 'Event' ? (filter.eventId ?? events[0]?.id ?? null) : null,
      segmentId: scope === 'Segment' ? (filter.segmentId ?? segments[0]?.id ?? null) : null,
    })

  const changeCondition = (index: number, condition: AudienceCondition) =>
    set(
      'conditions',
      filter.conditions.map((c, i) => (i === index ? condition : c)),
    )

  const addCondition = () =>
    set('conditions', [...filter.conditions, { field: 'City', operator: 'Equal', value: '' }])

  const removeCondition = (index: number) =>
    set(
      'conditions',
      filter.conditions.filter((_, i) => i !== index),
    )

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">{t('marketing.recipients')}</h2>

        <div className="space-y-2">
          <ScopeOption value="All" current={filter.scope} label={t('audience.allAthletes')} onPick={changeScope} />

          <ScopeOption value="Participants" current={filter.scope} label={t('audience.allParticipants')} onPick={changeScope} />

          <ScopeOption value="Event" current={filter.scope} label={t('audience.raceParticipants')} onPick={changeScope}>
            <Select
              aria-label={t('audiencePage.raceLabel')}
              className="mt-2 w-full sm:w-80"
              value={filter.eventId ?? ''}
              onChange={(e) => set('eventId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('marketing.chooseRace')}</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </Select>
          </ScopeOption>

          <ScopeOption value="Segment" current={filter.scope} label={t('audience.existingSegment')} onPick={changeScope}>
            {segments.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{t('audience.segmentEmpty')}</p>
            ) : (
              <Select
                aria-label={t('audiencePage.segmentLabel')}
                className="mt-2 w-full sm:w-80"
                value={filter.segmentId ?? ''}
                onChange={(e) => set('segmentId', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('marketing.chooseSegment')}</option>
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </Select>
            )}
          </ScopeOption>
        </div>

        {filter.scope === 'Segment' && <p className="text-xs text-muted-foreground">{t('audience.segmentConditions')}</p>}
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('marketing.filters')}</h2>
          <span className="text-xs text-muted-foreground">{t('audience.allConditions')}</span>
        </div>

        {filter.conditions.length === 0 && <p className="text-sm text-muted-foreground">{t('audience.noConditions')}</p>}

        <div className="space-y-2">
          {filter.conditions.map((condition, index) => (
            <ConditionRow
              // The index is the right key here: conditions have no identity of their own and are only added or removed.
              key={index}
              condition={condition}
              first={index === 0}
              onChange={(next) => changeCondition(index, next)}
              onRemove={() => removeCondition(index)}
            />
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addCondition}>
          <Plus size={14} />
          {t('marketing.addFilter')}
        </Button>
      </Card>
    </div>
  )
}

/** Estimated audience card. Exported on its own because the audience screen uses it. */
export function EstimateCard({
  total,
  withWhatsApp,
  withEmail,
  loading,
}: {
  total: number
  withWhatsApp: number
  withEmail: number
  loading?: boolean
}) {
  const { t, i18n } = useTranslation()
  const format = (value: number) => value.toLocaleString(i18n.language)

  return (
    <Card className={cn('p-4', loading && 'opacity-60')}>
      <Label>{t('audience.estimated')}</Label>

      <div className="mt-1 text-3xl font-semibold tabular-nums">{format(total)}</div>
      <div className="text-sm text-muted-foreground">{total === 1 ? t('audience.participant') : t('audience.participants')}</div>

      <p className="mt-3 text-xs text-muted-foreground">{t('audience.consentNote')}</p>

      <dl className="mt-4 space-y-1 border-t pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="font-medium tabular-nums">{format(withWhatsApp)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium tabular-nums">{format(withEmail)}</dd>
        </div>
      </dl>

      {total !== withWhatsApp && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t('audiencePage.sharedNotice', {
            whatsapp: format(withWhatsApp),
            shared: format(total - withWhatsApp),
            sharedLabel: total - withWhatsApp === 1 ? t('audience.sharedOne') : t('audience.sharedMany'),
            note: t('audience.duplicateNote'),
          })}
        </p>
      )}
    </Card>
  )
}

function ScopeOption({
  value,
  current,
  label,
  onPick,
  children,
}: {
  value: AudienceScope
  current: AudienceScope
  label: string
  onPick: (value: AudienceScope) => void
  children?: ReactNode
}) {
  const chosen = current === value

  return (
    <div className={chosen ? 'rounded-md border border-primary/40 bg-accent/40 p-3' : 'p-3'}>
      <label className="flex items-center gap-2 text-sm">
        <input type="radio" name="audience-scope" className="h-4 w-4" checked={chosen} onChange={() => onPick(value)} />
        {label}
      </label>
      {chosen && children}
    </div>
  )
}

function ConditionRow({
  condition,
  first,
  onChange,
  onRemove,
}: {
  condition: AudienceCondition
  first: boolean
  onChange: (condition: AudienceCondition) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const kind = kindOf(condition.field)
  const operators = OPERATORS[kind]

  const changeField = (field: AudienceField) => {
    const nextKind = kindOf(field)

    // Changing the field can invalidate the operator and the value: "City contains x" makes no sense
    // as "Age contains x", so both restart at something valid for the new field.
    onChange({
      field,
      operator: OPERATORS[nextKind].includes(condition.operator) ? condition.operator : OPERATORS[nextKind][0],
      value: nextKind === kind ? condition.value : initialValue(nextKind),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-10 shrink-0 text-xs font-medium uppercase text-muted-foreground">{first ? '' : t('audience.and')}</span>

      <Select aria-label={t('audience.field')} className="w-full sm:w-52" value={condition.field} onChange={(e) => changeField(e.target.value as AudienceField)}>
        {FIELDS.map((f) => (
          <option key={f.field} value={f.field}>
            {t(`audiencePage.fields.${f.field}`)}
          </option>
        ))}
      </Select>

      <Select
        aria-label={t('audience.operator')}
        className="w-full sm:w-32"
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value as AudienceOperator })}
      >
        {operators.map((operator) => (
          <option key={operator} value={operator}>
            {operator === 'Contains' ? t('audiencePage.contains') : OPERATOR_SYMBOL[operator]}
          </option>
        ))}
      </Select>

      <ValueControl kind={kind} value={condition.value} onChange={(value) => onChange({ ...condition, value })} />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        title={t('marketing.removeFilter')}
        className="text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}

function ValueControl({ kind, value, onChange }: { kind: Kind; value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation()

  if (kind === 'boolean') {
    return (
      <Select aria-label={t('audience.value')} className="w-full sm:w-40" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="true">{t('audience.yes')}</option>
        <option value="false">{t('audience.no')}</option>
      </Select>
    )
  }

  if (kind === 'sex') {
    return (
      <Select aria-label={t('audience.value')} className="w-full sm:w-40" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="Female">{t('profile.genderFemale')}</option>
        <option value="Male">{t('profile.genderMale')}</option>
      </Select>
    )
  }

  return (
    <Input
      aria-label={t('audience.value')}
      className="w-full sm:w-52"
      type={kind === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
