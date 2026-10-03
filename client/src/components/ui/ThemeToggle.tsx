import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { IconButton } from './Button'

type Scheme = 'light' | 'dark'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')
const systemScheme = (): Scheme => (media().matches ? 'dark' : 'light')

function readPinned(): Scheme | null {
  try {
    const v = localStorage.getItem('color-scheme')
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function apply(pinned: Scheme | null) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
  if (meta) meta.content = pinned ?? 'light dark'
  if (pinned) document.documentElement.dataset.theme = pinned
  else delete document.documentElement.dataset.theme
  try {
    if (pinned) localStorage.setItem('color-scheme', pinned)
    else localStorage.removeItem('color-scheme')
  } catch {
    /* ignore */
  }
}

/**
 * Two states: follow the system, or pin the opposite. Pinning stores the concrete scheme, so a
 * later OS change doesn't flip it back.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [pinned, setPinned] = useState<Scheme | null>(readPinned)
  const [system, setSystem] = useState<Scheme>(systemScheme)

  useEffect(() => {
    const m = media()
    const onChange = () => setSystem(systemScheme())
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])

  const effective = pinned ?? system
  const toggle = () => {
    const next: Scheme = effective === 'dark' ? 'light' : 'dark'
    const value = next === system ? null : next
    apply(value)
    setPinned(value)
  }

  return (
    <IconButton
      label={effective === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
      className={className}
    >
      {effective === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </IconButton>
  )
}
