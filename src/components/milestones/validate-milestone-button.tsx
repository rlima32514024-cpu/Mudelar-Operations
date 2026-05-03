'use client'

import { useTransition } from 'react'
import { CheckSquare } from 'lucide-react'
import { validateMilestone } from '@/app/actions/milestones'

interface ValidateMilestoneButtonProps {
  milestoneId: string
  projectId: string
}

export function ValidateMilestoneButton({ milestoneId, projectId }: ValidateMilestoneButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await validateMilestone(milestoneId, projectId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <CheckSquare className="w-3.5 h-3.5" />
      {isPending ? 'A validar...' : 'Validar'}
    </button>
  )
}
