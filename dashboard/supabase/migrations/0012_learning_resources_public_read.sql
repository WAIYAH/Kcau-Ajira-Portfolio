-- Public site <-> dashboard content unification, continued (ROADMAP.md
-- §2.4's explicitly-deferred item: "skills.html -> learning_resources pull").
-- Same reasoning as 0011_events_public_read.sql: titles/categories/links of
-- staff-curated learning resources aren't sensitive -- they're the same
-- material already visible to every signed-in member -- so this adds an
-- anon-read policy alongside the existing "resources: authenticated read"
-- one (RLS policies are OR'd together; this doesn't replace or weaken the
-- existing policy, just adds a second path).
--
-- Lets the public marketing site's anon key read curated resources directly
-- and render a live "From the Learning Hub" list on skills.html, so a
-- Leader who adds a resource in the dashboard doesn't also have to
-- hand-edit skills.html to get it to show up publicly.

create policy "resources: public read" on public.learning_resources
  for select using (true);
