import type { ReactNode } from 'react'

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-line px-5 py-8">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="max-w-prose text-sm text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
