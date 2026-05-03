'use client'

import { useTransition } from 'react'
import { updateIssueStatus } from '@/app/actions/issues'
import type { IssueStatus } from '@/types'

interface UpdateIssueStatusButtonProps {
  issueId: string
  newStatus: IssueStatus
  label: string
  className?: string
}

export function UpdateIssueStatusButton({ issueId, newStatus, label, className }: UpdateIssueStatusButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await updateIssueStatus(issueId, newStatus)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={className ?? 'px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'}
    >
      {isPending ? '...' : label}
    </button>
  )
}
