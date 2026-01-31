/* ==================================================
   modals.js
   - Program & Join modal logic
   - Exposes functions on `window` for compatibility with inline handlers
   - Keeps `programDetails` data separated from main initialization
   ================================================== */

export const programDetails = {
  'skill-labs': {
    title: 'Weekly Skill Labs',
    content: `...` // (kept short here; main content will be assigned in JS when needed)
  },
  'freelance-launchpad': {
    title: 'Freelance Launchpad Program',
    content: `...`
  },
  'digital-mentorship': {
    title: 'Digital Mentorship Program',
    content: `...`
  }
};

// We will set the real HTML content when the module is imported by main.js
// so the content remains readable and separation of concerns is clear.

export function openJoinModal() {
  const modal = document.getElementById('join-modal');
  const modalContent = document.getElementById('modal-content');

  modalContent.innerHTML = `
    <form id="modal-join-form" class="space-y-4">
      <div>
        <label class="block text-gray-700 mb-2" for="modal-name">Full Name</label>
        <input type="text" id="modal-name" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" required>
      </div>
      <div>
        <label class="block text-gray-700 mb-2" for="modal-email">KCA Email</label>
        <input type="email" id="modal-email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="john.doe@students.kca.ac.ke" required>
      </div>
      <div class="pt-2">
        <button type="submit" class="w-full btn-primary text-white font-semibold py-3 rounded-lg">
          Join Next Session <i class="ml-2 fas fa-calendar-alt"></i>
        </button>
      </div>
    </form>
    <p class="text-gray-500 text-sm text-center mt-4">Next session: Wednesday, 5 PM at Tech Lab 3</p>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export function closeJoinModal() {
  const modal = document.getElementById('join-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

export function openProgramModal(programId) {
  const modal = document.getElementById('program-modal');
  const title = document.getElementById('program-modal-title');
  const content = document.getElementById('program-modal-content');

  if (programDetails[programId]) {
    title.textContent = programDetails[programId].title;
    content.innerHTML = programDetails[programId].content;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

export function closeProgramModal() {
  const modal = document.getElementById('program-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

export function registerForProgram(programId) {
  const pd = programDetails[programId];
  if (pd) {
    // showToast is provided by main.js and exposed on window
    if (typeof window.showToast === 'function') {
      window.showToast('Program Registration', `You've registered for the ${pd.title}. Check your email for confirmation and next steps.`);
    }
    closeProgramModal();
  }
}

// Attach to `window` so existing inline attributes can still call these if present
window.openJoinModal = openJoinModal;
window.closeJoinModal = closeJoinModal;
window.openProgramModal = openProgramModal;
window.closeProgramModal = closeProgramModal;
window.registerForProgram = registerForProgram;
