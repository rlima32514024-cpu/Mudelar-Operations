'use client'

import { useActionState, useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { RefreshCw, X } from 'lucide-react'
import { updatePhase, type ActionResult } from '@/app/actions/projects'
import { CURRENT_PHASE_LABELS, type CurrentPhase } from '@/types'

const PHASES: CurrentPhase[] = [
  '1_preparacao_demolicoes',
  '2_infraestruturas',
  '3_revestimentos',
  '4_montagem_final',
]

const initialState: ActionResult = { error: null, success: false }

interface UpdatePhaseDialogProps {
  projectId: string
  currentPhase: CurrentPhase
}

export function UpdatePhaseDialog({ projectId, currentPhase }: UpdatePhaseDialogProps) {
  const [open, setOpen] = useState(false)

  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => updatePhase(projectId, prev, formData),
    [projectId]
  )

  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar Fase
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Actualizar Fase da Obra
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="up-phase" className="block text-sm font-medium text-gray-700 mb-1">
                Fase actual
              </label>
              <select
                id="up-phase"
                name="current_phase"
                defaultValue={currentPhase}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                {PHASES.map((phase) => (
                  <option key={phase} value={phase}>{CURRENT_PHASE_LABELS[phase]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="up-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas da fase
              </label>
              <textarea
                id="up-notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                placeholder="Notas opcionais sobre esta fase..."
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
                {isPending ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
