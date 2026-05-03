import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { RiskBadge } from '@/components/shared/risk-badge'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { AssignSupervisorDialog } from '@/components/projects/assign-supervisor-dialog'
import { AssignTeamDialog } from '@/components/projects/assign-team-dialog'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { GeneralStatus, StartRiskLevel, WorkModel, ResponsibleParty, IssuePriority, IssueStatus } from '@/types'
import Link from 'next/link'

export default async function MarioDashboard() {
  const supabase = await createClient()

  const [
    { data: projects },
    { data: allParties },
    { data: urgentIssues },
    { data: workModels },
  ] = await Promise.all([
    supabase
      .from('projects_view')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('responsible_parties').select('*').eq('active', true),
    supabase
      .from('issues_view')
      .select('*')
      .in('status', ['open', 'in_progress'])
      .in('priority', ['High', 'Urgent'])
      .order('priority', { ascending: false })
      .limit(5),
    supabase.from('work_models').select('*').order('nome_modelo'),
  ])

  const safeProjects = projects ?? []
  const safeParties = (allParties ?? []) as ResponsibleParty[]
  const safeIssues = urgentIssues ?? []
  const safeWorkModels = (workModels ?? []) as WorkModel[]

  const supervisors = safeParties.filter((p) => p.role === 'supervisor')
  const equipas = safeParties.filter((p) => p.role === 'equipa_obras')

  const partiesMap = new Map(safeParties.map((p) => [p.id, p.name]))

  const totalCount = safeProjects.length
  const aguardaAtribuicaoCount = safeProjects.filter((p) => p.general_status === '1_aguarda_atribuicao').length
  const emExecucaoCount = safeProjects.filter((p) => p.general_status === '5_em_execucao').length
  const urgentIssuesCount = safeIssues.length

  const aguardaAtribuicao = safeProjects.filter((p) => p.general_status === '1_aguarda_atribuicao')
  const aguardaArranque = safeProjects.filter((p) => p.general_status === '4_aguarda_arranque')

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Obras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Painel do gestor</p>
        </div>
        <CreateProjectDialog workModels={safeWorkModels} supervisors={supervisors} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Total de obras</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Aguarda atribuição</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">{aguardaAtribuicaoCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Em execução</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{emExecucaoCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Issues urgentes</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{urgentIssuesCount}</p>
        </div>
      </div>

      {/* Projectos a aguardar atribuição */}
      {aguardaAtribuicao.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Aguarda atribuição de supervisor ({aguardaAtribuicao.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {aguardaAtribuicao.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">{p.contract_number}</span>
                  <span className="text-sm text-gray-500 ml-2">— {p.client_name}</span>
                  {p.address && <p className="text-xs text-gray-400 mt-0.5">{p.address}</p>}
                </div>
                <AssignSupervisorDialog projectId={p.id} supervisors={supervisors} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projectos a aguardar arranque */}
      {aguardaArranque.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Aguarda atribuição de equipa ({aguardaArranque.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {aguardaArranque.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">{p.contract_number}</span>
                  <span className="text-sm text-gray-500 ml-2">— {p.client_name}</span>
                  {p.planned_start_date && (
                    <p className="text-xs text-gray-400 mt-0.5">Arranque previsto: {formatDate(p.planned_start_date)}</p>
                  )}
                </div>
                <AssignTeamDialog projectId={p.id} supervisors={supervisors} equipas={equipas} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabela de todas as obras */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Todas as obras</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contrato</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Risco</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Supervisor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Valor</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.contract_number}</td>
                    <td className="px-4 py-3 text-gray-700">{p.client_name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.work_type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.general_status as GeneralStatus} />
                    </td>
                    <td className="px-4 py-3">
                      {p.start_risk_level ? (
                        <RiskBadge risk={p.start_risk_level as StartRiskLevel} />
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.assigned_supervisor_id ? (partiesMap.get(p.assigned_supervisor_id) ?? '—') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(p.total_project_value)}</td>
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
      </section>

      {/* Issues urgentes */}
      {safeIssues.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Issues urgentes / alta prioridade</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {safeIssues.map((issue) => (
              <div key={issue.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{issue.issue_title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Prioridade: {issue.priority as IssuePriority} · Estado: {issue.status as IssueStatus}
                    {issue.days_open != null && ` · ${issue.days_open} dias em aberto`}
                  </p>
                </div>
                {issue.sla_breach && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">SLA violado</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
