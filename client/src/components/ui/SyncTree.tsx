import { cn } from '../../lib/cn'
import type { Tree } from '../../lib/types'

const MAX_SHOWN = 14

function stageFor(tree: Tree): 'tree' | 'sapling' | 'sprout' | 'none' {
  if (tree.isGrowing) return tree.progress >= 50 ? 'sapling' : 'sprout'
  return tree.grown > 0 ? 'tree' : 'none'
}

/** Tiny inline forest used in group lists: one tree glyph per grown tree. */
export function ForestCount({ grown, className }: { grown: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm text-muted', className)}
      title={`${grown} SyncTrees grown`}
    >
      <img src="/synctree/tree.png" alt="" className="size-4" />
      <span>{grown}</span>
      <span className="sr-only">trees grown</span>
    </span>
  )
}

/**
 * The group's forest: every finished SyncTree stands on the ground line, and the one currently
 * growing sits at the end, sized by its progress.
 */
export function Forest({ tree, className }: { tree: Tree; className?: string }) {
  const stage = stageFor(tree)
  const shown = Math.min(tree.grown, MAX_SHOWN)
  const hidden = tree.grown - shown
  const growingScale = 0.55 + (tree.progress / 100) * 0.45

  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden="true">
      <div
        className={cn(
          'flex items-end gap-1 px-4 sm:px-6',
          stage === 'none' ? 'h-24' : 'h-32 sm:h-40',
        )}
      >
        {Array.from({ length: shown }, (_, i) => (
          <img
            key={i}
            src="/synctree/tree.png"
            alt=""
            className="w-[clamp(3rem,7vw,4.75rem)] shrink-0"
            style={{ marginBottom: `${(i % 3) * 2}px` }}
          />
        ))}
        {hidden > 0 && (
          <span className="mb-2 shrink-0 rounded-full bg-pine-soft px-2 py-0.5 text-sm font-semibold text-pine">
            +{hidden}
          </span>
        )}
        {(stage === 'sprout' || stage === 'sapling') && (
          <img
            src={`/synctree/${stage}.png`}
            alt=""
            className="ml-auto w-[clamp(5.5rem,15vw,9rem)] origin-bottom transition-transform duration-700"
            style={{ transform: `scale(${growingScale})` }}
          />
        )}
        {stage === 'none' && (
          <span className="mx-auto mb-2 text-sm text-muted">
            An empty plot, waiting for its first tree.
          </span>
        )}
      </div>
      <div className="h-3 rounded-t-[50%] bg-bark/80" />
    </div>
  )
}

export function TreeProgress({ tree }: { tree: Tree }) {
  if (!tree.isGrowing) return null
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={tree.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="SyncTree growth"
      >
        <div
          className="h-full rounded-full bg-sprout transition-[width] duration-700"
          style={{ width: `${tree.progress}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums">{tree.progress}%</span>
    </div>
  )
}
