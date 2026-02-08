/* ==================================================
   hero-slider.js
   - Auto-advancing hero carousel with fade + scale
   - Supports dot navigation and keyboard control
   - 4.5-second interval per slide
   ================================================== */

class HeroSlider {
  constructor(container) {
    this.container = container;
    this.slides = Array.from(container.querySelectorAll('.hero-slide'));
    this.dots = Array.from(container.querySelectorAll('.slider-dot'));
    this.current = 0;
    this.interval = null;
    this.delay = 4500; // 4.5 seconds
    this.paused = false;
  }

  init() {
    if (this.slides.length === 0) return;

    // Show first slide
    this.goTo(0);

    // Start auto-play
    this.play();

    // Dot click handlers
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.goTo(i);
        this.restart();
      });
    });

    // Pause on hover
    this.container.addEventListener('mouseenter', () => this.pause());
    this.container.addEventListener('mouseleave', () => this.play());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Only handle if hero is in viewport
      const rect = this.container.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        this.next();
        this.restart();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        this.prev();
        this.restart();
      }
    });

    // Touch/swipe support
    let touchStartX = 0;
    this.container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) this.next();
        else this.prev();
        this.restart();
      }
    }, { passive: true });
  }

  goTo(index) {
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    this.current = index;
  }

  next() {
    const nextIndex = (this.current + 1) % this.slides.length;
    this.goTo(nextIndex);
  }

  prev() {
    const prevIndex = (this.current - 1 + this.slides.length) % this.slides.length;
    this.goTo(prevIndex);
  }

  play() {
    this.paused = false;
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.next(), this.delay);
  }

  pause() {
    this.paused = true;
    if (this.interval) clearInterval(this.interval);
  }

  restart() {
    this.pause();
    this.play();
  }
}

// Auto-initialize
export function initHeroSlider() {
  const container = document.querySelector('.hero-slider');
  if (container) {
    const slider = new HeroSlider(container);
    slider.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroSlider);
} else {
  initHeroSlider();
}
