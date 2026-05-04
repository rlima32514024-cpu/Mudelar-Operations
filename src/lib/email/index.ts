import { Resend } from 'resend'
import { CURRENT_PHASE_LABELS } from '@/types'
import type { CurrentPhase } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'noreply@mudelar.pt'
const MARIO = process.env.EMAIL_MARIO ?? ''
const SUSANA = process.env.EMAIL_SUSANA ?? ''
const ANA = process.env.EMAIL_ANA ?? ''
const GUSTAVO = process.env.EMAIL_GUSTAVO ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function send(to: string[], subject: string, html: string) {
  const recipients = to.filter(Boolean)
  if (recipients.length === 0) return
  try {
    await resend.emails.send({ from: FROM, to: recipients, subject, html })
  } catch {
    // fire-and-forget: email failures don't block mutations
  }
}

function link(id: string) {
  return `${APP_URL}/obras/${id}`
}

function row(label: string, value: string | null | undefined) {
  if (!value) return ''
  return `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:16px">${label}</td><td style="padding:4px 0;font-size:13px">${value}</td></tr>`
}

function wrap(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
<h2 style="margin-bottom:16px;font-size:18px">${title}</h2>
${body}
<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
<p style="font-size:12px;color:#9ca3af;margin:0">Mudelar Operations — sistema automático, não responda a este email</p>
</body></html>`
}

// ─── Automação 1: Obra criada → mario ────────────────────────────────────────

export async function emailObraCriada(p: {
  projectId: string
  contractNumber: string
  clientName: string
  address: string | null
  workType: string
  totalValue: number | null
}) {
  await send(
    [MARIO],
    `Nova obra criada — ${p.contractNumber}`,
    wrap(
      `Nova obra: ${p.contractNumber}`,
      `<p style="color:#374151">Uma nova obra foi registada e aguarda atribuição de supervisor.</p>
      <table style="border-collapse:collapse">
        ${row('Cliente', p.clientName)}
        ${row('Morada', p.address)}
        ${row('Tipo', p.workType)}
        ${p.totalValue != null ? row('Valor total', `€${p.totalValue.toFixed(2)}`) : ''}
      </table>
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 2+3: Supervisor atribuído + retificação marcada → supervisor ──

export async function emailSupervisorAtribuido(p: {
  projectId: string
  contractNumber: string
  clientName: string
  address: string | null
  supervisorEmail: string | null
  supervisorName: string | null
  dataRetificacao: string | null
}) {
  if (!p.supervisorEmail) return
  await send(
    [p.supervisorEmail],
    `Nova obra atribuída — ${p.contractNumber}`,
    wrap(
      `Obra atribuída: ${p.contractNumber}`,
      `<p>Olá${p.supervisorName ? ` ${p.supervisorName}` : ''},</p>
      <p>Foi-lhe atribuída uma nova obra para retificação de medidas.</p>
      <table style="border-collapse:collapse">
        ${row('Contrato', p.contractNumber)}
        ${row('Cliente', p.clientName)}
        ${row('Morada', p.address)}
        ${p.dataRetificacao ? row('Data de retificação', p.dataRetificacao) : ''}
      </table>
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 5: Lista de compras submetida → susana ────────────────────────

export async function emailListaComprasSubmetida(p: {
  projectId: string
  contractNumber: string
  clientName: string
  listUrl: string | null
}) {
  await send(
    [SUSANA],
    `Lista de compras submetida — ${p.contractNumber}`,
    wrap(
      `Lista de compras: ${p.contractNumber}`,
      `<p>Foi submetida uma lista de compras para a obra <strong>${p.contractNumber}</strong> — ${p.clientName}.</p>
      ${p.listUrl ? `<p><a href="${p.listUrl}" style="color:#2563eb;font-weight:600">Ver lista de compras →</a></p>` : ''}
      <p><a href="${link(p.projectId)}" style="color:#2563eb">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 6: Compras recebidas → mario + supervisor ─────────────────────

export async function emailComprasRecebidas(p: {
  projectId: string
  contractNumber: string
  clientName: string
  supervisorEmail: string | null
}) {
  const to = [MARIO, p.supervisorEmail ?? '']
  await send(
    to,
    `Compras recebidas — ${p.contractNumber}`,
    wrap(
      `Compras recebidas: ${p.contractNumber}`,
      `<p>As compras para a obra <strong>${p.contractNumber}</strong> — ${p.clientName} foram recebidas.</p>
      <p>A obra pode agora ser agendada para arranque.</p>
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 7: Obra iniciada → cliente ────────────────────────────────────

export async function emailObraIniciada(p: {
  projectId: string
  contractNumber: string
  clientName: string
  clientEmail: string | null
  plannedStartDate: string | null
}) {
  if (!p.clientEmail) return
  await send(
    [p.clientEmail],
    `A sua obra foi iniciada — ${p.contractNumber}`,
    wrap(
      'A sua obra foi iniciada',
      `<p>Caro/a ${p.clientName},</p>
      <p>Temos o prazer de informar que a sua obra (<strong>${p.contractNumber}</strong>) foi iniciada.</p>
      ${p.plannedStartDate ? `<p>Data de arranque prevista: <strong>${p.plannedStartDate}</strong></p>` : ''}
      <p>Para qualquer questão, não hesite em contactar a nossa equipa.</p>
      <p style="color:#6b7280;font-size:13px">Equipa Mudelar</p>`
    )
  )
}

// ─── Automação 8: Fase atualizada → mario ────────────────────────────────────

export async function emailFaseAtualizada(p: {
  projectId: string
  contractNumber: string
  clientName: string
  phase: CurrentPhase
}) {
  await send(
    [MARIO],
    `Fase atualizada — ${p.contractNumber}`,
    wrap(
      `Fase atualizada: ${p.contractNumber}`,
      `<p>A obra <strong>${p.contractNumber}</strong> — ${p.clientName} avançou para a fase:</p>
      <p style="font-size:15px;font-weight:600;color:#111">${CURRENT_PHASE_LABELS[p.phase]}</p>
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 9: Obra concluída → cliente + mario ───────────────────────────

export async function emailObraConcluida(p: {
  projectId: string
  contractNumber: string
  clientName: string
  clientEmail: string | null
}) {
  const to = [MARIO, p.clientEmail ?? '']
  await send(
    to,
    `Obra concluída — ${p.contractNumber}`,
    wrap(
      `Obra concluída: ${p.contractNumber}`,
      `<p>Caro/a ${p.clientName},</p>
      <p>A sua obra (<strong>${p.contractNumber}</strong>) foi concluída com sucesso.</p>
      <p>Obrigado por confiar na Mudelar para a sua remodelação. Esperamos que fique muito satisfeito/a com o resultado.</p>
      <p style="color:#6b7280;font-size:13px">Equipa Mudelar</p>`
    )
  )
}

// ─── Automação 10: Marco pronto → mario + ana ────────────────────────────────

export async function emailMarcoPronto(p: {
  projectId: string
  contractNumber: string
  clientName: string
  billingStage: string
  amount: number | null
}) {
  await send(
    [MARIO, ANA],
    `Marco pronto para validação — ${p.contractNumber}`,
    wrap(
      `Marco pronto: ${p.contractNumber}`,
      `<p>O marco <strong>${p.billingStage}</strong> da obra <strong>${p.contractNumber}</strong> — ${p.clientName} está pronto para validação.</p>
      ${p.amount != null ? `<p>Valor: <strong>€${p.amount.toFixed(2)}</strong></p>` : ''}
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 11: Marco validado → ana ──────────────────────────────────────

export async function emailMarcoValidado(p: {
  projectId: string
  contractNumber: string
  clientName: string
  billingStage: string
  amount: number | null
}) {
  await send(
    [ANA],
    `Marco validado — ${p.contractNumber}`,
    wrap(
      `Marco validado: ${p.contractNumber}`,
      `<p>O marco <strong>${p.billingStage}</strong> da obra <strong>${p.contractNumber}</strong> — ${p.clientName} foi validado.</p>
      ${p.amount != null ? `<p>Valor: <strong>€${p.amount.toFixed(2)}</strong></p>` : ''}
      <p>Pode emitir a fatura ao cliente.</p>
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 12: Fatura emitida → mario + cliente ──────────────────────────

export async function emailFaturaEmitida(p: {
  projectId: string
  contractNumber: string
  clientName: string
  clientEmail: string | null
  invoiceNumber: string | null
  billingStage: string
  amount: number | null
  paymentDueDate: string | null
}) {
  const to = [MARIO, p.clientEmail ?? '']
  await send(
    to,
    `Fatura emitida — ${p.contractNumber}`,
    wrap(
      `Fatura emitida: ${p.contractNumber}`,
      `<p>Caro/a ${p.clientName},</p>
      <p>Foi emitida uma fatura referente ao marco <strong>${p.billingStage}</strong> da sua obra <strong>${p.contractNumber}</strong>.</p>
      <table style="border-collapse:collapse">
        ${p.invoiceNumber ? row('N.º fatura', p.invoiceNumber) : ''}
        ${p.amount != null ? row('Valor', `€${p.amount.toFixed(2)}`) : ''}
        ${p.paymentDueDate ? row('Data limite pagamento', p.paymentDueDate) : ''}
      </table>
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 13: Pagamento recebido → mario ────────────────────────────────

export async function emailPagamentoRecebido(p: {
  projectId: string
  contractNumber: string
  clientName: string
  billingStage: string
  amount: number | null
}) {
  await send(
    [MARIO],
    `Pagamento recebido — ${p.contractNumber}`,
    wrap(
      `Pagamento recebido: ${p.contractNumber}`,
      `<p>Foi registado o pagamento do marco <strong>${p.billingStage}</strong> da obra <strong>${p.contractNumber}</strong> — ${p.clientName}.</p>
      ${p.amount != null ? `<p>Valor pago: <strong>€${p.amount.toFixed(2)}</strong></p>` : ''}
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 14: Issue urgente criado → mario + gustavo ────────────────────

export async function emailIssueUrgente(p: {
  projectId: string
  contractNumber: string
  clientName: string
  issueTitle: string
  priority: string
  description: string | null
}) {
  await send(
    [MARIO, GUSTAVO],
    `Issue ${p.priority} — ${p.contractNumber}: ${p.issueTitle}`,
    wrap(
      `Issue ${p.priority}: ${p.contractNumber}`,
      `<p>Foi criado um issue de prioridade <strong style="color:#dc2626">${p.priority}</strong> na obra <strong>${p.contractNumber}</strong> — ${p.clientName}.</p>
      <table style="border-collapse:collapse">
        ${row('Título', p.issueTitle)}
        ${row('Prioridade', p.priority)}
        ${p.description ? row('Descrição', p.description) : ''}
      </table>
      <p style="margin-top:16px"><a href="${link(p.projectId)}" style="color:#2563eb;font-weight:600">Ver obra →</a></p>`
    )
  )
}

// ─── Automação 15: Issue resolvido → cliente ─────────────────────────────────

export async function emailIssueResolvido(p: {
  projectId: string
  contractNumber: string
  clientName: string
  clientEmail: string | null
  issueTitle: string
  resolutionNotes: string | null
}) {
  if (!p.clientEmail) return
  await send(
    [p.clientEmail],
    `Problema resolvido — ${p.contractNumber}`,
    wrap(
      'Problema resolvido',
      `<p>Caro/a ${p.clientName},</p>
      <p>Temos o prazer de informar que o problema <strong>"${p.issueTitle}"</strong> referente à sua obra (<strong>${p.contractNumber}</strong>) foi resolvido.</p>
      ${p.resolutionNotes ? `<p style="background:#f9fafb;border-left:3px solid #e5e7eb;padding:8px 12px;font-size:13px;color:#374151"><em>Notas: ${p.resolutionNotes}</em></p>` : ''}
      <p>Para qualquer questão adicional, não hesite em contactar a nossa equipa.</p>
      <p style="color:#6b7280;font-size:13px">Equipa Mudelar</p>`
    )
  )
}

// ─── Automação 16: SLA monitor (via edge function — ver supabase/functions/sla-monitor)
