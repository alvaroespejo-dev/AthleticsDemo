'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArchiveRestore, FileText, Inbox, MessageSquareText, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { brands, inbox } from '@/api/endpoints'
import type { ConversationSummary, InboxWindow, MessageView } from '@/api/types'
import { Badge, Button, Card, Input, Select, Textarea } from '@/components/ui/primitives'
import { EmptyState, ErrorNotice, InfoNotice, Loading } from '@/components/ui/states'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ReplyTemplateDialog } from './ReplyTemplateDialog'

/** Returns the value only after it has stayed unchanged for a moment: avoids calling the API on every keystroke. */
function useDeferred<T>(value: T, ms: number): T {
  const [deferred, setDeferred] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDeferred(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return deferred
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** The inbox: what customers write to each brand's number, and the operator's replies inside the 24-hour window. */
export function InboxPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const openedFromUrl = Number(searchParams.get('conversation')) || null
  const [conversationId, setConversationId] = useState<number | null>(openedFromUrl)
  const [brandId, setBrandId] = useState<number | ''>('')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [rawSearch, setRawSearch] = useState('')
  const search = useDeferred(rawSearch, 300)
  const [page, setPage] = useState(1)

  const brandList = useQuery({ queryKey: ['brands'], queryFn: () => brands.list(), staleTime: Infinity })

  const list = useQuery({
    queryKey: ['inbox-conversations', { brandId, onlyUnread, search, page }],
    queryFn: () => inbox.list({ brandId, onlyUnread, search: search || undefined, page, size: 25 }),
    placeholderData: keepPreviousData,
    // The inbox has no server push: it refreshes itself so a new message appears without reloading the page.
    refetchInterval: 10000,
  })

  const open = (id: number) => {
    setConversationId(id)
    router.replace(`/marketing/inbox/?conversation=${id}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('nav.inbox')}</h1>
        <p className="text-sm text-muted-foreground">{t('marketing.inbox.description')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="flex max-h-[75vh] flex-col overflow-hidden">
          <div className="space-y-2 border-b p-3">
            <Input
              aria-label={t('marketing.inbox.searchPlaceholder')}
              placeholder={t('marketing.inbox.searchPlaceholder')}
              value={rawSearch}
              onChange={(e) => {
                setRawSearch(e.target.value)
                setPage(1)
              }}
            />
            <Select
              aria-label={t('marketing.inbox.allBrands')}
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value ? Number(e.target.value) : '')
                setPage(1)
              }}
            >
              <option value="">{t('marketing.inbox.allBrands')}</option>
              {brandList.data?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => {
                  setOnlyUnread(e.target.checked)
                  setPage(1)
                }}
              />
              {t('marketing.inbox.onlyUnread')}
            </label>
          </div>

          <div className="flex-1 overflow-y-auto">
            {list.isPending && <Loading />}
            {list.isError && (
              <div className="p-3">
                <ErrorNotice error={list.error} />
              </div>
            )}
            {list.data?.total === 0 && (
              <div className="p-3">
                <EmptyState icon={Inbox} title={t('marketing.inbox.empty')} message={t('marketing.inbox.emptyMessage')} />
              </div>
            )}
            {list.data?.items.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === conversationId}
                locale={locale}
                onClick={() => open(conversation.id)}
              />
            ))}
          </div>

          {list.data && list.data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
              <span>
                {list.data.page}/{list.data.totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={!list.data.hasPrevious} onClick={() => setPage((p) => p - 1)}>
                  ‹
                </Button>
                <Button variant="outline" size="sm" disabled={!list.data.hasNext} onClick={() => setPage((p) => p + 1)}>
                  ›
                </Button>
              </div>
            </div>
          )}
        </Card>

        {conversationId === null ? (
          <Card className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
            {t('marketing.inbox.chooseConversation')}
          </Card>
        ) : (
          <Thread
            key={conversationId}
            id={conversationId}
            onArchived={() => void queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] })}
          />
        )}
      </div>
    </div>
  )
}

function ConversationRow({
  conversation: c,
  active,
  locale,
  onClick,
}: {
  conversation: ConversationSummary
  active: boolean
  locale: string
  onClick: () => void
}) {
  const name = c.profileName || c.athleteName || c.phoneE164

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex w-full items-start gap-2 border-b px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50', active && 'bg-accent')}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(name)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{name}</span>
          {c.lastMessageAt && <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(c.lastMessageAt, locale)}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">{c.lastMessageSummary ?? '—'}</span>
          {c.unreadCount > 0 && (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {c.unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{c.brandName}</span>
      </div>
    </button>
  )
}

/** Human form of a number of minutes: "45 min", "2 h", "2 h 30 min". */
function formatMinutes(minutes: number, t: TFunction) {
  if (minutes < 60) return t('inboxPage.minutes', { count: minutes })
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? t('inboxPage.hours', { count: hours }) : t('inboxPage.hoursMinutes', { hours, minutes: rest })
}

function WindowBar({ window, onReopen }: { window: InboxWindow; onReopen: () => void }) {
  const { t, i18n } = useTranslation()

  if (!window.closesAt) {
    return (
      <InfoNotice>
        {t('marketing.inbox.windowNeverOpened')}.{' '}
        <button type="button" className="underline" onClick={onReopen}>
          {t('marketing.inbox.reopenWithTemplate')}
        </button>
      </InfoNotice>
    )
  }

  if (!window.open) {
    return (
      <InfoNotice>
        {t('marketing.inbox.windowClosed')} ({formatDateTime(window.closesAt, i18n.language)}).{' '}
        <button type="button" className="underline" onClick={onReopen}>
          {t('marketing.inbox.reopenWithTemplate')}
        </button>
      </InfoNotice>
    )
  }

  const nearlyClosed = window.minutesRemaining <= 120

  return (
    <div className={cn('rounded-md border px-3 py-2 text-sm', nearlyClosed ? 'border-yellow-200 bg-yellow-50 text-yellow-800' : 'border-green-200 bg-green-50 text-green-700')}>
      {t('marketing.inbox.windowOpen')} · {t('inboxPage.minutesLeft', { time: formatMinutes(window.minutesRemaining, t) })}
    </div>
  )
}

function messageStatusVariant(status: MessageView['status']) {
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

function Thread({ id, onArchived }: { id: number; onArchived: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [templateOpen, setTemplateOpen] = useState(false)

  const conversation = useQuery({
    queryKey: ['inbox-conversation', id],
    queryFn: () => inbox.get(id),
    refetchInterval: 5000,
  })

  const messages = useQuery({
    queryKey: ['inbox-messages', id],
    queryFn: () => inbox.messages(id),
    refetchInterval: 3000,
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['inbox-conversation', id] })
    void queryClient.invalidateQueries({ queryKey: ['inbox-messages', id] })
    void queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] })
  }

  const markRead = useMutation({ mutationFn: () => inbox.markRead(id), onSuccess: refresh })

  // Opening a conversation with unread messages marks it read.
  useEffect(() => {
    if (conversation.data && conversation.data.unreadCount > 0) markRead.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.data?.unreadCount])

  const reply = useMutation({
    mutationFn: () => inbox.reply(id, text.trim()),
    onSuccess: () => {
      setText('')
      refresh()
    },
  })

  const archive = useMutation({
    mutationFn: (value: boolean) => inbox.archive(id, value),
    onSuccess: () => {
      refresh()
      onArchived()
    },
  })

  if (conversation.isPending) return <Card className="flex min-h-[50vh] items-center justify-center"><Loading /></Card>
  if (conversation.isError) return <Card className="p-4"><ErrorNotice error={conversation.error} /></Card>

  const c = conversation.data
  const name = c.profileName || c.athleteName || c.phoneE164
  const canReply = c.window.open

  return (
    <Card className="flex max-h-[75vh] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {c.phoneE164} · {c.brandName}
            {c.athleteId && (
              <>
                {' · '}
                <a className="underline" href={`/athletes/?id=${c.athleteId}`}>
                  {t('inboxPage.athleteFile')}
                </a>
              </>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" isLoading={archive.isPending} onClick={() => archive.mutate(!c.archived)}>
          {c.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          {c.archived ? t('marketing.inbox.unarchive') : t('marketing.inbox.archive')}
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.isPending && <Loading />}
        {messages.isError && <ErrorNotice error={messages.error} />}
        {messages.data && [...messages.data.items].reverse().map((message) => <Bubble key={message.id} message={message} />)}
      </div>

      <div className="space-y-2 border-t p-3">
        <WindowBar window={c.window} onReopen={() => setTemplateOpen(true)} />

        {reply.isError && <ErrorNotice error={reply.error} />}

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim() && canReply) reply.mutate()
          }}
        >
          <Textarea
            className="min-h-[42px] flex-1"
            placeholder={t('marketing.inbox.writePlaceholder')}
            value={text}
            disabled={!canReply}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (text.trim() && canReply) reply.mutate()
              }
            }}
          />
          <Button type="submit" isLoading={reply.isPending} disabled={!canReply || !text.trim()}>
            <Send size={14} />
            {t('marketing.inbox.send')}
          </Button>
        </form>
      </div>

      {templateOpen && (
        <ReplyTemplateDialog
          conversationId={id}
          brandCode={c.brandCode}
          onClose={() => setTemplateOpen(false)}
          onSent={() => {
            setTemplateOpen(false)
            refresh()
          }}
        />
      )}
    </Card>
  )
}

function Bubble({ message: m }: { message: MessageView }) {
  const { i18n } = useTranslation()
  const outbound = m.direction === 'Outbound'

  return (
    <div className={cn('flex', outbound ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%] rounded-lg px-3 py-2 text-sm', outbound ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        {m.contentType === 'Template' && (
          <div className="mb-1 flex items-center gap-1 text-xs opacity-80">
            <FileText size={12} /> {m.templateName}
          </div>
        )}

        {m.hasMedia ? <MediaBubble message={m} /> : null}

        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}

        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
          {formatDateTime(m.messageAt, i18n.language)}
          {outbound && <Badge variant={messageStatusVariant(m.status)}>{m.status}</Badge>}
        </div>
        {m.error && (
          <p className="mt-1 text-xs text-destructive" title={m.error}>
            {m.error.slice(0, 120)}
          </p>
        )}
      </div>
    </div>
  )
}

/** Fetches the authenticated media and shows it by type. Shows a placeholder until the server has downloaded it. */
function MediaBubble({ message: m }: { message: MessageView }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!m.mediaAvailable) return

    let cancelled = false
    let objectUrl: string | null = null

    inbox.mediaBlob(m.id).then((blob) => {
      if (cancelled) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [m.id, m.mediaAvailable])

  if (!m.mediaAvailable) {
    return (
      <div className="mb-1 flex items-center gap-1 text-xs opacity-80">
        <MessageSquareText size={12} /> {t('marketing.inbox.noMedia')}
      </div>
    )
  }

  if (!url) return <Loading text={t('marketing.inbox.noMedia')} />

  if (m.contentType === 'Image' || m.contentType === 'Sticker') {
    // eslint-disable-next-line @next/next/no-img-element -- object URL of a fetched file
    return <img src={url} alt="" className="mb-1 max-h-64 rounded-md" />
  }

  if (m.contentType === 'Audio') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <audio className="mb-1 max-w-full" controls src={url} />
  }

  if (m.contentType === 'Video') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video className="mb-1 max-h-64 max-w-full" controls src={url} />
  }

  return (
    <a href={url} download={m.mediaFileName ?? undefined} className="mb-1 flex items-center gap-1 underline">
      <FileText size={14} />
      {m.mediaFileName ?? t('marketing.inbox.downloadFile')}
    </a>
  )
}
