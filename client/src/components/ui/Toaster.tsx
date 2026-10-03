import { CircleCheck, CircleAlert, X } from 'lucide-react'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'

type Tone = 'success' | 'error'
interface Toast {
  id: number
  tone: Tone
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

function ToastItem({
  toast,
  index,
  onDone,
}: {
  toast: Toast
  index: number
  onDone: (id: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    // popover="manual": stays in the top layer above dialogs, no light-dismiss.
    el?.showPopover?.()
    const timer = setTimeout(() => onDone(toast.id), toast.tone === 'error' ? 6000 : 3500)
    return () => clearTimeout(timer)
  }, [toast, onDone])

  const Icon = toast.tone === 'success' ? CircleCheck : CircleAlert
  return (
    <div
      ref={ref}
      popover="manual"
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="ws-toast flex max-w-sm items-start gap-3 rounded-xl border border-line bg-paper py-3 pr-2 pl-3.5 text-sm text-ink shadow-lg"
      style={{ marginBottom: `${index * 4.25}rem` }}
    >
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          toast.tone === 'success' ? 'text-pine' : 'text-ember',
        )}
      />
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDone(toast.id)}
        aria-label="Dismiss"
        className="-mt-0.5 cursor-pointer rounded p-0.5 text-muted hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const push = useCallback((tone: Tone, message: string) => {
    const id = nextId.current++
    setToasts((prev) => [...prev.slice(-2), { id, tone, message }])
  }, [])
  const dismiss = useCallback(
    (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  )

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m) }),
    [push],
  )

  return (
    <ToastContext value={api}>
      {children}
      {toasts.map((t, i) => (
        <ToastItem key={t.id} toast={t} index={toasts.length - 1 - i} onDone={dismiss} />
      ))}
    </ToastContext>
  )
}

export function useToast(): ToastApi {
  const ctx = use(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <Toaster>')
  return ctx
}
