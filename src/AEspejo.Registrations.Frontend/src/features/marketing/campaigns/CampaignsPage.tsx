'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, MessageCircle, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { campaigns } from '@/api/endpoints'
import type { CampaignProgress, CampaignStatus, CampaignSummary, MessageStatus } from '@/api/types'
import { Badge, Button, Card, Select } from '@/components/ui/primitives'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState, ErrorNotice, InfoNotice, Loading, SuccessNotice } from '@/components/ui/states'
import { formatDateTime } from '@/lib/format'

const MESSAGE_STATUSES: MessageStatus[] = ['Pending', 'Sent', 'Delivered', 'Read', 'Failed']

function campaignStatusVariant(status: CampaignStatus) {
  switch (status) {
    case 'Sent':
      return 'success' as const
    case 'Sending':
      return 'info' as const
    case 'Scheduled':
      return 'warning' as const
    case 'Cancelled':
      return 'destructive' as const
    default:
      return 'default' as const
  }
}

function messageStatusVariant(status: MessageStatus) {
  switch (status) {
    case 'Delivered':
    case 'Read':
      return 'success' as const
    case 'Sent':
      return 'info' as const
    case 'Failed':
      return 'destructive' as const
    default:
      return 'default' as const
  }
}

/** Campaigns list, and the detail of the one chosen in the URL (`?campaign=id`) or in the list. */
export function CampaignsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [openedId, setOpenedId] = useState<number | null>(Number(params.get('campaign')) || null)
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)

  const list = useQuery({
    queryKey: ['campaigns', page],
    queryFn: () => campaigns.list(page),
    placeholderData: keepPreviousData,
    // While a campaign is in progress its counters move on their own: refresh so the operator does not
    // have to reload to watch them advance.
    refetchInterval: (query) => (query.state.data?.items.some((c) => c.status === 'Sending') ? 5000 : false),
  })

  const closeDetail = () => {
    setOpenedId(null)
    router.replace(pathname)
  }

  if (list.isPending) return <Loading />
  if (list.isError) return <ErrorNotice error={list.error} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('nav.campaigns')}</h1>
        <p className="text-sm text-muted-foreground">{t('campaigns.description')}</p>
      </div>

      {notice && <SuccessNotice>{notice}</SuccessNotice>}

      {list.data.total === 0 ? (
        <EmptyState icon={MessageCircle} title={t('campaigns.empty')} message={t('campaigns.emptyMessage')} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {(['name', 'status', 'brand', 'event', 'template', 'progress', 'created', 'sent'] as const).map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {t(`campaignsPage.columns.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((campaign) => (
                  <CampaignRow key={campaign.id} campaign={campaign} onOpen={() => setOpenedId(campaign.id)} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {t('campaignsPage.pageSummary', {
                total: list.data.total,
                noun: t(list.data.total === 1 ? 'campaignsPage.campaignOne' : 'campaignsPage.campaignMany'),
                page: list.data.page,
                pages: list.data.totalPages,
              })}
            </span>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!list.data.hasPrevious} onClick={() => setPage((p) => p - 1)}>
                {t('pagination.previous')}
              </Button>
              <Button variant="outline" size="sm" disabled={!list.data.hasNext} onClick={() => setPage((p) => p + 1)}>
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {openedId !== null && (
        <CampaignDetailDialog id={openedId} onClose={closeDetail} onAction={setNotice} />
      )}
    </div>
  )
}

function CampaignRow({ campaign, onOpen }: { campaign: CampaignSummary; onOpen: () => void }) {
  const { t, i18n } = useTranslation()

  return (
    <tr className="cursor-pointer border-t hover:bg-accent/50" onClick={onOpen}>
      <td className="whitespace-nowrap px-3 py-2 font-medium">{campaign.name}</td>
      <td className="px-3 py-2">
        <Badge variant={campaignStatusVariant(campaign.status)}>{t(`campaignsPage.campaignStatus.${campaign.status}`)}</Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{campaign.brandName}</td>
      <td className="whitespace-nowrap px-3 py-2">{campaign.eventName ?? '—'}</td>
      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{campaign.templateName ?? '—'}</td>
      <td className="px-3 py-2">
        <ProgressBar progress={campaign.progress} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDateTime(campaign.createdAt, i18n.language)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
        {campaign.sentAt ? formatDateTime(campaign.sentAt, i18n.language) : '—'}
      </td>
    </tr>
  )
}

function ProgressBar({ progress }: { progress: CampaignProgress }) {
  const { t } = useTranslation()
  const { total, sent, delivered, read, failed } = progress
  const left = sent + delivered + read

  const percent = (part: number) => (total === 0 ? 0 : (part / total) * 100)

  return (
    <div className="min-w-32">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-green-500" style={{ width: `${percent(left)}%` }} />
        <div className="bg-destructive" style={{ width: `${percent(failed)}%` }} />
      </div>
      <div className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
        {left}/{total}
        {failed > 0 && <span className="text-destructive"> · {t('campaignsPage.failedCount', { amount: failed })}</span>}
      </div>
    </div>
  )
}

function CampaignDetailDialog({
  id,
  onClose,
  onAction,
}: {
  id: number
  onClose: () => void
  onAction: (message: string) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<MessageStatus | ''>('')

  const campaign = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaigns.get(id),
    refetchInterval: (query) => (query.state.data?.status === 'Sending' ? 5000 : false),
  })

  const recipients = useQuery({
    queryKey: ['campaign-recipients', id, status],
    queryFn: () => campaigns.recipients(id, status, 1),
    placeholderData: keepPreviousData,
    refetchInterval: campaign.data?.status === 'Sending' ? 5000 : false,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    void queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    void queryClient.invalidateQueries({ queryKey: ['campaign-recipients', id] })
  }

  const send = useMutation({
    mutationFn: () => campaigns.send(id),
    onSuccess: (updated) => {
      invalidate()
      onAction(t('campaignsPage.queued', { name: updated.name }))
    },
  })

  const cancel = useMutation({
    mutationFn: () => campaigns.cancel(id),
    onSuccess: (updated) => {
      invalidate()
      onAction(t('campaignsPage.cancelled', { name: updated.name }))
    },
  })

  return (
    <Dialog
      open
      title={campaign.data?.name ?? t('campaignsPage.defaultTitle')}
      className="max-w-4xl"
      onClose={onClose}
    >
      {campaign.isPending && <Loading />}
      {campaign.isError && <ErrorNotice error={campaign.error} />}

      {campaign.data && (
        <div className="space-y-4">
          {send.isError && <ErrorNotice error={send.error} />}
          {cancel.isError && <ErrorNotice error={cancel.error} />}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={campaignStatusVariant(campaign.data.status)}>
              {t(`campaignsPage.campaignStatus.${campaign.data.status}`)}
            </Badge>
            <span className="text-sm text-muted-foreground">{campaign.data.brandName}</span>
            {campaign.data.eventName && <span className="text-sm text-muted-foreground">{campaign.data.eventName}</span>}
            {campaign.data.provider && (
              <span className="text-xs text-muted-foreground">{t('campaignsPage.sentBy', { provider: campaign.data.provider })}</span>
            )}
          </div>

          {campaign.data.provider === 'simulated' && <InfoNotice>{t('campaignsPage.simulatedNotice')}</InfoNotice>}

          <div className="rounded-md border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('campaignsPage.message')}</p>
            <p className="whitespace-pre-wrap text-sm">{campaign.data.body}</p>
            {campaign.data.templateName && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {t('campaignsPage.templateLine', { name: campaign.data.templateName, language: campaign.data.templateLanguage })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <Counter label={t('campaignsPage.counters.total')} value={campaign.data.progress.total} />
            <Counter label={t('campaignsPage.counters.pending')} value={campaign.data.progress.pending} />
            <Counter label={t('campaignsPage.counters.sent')} value={campaign.data.progress.sent} tone="text-blue-600" />
            <Counter label={t('campaignsPage.counters.delivered')} value={campaign.data.progress.delivered} tone="text-green-600" />
            <Counter label={t('campaignsPage.counters.read')} value={campaign.data.progress.read} />
            <Counter
              label={t('campaignsPage.counters.failed')}
              value={campaign.data.progress.failed}
              tone={campaign.data.progress.failed > 0 ? 'text-destructive' : undefined}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(campaign.data.status === 'Draft' || campaign.data.status === 'Scheduled') && (
              <Button isLoading={send.isPending} onClick={() => send.mutate()}>
                <Send size={14} />
                {t('campaignsPage.sendNow')}
              </Button>
            )}

            {campaign.data.status !== 'Sent' && campaign.data.status !== 'Cancelled' && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                isLoading={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                <Ban size={14} />
                {t('campaignsPage.cancelCampaign')}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('campaignsPage.recipients')}</h3>
              <Select
                aria-label={t('campaignsPage.filterByStatus')}
                className="w-44"
                value={status}
                onChange={(e) => setStatus(e.target.value as MessageStatus | '')}
              >
                <option value="">{t('campaignsPage.all')}</option>
                {MESSAGE_STATUSES.map((messageStatus) => (
                  <option key={messageStatus} value={messageStatus}>
                    {t(`campaignsPage.messageStatus.${messageStatus}`)}
                  </option>
                ))}
              </Select>
            </div>

            {recipients.isError && <ErrorNotice error={recipients.error} />}

            {recipients.data && (
              <div className="max-h-80 overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <tbody>
                    {recipients.data.items.map((recipient) => (
                      <tr key={recipient.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">
                          <Badge variant={messageStatusVariant(recipient.status)}>
                            {t(`campaignsPage.messageStatus.${recipient.status}`)}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-medium">{recipient.athleteName}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{recipient.phone}</td>
                        <td className="px-3 py-2 text-xs text-destructive">
                          {recipient.lastError && (
                            <span title={recipient.lastError}>
                              {recipient.lastError.slice(0, 80)}
                              {recipient.lastError.length > 80 && '…'}
                              {recipient.attempts > 1 && ` ${t('campaignsPage.attempts', { amount: recipient.attempts })}`}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {recipients.data.total > recipients.data.items.length && (
                  <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                    {t('campaignsPage.showingOf', { shown: recipients.data.items.length, total: recipients.data.total })}
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </Dialog>
  )
}

function Counter({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-md border p-2 text-center">
      <div className={`text-lg font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
