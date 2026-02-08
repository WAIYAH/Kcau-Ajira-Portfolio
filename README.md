# KCA Ajira Club — Portfolio Website

> KCA University's student-led digital economy club. This is our official portfolio website.

**Repo:** [WAIYAH/Kcau-Ajira-Portfolio](https://github.com/WAIYAH/Kcau-Ajira-Portfolio)

---

## What This Is

A fully static, multi-page website for **KCA Ajira Club**. No build tools or frameworks needed — just HTML, CSS, and vanilla JavaScript. Open `index.html` in a browser and it works.

The site covers everything about the club: who we are, what we do, our programs, skills we teach, member success stories, upcoming events, and how to join.

---

## Features

- **Futuristic landing page** — auto-advancing hero slider, glassmorphism effects, scroll-triggered animations, floating particles
- **Live countdown timers** on upcoming events
- **Animated stat counters** that count up when scrolled into view
- **15 pages** — 6 main pages, 5 resource pages, 3 legal pages, plus a 404 page
- **Responsive** across mobile, tablet, and desktop
- **Accessible** — skip links, ARIA labels, semantic HTML
- **SEO ready** — Open Graph tags, sitemap.xml, robots.txt, JSON-LD structured data
- **Interactive** — join modal, program detail modals, form handling, toast notifications

---

## Tech Stack

| Tech | What For |
|---|---|
| HTML5 | Page structure |
| Tailwind CSS (CDN) | Styling |
| Custom CSS | Animations, glassmorphism, hero slider, gradients |
| Vanilla JS (ES Modules) | Slider, countdown, scroll animations, modals, forms |
| Font Awesome 6.4 | Icons |
| Google Fonts | Poppins + Inter |

---

## Project Structure

```
Kcau-Ajira-Portfolio/
│
├── index.html                      # Landing page (hero slider, stats, events, etc.)
├── about.html                      # About — constitution, leadership, mission
├── programs.html                   # Club programs
├── skills.html                     # Digital skills we teach
├── success-stories.html            # Member testimonials
├── contact.html                    # Contact info & form
├── 404.html                        # Custom 404 page
│
├── Resources/
│   ├── learning-materials.html
│   ├── freelancing-guides.html
│   ├── portfolio-templates.html
│   ├── job-board.html
│   └── ai-tools-directory.html
│
├── legal/
│   ├── privacy-policy.html
│   ├── terms-of-service.html
│   └── code-of-conduct.html
│
├── css/
│   ├── style.css                   # Base styles (buttons, cards, gradients)
│   └── tailwind-config.js          # Tailwind CDN config
│
├── index.css                       # Landing page styles (slider, glass, glow, countdown)
│
├── js/
│   ├── main.js                     # App init, mobile menu, toasts, structured data
│   ├── hero-slider.js              # Auto-advancing hero carousel
│   ├── countdown.js                # Live countdown timers for events
│   ├── animations.js               # Scroll reveals, counter animations, particles
│   ├── modals.js                   # Join & program modals
│   └── form-handler.js             # Form submission handling
│
├── img/                            # Club images & media
│
├── .gitignore
├── .editorconfig
├── LICENSE                         # MIT License
├── robots.txt
├── sitemap.xml
├── README.md
└── WEBSITE_DOCUMENTATION.md
```

---

## How to Run

No install. No build. Just open it.

**Option 1 — Direct:**
Open `index.html` in your browser.

**Option 2 — Local server** (better for testing):
```bash
# Python
python -m http.server 8000

# or Node.js
npx serve .
```
Then go to `http://localhost:8000`

---

## Pages

| Page | What It Shows |
|---|---|
| **Home** | Hero slider, stats, about, programs, upcoming events with countdown, skills, testimonials, contact form |
| **About** | Club constitution, 6 leadership members, mission & vision, Ajira Kenya 5 pillars |
| **Programs** | Weekly Skill Labs, Freelance Launchpad, Digital Mentorship |
| **Skills** | Technical skills (marketing, dev, AI, data) + soft skills |
| **Success Stories** | Member testimonials and career outcomes |
| **Contact** | Contact form, location, meeting schedule, social links |
| **Resources** (5 pages) | Learning materials, freelancing guides, portfolio templates, job board, AI tools |
| **Legal** (3 pages) | Privacy policy, terms of service, code of conduct |
| **404** | Custom error page |

---

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by KCA Ajira Club** · KCA University, Nairobi, Kenya
