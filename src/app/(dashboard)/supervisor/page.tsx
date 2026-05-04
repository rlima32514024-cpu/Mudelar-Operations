import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/shared/status-badge'
import { PhaseBadge } from '@/components/shared/phase-badge'
import { UpdatePhaseDialog } from '@/components/supervisor/update-phase-dialog'
import { MarkCompletedButton } from '@/components/supervisor/mark-completed-button'
import { MarkMilestoneReadyButton } from '@/components/supervisor/mark-milestone-ready-button'
import { CreateApontamentoDialog } from '@/components/supervisor/create-apontamento-dialog'
import { VerifyMeasurementsDialog } from '@/components/supervisor/verify-measurements-dialog'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { GeneralStatus, CurrentPhase, MilestoneStatus, BillingStage } from '@/types'
import { MILESTONE_STATUS_LABELS } from '@/types'
import Link from 'next/link'

export default async function SupervisorDashboard() {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile?.responsible_party_id) {
    redirect('/perfil')
  }

  const { data: projects } = await supabase
    .from('projects_view')
    .select('*')
    .eq('assigned_supervisor_id', profile.responsible_party_id)
    .order('created_at', { ascending: false })

  const safeProjects = projects ?? []
  const projectIds = safeProjects.map((p) => p.id)

  const { data: milestones } = projectIds.length > 0
    ? await supabase
        .from('billing_milestones')
        .select('*')
        .in('project_id', projectIds)
        .not('status', 'in', '(paid,not_ready)')
    : { data: [] }

  const safeMilestones = milestones ?? []

  // Group milestones by project
  const milestonesByProject = new Map<string, typeof safeMilestones>()
  for (const m of safeMilestones) {
    const list = milestonesByProject.get(m.project_id) ?? []
    list.push(m)
    milestonesByProject.set(m.project_id, list)
  }

  const pendingValidation = safeMilestones.filter((m) => m.status === 'ready_for_validation')

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">As Minhas Obras</h1>
        <p className="text-sm text-gray-500 mt-0.5">{safeProjects.length} obra(s) atribuída(s)</p>
      </div>

      {pendingValidation.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <span className="font-medium">{pendingValidation.length} marco(s)</span> aguardam validação do gestor.
        </div>
      )}

      {safeProjects.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          Não tens obras atribuídas de momento.
        </div>
      )}

      <div className="space-y-6">
        {safeProjects.map((p) => {
          const projectMilestones = milestonesByProject.get(p.id) ?? []
          const notReadyMilestones = projectMilestones.filter((m) => m.status === 'not_ready')
          const readyMilestones = projectMilestones.filter((m) => m.status === 'ready_for_validation')
          const canMarkCompleted = p.current_phase === '4_montagem_final'

          return (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">{p.contract_number}</h2>
                    <StatusBadge status={p.general_status as GeneralStatus} />
                    <PhaseBadge phase={p.current_phase as CurrentPhase} />
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{p.client_name}</p>
                  {p.address && <p className="text-xs text-gray-400">{p.address}</p>}
                </div>
                <Link href={`/obras/${p.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  Ver detalhe
                </Link>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <div>
                  <span className="font-medium text-gray-700">Arranque: </span>
                  {formatDate(p.actual_start_date)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Conclusão prevista: </span>
                  {formatDate(p.estimated_completion_date)}
                </div>
              </div>

              {/* Milestones pendentes */}
              {projectMilestones.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Marcos de faturação</p>
                  <div className="space-y-2">
                    {projectMilestones.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="text-xs text-gray-700">
                          {m.billing_stage as BillingStage} — {formatCurrency(m.amount)}
                          <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            m.status === 'ready_for_validation' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {MILESTONE_STATUS_LABELS[m.status as MilestoneStatus]}
                          </span>
                        </div>
                        {m.status === 'not_ready' && (
                          <MarkMilestoneReadyButton milestoneId={m.id} projectId={p.id} />
                        )}
                        {m.status === 'ready_for_validation' && (
                          <span className="text-xs text-yellow-700 font-medium">Aguarda validação</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medições */}
              {p.general_status === '2_aguarda_retificacao' && !p.measurements_verified && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between">
                  <p className="text-xs text-blue-700 font-medium">Medições por verificar</p>
                  <VerifyMeasurementsDialog projectId={p.id} contractNumber={p.contract_number} />
                </div>
              )}
              {p.measurements_verified && p.measurements_verified_date && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                  ✓ Medições verificadas em {new Date(p.measurements_verified_date).toLocaleDateString('pt-PT')}
                  {p.measurements_notes && <span className="text-gray-500 ml-1">— {p.measurements_notes}</span>}
                </div>
              )}

              {/* Acções */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {p.current_phase !== 'completed' && p.current_phase !== 'not_started' && (
                  <UpdatePhaseDialog
                    projectId={p.id}
                    currentPhase={p.current_phase as CurrentPhase}
                  />
                )}
                {p.current_phase === 'not_started' && (
                  <UpdatePhaseDialog
                    projectId={p.id}
                    currentPhase={'1_preparacao_demolicoes' as CurrentPhase}
                  />
                )}
                <CreateApontamentoDialog projectId={p.id} />
                {canMarkCompleted && (
                  <MarkCompletedButton projectId={p.id} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
