// Automação 16: SLA Monitor — corre diariamente às 8h
// Envia email a gustavo + mario para issues com SLA a expirar em 24h ou já em breach

import { createAdminClient } from '../_shared/supabase-client.ts'
import { sendEmail, projectLink, wrap } from '../_shared/email.ts'

const MARIO = Deno.env.get('EMAIL_MARIO') ?? ''
const GUSTAVO = Deno.env.get('EMAIL_GUSTAVO') ?? ''

Deno.serve(async (_req) => {
  try {
    const supabase = createAdminClient()

    // Issues com SLA em breach ou a expirar nas próximas 24h
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const todayStr = new Date().toISOString().split('T')[0]

    const { data: issues, error } = await supabase
      .from('issues_view')
      .select('id, issue_title, project_id, priority, sla_deadline, sla_breach, days_open')
      .in('status', ['open', 'in_progress'])
      .not('sla_deadline', 'is', null)
      .or(`sla_breach.eq.true,sla_deadline.lte.${tomorrowStr}`)
      .order('sla_deadline', { ascending: true })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    if (!issues || issues.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
    }

    // Fetch project info for context
    const projectIds = [...new Set(issues.map((i) => i.project_id))]
    const { data: projects } = await supabase
      .from('projects')
      .select('id, contract_number, client_name')
      .in('id', projectIds)

    const projectMap = new Map((projects ?? []).map((p) => [p.id, p]))

    const breachIssues = issues.filter((i) => i.sla_breach)
    const expiringIssues = issues.filter((i) => !i.sla_breach && i.sla_deadline && i.sla_deadline <= tomorrowStr)

    const buildRows = (list: typeof issues) =>
      list
        .map((i) => {
          const project = projectMap.get(i.project_id)
          const label = i.sla_breach
            ? `<span style="color:#dc2626;font-weight:600">SLA violado</span>`
            : `<span style="color:#d97706;font-weight:600">Expira ${i.sla_deadline}</span>`
          return `<tr>
            <td style="padding:6px 8px;font-size:13px;border-bottom:1px solid #f3f4f6">${project?.contract_number ?? '—'}</td>
            <td style="padding:6px 8px;font-size:13px;border-bottom:1px solid #f3f4f6">${i.issue_title}</td>
            <td style="padding:6px 8px;font-size:13px;border-bottom:1px solid #f3f4f6">${i.priority}</td>
            <td style="padding:6px 8px;font-size:13px;border-bottom:1px solid #f3f4f6">${label}</td>
            <td style="padding:6px 8px;font-size:13px;border-bottom:1px solid #f3f4f6">
              <a href="${projectLink(i.project_id)}" style="color:#2563eb">Ver</a>
            </td>
          </tr>`
        })
        .join('')

    const tableHeader = `<tr style="background:#f9fafb">
      <th style="padding:6px 8px;text-align:left;font-size:12px;color:#6b7280">Contrato</th>
      <th style="padding:6px 8px;text-align:left;font-size:12px;color:#6b7280">Issue</th>
      <th style="padding:6px 8px;text-align:left;font-size:12px;color:#6b7280">Prioridade</th>
      <th style="padding:6px 8px;text-align:left;font-size:12px;color:#6b7280">SLA</th>
      <th style="padding:6px 8px"></th>
    </tr>`

    let body = `<p>Relatório diário de SLA — <strong>${todayStr}</strong></p>`

    if (breachIssues.length > 0) {
      body += `<h3 style="color:#dc2626;font-size:14px;margin:16px 0 8px">SLA violado (${breachIssues.length})</h3>
      <table style="border-collapse:collapse;width:100%">${tableHeader}${buildRows(breachIssues)}</table>`
    }

    if (expiringIssues.length > 0) {
      body += `<h3 style="color:#d97706;font-size:14px;margin:16px 0 8px">Expira nas próximas 24h (${expiringIssues.length})</h3>
      <table style="border-collapse:collapse;width:100%">${tableHeader}${buildRows(expiringIssues)}</table>`
    }

    await sendEmail(
      [MARIO, GUSTAVO],
      `SLA Monitor — ${breachIssues.length} violados, ${expiringIssues.length} a expirar`,
      wrap(`SLA Monitor: ${todayStr}`, body)
    )

    return new Response(
      JSON.stringify({ processed: issues.length, breach: breachIssues.length, expiring: expiringIssues.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
