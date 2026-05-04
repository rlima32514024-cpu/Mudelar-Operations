import { createClient } from '@/lib/supabase/server'
import { UpdateProcurementForm } from '@/components/projects/update-procurement-form'
import { formatDate } from '@/lib/utils'
import type { ProcurementStatus } from '@/types'
import Link from 'next/link'

const PROCUREMENT_LABELS: Record<ProcurementStatus, string> = {
  submitted: 'Submetido',
  in_procurement: 'Em compras',
  received: 'Recebido',
}

const PROCUREMENT_COLORS: Record<ProcurementStatus, string> = {
  submitted: 'bg-yellow-100 text-yellow-700',
  in_procurement: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
}

export default async function SusanaDashboard() {
  const supabase = await createClient()

  const [{ data: filaCompras }, { data: emAcompanhamento }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('general_status', '3_aguarda_compras')
      .order('data_retificacao_marcada', { ascending: true }),
    supabase
      .from('projects')
      .select('*')
      .in('procurement_status', ['submitted', 'in_procurement'])
      .neq('general_status', '3_aguarda_compras')
      .order('created_at', { ascending: false }),
  ])

  const safeFilaCompras = filaCompras ?? []
  const safeEmAcompanhamento = emAcompanhamento ?? []

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fila de Compras</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {safeFilaCompras.length} {safeFilaCompras.length === 1 ? 'obra aguarda' : 'obras aguardam'} compras
        </p>
      </div>

      {/* Fila principal */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          A aguardar compras ({safeFilaCompras.length})
        </h2>
        {safeFilaCompras.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
            Nenhuma obra a aguardar compras
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contrato</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Data retificação</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado compras</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actualizar</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {safeFilaCompras.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.contract_number}</td>
                      <td className="px-4 py-3 text-gray-700">{p.client_name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.work_type}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(p.data_retificacao_marcada)}</td>
                      <td className="px-4 py-3">
                        {p.procurement_status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PROCUREMENT_COLORS[p.procurement_status as ProcurementStatus]}`}>
                            {PROCUREMENT_LABELS[p.procurement_status as ProcurementStatus]}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <UpdateProcurementForm
                          projectId={p.id}
                          currentStatus={p.procurement_status as ProcurementStatus | null}
                          currentListUrl={p.procurement_list_url}
                          currentListDate={p.procurement_list_uploaded_date}
                          contractNumber={p.contract_number}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/obras/${p.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Em acompanhamento */}
      {safeEmAcompanhamento.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Em acompanhamento ({safeEmAcompanhamento.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contrato</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado compras</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actualizar</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {safeEmAcompanhamento.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.contract_number}</td>
                      <td className="px-4 py-3 text-gray-700">{p.client_name}</td>
                      <td className="px-4 py-3">
                        {p.procurement_status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PROCUREMENT_COLORS[p.procurement_status as ProcurementStatus]}`}>
                            {PROCUREMENT_LABELS[p.procurement_status as ProcurementStatus]}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <UpdateProcurementForm
                          projectId={p.id}
                          currentStatus={p.procurement_status as ProcurementStatus | null}
                          currentListUrl={p.procurement_list_url}
                          currentListDate={p.procurement_list_uploaded_date}
                          contractNumber={p.contract_number}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/obras/${p.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
