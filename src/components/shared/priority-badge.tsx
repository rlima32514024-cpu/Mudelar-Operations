import { cn } from '@/lib/utils'
import type { IssuePriority } from '@/types'

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Normal: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-500',
}

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  Urgent: 'Urgente',
  High: 'Alta',
  Normal: 'Normal',
  Low: 'Baixa',
}

interface PriorityBadgeProps {
  priority: IssuePriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        PRIORITY_COLORS[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
