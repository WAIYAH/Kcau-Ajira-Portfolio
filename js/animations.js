/* ==================================================
   animations.js
   - Scroll-triggered reveal animations using IntersectionObserver
   - Particle generation for hero section
   - Counter animation for stats
   ================================================== */

// ---------- Scroll Reveal ----------
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');

  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Once revealed, stop observing for performance
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

// ---------- Animated Counters ----------
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 2000;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);

    el.textContent = prefix + current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = prefix + target.toLocaleString() + suffix;
    }
  }

  requestAnimationFrame(step);
}

// ---------- Hero Particles ----------
function initParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;

  const count = 20;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.classList.add('hero-particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = (80 + Math.random() * 20) + '%';
    particle.style.width = (3 + Math.random() * 5) + 'px';
    particle.style.height = particle.style.width;
    particle.style.animationDuration = (6 + Math.random() * 10) + 's';
    particle.style.animationDelay = (Math.random() * 8) + 's';
    particle.style.opacity = (0.15 + Math.random() * 0.25);
    container.appendChild(particle);
  }
}

// ---------- Parallax tilt on mouse for hero stat cards ----------
function initParallaxCards() {
  const cards = document.querySelectorAll('.parallax-card');
  if (!cards.length) return;

  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx; // -1 to 1
    const dy = (e.clientY - cy) / cy;

    cards.forEach(card => {
      const intensity = parseFloat(card.dataset.parallax || '8');
      const tx = dx * intensity;
      const ty = dy * intensity;
      card.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });
}

// ---------- Header shrink on scroll ----------
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 60) {
          header.classList.add('shadow-lg');
          header.style.padding = '0';
        } else {
          header.classList.remove('shadow-lg');
          header.style.padding = '';
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ---------- Initialize All ----------
export function initAnimations() {
  initScrollReveal();
  initCounterAnimations();
  initParticles();
  initParallaxCards();
  initHeaderScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnimations);
} else {
  initAnimations();
}
