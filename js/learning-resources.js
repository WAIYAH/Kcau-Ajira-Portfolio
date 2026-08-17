/* ==================================================
   learning-resources.js
   - Renders a small "From the Learning Hub" list on skills.html, fed live
     from the dashboard's `learning_resources` table (staff-curated
     articles/videos/courses/links members already see in-app) -- distinct
     from the static skill cards above it, which stay hardcoded since they
     describe the club's evergreen skill categories, not individual curated
     resources.
   - Whole section stays hidden if there are zero resources yet, so it never
     shows an awkward empty state to a visitor.
   ================================================== */

import { fetchLearningResources } from './supabase-client.js';

const TYPE_ICON = {
  article: 'fa-file-lines',
  video: 'fa-circle-play',
  course: 'fa-graduation-cap',
  link: 'fa-arrow-up-right-from-square',
};

function resourceCardHtml(resource) {
  const icon = TYPE_ICON[resource.type] ?? 'fa-book';
  const tag = resource.skill_tag
    ? `<span class="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">${resource.skill_tag}</span>`
    : '';
  return `
    <a href="${resource.url_or_content}" target="_blank" rel="noopener noreferrer"
       class="group bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2 hover:border-blue-300 hover:shadow-md transition-all">
      <div class="flex items-start justify-between gap-3">
        <h4 class="font-bold text-gray-800 group-hover:text-blue-700">${resource.title}</h4>
        <i class="fas ${icon} text-blue-500 mt-1"></i>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs uppercase tracking-wide text-gray-400 font-semibold">${resource.category}</span>
        ${tag}
      </div>
    </a>
  `;
}

export async function initLearningResources() {
  const container = document.getElementById('learning-hub-list');
  if (!container) return;

  const { resources, error } = await fetchLearningResources(6);
  if (error || resources.length === 0) return; // stays hidden -- see file header

  const grid = container.querySelector('[data-learning-hub-grid]');
  grid.innerHTML = resources.map(resourceCardHtml).join('');
  container.classList.remove('hidden');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLearningResources);
} else {
  initLearningResources();
}
