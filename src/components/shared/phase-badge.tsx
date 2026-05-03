import { cn } from '@/lib/utils'
import { CURRENT_PHASE_LABELS, type CurrentPhase } from '@/types'

interface PhaseBadgeProps {
  phase: CurrentPhase
  className?: string
}

export function PhaseBadge({ phase, className }: PhaseBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700',
        className
      )}
    >
      {CURRENT_PHASE_LABELS[phase]}
    </span>
  )
}
