/* ==================================================
   upcoming-events.js
   - Renders a small "More on the calendar" list fed live from the
     dashboard's `events` table (one-time events a Leader posts there --
     elections, hackathons, guest sessions -- distinct from the two
     evergreen recurring-schedule cards above it, which stay hardcoded
     since they describe a permanent weekly pattern, not a dated event).
   - Whole section stays hidden if there are zero upcoming one-time events,
     so it never shows an awkward empty state to a visitor.
   ================================================== */

import { fetchUpcomingEvents } from './supabase-client.js';

function formatEventDate(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function eventCardHtml(event) {
  const description = event.description ? `<p class="text-blue-200 text-sm mt-2">${event.description}</p>` : '';
  const location = event.location ? `<span><i class="fas fa-map-marker-alt mr-1"></i> ${event.location}</span>` : '';
  const category = event.category
    ? `<span class="bg-white/10 text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-full">${event.category}</span>`
    : '';
  return `
    <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex flex-col gap-2">
      <div class="flex items-start justify-between gap-3">
        <h4 class="font-bold text-white">${event.title}</h4>
        ${category}
      </div>
      <div class="flex items-center gap-4 text-blue-300 text-xs">
        <span><i class="fas fa-clock mr-1"></i> ${formatEventDate(event.starts_at)}</span>
        ${location}
      </div>
      ${description}
    </div>
  `;
}

export async function initUpcomingEvents() {
  const container = document.getElementById('dynamic-events-list');
  if (!container) return;

  const { events, error } = await fetchUpcomingEvents(3);
  if (error || events.length === 0) return; // stays hidden -- see file header

  const grid = container.querySelector('[data-dynamic-events-grid]');
  grid.innerHTML = events.map(eventCardHtml).join('');
  container.classList.remove('hidden');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUpcomingEvents);
} else {
  initUpcomingEvents();
}
