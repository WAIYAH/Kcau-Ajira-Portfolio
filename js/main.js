/* ==================================================
   main.js (entry module)
   - Initializes UI behavior: mobile menu, smooth scrolling, nav active state
   - Sets current year and injects structured data (JSON-LD)
   - Provides showToast utility used by other modules
   - Imports and initializes form handlers and modal data
   ================================================== */

import { openJoinModal, closeJoinModal, openProgramModal, closeProgramModal, programDetails } from './modals.js';
import { initFormHandlers } from './form-handler.js';

// Expose program content (moving long HTML content separated from modals.js)
programDetails['skill-labs'].content = `
  <div class="space-y-6">
    <div class="bg-blue-50 p-4 rounded-lg">
      <h4 class="font-bold text-lg text-blue-800 mb-2">Schedule</h4>
      <p><i class="fas fa-calendar-alt text-blue-600 mr-2"></i> Every Wednesday, 5-7 PM</p>
      <p><i class="fas fa-map-marker-alt text-blue-600 mr-2"></i> Tech Lab 3, KCA University</p>
    </div>
    <div>
      <h4 class="font-bold text-lg text-gray-800 mb-3">What You'll Learn</h4>
      <ul class="space-y-2">
        <li class="flex items-start"><i class="fas fa-check text-green-500 mt-1 mr-2"></i><span>Digital Marketing Fundamentals (SEO, Social Media, Analytics)</span></li>
        <li class="flex items-start"><i class="fas fa-check text-green-500 mt-1 mr-2"></i><span>Web Development Basics (HTML, CSS, JavaScript, WordPress)</span></li>
        <li class="flex items-start"><i class="fas fa-check text-green-500 mt-1 mr-2"></i><span>AI Tools Mastery (ChatGPT, Midjourney, AI Automation)</span></li>
        <li class="flex items-start"><i class="fas fa-check text-green-500 mt-1 mr-2"></i><span>Content Creation & Video Editing</span></li>
        <li class="flex items-start"><i class="fas fa-check text-green-500 mt-1 mr-2"></i><span>Data Analysis with Excel & Google Sheets</span></li>
      </ul>
    </div>
    <div class="bg-yellow-50 p-4 rounded-lg"><h4 class="font-bold text-lg text-yellow-800 mb-2">Prerequisites</h4><p>No prior experience needed! Just bring your laptop and willingness to learn.</p></div>
    <div class="text-center pt-4"><button onclick="registerForProgram('skill-labs')" class="btn-primary text-white font-semibold py-3 px-8 rounded-lg">Register for Next Lab</button></div>
  </div>
`;

programDetails['freelance-launchpad'].content = `
  <div class="space-y-6">
    <div class="bg-orange-50 p-4 rounded-lg"><h4 class="font-bold text-lg text-orange-800 mb-2">Program Structure</h4><p>4-week intensive program with weekly milestones</p></div>
    <div><h4 class="font-bold text-lg text-gray-800 mb-3">Weekly Breakdown</h4><div class="space-y-4"><div class="border-l-4 border-orange-500 pl-4"><h5 class="font-bold">Week 1: Platform Setup & Profile Optimization</h5><p class="text-sm text-gray-600">Create winning profiles on Upwork, Fiverr, and LinkedIn</p></div><div class="border-l-4 border-orange-500 pl-4"><h5 class="font-bold">Week 2: Proposal Writing & Client Pitching</h5><p class="text-sm text-gray-600">Learn to write proposals that win projects</p></div><div class="border-l-4 border-orange-500 pl-4"><h5 class="font-bold">Week 3: Portfolio Development</h5><p class="text-sm text-gray-600">Build a portfolio that showcases your skills</p></div><div class="border-l-4 border-orange-500 pl-4"><h5 class="font-bold">Week 4: Client Management & Scaling</h5><p class="text-sm text-gray-600">Learn to manage clients and scale your freelance business</p></div></div></div>
    <div class="bg-green-50 p-4 rounded-lg"><h4 class="font-bold text-lg text-green-800 mb-2">Success Rate</h4><p class="text-2xl font-bold text-green-700">78%</p><p class="text-sm text-green-600">of participants land their first freelance project within 2 weeks of completion</p></div>
    <div class="text-center pt-4"><button onclick="registerForProgram('freelance-launchpad')" class="btn-primary text-white font-semibold py-3 px-8 rounded-lg">Join Next Cohort</button></div>
  </div>
`;

programDetails['digital-mentorship'].content = `
  <div class="space-y-6">
    <div class="bg-teal-50 p-4 rounded-lg"><h4 class="font-bold text-lg text-teal-800 mb-2">Program Features</h4><p>1-on-1 mentorship with industry professionals and successful alumni</p></div>
    <div><h4 class="font-bold text-lg text-gray-800 mb-3">Mentorship Areas</h4><div class="grid grid-cols-2 gap-4"><div class="bg-gray-50 p-3 rounded-lg text-center"><i class="fas fa-code text-blue-600 text-xl mb-2"></i><p class="font-medium text-sm">Tech & Development</p></div><div class="bg-gray-50 p-3 rounded-lg text-center"><i class="fas fa-chart-line text-green-600 text-xl mb-2"></i><p class="font-medium text-sm">Digital Marketing</p></div><div class="bg-gray-50 p-3 rounded-lg text-center"><i class="fas fa-pen-nib text-purple-600 text-xl mb-2"></i><p class="font-medium text-sm">Content Creation</p></div><div class="bg-gray-50 p-3 rounded-lg text-center"><i class="fas fa-briefcase text-orange-600 text-xl mb-2"></i><p class="font-medium text-sm">Career Guidance</p></div></div></div>
    <div><h4 class="font-bold text-lg text-gray-800 mb-3">How It Works</h4><ol class="space-y-3 list-decimal pl-5"><li class="pl-2"><span class="font-medium">Application:</span> Fill out mentorship interest form</li><li class="pl-2"><span class="font-medium">Matching:</span> We match you with a suitable mentor based on your goals</li><li class="pl-2"><span class="font-medium">Kickoff:</span> Initial meeting to set goals and expectations</li><li class="pl-2"><span class="font-medium">Regular Sessions:</span> Bi-weekly check-ins for 3 months</li><li class="pl-2"><span class="font-medium">Graduation:</span> Review progress and plan next steps</li></ol></div>
    <div class="text-center pt-4"><button onclick="registerForProgram('digital-mentorship')" class="btn-primary text-white font-semibold py-3 px-8 rounded-lg">Apply for Mentorship</button></div>
  </div>
`;

// Show toast utility (global)
export function showToast(title = 'Success!', message = 'Your action was completed successfully.') {
  const toast = document.getElementById('success-toast');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');

  if (!toast || !toastTitle || !toastMessage) return;

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.remove('hidden', 'translate-x-full');
  toast.classList.add('translate-x-0');

  setTimeout(() => {
    toast.classList.remove('translate-x-0');
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 300);
  }, 5000);
}

// Expose globally so other non-module code or callbacks can call it
window.showToast = showToast;

// Initialization
function init() {
  // Set current year
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      const icon = mobileMenuButton.querySelector('i');
      if (mobileMenu.classList.contains('hidden')) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      } else {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      }
    });

    // Close mobile menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        const icon = mobileMenuButton.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      });
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return; // keep defaults
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
      }
    });
  });

  // Close modals when clicking outside
  document.addEventListener('click', function (e) {
    const joinModal = document.getElementById('join-modal');
    const programModal = document.getElementById('program-modal');

    if (joinModal && !joinModal.classList.contains('hidden')) {
      if (e.target === joinModal) closeJoinModal();
    }

    if (programModal && !programModal.classList.contains('hidden')) {
      if (e.target === programModal) closeProgramModal();
    }
  });

  // Close modals with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeJoinModal();
      closeProgramModal();
    }
  });

  // Add active class to navigation links based on scroll position
  window.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a[href^="#"]');

    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 100) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('nav-active');
      if (link.getAttribute('href') === `#${current}`) link.classList.add('nav-active');
    });
  });

  // Initialize forms with our handler
  initFormHandlers(showToast);

  // Ensure first nav link is active on load
  const homeLink = document.querySelector('nav a[href="#home"]');
  if (homeLink) homeLink.classList.add('nav-active');

  // Inject structured data (JSON-LD) into head
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "KCA Ajira Club",
    "url": "https://kcaajiraclub.ke",
    "logo": "https://kcaajiraclub.ke/img/logo.png",
    "description": "Digital skills and empowerment club for KCA University students",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ruaraka, Thika Road",
      "addressLocality": "Nairobi",
      "addressCountry": "Kenya"
    },
    "memberOf": {
      "@type": "CollegeOrUniversity",
      "name": "KCA University"
    }
  };
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(ldJson);
  document.head.appendChild(script);
}

// Run init on DOM content loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
