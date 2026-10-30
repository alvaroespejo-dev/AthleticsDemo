'use client'

import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './primitives'

export interface ActionRow {
  key: number | string
  cells: ReactNode[]
  /** Name used in the edit and delete button labels for screen readers. */
  label: string
  onEdit: () => void
  onDelete: () => void
}

interface ActionTableProps {
  columns: string[]
  rows: ActionRow[]
  /** Indexes of the columns aligned to the right (amounts, counts). */
  rightAligned?: number[]
  showActions: boolean
}

/** Plain table with an edit and a delete button on each row, as the admin panel uses everywhere. */
export function ActionTable({ columns, rows, rightAligned = [], showActions }: ActionTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
                  rightAligned.includes(index) ? 'text-right' : 'text-left'
                }`}
              >
                {column}
              </th>
            ))}
            {showActions && <th className="w-20" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t">
              {row.cells.map((cell, index) => (
                <td
                  key={index}
                  className={`whitespace-nowrap px-3 py-2 ${rightAligned.includes(index) ? 'text-right tabular-nums' : ''}`}
                >
                  {cell}
                </td>
              ))}

              {showActions && (
                <td className="px-2 py-1">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={row.onEdit}
                      aria-label={t('modalities.editRow', { name: row.label })}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={row.onDelete}
                      aria-label={t('modalities.deleteRow', { name: row.label })}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
