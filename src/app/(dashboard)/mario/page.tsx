import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { RiskBadge } from '@/components/shared/risk-badge'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { MarioCharts } from '@/components/dashboard/mario-charts'
import type {
  StatusChartData,
  MonthChartData,
  RiskChartData,
  FinancialChartData,
} from '@/components/dashboard/mario-charts'
import { Download, CalendarRange, ClipboardList } from 'lucide-react'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { AssignSupervisorDialog } from '@/components/projects/assign-supervisor-dialog'
import { AssignTeamDialog } from '@/components/projects/assign-team-dialog'
import { ObrasFilterTable } from '@/components/mario/obras-filter-table'
import { formatDate, formatCurrency } from '@/lib/utils'
import type {
  GeneralStatus,
  StartRiskLevel,
  WorkModel,
  ResponsibleParty,
  IssuePriority,
  IssueStatus,
} from '@/types'
import { RISK_LEVEL_LABELS } from '@/types'
import Link from 'next/link'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtKpi(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M€`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k€`
  return `${v.toFixed(0)}€`
}

const STATUS_SHORT: Record<string, string> = {
  '1_aguarda_atribuicao': 'Atrib.',
  '2_aguarda_retificacao': 'Retif.',
  '3_aguarda_compras': 'Compras',
  '4_aguarda_arranque': 'Arranque',
  '5_em_execucao': 'Execução',
  '6_concluida': 'Concluída',
  '7_fechada': 'Fechada',
  'cancelada': 'Cancelada',
}

const RISK_FILL: Record<string, string> = {
  green: '#16a34a',
  yellow: '#ca8a04',
  orange: '#ea580c',
  red: '#dc2626',
  critical: '#7f1d1d',
  started: '#2563eb',
}

function computeMonthlyTrend(projects: { created_at: string }[]): MonthChartData[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })
    const count = projects.filter((p) => p.created_at.startsWith(key)).length
    return { month: label, count }
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MarioDashboard() {
  const supabase = await createClient()

  const [
    { data: projects },
    { data: allParties },
    { data: urgentIssues },
    { data: workModels },
    { data: allIssues },
  ] = await Promise.all([
    supabase.from('projects_view').select('*').order('created_at', { ascending: false }),
    supabase.from('responsible_parties').select('*').eq('active', true),
    supabase
      .from('issues_view')
      .select('*')
      .in('status', ['open', 'in_progress'])
      .in('priority', ['High', 'Urgent'])
      .order('priority', { ascending: false })
      .limit(5),
    supabase.from('work_models').select('*').order('nome_modelo'),
    supabase.from('issues_view').select('id, status, priority, sla_breach'),
  ])

  const safeProjects = projects ?? []
  const safeParties = (allParties ?? []) as ResponsibleParty[]
  const safeIssues = urgentIssues ?? []
  const safeWorkModels = (workModels ?? []) as WorkModel[]
  const safeAllIssues = allIssues ?? []

  const supervisors = safeParties.filter((p) => p.role === 'supervisor')
  const equipas = safeParties.filter((p) => p.role === 'equipa_obras')
  const partiesMap = new Map(safeParties.map((p) => [p.id, p.name]))

  // ─── KPI Computation ───────────────────────────────────────────────────────

  // Operacional
  const totalCount = safeProjects.length
  const emExecucao = safeProjects.filter((p) => p.general_status === '5_em_execucao').length
  const concluidas = safeProjects.filter((p) => p.general_status === '6_concluida').length
  const aguardaAtribuicaoCount = safeProjects.filter((p) => p.general_status === '1_aguarda_atribuicao').length
  const aguardaArranqueCount = safeProjects.filter((p) => p.general_status === '4_aguarda_arranque').length

  // Financeiro
  const activeStatuses = ['1_aguarda_atribuicao', '2_aguarda_retificacao', '3_aguarda_compras', '4_aguarda_arranque', '5_em_execucao']
  const valorCarteira = safeProjects
    .filter((p) => activeStatuses.includes(p.general_status))
    .reduce((s, p) => s + (p.total_project_value ?? 0), 0)
  const totalFaturado = safeProjects.reduce((s, p) => s + (p.total_billed ?? 0), 0)
  const totalPago = safeProjects.reduce((s, p) => s + (p.total_paid ?? 0), 0)
  const emDivida = safeProjects.reduce((s, p) => s + (p.outstanding_invoiced ?? 0), 0)
  const obrasAfetamPagamento = safeProjects.filter((p) => p.has_affected_payment_issues).length

  // Qualidade & SLA
  const openIssues = safeAllIssues.filter((i) => i.status === 'open' || i.status === 'in_progress')
  const resolvedIssues = safeAllIssues.filter((i) => i.status === 'resolved')
  const issuesAbertos = openIssues.length
  const issuesSlaBreached = openIssues.filter((i) => i.sla_breach).length
  const issuesUrgentes = openIssues.filter((i) => i.priority === 'High' || i.priority === 'Urgent').length
  const totalIssuesEver = safeAllIssues.length
  const taxaResolucao = totalIssuesEver > 0 ? Math.round((resolvedIssues.length / totalIssuesEver) * 100) : 0

  const completedWithDates = safeProjects.filter(
    (p) => p.general_status === '6_concluida' && p.actual_start_date && p.actual_completion_date,
  )
  const duracaoMedia =
    completedWithDates.length > 0
      ? Math.round(
          completedWithDates.reduce((acc, p) => {
            const ms =
              new Date(p.actual_completion_date!).getTime() -
              new Date(p.actual_start_date!).getTime()
            return acc + ms / (1000 * 60 * 60 * 24)
          }, 0) / completedWithDates.length,
        )
      : null

  // ─── Chart Data ────────────────────────────────────────────────────────────

  const statusChartData: StatusChartData[] = Object.entries(STATUS_SHORT)
    .map(([status, label]) => ({
      label,
      count: safeProjects.filter((p) => p.general_status === status).length,
    }))
    .filter((d) => d.count > 0)

  const monthlyData: MonthChartData[] = computeMonthlyTrend(safeProjects)

  const riskData: RiskChartData[] = Object.entries(RISK_FILL)
    .map(([risk, fill]) => ({
      name: RISK_LEVEL_LABELS[risk as StartRiskLevel] ?? risk,
      value: safeProjects.filter(
        (p) => activeStatuses.includes(p.general_status) && p.start_risk_level === risk,
      ).length,
      fill,
    }))
    .filter((d) => d.value > 0)

  const financialData: FinancialChartData[] = [
    { name: 'Em carteira', value: valorCarteira, fill: '#3b82f6' },
    { name: 'Faturado', value: totalFaturado, fill: '#6366f1' },
    { name: 'Pago', value: totalPago, fill: '#16a34a' },
    { name: 'Em dívida', value: emDivida, fill: '#dc2626' },
  ]

  // ─── Pending sections ──────────────────────────────────────────────────────

  const aguardaAtribuicao = safeProjects.filter((p) => p.general_status === '1_aguarda_atribuicao')
  const aguardaArranque = safeProjects.filter((p) => p.general_status === '4_aguarda_arranque')

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Obras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Painel do gestor</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/mario/apontamentos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Apontamentos
          </Link>
          <Link
            href="/mario/gantt"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CalendarRange className="w-4 h-4" />
            Gantt
          </Link>
          <a
            href="/api/export/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </a>
          <CreateProjectDialog workModels={safeWorkModels} supervisors={supervisors} />
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}

      <div className="space-y-4">

        {/* Grupo 1: Obras */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Obras</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard label="Total de obras" value={totalCount} />
            <KpiCard
              label="Em execução"
              value={emExecucao}
              valueColor="text-green-700"
            />
            <KpiCard
              label="Concluídas"
              value={concluidas}
              valueColor="text-blue-600"
            />
            <KpiCard
              label="Aguarda atribuição"
              value={aguardaAtribuicaoCount}
              valueColor={aguardaAtribuicaoCount > 0 ? 'text-amber-600' : 'text-gray-400'}
            />
            <KpiCard
              label="Aguarda arranque"
              value={aguardaArranqueCount}
              valueColor={aguardaArranqueCount > 0 ? 'text-amber-600' : 'text-gray-400'}
            />
          </div>
        </div>

        {/* Grupo 2: Financeiro */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Financeiro</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Valor em carteira"
              value={fmtKpi(valorCarteira)}
              sub={formatCurrency(valorCarteira)}
            />
            <KpiCard
              label="Total faturado"
              value={fmtKpi(totalFaturado)}
              sub={formatCurrency(totalFaturado)}
            />
            <KpiCard
              label="Total pago"
              value={fmtKpi(totalPago)}
              sub={formatCurrency(totalPago)}
              valueColor="text-green-700"
            />
            <KpiCard
              label="Em dívida"
              value={fmtKpi(emDivida)}
              sub={formatCurrency(emDivida)}
              valueColor={emDivida > 0 ? 'text-red-600' : 'text-gray-400'}
            />
            <KpiCard
              label="Obras c/ issues pagamento"
              value={obrasAfetamPagamento}
              valueColor={obrasAfetamPagamento > 0 ? 'text-red-600' : 'text-gray-400'}
            />
          </div>
        </div>

        {/* Grupo 3: Qualidade & SLA */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Qualidade & SLA</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Issues abertos"
              value={issuesAbertos}
              valueColor={issuesAbertos > 0 ? 'text-amber-600' : 'text-gray-400'}
            />
            <KpiCard
              label="SLA violado"
              value={issuesSlaBreached}
              valueColor={issuesSlaBreached > 0 ? 'text-red-600' : 'text-gray-400'}
            />
            <KpiCard
              label="Urgentes / alta prioridade"
              value={issuesUrgentes}
              valueColor={issuesUrgentes > 0 ? 'text-red-600' : 'text-gray-400'}
            />
            <KpiCard
              label="Taxa de resolução"
              value={`${taxaResolucao}%`}
              valueColor={
                taxaResolucao >= 80
                  ? 'text-green-700'
                  : taxaResolucao >= 50
                    ? 'text-amber-600'
                    : totalIssuesEver === 0
                      ? 'text-gray-400'
                      : 'text-red-600'
              }
            />
            <KpiCard
              label="Duração média (dias)"
              value={duracaoMedia != null ? `${duracaoMedia} dias` : '—'}
              sub={completedWithDates.length > 0 ? `${completedWithDates.length} obras concluídas` : undefined}
            />
          </div>
        </div>

      </div>

      {/* ── Charts ───────────────────────────────────────────────────────────── */}

      <MarioCharts
        statusData={statusChartData}
        monthlyData={monthlyData}
        riskData={riskData}
        financialData={financialData}
      />

      {/* ── Pending: aguarda atribuição ───────────────────────────────────────── */}
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

      {/* ── Pending: aguarda arranque ─────────────────────────────────────────── */}
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
                    <p className="text-xs text-gray-400 mt-0.5">
                      Arranque previsto: {formatDate(p.planned_start_date)}
                    </p>
                  )}
                </div>
                <AssignTeamDialog projectId={p.id} supervisors={supervisors} equipas={equipas} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Todas as obras ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Todas as obras</h2>
        <ObrasFilterTable
          projects={safeProjects}
          supervisorsMap={partiesMap}
          supervisors={supervisors}
        />
      </section>

      {/* ── Issues urgentes ──────────────────────────────────────────────────── */}
      {safeIssues.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Issues urgentes / alta prioridade</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {safeIssues.map((issue) => (
              <div key={issue.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{issue.issue_title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Prioridade: {issue.priority as IssuePriority} · Estado:{' '}
                    {issue.status as IssueStatus}
                    {issue.days_open != null && ` · ${issue.days_open} dias em aberto`}
                  </p>
                </div>
                {issue.sla_breach && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                    SLA violado
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </main>
  )
}
