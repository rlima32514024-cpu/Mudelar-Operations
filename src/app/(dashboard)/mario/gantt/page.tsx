import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { GanttChart } from '@/components/dashboard/gantt-chart'
import type { GanttProject } from '@/components/dashboard/gantt-chart'

export default async function GanttPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects_view')
    .select(
      'id, contract_number, client_name, general_status, planned_start_date, actual_start_date, estimated_completion_date, actual_completion_date'
    )
    .not('general_status', 'in', '("7_fechada","cancelada")')
    .order('actual_start_date', { ascending: true, nullsFirst: false })

  const ganttData: GanttProject[] = (projects ?? []).map((p) => ({
    id: p.id,
    contractNumber: p.contract_number,
    clientName: p.client_name,
    status: p.general_status,
    startDate: p.actual_start_date ?? p.planned_start_date,
    endDate: p.actual_completion_date ?? p.estimated_completion_date,
    isCompleted: p.general_status === '6_concluida',
  }))

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <Link
          href="/mario"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao painel
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendário Gantt</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {ganttData.length} obras ativas · arraste horizontalmente para navegar
            </p>
          </div>
        </div>
      </div>

      <GanttChart projects={ganttData} />
    </main>
  )
}
