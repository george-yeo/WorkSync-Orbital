import { CheckSquare, LogOut, MessagesSquare, Sprout, UsersRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth, useMe } from '../../auth/AuthProvider'
import { cn } from '../../lib/cn'
import { useInvites } from '../../lib/queries'
import { useRealtime } from '../../realtime/SocketProvider'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/Button'
import { ThemeToggle } from '../ui/ThemeToggle'

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight',
        className,
      )}
    >
      <span className="inline-flex size-7 items-center justify-center rounded-lg bg-pine text-sprout">
        <Sprout className="size-4.5" strokeWidth={2.5} />
      </span>
      WorkSync
    </span>
  )
}

function useNavItems() {
  const invites = useInvites()
  const { unread } = useRealtime()
  return [
    { to: '/', label: 'Tasks', icon: CheckSquare, end: true, badge: 0 },
    {
      to: '/groups',
      label: 'Groups',
      icon: UsersRound,
      end: false,
      badge: invites.data?.length ?? 0,
    },
    { to: '/chat', label: 'Chat', icon: MessagesSquare, end: false, badge: unread.size },
  ]
}

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-sprout px-1.5 text-xs font-bold text-ink tabular-nums">
      {count}
      <span className="sr-only"> new</span>
    </span>
  )
}

function GuestBanner() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-pine px-4 py-2 text-center text-sm text-pine-ink">
      <span>
        <span className="sm:hidden">Demo account, resets in 24 hours.</span>
        <span className="hidden sm:inline">
          You're exploring a demo account. It's private to you and resets after 24 hours.
        </span>
      </span>
      <button
        type="button"
        className="cursor-pointer font-semibold underline underline-offset-2"
        onClick={() => {
          logout()
          navigate('/signup')
        }}
      >
        Create a real account
      </button>
    </div>
  )
}

export function AppShell() {
  const me = useMe()
  const { logout } = useAuth()
  const items = useNavItems()

  return (
    <div className="flex h-dvh flex-col">
      {me.isGuest && <GuestBanner />}
      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-paper px-3 py-5 md:flex">
          <Logo className="px-3" />
          <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
            {items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors',
                    isActive
                      ? 'bg-pine-soft text-pine'
                      : 'text-muted hover:bg-sunken hover:text-ink',
                  )
                }
              >
                <Icon className="size-5" />
                {label}
                <Badge count={badge} />
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-1 border-t border-line pt-4">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sunken',
                  isActive && 'bg-sunken',
                )
              }
            >
              <Avatar id={me.id} name={me.displayName} version={me.avatarVersion} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{me.displayName}</span>
                <span className="block truncate text-xs text-muted">@{me.username}</span>
              </span>
            </NavLink>
            <ThemeToggle />
            <IconButton label="Log out" onClick={logout}>
              <LogOut className="size-4.5" />
            </IconButton>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex items-center justify-between border-b border-line bg-paper px-4 py-3 md:hidden">
            <Logo />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NavLink to="/profile" aria-label="Profile" className="rounded-full">
                <Avatar id={me.id} name={me.displayName} version={me.avatarVersion} size="sm" />
              </NavLink>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="grid shrink-0 grid-cols-3 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 py-2 text-xs font-medium',
                isActive ? 'text-pine' : 'text-muted',
              )
            }
          >
            <Icon className="size-5" />
            {label}
            {badge > 0 && (
              <span className="absolute top-1.5 left-[calc(50%+0.5rem)] size-2 rounded-full bg-sprout" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
