import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { formatDate } from '@/lib/utils'
import type { GeneralStatus, WorkModel } from '@/types'
import Link from 'next/link'

export default async function SofiaDashboard() {
  const supabase = await createClient()

  const [{ data: projects }, { data: workModels }] = await Promise.all([
    supabase
      .from('projects_view')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('work_models').select('*').order('nome_modelo'),
  ])

  const safeProjects = projects ?? []
  const safeWorkModels = (workModels ?? []) as WorkModel[]

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">As Obras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Apoio ao cliente</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sofia/pos-venda"
            className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Pós-venda →
          </Link>
          <CreateProjectDialog workModels={safeWorkModels} supervisors={[]} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contrato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Morada</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Data contrato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Issues</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {safeProjects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.contract_number}</td>
                  <td className="px-4 py-3 text-gray-700">{p.client_name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{p.address ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.work_type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.general_status as GeneralStatus} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.contract_signature_date)}</td>
                  <td className="px-4 py-3">
                    {p.active_issues_count > 0 ? (
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        {p.active_issues_count}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">0</span>
                    )}
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
              {safeProjects.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    Sem obras registadas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
