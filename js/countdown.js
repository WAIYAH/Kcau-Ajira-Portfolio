/* ==================================================
   countdown.js
   - Live countdown timer for upcoming events
   - Exported as ES module, auto-initializes on import
   - Finds all [data-countdown] elements and ticks them
   - Supports two modes:
     1. One-off: data-countdown="2026-04-01T14:00:00" (fixed date/time)
     2. Recurring weekly: data-recurring-days="4,5" data-recurring-time="14:00"
        (day numbers are JS getDay(): 0=Sun..6=Sat). Always counts down to
        the NEXT upcoming occurrence, so it never goes stale after the
        first event passes.
   ================================================== */

class CountdownTimer {
  constructor(element) {
    this.element = element;
    this.recurringDays = element.dataset.recurringDays
      ? element.dataset.recurringDays.split(',').map(Number)
      : null;
    this.recurringTime = element.dataset.recurringTime || '00:00';
    this.targetDate = this.recurringDays ? this.computeNextOccurrence() : new Date(element.dataset.countdown).getTime();
    this.daysEl = element.querySelector('[data-days]');
    this.hoursEl = element.querySelector('[data-hours]');
    this.minutesEl = element.querySelector('[data-minutes]');
    this.secondsEl = element.querySelector('[data-seconds]');
    this.interval = null;
    this.prevValues = { d: -1, h: -1, m: -1, s: -1 };
  }

  // Finds the next date/time matching one of `recurringDays` at `recurringTime`,
  // scanning forward from right now (today counts if the time hasn't passed yet).
  computeNextOccurrence() {
    const [hh, mm] = this.recurringTime.split(':').map(Number);
    const now = new Date();
    for (let addDays = 0; addDays < 8; addDays++) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + addDays);
      candidate.setHours(hh, mm, 0, 0);
      if (this.recurringDays.includes(candidate.getDay()) && candidate.getTime() > now.getTime()) {
        return candidate.getTime();
      }
    }
    return now.getTime();
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
    let diff = this.targetDate - now;

    if (diff <= 0) {
      if (this.recurringDays) {
        // Recurring event: roll forward to the next occurrence instead of
        // freezing at "Event has started!" forever.
        this.targetDate = this.computeNextOccurrence();
        diff = this.targetDate - now;
      } else {
        this.stop();
        this.setValues(0, 0, 0, 0);
        this.element.classList.add('countdown-ended');
        const msg = this.element.querySelector('[data-countdown-msg]');
        if (msg) msg.textContent = 'Event has started!';
        return;
      }
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
  const elements = document.querySelectorAll('[data-countdown], [data-recurring-days]');
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
