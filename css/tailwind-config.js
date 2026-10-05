/* ==================================================
   Tailwind CDN configuration — KCA UNIVERSITY BRAND PALETTE
   Loaded before the Tailwind CDN script in every page.

   WHY THIS FILE REMAPS THE STOCK TAILWIND SCALES
   ----------------------------------------------
   KCA University's visual identity is two colours, sampled straight
   from the official university logo (07_BRANDING/Logos/KCAU_logo_svg.png):

       KCA Navy  #001D51      KCA Gold  #CEAA0C

   The site was originally built on stock Tailwind `blue-*` / `orange-*` /
   `teal-*` utilities (generic #2563eb / #f97316), spread across ~400
   class names in 10+ HTML files. Rather than hand-editing every one of
   those, we redefine the `blue`, `orange`, `teal` and `yellow` scales
   themselves, so every existing `text-blue-600`, `bg-orange-50`, etc.
   resolves to a KCA brand colour automatically — and any new markup
   written with ordinary Tailwind classes stays on-brand by default.

   CONTRAST NOTE (why gold-500 is not the literal #CEAA0C)
   ------------------------------------------------------
   Brand gold on white is only ~2.2:1 — it fails WCAG for text, and
   `text-orange-500` is used as *text on white* in 37 places (the "Ajira"
   wordmark, icons, links). So the gold ramp is tuned by role:
     - 200–400  bright brand gold — for accents ON NAVY/dark imagery
     - 500–900  progressively deeper gold — legible as TEXT ON WHITE
   The literal brand gold stays available as `kca-gold` for fills,
   rules and accents that sit on dark backgrounds.
   ================================================== */

// Navy ramp, anchored on the official #001D51 at step 700.
const KCA_NAVY = {
  50:  '#EDF1F8',
  100: '#D4DEEF',
  200: '#A9BCDD',
  300: '#7594C6',
  400: '#45689F',
  500: '#1F4380',
  600: '#0C2F68', // primary interactive navy — 11:1 on white
  700: '#001D51', // ← official KCA University navy
  800: '#001642',
  900: '#000F2E',
  950: '#00081C'
};

// Gold ramp, anchored on the official #CEAA0C at step 400 (on-dark use).
// Steps 500+ are deepened so gold survives as text on white.
const KCA_GOLD = {
  50:  '#FBF7E8',
  100: '#F6EDC4',
  200: '#EFDD8E',
  300: '#E6C94F', // bright accent on navy
  400: '#CEAA0C', // ← official KCA University gold
  500: '#A8850A', // deep gold — 4.0:1 on white, safe for text
  600: '#8A6C08',
  700: '#6B5407',
  800: '#4F3E06',
  900: '#3A2D05',
  950: '#231B03'
};

window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        // --- Remapped stock scales: existing markup inherits the brand ---
        blue: KCA_NAVY,
        orange: KCA_GOLD,
        teal: KCA_GOLD,   // the old third accent collapses into the gold family
        yellow: KCA_GOLD,

        // --- Explicit brand tokens for new markup ---
        'kca-navy': '#001D51',
        'kca-navy-deep': '#00122F',
        'kca-gold': '#CEAA0C',
        'kca-gold-soft': '#E6C94F',

        // Back-compat aliases used by older markup
        'kca-blue': '#0C2F68',
        'kca-dark': '#001D51',
        'kca-orange': '#CEAA0C'
      }
    }
  }
};
