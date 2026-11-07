// LUXUM video intro: play once per page visit, with an accessible skip control.
(() => {
  const screen = document.getElementById('introScreen');
  const video = document.getElementById('introVideo');
    if (!screen || !video) return;
  const finish = () => { screen.classList.add('is-done'); setTimeout(() => screen.remove(), 850); };
  video.addEventListener('ended', finish, { once: true });
  video.addEventListener('error', finish, { once: true });
  const play = video.play();
  if (play?.catch) play.catch(() => { /* Intro remains skippable if autoplay is blocked. */ });
  window.setTimeout(finish, 8500);
})();
// LUXUM website interactions
const navLinks = document.getElementById('navLinks');
const menuToggle = document.getElementById('menuToggle');
menuToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

// Reveal elements as they enter the viewport.
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Subtle cursor light on pointer devices.
const glow = document.querySelector('.cursor-glow');
if (window.matchMedia('(pointer:fine)').matches && glow) {
  window.addEventListener('pointermove', e => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }, { passive: true });
} else if (glow) glow.style.display = 'none';

// Pricing cards can preselect an enquiry service.
document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.querySelector('select[name="service"]');
    if (select) {
      const value = link.dataset.service;
      const option = [...select.options].find(o => o.textContent === value);
      if (option) select.value = option.value;
      else if (value.includes('₹99')) select.value = 'Website launch — ₹99 offer';
      else if (value.includes('₹299')) select.value = 'Promo package — ₹299 offer';
      else select.value = 'Something else';
    }
  });
});

// Replace this placeholder with the agency's WhatsApp number, digits only, including country code.
// Example India: 919876543210
const WHATSAPP_NUMBER = '919074030474';
document.getElementById('contactForm')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get('name') || '').trim();
  const reply = String(form.get('reply') || '').trim();
  const service = String(form.get('service') || '').trim();
  const message = String(form.get('message') || '').trim();
  const text = [
    'Hello LUXUM! I would like to make a project enquiry.',
    '',
    `Name: ${name}`,
    `Contact: ${reply}`,
    `Service: ${service}`,
    `Project details: ${message || 'Not provided yet'}`
  ].join('\n');
  if (WHATSAPP_NUMBER.includes('X')) {
    alert('Website setup needed: add your WhatsApp number in script.js (WHATSAPP_NUMBER) before publishing.');
    return;
  }
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
});

document.getElementById('year').textContent = new Date().getFullYear();
