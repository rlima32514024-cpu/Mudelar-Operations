import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { RiskBadge } from '@/components/shared/risk-badge'
import { PhaseBadge } from '@/components/shared/phase-badge'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type {
  GeneralStatus,
  StartRiskLevel,
  CurrentPhase,
  IssuePriority,
  IssueStatus,
  MilestoneStatus,
  BillingStage,
  TipoProblema,
  ReportadoPor,
} from '@/types'
import { MILESTONE_STATUS_LABELS, CURRENT_PHASE_LABELS } from '@/types'

const AUDIT_ACTION_LABELS: Record<string, string> = {
  project_created: 'Obra criada',
  supervisor_assigned: 'Supervisor atribuído',
  team_assigned: 'Equipa atribuída',
  procurement_updated: 'Compras atualizadas',
  phase_updated: 'Fase atualizada',
  project_completed: 'Obra concluída',
  issue_created: 'Issue criado',
  issue_resolved: 'Issue resolvido',
  milestone_ready: 'Marco marcado pronto',
  milestone_validated: 'Marco validado',
  milestone_updated: 'Marco atualizado',
}

const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em progresso',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
}

const TIPO_PROBLEMA_LABELS: Record<TipoProblema, string> = {
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

const REPORTADO_POR_LABELS: Record<ReportadoPor, string> = {
  cliente: 'Cliente',
  supervisor: 'Supervisor',
  outro: 'Outro',
}

interface ObraDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ObraDetailPage({ params }: ObraDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: project },
    { data: milestones },
    { data: issues },
    { data: apontamentos },
    { data: parties },
    { data: auditLog },
  ] = await Promise.all([
    supabase
      .from('projects_view')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('billing_milestones_view')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('issues')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('apontamentos')
      .select('*')
      .eq('project_id', id)
      .order('data_apontamento', { ascending: false })
      .limit(10),
    supabase
      .from('responsible_parties')
      .select('id, name'),
    supabase
      .from('project_audit_log')
      .select('id, user_name, action, details, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  if (!project) notFound()

  const safeMilestones = milestones ?? []
  const safeIssues = issues ?? []
  const safeApontamentos = apontamentos ?? []
  const safeAuditLog = auditLog ?? []
  const partiesMap = new Map((parties ?? []).map((p) => [p.id, p.name]))

  const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
    not_ready: 'bg-gray-100 text-gray-500',
    ready_for_validation: 'bg-yellow-100 text-yellow-700',
    validated: 'bg-blue-100 text-blue-700',
    invoiced: 'bg-indigo-100 text-indigo-700',
    paid: 'bg-green-100 text-green-700',
    debt: 'bg-red-100 text-red-700',
  }

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/mario"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{project.contract_number}</h1>
              <StatusBadge status={project.general_status as GeneralStatus} />
              {project.start_risk_level && (
                <RiskBadge risk={project.start_risk_level as StartRiskLevel} />
              )}
            </div>
            <p className="text-lg text-gray-600 mt-1">{project.client_name}</p>
            {project.work_type && (
              <p className="text-sm text-gray-500 mt-0.5">{project.work_type}</p>
            )}
          </div>
        </div>
      </div>

      {/* Grid de detalhes */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Detalhes</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Morada</dt>
            <dd className="text-gray-900 mt-0.5">{project.address ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Valor total</dt>
            <dd className="text-gray-900 mt-0.5">{formatCurrency(project.total_project_value)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Data contrato</dt>
            <dd className="text-gray-900 mt-0.5">{formatDate(project.contract_signature_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Supervisor</dt>
            <dd className="text-gray-900 mt-0.5">
              {project.assigned_supervisor_id ? (partiesMap.get(project.assigned_supervisor_id) ?? '—') : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Equipa</dt>
            <dd className="text-gray-900 mt-0.5">
              {project.equipa_obras_id ? (partiesMap.get(project.equipa_obras_id) ?? '—') : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Arranque real</dt>
            <dd className="text-gray-900 mt-0.5">{formatDate(project.actual_start_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Conclusão prevista</dt>
            <dd className="text-gray-900 mt-0.5">{formatDate(project.estimated_completion_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Conclusão real</dt>
            <dd className="text-gray-900 mt-0.5">{formatDate(project.actual_completion_date)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Telefone</dt>
            <dd className="text-gray-900 mt-0.5">{project.client_phone ?? '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Fases */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Progresso da Obra</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Fase actual:</span>
          <PhaseBadge phase={project.current_phase as CurrentPhase} />
        </div>
        <div className="space-y-2">
          {[
            { key: '1_preparacao_demolicoes', notes: project.notes_phase_1 },
            { key: '2_infraestruturas', notes: project.notes_phase_2 },
            { key: '3_revestimentos', notes: project.notes_phase_3 },
            { key: '4_montagem_final', notes: project.notes_phase_4 },
          ].map(({ key, notes }) => (
            <div key={key} className="flex gap-3 text-sm">
              <span className="text-gray-500 w-52 shrink-0">
                {CURRENT_PHASE_LABELS[key as CurrentPhase]}:
              </span>
              <span className="text-gray-700">{notes ?? '—'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Faturação */}
      {safeMilestones.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Faturação</h2>
          <div className="space-y-2">
            {safeMilestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">{m.billing_stage as BillingStage}</span>
                  {m.percentage != null && <span className="text-gray-500 ml-2">({m.percentage}%)</span>}
                  {m.amount != null && <span className="text-gray-700 ml-2">{formatCurrency(m.amount)}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MILESTONE_STATUS_COLORS[m.status as MilestoneStatus]}`}>
                    {MILESTONE_STATUS_LABELS[m.status as MilestoneStatus]}
                  </span>
                  {m.invoice_number && (
                    <span className="text-xs text-gray-500">Factura: {m.invoice_number}</span>
                  )}
                  {m.payment_received_date && (
                    <span className="text-xs text-green-600">Pago em {formatDate(m.payment_received_date)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Issues */}
      {safeIssues.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Issues ({safeIssues.length})</h2>
          <div className="space-y-2">
            {safeIssues.map((issue) => (
              <div key={issue.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{issue.issue_title}</span>
                    <PriorityBadge priority={issue.priority as IssuePriority} />
                  </div>
                  {issue.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{issue.description}</p>
                  )}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-4 shrink-0 ${
                  issue.status === 'open' ? 'bg-red-100 text-red-700' :
                  issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                  issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {ISSUE_STATUS_LABELS[issue.status as IssueStatus]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Apontamentos */}
      {safeApontamentos.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Apontamentos (últimos {safeApontamentos.length})
          </h2>
          <div className="space-y-3">
            {safeApontamentos.map((a) => (
              <div key={a.id} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.apontamento_title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">{formatDate(a.data_apontamento)}</span>
                      {a.tipo_problema && (
                        <span className="text-xs text-gray-500">
                          {TIPO_PROBLEMA_LABELS[a.tipo_problema as TipoProblema] ?? a.tipo_problema}
                        </span>
                      )}
                      {a.reportado_por && (
                        <span className="text-xs text-gray-400">
                          por {REPORTADO_POR_LABELS[a.reportado_por as ReportadoPor] ?? a.reportado_por}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {a.descricao && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Audit Log */}
      {safeAuditLog.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Histórico de auditoria ({safeAuditLog.length})
          </h2>
          <ol className="relative border-l border-gray-200 ml-2 space-y-0">
            {safeAuditLog.map((entry) => (
              <li key={entry.id} className="mb-4 ml-4 last:mb-0">
                <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-900">
                    {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                  {entry.user_name && (
                    <span className="text-xs text-gray-500">por {entry.user_name}</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                {entry.details && Object.keys(entry.details).length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Object.entries(entry.details as Record<string, unknown>)
                      .filter(([, v]) => v != null && v !== '')
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

    </main>
  )
}
