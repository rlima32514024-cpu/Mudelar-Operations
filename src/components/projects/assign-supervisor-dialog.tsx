'use client'

import { useActionState, useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { UserCheck, X } from 'lucide-react'
import { assignSupervisor, type ActionResult } from '@/app/actions/projects'
import type { ResponsibleParty } from '@/types'

const initialState: ActionResult = { error: null, success: false }

interface AssignSupervisorDialogProps {
  projectId: string
  supervisors: ResponsibleParty[]
}

export function AssignSupervisorDialog({ projectId, supervisors }: AssignSupervisorDialogProps) {
  const [open, setOpen] = useState(false)

  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => assignSupervisor(projectId, prev, formData),
    [projectId]
  )

  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 text-white text-xs font-medium rounded-lg hover:bg-yellow-700 transition-colors">
          <UserCheck className="w-3.5 h-3.5" />
          Atribuir Supervisor
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Atribuir Supervisor
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="as-supervisor" className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor inicial
              </label>
              <select
                id="as-supervisor"
                name="initial_supervisor_id"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Sem supervisor</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="as-data_retificacao" className="block text-sm font-medium text-gray-700 mb-1">
                Data de retificação marcada
              </label>
              <input
                id="as-data_retificacao"
                name="data_retificacao_marcada"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
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
                {isPending ? 'A guardar...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
