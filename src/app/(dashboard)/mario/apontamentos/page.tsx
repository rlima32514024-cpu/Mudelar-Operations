import { createClient } from '@/lib/supabase/server'
import { CreateApontamentoMarioDialog } from '@/components/mario/create-apontamento-mario-dialog'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

const TIPO_LABELS: Record<string, string> = {
  atraso_obra: 'Atraso de obra',
  ma_execucao: 'Má execução',
  mobiliario: 'Mobiliário',
  acabamentos: 'Acabamentos',
  comunicacao: 'Comunicação',
  limpeza_cuidado: 'Limpeza / Cuidado',
  falta_de_algo: 'Falta de algo',
  material_defeituoso: 'Material defeituoso',
  outro: 'Outro',
}

const REPORTADO_LABELS: Record<string, string> = {
  cliente: 'Cliente',
  supervisor: 'Supervisor',
  outro: 'Outro',
}

export default async function MarioApontamentos() {
  const supabase = await createClient()

  const [{ data: apontamentos }, { data: projects }, { data: supervisors }] = await Promise.all([
    supabase
      .from('apontamentos')
      .select('*')
      .order('data_apontamento', { ascending: false }),
    supabase
      .from('projects')
      .select('id, contract_number, client_name, assigned_supervisor_id')
      .not('general_status', 'in', '(7_fechada,cancelada)')
      .order('created_at', { ascending: false }),
    supabase
      .from('responsible_parties')
      .select('id, name')
      .eq('role', 'supervisor')
      .eq('active', true),
  ])

  const safeApontamentos = apontamentos ?? []
  const safeProjects = projects ?? []
  const safeSupervisors = supervisors ?? []

  const projectsMap = new Map(safeProjects.map((p) => [p.id, p]))
  const supervisorsMap = new Map(safeSupervisors.map((s) => [s.id, s.name]))

  // Group by supervisor
  const bySupervisor = new Map<string | null, typeof safeApontamentos>()
  for (const a of safeApontamentos) {
    const project = projectsMap.get(a.project_id)
    const supId = project?.assigned_supervisor_id ?? null
    const list = bySupervisor.get(supId) ?? []
    list.push(a)
    bySupervisor.set(supId, list)
  }

  // Sort: supervisors with entries first, then "sem supervisor"
  const supervisorKeys = Array.from(bySupervisor.keys()).sort((a, b) => {
    if (a === null) return 1
    if (b === null) return -1
    const nameA = supervisorsMap.get(a) ?? ''
    const nameB = supervisorsMap.get(b) ?? ''
    return nameA.localeCompare(nameB)
  })

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/mario" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-900">Apontamentos</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{safeApontamentos.length} apontamento(s) registado(s)</p>
        </div>
        <CreateApontamentoMarioDialog projects={safeProjects} />
      </div>

      {safeApontamentos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          Sem apontamentos registados
        </div>
      ) : (
        <div className="space-y-6">
          {supervisorKeys.map((supId) => {
            const items = bySupervisor.get(supId) ?? []
            const supervisorName = supId ? (supervisorsMap.get(supId) ?? 'Supervisor desconhecido') : 'Sem supervisor atribuído'

            return (
              <section key={supId ?? 'none'}>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  {supervisorName}
                  <span className="ml-2 text-xs font-normal text-gray-400">({items.length})</span>
                </h2>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Data</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Obra</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Título</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Reportado por</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((a) => {
                          const proj = projectsMap.get(a.project_id)
                          return (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                {formatDate(a.data_apontamento)}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-700">
                                {proj ? (
                                  <Link href={`/obras/${proj.id}`} className="hover:text-blue-600">
                                    {proj.contract_number} — {proj.client_name}
                                  </Link>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">{a.apontamento_title}</td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {a.tipo_problema ? (TIPO_LABELS[a.tipo_problema] ?? a.tipo_problema) : '—'}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {a.reportado_por ? (REPORTADO_LABELS[a.reportado_por] ?? a.reportado_por) : '—'}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                                <span className="line-clamp-2">{a.descricao ?? '—'}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
