import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export const inputClass =
  'field-input w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-muted/70 transition-colors focus:border-pine focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-pine/25 disabled:opacity-60'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Shown above the input so autofill popovers and mobile keyboards don't cover it. */
  hint?: ReactNode
  /** Server-side error for this field. */
  error?: string
  trailing?: ReactNode
}

export function Field({ label, hint, error, trailing, className, id, ...props }: FieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  return (
    <div className={cn('field flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-semibold">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="field-hint text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-describedby={hint ? hintId : undefined}
          aria-invalid={error ? true : undefined}
          aria-errormessage={error ? errorId : undefined}
          className={cn(inputClass, error && 'border-ember bg-ember-soft', trailing && 'pr-10')}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-ember">
          {error}
        </p>
      )}
    </div>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-ember-soft px-3 py-2 text-sm text-ember">
      {message}
    </p>
  )
}
