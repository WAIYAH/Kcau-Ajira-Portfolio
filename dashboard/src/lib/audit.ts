import { supabase } from './supabaseClient'

export async function logAudit(
  action: string,
  targetTable?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  const { data } = await supabase.auth.getUser()
  await supabase.from('audit_log').insert({
    actor_id: data.user?.id ?? null,
    action,
    target_table: targetTable ?? null,
    target_id: targetId ?? null,
    metadata: metadata ?? null,
  })
}
