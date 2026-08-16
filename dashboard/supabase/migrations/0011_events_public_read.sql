-- Public site <-> dashboard content unification (ROADMAP.md §2.4). Event
-- titles/dates/locations aren't sensitive -- they're the same information
-- already visible to every signed-in member -- so this adds an anon-read
-- policy alongside the existing "events: authenticated read" one (RLS
-- policies are OR'd together; this doesn't replace or weaken the existing
-- policy, just adds a second path).
--
-- This lets the public marketing site's anon key read upcoming events
-- directly and render a live "More on the calendar" list, so a Leader who
-- posts a one-time event in the dashboard doesn't also have to hand-edit
-- index.html to get it to show up publicly.

create policy "events: public read" on public.events
  for select using (true);
