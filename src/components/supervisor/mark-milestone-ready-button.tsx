'use client'

import { useTransition } from 'react'
import { CheckCircle } from 'lucide-react'
import { markMilestoneReady } from '@/app/actions/milestones'

interface MarkMilestoneReadyButtonProps {
  milestoneId: string
  projectId: string
  label?: string
}

export function MarkMilestoneReadyButton({ milestoneId, projectId, label }: MarkMilestoneReadyButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await markMilestoneReady(milestoneId, projectId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <CheckCircle className="w-3.5 h-3.5" />
      {isPending ? 'A marcar...' : (label ?? 'Marco pronto')}
    </button>
  )
}
