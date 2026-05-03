'use client'

import { useActionState, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { UserPlus, X } from 'lucide-react'
import { inviteUser } from '@/app/(dashboard)/admin/utilizadores/actions'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['mario', 'sofia', 'susana', 'ana', 'supervisor', 'gustavo', 'admin']
const initialState: { error: string | null; success: boolean; message?: string } = {
  error: null,
  success: false,
}

export function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(inviteUser, initialState)

  // Close dialog on success
  if (state.success && open) setOpen(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          <UserPlus className="w-4 h-4" />
          Convidar utilizador
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Convidar novo utilizador
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="invite-email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="email@mudelar.pt"
              />
            </div>

            <div>
              <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                id="invite-name"
                name="full_name"
                type="text"
                required
                minLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Nome da pessoa"
              />
            </div>

            <div>
              <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
                Função
              </label>
              <select
                id="invite-role"
                name="role"
                required
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              >
                <option value="" disabled>Selecciona uma função</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            {state.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'A enviar...' : 'Enviar convite'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
