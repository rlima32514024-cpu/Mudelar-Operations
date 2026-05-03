import { cn } from '@/lib/utils'
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, type StartRiskLevel } from '@/types'

interface RiskBadgeProps {
  risk: StartRiskLevel | null | undefined
  className?: string
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  if (!risk) return null

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        RISK_LEVEL_COLORS[risk],
        className
      )}
    >
      {RISK_LEVEL_LABELS[risk]}
    </span>
  )
}
