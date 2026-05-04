/**
 * Migração Airtable → Supabase
 *
 * Requer que os grants estejam aplicados (20260504000003_grants.sql).
 * Ordem de inserção respeitando FK:
 *   1. work_models
 *   2. responsible_parties
 *   3. projects          (trigger auto-cria billing_milestones)
 *   4. billing_milestones (update com dados do CSV)
 *   5. issues
 *   6. apontamentos      (ignorados — sem projecto ligado no export)
 *
 * Uso:
 *   npx tsx scripts/migrate-airtable.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── env ───────────────────────────────────────────────────────────────────────

function loadEnv() {
  const path = resolve(process.cwd(), '.env.local')
  try {
    const raw = readFileSync(path, 'utf-8')
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.error('❌  Não encontrei .env.local em', path)
    process.exit(1)
  }
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.replace(/\r/g, '').split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

function csvFile(filename: string): Record<string, string>[] {
  return parseCSV(readFileSync(resolve(process.cwd(), filename), 'utf-8'))
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseDate(s: string): string | null {
  if (!s) return null
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function parseCurrency(s: string): number | null {
  if (!s) return null
  const n = parseFloat(s.replace(/[€\s]/g, '').replace(',', '.'))
  return isNaN(n) || n === 0 ? null : n
}

function parseBool(s: string): boolean {
  const l = s.toLowerCase()
  return l === 'checked' || l === 'true' || l === '1' || l === 'yes'
}

function orNull(s: string): string | null { return s.trim() || null }

// ── value maps ────────────────────────────────────────────────────────────────

const GENERAL_STATUS: Record<string, string> = {
  '1 — Aguarda atribuição':  '1_aguarda_atribuicao',
  '2 — Aguarda retificação': '2_aguarda_retificacao',
  '3 — Aguarda compras':     '3_aguarda_compras',
  '4 — Aguarda arranque':    '4_aguarda_arranque',
  '5 — Em execução':         '5_em_execucao',
  '6 — Concluída':           '6_concluida',
  '7 — Fechada':             '7_fechada',
  'Cancelada':               'cancelada',
}

const PROCUREMENT_STATUS: Record<string, string> = {
  'Submitted':      'submitted',
  'In procurement': 'in_procurement',
  'Received':       'received',
}

const MILESTONE_STATUS: Record<string, string> = {
  'Not ready':            'not_ready',
  'Ready for validation': 'ready_for_validation',
  'Validated':            'validated',
  'Invoiced':             'invoiced',
  'Paid':                 'paid',
  'Debt':                 'debt',
}

const ISSUE_STATUS: Record<string, string> = {
  'Open':        'open',
  'In progress': 'in_progress',
  'Resolved':    'resolved',
  'Cancelled':   'cancelled',
}

const TIPO_RECLAMACAO: Record<string, string> = {
  'Defeito de execução': 'defeito_execucao',
  'Acabamento':          'acabamento',
  'Mobiliário':          'mobiliario',
  'Gás':                 'gas',
  'Eletrodomésticos':    'eletrodomesticos',
  'Falta de algo':       'falta_de_algo',
  'Outro':               'outro',
}

const COBERTO_GARANTIA: Record<string, string> = {
  'Sim  — coberto': 'sim',
  'Sim — coberto':  'sim',
  'Não coberto':    'nao',
  'A avaliar':      'a_avaliar',
}

const DEPARTAMENTO: Record<string, string> = {
  'Operação':                   'operacao',
  'Compras':                    'compras',
  'Comercial':                  'comercial',
  'Cliente trata directamente': 'cliente_trata_diretamente',
}

// ── role inference ────────────────────────────────────────────────────────────

const ROLE_BY_EMAIL: Record<string, string> = {
  'financeiro@bmlar.pt':        'financeiro',
  'compras@bmlar.pt':           'compras',
  'apoio.cliente@mudelar.pt':   'pos_venda_interna',
  'mario.lima@bmlar.pt':        'gestor',
  'renato.lima@bmlar.pt':       'gestor',
  'adriana.miguel@bmlar.pt':    'outro',
  'gustavoprsilva99@gmail.com': 'pos_venda_interna',
  'tiago.belchior@bmlar.pt':    'supervisor',
}

const ROLE_BY_NAME: Record<string, string> = {
  'Crispim': 'equipa_obras',
  'Otaniel': 'equipa_obras',
  'Lucas':   'equipa_obras',
}

function inferRole(r: Record<string, string>): string {
  const email = (r['Email'] ?? '').toLowerCase()
  if (email && ROLE_BY_EMAIL[email]) return ROLE_BY_EMAIL[email]
  if (ROLE_BY_NAME[r['Name']]) return ROLE_BY_NAME[r['Name']]
  if (r['Category'] === 'Supervisor') return 'supervisor'
  if (r['Category'] === 'External partner') return 'equipa_obras'
  return 'outro'
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌  NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta no .env.local')
    process.exit(1)
  }

  const sb = createClient(url, key, { auth: { persistSession: false } })

  // ── guard: idempotência ──────────────────────────────────────────────────
  const { data: existing } = await sb
    .from('projects')
    .select('id')
    .eq('contract_number', '3002')
    .maybeSingle()

  if (existing) {
    console.log('⚠️  Projecto 3002 já existe — migração já executada. A sair.')
    process.exit(0)
  }

  // ── 1. work_models ───────────────────────────────────────────────────────
  console.log('\n1/5  work_models…')
  const modelRows = csvFile('Modelos de obra-Grid view.csv')
    .filter(r => r['Prazo estimado (dias)'] && r['Categoria'])

  const { data: models, error: modelsErr } = await sb
    .from('work_models')
    .insert(modelRows.map(r => ({
      nome_modelo:         r['Nome do modelo'],
      prazo_estimado_dias: parseInt(r['Prazo estimado (dias)'], 10),
      categoria:           r['Categoria'] as 'WC' | 'Cozinha',
      notas:               orNull(r['Notas']),
    })))
    .select('id, nome_modelo')

  if (modelsErr) { console.error('  ❌', modelsErr.message); process.exit(1) }
  const modelByName = new Map(models!.map(m => [m.nome_modelo, m.id as string]))
  console.log(`  ✓  ${models!.length} modelos (1 ignorado — sem prazo/categoria)`)

  // ── 2. responsible_parties ───────────────────────────────────────────────
  console.log('\n2/5  responsible_parties…')
  const partyRows = csvFile('Responsible Parties-Grid view.csv')

  const { data: parties, error: partiesErr } = await sb
    .from('responsible_parties')
    .insert(partyRows.map(r => ({
      name:  r['Name'],
      email: orNull(r['Email']),
      phone: orNull(r['Phone']),
      role:  inferRole(r),
      notes: orNull(r['Notes']),
    })))
    .select('id, name, email')

  if (partiesErr) { console.error('  ❌', partiesErr.message); process.exit(1) }
  const partyByName  = new Map(parties!.map(p => [p.name,  p.id as string]))
  const partyByEmail = new Map(
    parties!.filter(p => p.email).map(p => [p.email as string, p.id as string])
  )
  console.log(`  ✓  ${parties!.length} intervenientes`)

  // ── 3. projects ──────────────────────────────────────────────────────────
  console.log('\n3/5  projects…')
  const projectRows = csvFile('Projects-Geral.csv')
  const insertedProjects: Array<{ id: string; contract_number: string }> = []
  const validWorkTypes = ['Kitchen', 'Bathroom', 'Both']

  for (const r of projectRows) {
    const contractNumber = r['Contract number (MD)']
    if (!contractNumber) continue

    const workType = r['Work type']
    if (!validWorkTypes.includes(workType)) {
      console.warn(`  ⚠️  ${contractNumber} — work_type inválido: "${workType}" — ignorado`)
      continue
    }

    const supervisorName = r['Initial supervisor name'] || r['Assigned supervisor'] || null
    const supervisorId   = supervisorName ? (partyByName.get(supervisorName) ?? null) : null
    const assignedEmail  = r['Assigned supervisor email'] || null
    const assignedId     = assignedEmail ? (partyByEmail.get(assignedEmail.toLowerCase()) ?? null) : null
    const modelId        = r['Work model'] ? (modelByName.get(r['Work model']) ?? null) : null

    const { data, error } = await sb
      .from('projects')
      .insert({
        contract_number:                contractNumber,
        client_name:                    r['Client name'] || '(sem nome)',
        client_phone:                   orNull(r['Client phone']),
        client_email:                   orNull(r['Client email']),
        address:                        orNull(r['Address']),
        work_type:                      workType,
        work_model_id:                  modelId,
        contract_signature_date:        parseDate(r['Contract signature date']),
        planned_start_date:             parseDate(r['Planned start date']),
        actual_start_date:              parseDate(r['Actual start date']),
        estimated_completion_date:      parseDate(r['Estimated completion date']),
        actual_completion_date:         parseDate(r['Actual completion date']),
        general_status:                 GENERAL_STATUS[r['General status']] ?? '1_aguarda_atribuicao',
        total_project_value:            parseCurrency(r['Total project value']),
        initial_supervisor_id:          supervisorId,
        assigned_supervisor_id:         assignedId,
        procurement_status:             PROCUREMENT_STATUS[r['Procurement status']] ?? null,
        procurement_list_uploaded_date: parseDate(r['Procurement list uploaded date']),
        measurements_verified:          parseBool(r['Measurement verified']),
        measurements_verified_date:     parseDate(r['Measurements verified date']),
        measurements_notes:             orNull(r['Measurement notes']),
        data_retificacao_marcada:       parseDate(r['Data de retificação marcada']),
        notes_phase_1:                  orNull(r['Notes — Phase 1 (Preparação)']),
        notes_phase_2:                  orNull(r['Notes — Phase 2 (Infraestruturas)']),
        notes_phase_3:                  orNull(r['Notes — Phase 3 (Revestimentos)']),
        notes_phase_4:                  orNull(r['Notes — Phase 4 (Montagem Final)']),
        has_extras:                     parseBool(r['Has extras']),
        extras_descricao:               orNull(r['Extras de obra — descrição']),
        orcamento_extra_descricao:      orNull(r['Orçamento extra para cliente — descrição']),
        orcamento_extra_valor:          parseCurrency(r['Orçamento extra — valor acordado']),
        fatura_equipa_enviada_ana:      parseBool(r['Fatura equipa enviada à Ana']),
        fatura_equipa_paga:             parseBool(r['Fatura equipa paga']),
      })
      .select('id, contract_number')
      .single()

    if (error) { console.error(`  ❌  ${contractNumber}:`, error.message); process.exit(1) }
    insertedProjects.push(data!)
    console.log(`  ✓  ${contractNumber} — billing_milestones auto-criados por trigger`)
  }

  const projectByContract = new Map(insertedProjects.map(p => [p.contract_number, p.id]))

  // ── 4. billing_milestones ────────────────────────────────────────────────
  console.log('\n4/5  billing_milestones (update do CSV)…')
  const milestoneRows = csvFile('Billing Milestones-Grid view.csv')
  let milestonesUpdated = 0

  for (const r of milestoneRows) {
    const linked = r['Linked project']
    if (!linked) continue
    const projectId = projectByContract.get(linked)
    if (!projectId) continue
    const stage = r['Billing stage']
    if (!stage) continue
    const milestoneId = stage === 'Start' ? 'start' : stage === 'Final' ? 'final' : 'extras'

    const patch: Record<string, unknown> = { status: MILESTONE_STATUS[r['Status']] ?? 'not_ready' }
    const amount = parseCurrency(r['Amount'])
    if (amount)                           patch.amount                      = amount
    if (orNull(r['Invoice number']))      patch.invoice_number              = r['Invoice number']
    if (r['Invoice issued date'])         patch.invoice_issued_date         = parseDate(r['Invoice issued date'])
    if (r['Payment due date'])            patch.payment_due_date            = parseDate(r['Payment due date'])
    if (r['Payment received date'])       patch.payment_received_date       = parseDate(r['Payment received date'])
    if (orNull(r['Notes']))               patch.notes                       = r['Notes']
    if (parseBool(r['Supervisor marked ready'])) {
      patch.supervisor_marked_ready      = true
      patch.supervisor_marked_ready_date = parseDate(r['Supervisor marked ready date'])
    }
    if (parseBool(r['Manager validated'])) {
      patch.manager_validated      = true
      patch.manager_validated_date = parseDate(r['Manager validated date'])
    }

    const { error } = await sb
      .from('billing_milestones')
      .update(patch)
      .eq('project_id', projectId)
      .eq('milestone_id', milestoneId)

    if (error) console.warn(`  ⚠️  milestone ${linked}-${milestoneId}:`, error.message)
    else milestonesUpdated++
  }
  console.log(`  ✓  ${milestonesUpdated} marcos actualizados`)

  // ── 5. issues ────────────────────────────────────────────────────────────
  console.log('\n5/5  issues…')
  const issueRows = csvFile('Issues-Pós-venda - Sofia.csv')
  let issuesInserted = 0

  for (const r of issueRows) {
    const linked = r['Linked project']
    if (!linked) continue
    const projectId = projectByContract.get(linked)
    if (!projectId) { console.warn(`  ⚠️  Projecto "${linked}" não encontrado — issue ignorado`); continue }

    const assignedName = r['Assigned to name'] || r['Assigned to'] || null
    const assignedId   = assignedName ? (partyByName.get(assignedName) ?? null) : null
    const reportedDate = parseDate(r['Reported date']) ?? new Date().toISOString().slice(0, 10)
    const validPriorities = ['Low', 'Normal', 'High', 'Urgent']
    const priority = validPriorities.includes(r['Priority']) ? r['Priority'] : 'Normal'

    const { error } = await sb.from('issues').insert({
      issue_title:                 r['Issue title'] || 'Sem título',
      project_id:                  projectId,
      reported_date:               reportedDate,
      priority,
      status:                      ISSUE_STATUS[r['Status']] ?? 'open',
      assigned_to_id:              assignedId,
      description:                 orNull(r['Description']),
      resolution_notes:            orNull(r['Resolution notes']),
      resolution_date:             parseDate(r['Resolution date']),
      tipo_reclamacao:             TIPO_RECLAMACAO[r['Tipo de reclamação']] ?? null,
      coberto_garantia:            COBERTO_GARANTIA[r['Coberto por garantia/contrato']] ?? null,
      departamento_responsavel:    DEPARTAMENTO[r['Departamento responsável']] ?? null,
      data_intervencao_prevista:   parseDate(r['Data de intervenção prevista']),
      data_resolucao_real:         parseDate(r['Data de resolução real']),
      cliente_confirmou_resolucao: parseBool(r['Cliente confirmou resolução']),
      afeta_pagamento:             parseBool(r['Afeta pagamento']),
    })

    if (error) console.warn(`  ⚠️  Issue "${r['Issue title']}":`, error.message)
    else issuesInserted++
  }
  console.log(`  ✓  ${issuesInserted} issues`)

  // ── apontamentos (sem projecto ligado) ────────────────────────────────────
  const orphans = csvFile('Apontamentos Obra-Grid view.csv').filter(r => !r['Linked project'])
  if (orphans.length > 0) {
    console.log(`\nℹ️  ${orphans.length} apontamento(s) sem projecto ligado no Airtable — não importados:`)
    orphans.forEach(r => console.log(`     • "${r['Apontamento title']}"  (${r['Data do apontamento']})`))
  }

  // ── sumário ───────────────────────────────────────────────────────────────
  console.log('\n✅  Migração concluída!')
  console.log('─'.repeat(44))
  console.log(`   work_models          ${models!.length}`)
  console.log(`   responsible_parties  ${parties!.length}`)
  console.log(`   projects             ${insertedProjects.length}`)
  console.log(`   billing_milestones   ${milestonesUpdated} actualizados (${insertedProjects.length * 2} auto-criados)`)
  console.log(`   issues               ${issuesInserted}`)
  console.log(`   apontamentos         0 (orphans)`)
  console.log('─'.repeat(44))
}

main().catch(err => {
  console.error('\n💥  Fatal:', (err as Error).message)
  process.exit(1)
})
