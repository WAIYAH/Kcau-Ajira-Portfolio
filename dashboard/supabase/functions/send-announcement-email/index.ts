// Supabase Edge Function: sends an announcement email via Resend, then
// logs the send in `email_log`. Only callable by an authenticated
// Leader/Admin -- verified server-side against `profiles`, not trusted
// from the client.
//
// Deploy: supabase functions deploy send-announcement-email
// Secrets:  supabase secrets set RESEND_API_KEY=re_xxx RESEND_FROM_EMAIL="KCA Ajira Club <you@yourdomain.com>"
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by the platform.)

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendPayload {
  subject: string
  body: string
  audience: 'all' | 'members' | 'leaders'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'KCA Ajira Club <onboarding@resend.dev>'

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured on this project.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: caller, error: callerError } = await serviceClient
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (callerError || !caller || !['leader', 'admin'].includes(caller.role) || caller.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Only active Leaders/Admins can send announcement emails.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = (await req.json()) as SendPayload
    if (!payload.subject || !payload.body || !payload.audience) {
      return new Response(JSON.stringify({ error: 'subject, body, and audience are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let recipientsQuery = serviceClient.from('profiles').select('email').eq('status', 'active')
    if (payload.audience === 'members') recipientsQuery = recipientsQuery.eq('role', 'member')
    if (payload.audience === 'leaders') recipientsQuery = recipientsQuery.in('role', ['leader', 'admin'])

    const { data: recipients, error: recipientsError } = await recipientsQuery
    if (recipientsError) throw recipientsError

    const recipientEmails = (recipients ?? []).map((r) => r.email).filter(Boolean)

    let status = 'sent'
    let sendError: string | null = null

    if (recipientEmails.length > 0) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [fromEmail],
          bcc: recipientEmails,
          subject: payload.subject,
          html: payload.body.replace(/\n/g, '<br/>'),
        }),
      })

      if (!resendRes.ok) {
        status = 'failed'
        sendError = await resendRes.text()
      }
    } else {
      status = 'failed'
      sendError = 'No active recipients matched this audience.'
    }

    await serviceClient.from('email_log').insert({
      subject: payload.subject,
      body: payload.body,
      audience: payload.audience,
      sent_by: user.id,
      recipient_count: recipientEmails.length,
      status,
    })

    if (status === 'failed') {
      return new Response(JSON.stringify({ error: sendError }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, recipientCount: recipientEmails.length }), {
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
