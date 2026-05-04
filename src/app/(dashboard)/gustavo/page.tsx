import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { CreateIssueDialog } from '@/components/issues/create-issue-dialog'
import { ResolveIssueDialog } from '@/components/issues/resolve-issue-dialog'
import { UpdateIssueStatusButton } from '@/components/issues/update-issue-status-button'
import { formatDate } from '@/lib/utils'
import type { IssuePriority, IssueStatus, Project } from '@/types'

const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em progresso',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
}

const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function GustavoDashboard() {
  const supabase = await createClient()
  const profile = await getProfile()

  const issuesQuery = supabase
    .from('issues_view')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (profile?.responsible_party_id) {
    issuesQuery.eq('assigned_to_id', profile.responsible_party_id)
  }

  const [{ data: issues }, { data: projects }, { data: responsibleParties }] = await Promise.all([
    issuesQuery,
    supabase
      .from('projects')
      .select('id, contract_number, client_name')
      .order('created_at', { ascending: false }),
    supabase
      .from('responsible_parties')
      .select('id, name')
      .eq('role', 'pos_venda_interna')
      .eq('active', true)
      .order('name'),
  ])

  const safeIssues = issues ?? []
  const safeProjects = (projects ?? []) as Pick<Project, 'id' | 'contract_number' | 'client_name'>[]
  const safeResponsibleParties = (responsibleParties ?? []) as { id: string; name: string }[]

  const projectsMap = new Map(safeProjects.map((p) => [p.id, `${p.contract_number} — ${p.client_name}`]))

  const openCount = safeIssues.filter((i) => i.status === 'open').length
  const inProgressCount = safeIssues.filter((i) => i.status === 'in_progress').length
  const slaBreachCount = safeIssues.filter((i) => i.sla_breach).length

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues &amp; Reclamações</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pós-venda</p>
        </div>
        <CreateIssueDialog projects={safeProjects} responsibleParties={safeResponsibleParties} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Abertos</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{openCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Em progresso</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">SLA violado</p>
          <p className="text-3xl font-bold text-red-900 mt-1">{slaBreachCount}</p>
        </div>
      </div>

      {/* Issues table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Obra</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Prioridade</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">SLA</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Dias em aberto</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {safeIssues.map((issue) => {
                const status = issue.status as IssueStatus
                const priority = issue.priority as IssuePriority
                return (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{issue.issue_title}</span>
                        {issue.sla_breach && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">SLA</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {projectsMap.get(issue.project_id) ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={priority} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ISSUE_STATUS_COLORS[status]}`}>
                        {ISSUE_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(issue.sla_deadline)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {issue.days_open != null ? `${issue.days_open}d` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {status === 'open' && (
                          <UpdateIssueStatusButton
                            issueId={issue.id}
                            newStatus="in_progress"
                            label="Iniciar"
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded hover:bg-yellow-200 transition-colors"
                          />
                        )}
                        {(status === 'open' || status === 'in_progress') && (
                          <ResolveIssueDialog issueId={issue.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {safeIssues.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    Sem issues registados
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
