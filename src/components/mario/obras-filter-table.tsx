'use client'

import { useState, useMemo } from 'react'
import { StatusBadge } from '@/components/shared/status-badge'
import { RiskBadge } from '@/components/shared/risk-badge'
import { formatCurrency } from '@/lib/utils'
import type { GeneralStatus, StartRiskLevel } from '@/types'
import Link from 'next/link'

interface Project {
  id: string
  contract_number: string
  client_name: string
  work_type: string
  general_status: string
  start_risk_level: string | null
  assigned_supervisor_id: string | null
  total_project_value: number | null
}

interface ObrasFilterTableProps {
  projects: Project[]
  supervisorsMap: Map<string, string>
  supervisors: { id: string; name: string }[]
}

const ALL = ''

export function ObrasFilterTable({ projects, supervisorsMap, supervisors }: ObrasFilterTableProps) {
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [supervisorFilter, setSupervisorFilter] = useState(ALL)
  const [riskFilter, setRiskFilter] = useState(ALL)

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter && p.general_status !== statusFilter) return false
      if (supervisorFilter && p.assigned_supervisor_id !== supervisorFilter) return false
      if (riskFilter && p.start_risk_level !== riskFilter) return false
      return true
    })
  }, [projects, statusFilter, supervisorFilter, riskFilter])

  const hasFilter = statusFilter || supervisorFilter || riskFilter

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Todos os estados</option>
          <option value="1_aguarda_atribuicao">Aguarda atribuição</option>
          <option value="2_aguarda_retificacao">Aguarda retificação</option>
          <option value="3_aguarda_compras">Aguarda compras</option>
          <option value="4_aguarda_arranque">Aguarda arranque</option>
          <option value="5_em_execucao">Em execução</option>
          <option value="6_concluida">Concluída</option>
          <option value="7_fechada">Fechada</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <select
          value={supervisorFilter}
          onChange={(e) => setSupervisorFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Todos os supervisores</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Todos os riscos</option>
          <option value="green">Verde</option>
          <option value="yellow">Amarelo</option>
          <option value="orange">Laranja</option>
          <option value="red">Vermelho</option>
          <option value="critical">Crítico</option>
          <option value="started">Iniciada</option>
        </select>

        {hasFilter && (
          <button
            onClick={() => { setStatusFilter(ALL); setSupervisorFilter(ALL); setRiskFilter(ALL) }}
            className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpar filtros
          </button>
        )}

        <span className="px-3 py-1.5 text-xs text-gray-400">
          {filtered.length} / {projects.length} obras
        </span>
      </div>

      {/* Table */}
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
              {filtered.map((p) => (
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
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.assigned_supervisor_id ? (supervisorsMap.get(p.assigned_supervisor_id) ?? '—') : '—'}
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhuma obra corresponde aos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
