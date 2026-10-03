import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { IconButton } from './Button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
}

/** Native modal <dialog>: focus trapping, Esc to close and inert background come for free. */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Click on the backdrop (the dialog element itself, outside the panel) closes it.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="dialog-title"
      className={cn(
        'ws-dialog m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-line bg-paper p-0 text-ink shadow-2xl',
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-5 p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="dialog-title" className="text-xl font-semibold">
                {title}
              </h2>
              {description && <p className="text-sm text-muted">{description}</p>}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mt-1 -mr-2">
              <X className="size-5" />
            </IconButton>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
