import type { ReactNode } from 'react'

/** Big value over a small caption, used for the summary numbers on cards and detail pages. */
export function Metric({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
