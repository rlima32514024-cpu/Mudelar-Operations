import { createClient } from '@/lib/supabase/server'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { CreateIssueDialog } from '@/components/issues/create-issue-dialog'
import { ToggleAfetaPagamentoButton } from '@/components/issues/toggle-afeta-pagamento-button'
import { formatDate } from '@/lib/utils'
import type { IssuePriority, IssueStatus, Project } from '@/types'
import Link from 'next/link'

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

export default async function SofiaPosVenda() {
  const supabase = await createClient()

  const [{ data: issues }, { data: projects }, { data: responsibleParties }] = await Promise.all([
    supabase
      .from('issues_view')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, contract_number, client_name')
      .in('general_status', ['6_concluida', '7_fechada'])
      .order('created_at', { ascending: false }),
    supabase
      .from('responsible_parties')
      .select('id, name')
      .eq('active', true)
      .order('name'),
  ])

  const safeIssues = issues ?? []
  const safeProjects = (projects ?? []) as Pick<Project, 'id' | 'contract_number' | 'client_name'>[]
  const safeParties = (responsibleParties ?? []) as { id: string; name: string }[]

  const projectsMap = new Map(safeProjects.map((p) => [p.id, p]))
  const partiesMap = new Map(safeParties.map((p) => [p.id, p.name]))

  // Group by project
  const issuesByProject = new Map<string, typeof safeIssues>()
  for (const i of safeIssues) {
    const list = issuesByProject.get(i.project_id) ?? []
    list.push(i)
    issuesByProject.set(i.project_id, list)
  }

  const activeCount = safeIssues.filter((i) => i.status === 'open' || i.status === 'in_progress').length

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/sofia" className="text-sm text-gray-500 hover:text-gray-700">← As obras</Link>
            <h1 className="text-2xl font-bold text-gray-900">Pós-venda</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{activeCount} issue(s) ativo(s)</p>
        </div>
        <CreateIssueDialog projects={safeProjects} responsibleParties={safeParties} />
      </div>

      {safeIssues.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          Sem issues registadas
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Obra</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Título</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Prioridade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Atribuído a</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">SLA</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Afeta pgto</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeIssues.map((issue) => {
                  const proj = projectsMap.get(issue.project_id)
                  const status = issue.status as IssueStatus
                  return (
                    <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {proj ? `${proj.contract_number} — ${proj.client_name}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900">{issue.issue_title}</span>
                          {issue.sla_breach && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">SLA</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{issue.tipo_reclamacao ?? '—'}</td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={issue.priority as IssuePriority} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ISSUE_STATUS_COLORS[status]}`}>
                          {ISSUE_STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {issue.assigned_to_id ? (partiesMap.get(issue.assigned_to_id) ?? '—') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(issue.sla_deadline)}</td>
                      <td className="px-4 py-3">
                        <ToggleAfetaPagamentoButton
                          issueId={issue.id}
                          currentValue={issue.afeta_pagamento ?? false}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/obras/${issue.project_id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Ver obra
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
