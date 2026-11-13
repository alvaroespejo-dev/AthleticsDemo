'use client'

import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './primitives'

interface AccordionItemProps {
  title: ReactNode
  open: boolean
  onToggle: () => void
  /** Buttons or other header controls, outside the area that opens and closes the panel. */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Loose expandable panel, like a single expansion panel: a clickable header plus collapsible content.
 * The `actions` sit apart from the button that toggles the panel (not inside it) so that one button is
 * never nested inside another.
 */
export function AccordionItem({ title, open, onToggle, actions, children, className }: AccordionItemProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 text-left font-semibold"
        >
          <ChevronDown size={18} className={cn('shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} />
          {title}
        </button>
        {actions}
      </div>
      {open && <div className="border-t px-5 py-4">{children}</div>}
    </Card>
  )
}
