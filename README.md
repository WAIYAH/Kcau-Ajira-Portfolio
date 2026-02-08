# KCA Ajira Club — Portfolio Website

A multi-page, responsive portfolio website for **KCA Ajira Club** — KCA University's student-led digital economy initiative. The site showcases the club's mission, programs, skills training, success stories, resource library, and membership flows.

> **Live Site:** [kcaajiraclub.ke](https://kcaajiraclub.ke) · **Repo:** [WAIYAH/Kcau-Ajira-Portfolio](https://github.com/WAIYAH/Kcau-Ajira-Portfolio)

---

## 🚀 Project Overview

Built with semantic HTML and **Tailwind CSS (CDN)**, this site is fully static — no build step required. It features a consistent design system across all pages, accessible navigation, interactive modals, and a growing resource library for digital professionals.

## ✨ Key Features

- **Multi-page site** with 14+ linked pages sharing a consistent header, footer, and design system
- **Semantic & accessible HTML** — skip links, ARIA labels, breadcrumb navigation
- **Tailwind CSS via CDN** — utility-first styling with a shared config (`css/tailwind-config.js`)
- **Custom CSS** — `hero-gradient`, `btn-primary`, `btn-secondary`, `nav-active` classes
- **Interactive UI** — mobile menu, join modal, program modals, form handling, toast notifications
- **SEO optimized** — Open Graph / Twitter meta tags, structured data (JSON-LD), canonical URLs
- **Resource library** — Learning materials, freelancing guides, portfolio templates, job board, AI tools directory
- **Legal pages** — Privacy policy, terms of service, code of conduct

## 📁 Project Structure

```
Kcau-Ajira-Portfolio/
│
├── index.html                  # Home — hero, stats, about, programs, skills, testimonials, contact
├── about.html                  # About the club — mission, vision, team
├── programs.html               # Detailed program offerings
├── skills.html                 # Digital skills taught (hard & soft)
├── success-stories.html        # Member testimonials & achievements
├── contact.html                # Contact form & information
│
├── Resources/                  # Resource pages
│   ├── learning-materials.html     # Curated courses & tutorials by track
│   ├── freelancing-guides.html     # Step-by-step freelancing roadmap
│   ├── portfolio-templates.html    # Free portfolio templates gallery
│   ├── job-board.html              # Curated job & internship listings
│   └── ai-tools-directory.html     # AI tools for writing, coding, design & productivity
│
├── legal/                      # Legal & policy pages
│   ├── privacy-policy.html
│   ├── terms-of-service.html
│   └── code-of-conduct.html
│
├── css/
│   ├── style.css               # Custom styles (gradients, buttons, cards, animations)
│   └── tailwind-config.js      # Tailwind CDN config (fonts, colors, extensions)
│
├── js/
│   ├── main.js                 # App init, mobile menu, toasts, structured data, year
│   ├── modals.js               # Join modal & program detail modals
│   └── form-handler.js         # Form validation & submission handling
│
├── img/                        # Images & media
│   ├── KCAU AJIRA CLUB.jpg        # Hero / main club image
│   ├── KCAU AJIRA CLUB LOGO 2.png # Club logo
│   ├── about-image.jpg            # About page image
│   ├── Thursday Meeting Invitation.png
│   ├── Wed_ Sat Trainings.png
│   └── Ajira Calendar of events.mp4
│
├── WEBSITE_DOCUMENTATION.md    # Detailed site documentation
└── README.md                   # This file
```

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic page structure |
| **Tailwind CSS (CDN)** | Utility-first styling |
| **Custom CSS** | Gradients, animations, brand classes |
| **Vanilla JavaScript (ES Modules)** | Interactivity, modals, forms |
| **Font Awesome 6.4** | Icons |
| **Google Fonts** | Poppins + Inter typography |

## ⚡ Run / Preview

No build step required — just open in a browser:

1. **Direct:** Open `index.html` in any modern browser
2. **Local server** (recommended):
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (if you have npx)
   npx serve .
   ```
   Then visit `http://localhost:8000`

## 📄 Pages Overview

| Page | Description |
|---|---|
| **Home** (`index.html`) | Hero banner, stats, about preview, programs, skills, testimonials, contact form |
| **About** (`about.html`) | Club mission & vision, team, Kenya Vision 2030 alignment |
| **Programs** (`programs.html`) | Weekly Skill Labs, Freelance Launchpad, Digital Mentorship |
| **Skills** (`skills.html`) | Hard skills (marketing, dev, AI, content, data) & soft skills |
| **Success Stories** (`success-stories.html`) | Member testimonials & career outcomes |
| **Contact** (`contact.html`) | Contact form, location, meeting times, social links |
| **Learning Materials** | Curated courses across Web Dev, Data & AI, Digital Marketing tracks |
| **Freelancing Guides** | 6-step roadmap, platform guides (Upwork, Fiverr, LinkedIn), Kenya payments & tax |
| **Portfolio Templates** | Free templates for developers, designers, and writers |
| **Job Board** | Filtered job listings — remote, internships, freelance, full-time |
| **AI Tools Directory** | 12+ AI tools for writing, coding, design, and productivity |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📜 License

© 2026 KCA Ajira Club. All rights reserved.

Part of Kenya's journey towards a knowledge-based economy (Vision 2030) | Contributing to UN SDGs 4, 8, and 9.

---

**Built with ❤️ by KCA Ajira Club**
