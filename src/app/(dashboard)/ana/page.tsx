import { createClient } from '@/lib/supabase/server'
import { ValidateMilestoneButton } from '@/components/milestones/validate-milestone-button'
import { UpdateMilestoneDialog } from '@/components/milestones/update-milestone-dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { BillingMilestone, BillingStage, MilestoneStatus } from '@/types'
import { MILESTONE_STATUS_LABELS } from '@/types'

const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  not_ready: 'bg-gray-100 text-gray-500',
  ready_for_validation: 'bg-yellow-100 text-yellow-700',
  validated: 'bg-blue-100 text-blue-700',
  invoiced: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700',
  debt: 'bg-red-100 text-red-700',
}

interface ProjectMap {
  [id: string]: { contract_number: string; client_name: string }
}

export default async function AnaDashboard() {
  const supabase = await createClient()

  const [{ data: milestones }, { data: projects }] = await Promise.all([
    supabase
      .from('billing_milestones_view')
      .select('*')
      .neq('status', 'not_ready')
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, contract_number, client_name'),
  ])

  const safeMilestones = (milestones ?? []) as BillingMilestone[]
  const projectsMap: ProjectMap = {}
  for (const p of projects ?? []) {
    projectsMap[p.id] = { contract_number: p.contract_number, client_name: p.client_name }
  }

  const paraValidar = safeMilestones.filter((m) => m.status === 'ready_for_validation')
  const paraFaturar = safeMilestones.filter((m) => m.status === 'validated')
  const faturados = safeMilestones.filter((m) => m.status === 'invoiced' || m.status === 'debt')
  const pagos = safeMilestones.filter((m) => m.status === 'paid')

  function MilestoneRow({ m, showValidate }: { m: BillingMilestone; showValidate?: boolean }) {
    const proj = projectsMap[m.project_id]
    return (
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm text-gray-700">
          {proj ? `${proj.contract_number} — ${proj.client_name}` : m.project_id}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{m.billing_stage as BillingStage}</td>
        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(m.amount)}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MILESTONE_STATUS_COLORS[m.status as MilestoneStatus]}`}>
            {MILESTONE_STATUS_LABELS[m.status as MilestoneStatus]}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(m.invoice_issued_date)}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(m.payment_due_date)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {showValidate && (
              <ValidateMilestoneButton milestoneId={m.id} projectId={m.project_id} />
            )}
            <UpdateMilestoneDialog milestone={m} />
          </div>
        </td>
      </tr>
    )
  }

  function Section({
    title,
    items,
    showValidate,
  }: {
    title: string
    items: BillingMilestone[]
    showValidate?: boolean
  }) {
    if (items.length === 0) return null
    return (
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">{title} ({items.length})</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Obra</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fase</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Factura emitida</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Prazo pagamento</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((m) => (
                  <MilestoneRow key={m.id} m={m} showValidate={showValidate} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    )
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faturação</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestão de marcos de faturação</p>
      </div>

      <Section title="Para validar" items={paraValidar} showValidate />
      <Section title="Para faturar" items={paraFaturar} />
      <Section title="Faturados / Em dívida" items={faturados} />
      <Section title="Pagos" items={pagos} />

      {safeMilestones.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          Sem marcos de faturação pendentes
        </div>
      )}
    </main>
  )
}
