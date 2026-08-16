/* ==================================================
   supabase-client.js
   - Public-site Supabase client, used by the Contact form and the
     "quick interest" Join form to actually save submissions instead of
     just showing a fake success toast.
   - Uses the anon key, which is meant to be public (it's only as
     powerful as the Row Level Security policies allow -- see
     dashboard/supabase/migrations/0006_inquiries.sql: anyone can INSERT
     an inquiry, only club staff can read them back).
   - This is the SAME Supabase project the member dashboard (dashboard/)
     runs on, so an inquiry submitted here shows up for leaders to see.
   ================================================== */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://cjntpaqafyvzyiyfgekm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbnRwYXFhZnl2enlpeWZnZWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDU5MTgsImV4cCI6MjEwMjM4MTkxOH0.eKqr63-cuEMTAvbNEML8leqKI0v4MulmJjeXdhkZIG8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Saves a Contact or Join-interest submission. Returns { error } (error
// is null on success) so callers can show the right toast/state.
export async function submitInquiry({ type, name, email, phone = null, subject = null, message = null, newsletterOptIn = false }) {
  const { error } = await supabase.from('inquiries').insert({
    type,
    name,
    email,
    phone,
    subject,
    message,
    newsletter_opt_in: newsletterOptIn,
  });
  return { error };
}
