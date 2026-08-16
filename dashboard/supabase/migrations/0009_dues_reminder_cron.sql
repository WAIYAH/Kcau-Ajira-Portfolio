-- Schedules the send-dues-reminder Edge Function to run weekly (ROADMAP.md
-- §2.3). pg_cron and pg_net are both officially supported Supabase
-- extensions (Database -> Extensions in the dashboard if this fails to
-- enable here for permission reasons on your plan).
--
-- MANUAL STEP REQUIRED before this migration does anything useful: the two
-- placeholders below (<project-ref> and <CRON_SECRET value>) can't be known
-- from inside a plain SQL migration. Find your project ref in your Supabase
-- project URL; pick any random string for the secret and set it with
-- `supabase secrets set CRON_SECRET=<that string>` (matching what you pass
-- here), same pattern as RESEND_API_KEY. Then replace the placeholders and
-- run this migration -- or skip this file and create the equivalent
-- schedule from the dashboard's Database -> Cron Jobs UI instead, which
-- fills in the project URL for you automatically.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'weekly-dues-reminder',
  '0 8 * * 1', -- every Monday at 08:00 UTC
  $$
  select net.http_post(
    url := 'https://<project-ref>.functions.supabase.co/send-dues-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET value>'),
    body := '{}'::jsonb
  );
  $$
);

-- To change the schedule or stop it later:
--   select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'weekly-dues-reminder'), schedule := '...');
--   select cron.unschedule('weekly-dues-reminder');
