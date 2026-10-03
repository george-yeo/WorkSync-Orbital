import type { ReactNode } from 'react'
import { Logo } from '../../components/layout/AppShell'
import { ThemeToggle } from '../../components/ui/ThemeToggle'

/** Sprout → sapling → tree, played once on load: the product's idea in one gesture. */
function GrowthSequence() {
  const stages = [
    { src: 'sprout', size: 'w-16', delay: '150ms' },
    { src: 'sapling', size: 'w-24', delay: '550ms' },
    { src: 'tree', size: 'w-40', delay: '950ms' },
  ]
  return (
    <div aria-hidden="true">
      <div className="flex items-end gap-6">
        {stages.map((s) => (
          <img
            key={s.src}
            src={`/synctree/${s.src}.png`}
            alt=""
            className={`${s.size} origin-bottom opacity-0`}
            style={{ animation: `grow-in 600ms cubic-bezier(.2,.8,.3,1.2) ${s.delay} forwards` }}
          />
        ))}
      </div>
      <div className="h-2.5 w-full rounded-t-[50%] bg-[#8a5a3b]" />
    </div>
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#1e4636] p-10 text-[#eef4ec] md:flex lg:p-14">
        <Logo className="text-[#eef4ec] [&>span]:bg-[#a6c94a] [&>span]:text-[#1e4636]" />
        <div className="flex max-w-md flex-col gap-10">
          <GrowthSequence />
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-3xl leading-tight font-bold lg:text-4xl">
              Get things done together, and grow a forest while you're at it.
            </h1>
            <p className="text-lg text-[#c9d8cc]">
              Shared task lists, group chat, and a SyncTree that grows every time someone on your
              team ticks off a task.
            </p>
          </div>
        </div>
        <p className="text-sm text-[#9fb5a6]">Built for NUS Orbital, rebuilt in 2026.</p>
      </section>

      <section className="flex flex-col">
        <header className="flex items-center justify-between p-5 md:justify-end">
          <Logo className="md:hidden" />
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </section>
    </div>
  )
}
