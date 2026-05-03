'use client'

import { useTransition } from 'react'
import { updateUserRole } from '@/app/(dashboard)/admin/utilizadores/actions'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['mario', 'sofia', 'susana', 'ana', 'supervisor', 'gustavo', 'admin']

export function RoleSelect({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: UserRole
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole
    startTransition(async () => {
      await updateUserRole(userId, role)
    })
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  )
}
