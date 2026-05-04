'use client'

import { useMemo } from 'react'

export interface GanttProject {
  id: string
  contractNumber: string
  clientName: string
  status: string
  startDate: string | null
  endDate: string | null
  isCompleted: boolean
}

interface Props {
  projects: GanttProject[]
}

const STATUS_COLOR: Record<string, string> = {
  '1_aguarda_atribuicao': 'bg-slate-400',
  '2_aguarda_retificacao': 'bg-blue-300',
  '3_aguarda_compras': 'bg-yellow-400',
  '4_aguarda_arranque': 'bg-orange-400',
  '5_em_execucao': 'bg-green-500',
  '6_concluida': 'bg-gray-400',
  '7_fechada': 'bg-gray-300',
  'cancelada': 'bg-red-300',
}

const STATUS_LABEL: Record<string, string> = {
  '1_aguarda_atribuicao': 'Atrib.',
  '2_aguarda_retificacao': 'Retif.',
  '3_aguarda_compras': 'Compras',
  '4_aguarda_arranque': 'Arranque',
  '5_em_execucao': 'Em execução',
  '6_concluida': 'Concluída',
  '7_fechada': 'Fechada',
  'cancelada': 'Cancelada',
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function getMonths(start: Date, end: Date) {
  const totalMs = end.getTime() - start.getTime()
  const months: { label: string; leftPct: number; widthPct: number }[] = []
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur.getTime() < end.getTime()) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    const ms = Math.min(next.getTime(), end.getTime()) - Math.max(cur.getTime(), start.getTime())
    months.push({
      label: cur.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
      leftPct: ((Math.max(cur.getTime(), start.getTime()) - start.getTime()) / totalMs) * 100,
      widthPct: (ms / totalMs) * 100,
    })
    cur = next
  }
  return months
}

const ONE_DAY = 86_400_000

export function GanttChart({ projects }: Props) {
  const { timelineStart, timelineEnd, totalMs, months, today } = useMemo(() => {
    const now = new Date()
    const dates: Date[] = []

    for (const p of projects) {
      if (p.startDate) dates.push(new Date(p.startDate))
      if (p.endDate) dates.push(new Date(p.endDate))
    }

    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : now
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : now

    // pad ±6 weeks
    const start = new Date(minDate.getTime() - 42 * ONE_DAY)
    start.setDate(1)
    const end = new Date(Math.max(maxDate.getTime(), now.getTime()) + 56 * ONE_DAY)
    end.setDate(1)
    end.setMonth(end.getMonth() + 1)

    return {
      timelineStart: start,
      timelineEnd: end,
      totalMs: end.getTime() - start.getTime(),
      months: getMonths(start, end),
      today: now,
    }
  }, [projects])

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
        Sem obras para mostrar no Gantt
      </div>
    )
  }

  function barStyle(p: GanttProject) {
    const rawStart = p.startDate ? new Date(p.startDate) : timelineStart
    const rawEnd = p.endDate ? new Date(p.endDate) : new Date(rawStart.getTime() + 30 * ONE_DAY)

    const leftMs = clamp(rawStart.getTime() - timelineStart.getTime(), 0, totalMs)
    const widthMs = clamp(rawEnd.getTime() - rawStart.getTime(), ONE_DAY, totalMs - leftMs)

    return {
      left: `${(leftMs / totalMs) * 100}%`,
      width: `${(widthMs / totalMs) * 100}%`,
    }
  }

  const todayLeft = `${(clamp(today.getTime() - timelineStart.getTime(), 0, totalMs) / totalMs) * 100}%`

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">

          {/* Month header */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-56 shrink-0 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-r border-gray-200">
              Obra
            </div>
            <div className="flex-1 relative h-8">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex items-center border-r border-gray-200 last:border-r-0"
                  style={{ left: `${m.leftPct}%`, width: `${m.widthPct}%` }}
                >
                  <span className="px-2 text-xs text-gray-500 truncate">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {projects.map((p) => (
            <div key={p.id} className="flex border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
              {/* Project label */}
              <div className="w-56 shrink-0 px-4 py-2.5 border-r border-gray-100 flex flex-col justify-center">
                <span className="text-xs font-semibold text-gray-900 truncate">{p.contractNumber}</span>
                <span className="text-xs text-gray-500 truncate">{p.clientName}</span>
              </div>

              {/* Bar area */}
              <div className="flex-1 relative h-11 bg-gray-50/30">
                {/* Month grid lines */}
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-r border-gray-100"
                    style={{ left: `${m.leftPct + m.widthPct}%` }}
                  />
                ))}

                {/* Today line */}
                <div
                  className="absolute top-0 h-full w-px bg-red-400 opacity-70 z-10"
                  style={{ left: todayLeft }}
                />

                {/* Project bar */}
                {(p.startDate || p.endDate) && (
                  <div
                    className={`absolute top-2.5 h-6 rounded-sm ${STATUS_COLOR[p.status] ?? 'bg-gray-400'} opacity-90 group-hover:opacity-100 transition-opacity flex items-center px-1.5 overflow-hidden min-w-[4px]`}
                    style={barStyle(p)}
                    title={`${p.contractNumber} — ${STATUS_LABEL[p.status] ?? p.status}`}
                  >
                    <span className="text-white text-[10px] font-medium truncate whitespace-nowrap">
                      {STATUS_LABEL[p.status] ?? ''}
                    </span>
                  </div>
                )}

                {/* No dates placeholder */}
                {!p.startDate && !p.endDate && (
                  <div className="absolute inset-y-0 left-2 flex items-center">
                    <span className="text-xs text-gray-400 italic">Sem datas</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 border-t border-gray-100 bg-gray-50">
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${color}`} />
                <span className="text-xs text-gray-500">{STATUS_LABEL[status]}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-px h-3 bg-red-400" />
              <span className="text-xs text-gray-500">Hoje</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
