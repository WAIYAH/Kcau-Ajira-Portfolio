/* ==================================================
   form-handler.js
   - Handles the join form (page + modal) submissions
   - Uses a single delegated submit handler so dynamically
     inserted modal form is handled automatically
   - Exports an initializer function to be called from main.js
   ================================================== */

export function initFormHandlers(showToast) {
  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;

    // Page join form
    if (form.id === 'join-form') {
      e.preventDefault();
      const name = document.getElementById('name')?.value || '';
      const email = document.getElementById('email')?.value || '';
      const course = document.getElementById('course')?.value || '';
      const interest = document.getElementById('interest')?.value || '';

      // Demo success behaviour
      showToast(
        'Application Submitted!',
        `Thanks ${name}! We've received your application to join Ajira Club. Check your email for next steps.`
      );

      form.reset();
      // Close modal if open
      if (typeof window.closeJoinModal === 'function') window.closeJoinModal();
    }

    // Modal join form (dynamically inserted)
    if (form.id === 'modal-join-form') {
      e.preventDefault();
      const name = document.getElementById('modal-name')?.value || '';

      showToast(
        'Session Registered!',
        `Great ${name}! You're registered for our next session. See you Wednesday at 5 PM in Tech Lab 3.`
      );

      form.reset();
      if (typeof window.closeJoinModal === 'function') window.closeJoinModal();
    }
  });
}
