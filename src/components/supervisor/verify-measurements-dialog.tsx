'use client'

import { useActionState, useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Ruler, X } from 'lucide-react'
import { verifyMeasurements } from '@/app/actions/supervisor'
import { FileUploadInput } from '@/components/shared/file-upload-input'
import type { ActionResult } from '@/app/actions/projects'

const initialState: ActionResult = { error: null, success: false }

interface VerifyMeasurementsDialogProps {
  projectId: string
  contractNumber: string
}

export function VerifyMeasurementsDialog({ projectId, contractNumber }: VerifyMeasurementsDialogProps) {
  const [open, setOpen] = useState(false)

  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => verifyMeasurements(projectId, prev, formData),
    [projectId]
  )

  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Ruler className="w-3.5 h-3.5" />
          Verificar Medições
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">
                Verificar Medições
              </Dialog.Title>
              <p className="text-xs text-gray-500 mt-0.5">{contractNumber}</p>
            </div>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="vm-date" className="block text-sm font-medium text-gray-700 mb-1">
                Data de verificação <span className="text-red-500">*</span>
              </label>
              <input
                id="vm-date"
                name="measurements_verified_date"
                type="date"
                defaultValue={today}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="vm-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas das medições
              </label>
              <textarea
                id="vm-notes"
                name="measurements_notes"
                rows={3}
                placeholder="Observações sobre as medições..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            <FileUploadInput
              name="initial_measurements_photos_url"
              storagePath={`measurements/${contractNumber}`}
              accept=".jpg,.jpeg,.png,.heic"
              label="Foto do levantamento"
            />

            <FileUploadInput
              name="layout_retificado_url"
              storagePath={`layout/${contractNumber}`}
              accept=".pdf,.dwg,.jpg,.jpeg,.png"
              label="Layout retificado"
            />

            <FileUploadInput
              name="procurement_list_url"
              storagePath={`procurement/${contractNumber}`}
              accept=".pdf,.xls,.xlsx,.doc,.docx"
              label="Mapa de necessidades"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              Ao confirmar, a obra avança para <strong>Aguarda Compras</strong> e a Susana é notificada.
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
                className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'A confirmar...' : 'Confirmar medições'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
