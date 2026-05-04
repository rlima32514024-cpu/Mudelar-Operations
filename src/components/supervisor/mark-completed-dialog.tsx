'use client'

import { useActionState, useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Flag, X } from 'lucide-react'
import { markCompleted } from '@/app/actions/projects'
import { FileUploadInput } from '@/components/shared/file-upload-input'
import type { ActionResult } from '@/app/actions/projects'

const initialState: ActionResult = { error: null, success: false }

interface MarkCompletedDialogProps {
  projectId: string
  contractNumber: string
}

export function MarkCompletedDialog({ projectId, contractNumber }: MarkCompletedDialogProps) {
  const [open, setOpen] = useState(false)

  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => markCompleted(projectId, prev, formData),
    [projectId]
  )

  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors">
          <Flag className="w-3.5 h-3.5" />
          Concluir Obra
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Concluir Obra
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="mc-date" className="block text-sm font-medium text-gray-700 mb-1">
                Data de conclusão <span className="text-red-500">*</span>
              </label>
              <input
                id="mc-date"
                name="actual_completion_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <FileUploadInput
              name="auto_entrega_url"
              storagePath={`delivery/${contractNumber}`}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              label="Auto de entrega"
            />

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-700">
              A obra avança para <strong>Concluída</strong> e a Ana é notificada para emitir fatura final.
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
                className="flex-1 py-2 px-4 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'A concluir...' : 'Confirmar conclusão'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
