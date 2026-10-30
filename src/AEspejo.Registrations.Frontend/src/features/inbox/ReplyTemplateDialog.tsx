'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { inbox, whatsAppTemplates } from '@/api/endpoints'
import type { WhatsAppTemplate } from '@/api/types'
import { FormDialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/primitives'
import { ErrorNotice, InfoNotice, Loading } from '@/components/ui/states'

interface Props {
  conversationId: number
  brandCode: string
  onClose: () => void
  onSent: () => void
}

function keyOf(template: WhatsAppTemplate) {
  return `${template.name}|${template.language}`
}

/**
 * Reopens the contact with an approved template: the only path Meta allows outside the 24-hour window.
 * Asks for one value per positional parameter the template declares.
 */
export function ReplyTemplateDialog({ conversationId, brandCode, onClose, onSent }: Props) {
  const { t } = useTranslation()
  const [key, setKey] = useState('')
  const [parameters, setParameters] = useState<string[]>([])

  const templates = useQuery({
    queryKey: ['whatsapp-templates', brandCode],
    queryFn: () => whatsAppTemplates.list(brandCode),
    retry: false,
  })

  const template = templates.data?.find((item) => keyOf(item) === key)

  const choose = (nextKey: string) => {
    setKey(nextKey)
    const chosen = templates.data?.find((item) => keyOf(item) === nextKey)
    setParameters(Array.from({ length: chosen?.parameterCount ?? 0 }, () => ''))
  }

  const send = useMutation({
    mutationFn: () =>
      inbox.replyWithTemplate(conversationId, {
        templateName: template!.name,
        language: template!.language,
        parameters,
      }),
    onSuccess: onSent,
  })

  const canSend = !!template && parameters.every((p) => p.trim().length > 0)

  return (
    <FormDialog
      open
      title={t('marketing.inbox.reopenWithTemplate')}
      onClose={onClose}
      onSave={() => canSend && send.mutate()}
      saving={send.isPending}
      disabled={!canSend}
    >
      {send.isError && <ErrorNotice error={send.error} />}

      <InfoNotice>{t('inboxPage.policyNotice')}</InfoNotice>

      <Field id="reply-template" label={t('inboxPage.approvedTemplate')}>
        {templates.isPending ? (
          <Loading />
        ) : templates.isError ? (
          <ErrorNotice error={templates.error} />
        ) : templates.data.length === 0 ? (
          <InfoNotice>{t('inboxPage.noTemplates')}</InfoNotice>
        ) : (
          <Select id="reply-template" required value={key} onChange={(e) => choose(e.target.value)}>
            <option value="">{t('inboxPage.chooseTemplate')}</option>
            {templates.data.map((item) => (
              <option key={keyOf(item)} value={keyOf(item)}>
                {item.name} · {item.language}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {template && (
        <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
          <p className="whitespace-pre-wrap font-mono text-xs">{template.body}</p>

          {parameters.map((value, index) => (
            <Field key={index} id={`parameter-${index}`} label={t('inboxPage.parameter', { number: `{{${index + 1}}}` })}>
              <Input
                id={`parameter-${index}`}
                required
                value={value}
                placeholder={template.bodyExamples[index] ?? ''}
                onChange={(e) => setParameters((prev) => prev.map((p, j) => (j === index ? e.target.value : p)))}
              />
            </Field>
          ))}
        </div>
      )}
    </FormDialog>
  )
}
