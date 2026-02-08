/* ==================================================
   countdown.js
   - Live countdown timer for upcoming events
   - Exported as ES module, auto-initializes on import
   - Finds all [data-countdown] elements and ticks them
   ================================================== */

class CountdownTimer {
  constructor(element) {
    this.element = element;
    this.targetDate = new Date(element.dataset.countdown).getTime();
    this.daysEl = element.querySelector('[data-days]');
    this.hoursEl = element.querySelector('[data-hours]');
    this.minutesEl = element.querySelector('[data-minutes]');
    this.secondsEl = element.querySelector('[data-seconds]');
    this.interval = null;
    this.prevValues = { d: -1, h: -1, m: -1, s: -1 };
  }

  start() {
    this.tick();
    this.interval = setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  tick() {
    const now = Date.now();
    const diff = this.targetDate - now;

    if (diff <= 0) {
      this.stop();
      this.setValues(0, 0, 0, 0);
      this.element.classList.add('countdown-ended');
      // Try to show an "Event Started!" message
      const msg = this.element.querySelector('[data-countdown-msg]');
      if (msg) msg.textContent = 'Event has started!';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    this.setValues(d, h, m, s);
  }

  setValues(d, h, m, s) {
    this.updateUnit(this.daysEl, d, 'd');
    this.updateUnit(this.hoursEl, h, 'h');
    this.updateUnit(this.minutesEl, m, 'm');
    this.updateUnit(this.secondsEl, s, 's');
  }

  updateUnit(el, value, key) {
    if (!el) return;
    const padded = String(value).padStart(2, '0');
    if (this.prevValues[key] !== value) {
      el.textContent = padded;
      // Add tick animation class briefly
      el.classList.add('tick');
      setTimeout(() => el.classList.remove('tick'), 300);
      this.prevValues[key] = value;
    }
  }
}

// Auto-initialize all countdown timers on the page
export function initCountdowns() {
  const elements = document.querySelectorAll('[data-countdown]');
  elements.forEach(el => {
    const timer = new CountdownTimer(el);
    timer.start();
  });
}

// Run on import
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCountdowns);
} else {
  initCountdowns();
}
