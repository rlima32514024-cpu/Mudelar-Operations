const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM = Deno.env.get('EMAIL_FROM') ?? 'noreply@mudelar.pt'
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://mudelar.pt'

export async function sendEmail(to: string[], subject: string, html: string) {
  const recipients = to.filter(Boolean)
  if (recipients.length === 0 || !RESEND_API_KEY) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to: recipients, subject, html }),
  })
}

export function projectLink(id: string) {
  return `${APP_URL}/obras/${id}`
}

export function wrap(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
<h2 style="margin-bottom:16px;font-size:18px">${title}</h2>
${body}
<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
<p style="font-size:12px;color:#9ca3af;margin:0">Mudelar Operations — sistema automático, não responda a este email</p>
</body></html>`
}
