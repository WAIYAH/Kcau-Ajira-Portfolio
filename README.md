# KCA Ajira Club — Portfolio Site

A clean, responsive portfolio-style landing page for the KCA Ajira Club showcasing the club's mission, programs, skills training, testimonials, and contact/join flows.

## 🚀 Project Overview
This repo was refactored from a single `index.html` into a simple, maintainable project structure with separated CSS and JavaScript modules. The site is built with semantic HTML and Tailwind CSS (CDN) and is optimized for accessibility and responsiveness.

## ✨ Key Features
- **Semantic & accessible HTML** (skip link, ARIA-friendly navigation) ✅
- **Tailwind CSS via CDN** for utility-first styling (configurable through `css/tailwind-config.js`) ✅
- **Separated CSS & JS**: `css/style.css`, `js/main.js`, `js/modals.js`, `js/form-handler.js` ✅
- **Interactive UI**: mobile menu, modals, form handling, and toast notifications ✅
- **SEO & structured data**: JSON-LD injected dynamically from `js/main.js` ✅

## 📁 Project Structure
```
kca-ajira-portfolio/
├── index.html
├── css/
│   ├── style.css          # Custom styles moved from inline <style>
│   └── tailwind-config.js # Optional Tailwind CDN config (loaded before the CDN)
├── js/
│   ├── main.js           # App init, toasts, structured data
│   ├── modals.js         # Modal logic + program data
│   └── form-handler.js   # Handles page & modal forms
├── img/                  # Add images here
└── README.md
```

## ⚡ Run / Preview
- Open `index.html` directly in a browser (no build step required).
- For a local server (recommended for some browser features):
  - Python 3: `python -m http.server 8000` and open `http://localhost:8000`

## 🛠️ How to Customize
- Edit content & layout in `index.html`.
- Change visual styles in `css/style.css`.
- Update interactivity in `js/` modules (`main.js`, `modals.js`, `form-handler.js`).
- Add images to the `img/` folder and update `<img>` src or background placeholders.

## ✅ Notes & Recommendations
- I kept existing inline `onclick` attributes functional by exposing modal functions on `window`. For a cleaner codebase, I can replace these with event listeners bound from `js/main.js`.
- If you want, I can add a small dev setup (`npm`, `live-server`) and a basic test suite.

---

If you'd like a short summary README for GitHub with a demo GIF or screenshots, I can add that next. Which addition would you prefer? (screenshots, dev server, or switch to event-driven listeners)
