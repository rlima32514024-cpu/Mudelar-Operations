'use client'

import { useActionState, useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Edit, X } from 'lucide-react'
import { updateMilestone } from '@/app/actions/milestones'
import type { ActionResult } from '@/app/actions/projects'
import { formatCurrency } from '@/lib/utils'
import type { BillingMilestone } from '@/types'

const initialState: ActionResult = { error: null, success: false }

interface UpdateMilestoneDialogProps {
  milestone: BillingMilestone
}

export function UpdateMilestoneDialog({ milestone }: UpdateMilestoneDialogProps) {
  const [open, setOpen] = useState(false)

  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) =>
      updateMilestone(milestone.id, milestone.project_id, prev, formData),
    [milestone.id, milestone.project_id]
  )

  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
          <Edit className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Actualizar Marco de Faturação
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Fase:</span> {milestone.billing_stage}</p>
            {milestone.percentage != null && (
              <p><span className="font-medium">Percentagem:</span> {milestone.percentage}%</p>
            )}
            {milestone.amount != null && (
              <p><span className="font-medium">Valor:</span> {formatCurrency(milestone.amount)}</p>
            )}
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="um-invoice_number" className="block text-sm font-medium text-gray-700 mb-1">
                Nº de factura
              </label>
              <input
                id="um-invoice_number"
                name="invoice_number"
                type="text"
                defaultValue={milestone.invoice_number ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="um-invoice_issued_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data de emissão da factura
              </label>
              <input
                id="um-invoice_issued_date"
                name="invoice_issued_date"
                type="date"
                defaultValue={milestone.invoice_issued_date ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="um-payment_due_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data limite de pagamento
              </label>
              <input
                id="um-payment_due_date"
                name="payment_due_date"
                type="date"
                defaultValue={milestone.payment_due_date ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="um-payment_received_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data de recepção do pagamento
              </label>
              <input
                id="um-payment_received_date"
                name="payment_received_date"
                type="date"
                defaultValue={milestone.payment_received_date ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="um-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                id="um-notes"
                name="notes"
                rows={3}
                defaultValue={milestone.notes ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
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
