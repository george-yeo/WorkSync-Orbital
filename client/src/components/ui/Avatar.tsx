import { useState } from 'react'
import { avatarUrl } from '../../lib/api'
import { cn } from '../../lib/cn'

const HUES = ['#2f6b4f', '#7a5a2f', '#4b5f8a', '#8a4b5f', '#5e7a2f', '#2f6f7a', '#6b4f8a']

function hueFor(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return HUES[h % HUES.length]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (
    ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase() ||
    '?'
  )
}

interface AvatarProps {
  kind?: 'user' | 'group'
  id: string
  name: string
  version: number | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
  className?: string
}

const sizes = {
  xs: 'size-6 text-[0.6rem]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-24 text-3xl',
}

export function Avatar({
  kind = 'user',
  id,
  name,
  version,
  size = 'md',
  online,
  className,
}: AvatarProps) {
  const src = avatarUrl(kind, id, version)
  const [failed, setFailed] = useState<string | null>(null)
  const showImage = src && failed !== src
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center overflow-hidden font-display font-semibold text-white select-none',
          kind === 'group' ? 'rounded-[28%]' : 'rounded-full',
          sizes[size],
        )}
        style={showImage ? undefined : { backgroundColor: hueFor(id) }}
        aria-hidden="true"
      >
        {showImage ? (
          <img
            src={src}
            alt=""
            className="size-full object-cover"
            onError={() => setFailed(src)}
            loading="lazy"
          />
        ) : (
          initials(name)
        )}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-paper',
            online ? 'bg-sprout' : 'bg-line',
          )}
        >
          <span className="sr-only">{online ? 'Online' : 'Offline'}</span>
        </span>
      )}
    </span>
  )
}
