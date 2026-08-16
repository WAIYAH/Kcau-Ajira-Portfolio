/* ==================================================
   form-handler.js
   - Handles the join form (page + modal) submissions
   - Uses a single delegated submit handler so dynamically
     inserted modal form is handled automatically
   - Exports an initializer function to be called from main.js
   - Real submissions: both forms save to Supabase (`inquiries` table,
     type='join_interest') so a club leader actually sees them in the
     dashboard, instead of the old fake "success" toast that saved nothing.
   ================================================== */

import { submitInquiry } from './supabase-client.js';

function setSubmitting(form, isSubmitting) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  button.disabled = isSubmitting;
  if (isSubmitting) {
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
  } else if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
  }
}

export function initFormHandlers(showToast) {
  document.addEventListener('submit', async function (e) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;

    // Page join form (full interest form: name, email, course, interest)
    if (form.id === 'join-form') {
      e.preventDefault();
      const name = document.getElementById('name')?.value || '';
      const email = document.getElementById('email')?.value || '';
      const course = document.getElementById('course')?.value || '';
      const interest = document.getElementById('interest')?.value || '';

      setSubmitting(form, true);
      const { error } = await submitInquiry({
        type: 'join_interest',
        name,
        email,
        subject: interest,
        message: course ? `Course/Program: ${course}` : null,
      });
      setSubmitting(form, false);

      if (error) {
        showToast('Something went wrong', "We couldn't save your details. Please try again or email us directly.");
        return;
      }

      showToast(
        'Application Submitted!',
        `Thanks ${name}! We've received your details and a club leader will follow up by email soon.`
      );

      form.reset();
      if (typeof window.closeJoinModal === 'function') window.closeJoinModal();
    }

    // Modal join form (dynamically inserted, quick version: name + email only)
    if (form.id === 'modal-join-form') {
      e.preventDefault();
      const name = document.getElementById('modal-name')?.value || '';
      const email = document.getElementById('modal-email')?.value || '';

      setSubmitting(form, true);
      const { error } = await submitInquiry({
        type: 'join_interest',
        name,
        email,
        subject: 'Quick join (modal)',
      });
      setSubmitting(form, false);

      if (error) {
        showToast('Something went wrong', "We couldn't save your details. Please try again or email us directly.");
        return;
      }

      showToast(
        'Session Registered!',
        `Great ${name}! We've got your details and a club leader will follow up. See you Wednesday at 5 PM in Tech Lab 3.`
      );

      form.reset();
      if (typeof window.closeJoinModal === 'function') window.closeJoinModal();
    }
  });
}
