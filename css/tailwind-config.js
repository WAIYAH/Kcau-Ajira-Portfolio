/* Tailwind CDN configuration.
   This file is loaded before the Tailwind CDN script in the HTML so
   you can customize Tailwind via the `tailwind.config` global.

   You can extend themes, add colors, etc. This is optional but useful
   for keeping central theme variables if you need to customize further.
*/

window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        'kca-blue': '#2563eb',
        'kca-dark': '#1e40af',
        'kca-orange': '#f97316'
      }
    }
  }
};
