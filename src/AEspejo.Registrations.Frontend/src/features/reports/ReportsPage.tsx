'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { events, reports } from '@/api/endpoints'
import type { MasterReport } from '@/api/types'
import { Card, Field, Select } from '@/components/ui/primitives'
import { EmptyState, ErrorNotice, Loading } from '@/components/ui/states'
import { formatMoney } from '@/lib/format'

/** Master report of one event: totals by modality (with revenue), distance, age category and shirt sizes. */
export function ReportsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [eventId, setEventId] = useState(0)

  const eventList = useQuery({ queryKey: ['events', true], queryFn: () => events.list(true) })

  useEffect(() => {
    if (!eventId && eventList.data?.length) setEventId(eventList.data[0].id)
  }, [eventId, eventList.data])

  const report = useQuery({
    queryKey: ['master-report', eventId],
    queryFn: () => reports.master(eventId),
    enabled: eventId > 0,
  })

  if (eventList.isPending) return <Loading />
  if (eventList.isError) return <ErrorNotice error={eventList.error} />
  if (eventList.data.length === 0) {
    return <EmptyState icon={BarChart3} title={t('registrants.empty')} message={t('events.emptyMessage')} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('reports.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.description')}</p>
        </div>

        <div className="w-full sm:w-72">
          <Field id="report-event" label={t('reports.event')}>
            <Select id="report-event" value={eventId} onChange={(e) => setEventId(Number(e.target.value))}>
              {eventList.data.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {report.isPending && eventId > 0 && <Loading text={t('reports.generating')} />}
      {report.isError && <ErrorNotice error={report.error} />}
      {report.data && <ReportContent report={report.data} locale={locale} />}
    </div>
  )
}

function ReportContent({ report, locale }: { report: MasterReport; locale: string }) {
  const { t } = useTranslation()
  const modalityRevenue = report.byModality.reduce((total, row) => total + row.collectedCents, 0)
  const shirtTotal = report.shirts.reduce((total, row) => total + row.count, 0)

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ReportTable title={t('reports.byModality')} headers={[t('reports.type'), t('reports.kit'), t('reports.quantity'), t('reports.revenue')]}>
        {report.byModality.map((row) => (
          <tr key={`${row.modality}-${row.kit}`}>
            <Cell>{row.modality}</Cell>
            <Cell>{row.kit}</Cell>
            <Cell right>{row.count}</Cell>
            <Cell right>{formatMoney(row.collectedCents, locale)}</Cell>
          </tr>
        ))}
        <TotalRow label={t('reports.total')} count={report.totalRegistrations} money={formatMoney(modalityRevenue, locale)} withRevenue />
      </ReportTable>

      <ReportTable title={t('reports.byDistance')} headers={[t('reports.distance'), t('reports.quantity')]}>
        {report.byDistance.map((row) => (
          <tr key={row.distance}>
            <Cell>{row.distance}</Cell>
            <Cell right>{row.count}</Cell>
          </tr>
        ))}
        <TotalRow label={t('reports.total')} count={report.totalRegistrations} />
      </ReportTable>

      <ReportTable title={t('reports.byCategory')} headers={[t('reports.category'), t('reports.quantity')]}>
        {report.byCategory.map((row) => (
          <tr key={row.category}>
            <Cell>{row.category}</Cell>
            <Cell right>{row.count}</Cell>
          </tr>
        ))}
        <TotalRow label={t('reports.total')} count={report.totalRegistrations} />
      </ReportTable>

      <ReportTable title={t('reports.shirts')} headers={[t('reports.gender'), t('reports.size'), t('reports.quantity')]}>
        {report.shirts.map((row) => (
          <tr key={`${row.sex}-${row.size}`}>
            <Cell>{row.sex}</Cell>
            <Cell>{row.size}</Cell>
            <Cell right>{row.count}</Cell>
          </tr>
        ))}
        <TotalRow label={t('reports.total')} count={shirtTotal} />
      </ReportTable>
    </div>
  )
}

function ReportTable({ title, headers, children }: { title: string; headers: string[]; children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {headers.map((header, index) => (
                <th key={`${header}-${index}`} className={`px-5 py-3 font-medium ${index === headers.length - 1 && index > 0 ? 'text-right' : 'text-left'}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">{children}</tbody>
        </table>
      </div>
    </Card>
  )
}

function Cell({ children, right = false }: { children: ReactNode; right?: boolean }) {
  return <td className={`px-5 py-2.5 ${right ? 'text-right tabular-nums' : ''}`}>{children}</td>
}

function TotalRow({ label, count, money, withRevenue = false }: { label: string; count: number; money?: string; withRevenue?: boolean }) {
  return (
    <tr className="bg-muted/30 font-semibold">
      <td className="px-5 py-3" colSpan={withRevenue ? 2 : 1}>
        {label}
      </td>
      {withRevenue ? (
        <>
          <td className="px-5 py-3 text-right tabular-nums">{count}</td>
          <td className="px-5 py-3 text-right tabular-nums">{money}</td>
        </>
      ) : (
        <td className="px-5 py-3 text-right tabular-nums">{count}</td>
      )}
    </tr>
  )
}
