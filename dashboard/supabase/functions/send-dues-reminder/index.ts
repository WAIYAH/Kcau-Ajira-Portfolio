// Supabase Edge Function: emails everyone with unpaid/partial dues that are
// overdue or due within 7 days, one email per member (their own outstanding
// terms + total), then logs a single summary row to `email_log`.
//
// Unlike send-announcement-email, this isn't called from the dashboard UI by
// a logged-in Leader -- it's meant to run on a schedule (see
// dashboard/supabase/migrations/0009_dues_reminder_cron.sql), so instead of
// checking a user's session it checks a shared secret header. That secret is
// never sent to a browser; it only ever travels from pg_cron -> this function.
//
// Deploy: supabase functions deploy send-dues-reminder --no-verify-jwt
// Secrets:  supabase secrets set CRON_SECRET=<any random string>
//           (RESEND_API_KEY / RESEND_FROM_EMAIL are already set from the
//           send-announcement-email setup -- this function reuses them.)
//
// Manual test: curl -X POST https://<project-ref>.functions.supabase.co/send-dues-reminder \
//   -H "x-cron-secret: <your CRON_SECRET>"

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

interface DueRow {
  term: string
  amount_due: number
  amount_paid: number
  due_date: string | null
  profile_id: string
  profiles: { full_name: string; email: string } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET')
    const suppliedSecret = req.headers.get('x-cron-secret')
    if (!cronSecret || suppliedSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'KCA Ajira Club <onboarding@resend.dev>'

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured on this project.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: dueRows, error: duesError } = await serviceClient
      .from('membership_dues')
      .select('term, amount_due, amount_paid, due_date, profile_id, profiles(full_name, email)')
      .neq('status', 'paid')
      .not('due_date', 'is', null)
      .lte('due_date', sevenDaysOut)

    if (duesError) throw duesError

    const byMember = new Map<string, { name: string; email: string; lines: string[]; total: number }>()
    for (const row of (dueRows ?? []) as unknown as DueRow[]) {
      if (!row.profiles?.email) continue
      const outstanding = Number(row.amount_due) - Number(row.amount_paid)
      if (outstanding <= 0) continue
      const entry = byMember.get(row.profile_id) ?? { name: row.profiles.full_name, email: row.profiles.email, lines: [], total: 0 }
      const dueLabel = row.due_date ? ` (due ${row.due_date})` : ''
      entry.lines.push(`${row.term}: KES ${outstanding.toFixed(2)}${dueLabel}`)
      entry.total += outstanding
      byMember.set(row.profile_id, entry)
    }

    let sentCount = 0
    let failedCount = 0

    for (const { name, email, lines, total } of byMember.values()) {
      const html = [
        `<p>Hi ${name},</p>`,
        `<p>This is a friendly reminder that you have outstanding KCA Ajira Club membership dues:</p>`,
        `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>`,
        `<p><strong>Total outstanding: KES ${total.toFixed(2)}</strong></p>`,
        `<p>You can settle this with any club Treasurer/Leader, or check your dues status in the member dashboard.</p>`,
      ].join('\n')

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Reminder: outstanding KCA Ajira Club dues',
          html,
        }),
      })

      if (res.ok) sentCount++
      else failedCount++
    }

    await serviceClient.from('email_log').insert({
      subject: 'Reminder: outstanding KCA Ajira Club dues',
      body: `Automated weekly dues reminder. Sent to ${sentCount} member(s), ${failedCount} failure(s).`,
      audience: 'all',
      sent_by: null,
      recipient_count: sentCount,
      status: failedCount > 0 && sentCount === 0 ? 'failed' : 'sent',
    })

    return new Response(JSON.stringify({ ok: true, sentCount, failedCount, consideredMembers: byMember.size }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
