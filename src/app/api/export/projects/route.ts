import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'

function csvEscape(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function row(values: unknown[]): string {
  return values.map(csvEscape).join(',')
}

export async function GET() {
  const profile = await getProfile()
  if (!profile || (profile.role !== 'mario' && profile.role !== 'admin')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const supabase = await createClient()
  const { data: projects, error } = await supabase
    .from('projects_view')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  const { data: parties } = await supabase.from('responsible_parties').select('id, name')
  const partiesMap = new Map((parties ?? []).map((p) => [p.id, p.name]))

  const headers = [
    'Contrato', 'Cliente', 'Telefone', 'Email', 'Morada', 'Tipo de Obra',
    'Estado', 'Fase Atual', 'Data Contrato', 'Valor Total (€)',
    'Supervisor', 'Equipa', 'Data Arranque', 'Data Conclusão',
    'Faturado (€)', 'Pago (€)', 'Em Dívida (€)',
    'Issues Ativos', 'Risco Arranque', 'Criado em',
  ]

  const STATUS_LABELS: Record<string, string> = {
    '1_aguarda_atribuicao': 'Aguarda Atribuição',
    '2_aguarda_retificacao': 'Aguarda Retificação',
    '3_aguarda_compras': 'Aguarda Compras',
    '4_aguarda_arranque': 'Aguarda Arranque',
    '5_em_execucao': 'Em Execução',
    '6_concluida': 'Concluída',
    '7_fechada': 'Fechada',
    'cancelada': 'Cancelada',
  }

  const PHASE_LABELS: Record<string, string> = {
    'not_started': 'Não iniciada',
    '1_preparacao_demolicoes': 'Preparação e Demolições',
    '2_infraestruturas': 'Infraestruturas',
    '3_revestimentos': 'Revestimentos',
    '4_montagem_final': 'Montagem Final',
    'completed': 'Concluída',
  }

  const lines = [
    '﻿' + row(headers), // UTF-8 BOM for Excel compatibility
    ...(projects ?? []).map((p) =>
      row([
        p.contract_number,
        p.client_name,
        p.client_phone,
        p.client_email,
        p.address,
        p.work_type,
        STATUS_LABELS[p.general_status] ?? p.general_status,
        PHASE_LABELS[p.current_phase] ?? p.current_phase,
        p.contract_signature_date,
        p.total_project_value,
        p.assigned_supervisor_id ? (partiesMap.get(p.assigned_supervisor_id) ?? '') : '',
        p.equipa_obras_id ? (partiesMap.get(p.equipa_obras_id) ?? '') : '',
        p.actual_start_date,
        p.actual_completion_date,
        p.total_billed,
        p.total_paid,
        p.outstanding_invoiced,
        p.active_issues_count,
        p.start_risk_level ?? '',
        p.created_at?.slice(0, 10),
      ])
    ),
  ]

  const filename = `obras-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
