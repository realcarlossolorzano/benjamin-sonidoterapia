// =============================================
// MAIN.JS — Sound Therapy Landing
// Tibetan Bowl Sounds + Phone Prefix + Form
// =============================================

// =============================================
// TIBETAN BOWL SOUND ENGINE (Web Audio API)
// =============================================

let audioCtx = null;
let bowlNoteIndex = 0;

// Pentatonic scale tuned to healing frequencies — always harmonious
const BOWL_NOTES = [
  { freq: 256,  name: 'C4'  },
  { freq: 288,  name: 'D4'  },
  { freq: 341,  name: 'F4'  },
  { freq: 384,  name: 'G4'  },
  { freq: 432,  name: 'A4'  },
  { freq: 512,  name: 'C5'  },
  { freq: 576,  name: 'D5'  },
];

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBowlSound(noteIndex) {
  initAudio();
  const note = BOWL_NOTES[noteIndex % BOWL_NOTES.length];
  const now = audioCtx.currentTime;

  // Create layered harmonics like a real singing bowl
  const harmonics = [
    { ratio: 1,    gain: 0.08  },  // fundamental
    { ratio: 2.76, gain: 0.03  },  // characteristic bowl overtone
    { ratio: 4.72, gain: 0.015 },  // high shimmer
  ];

  harmonics.forEach(h => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq * h.ratio, now);
    // Slight detune for warmth
    osc.detune.setValueAtTime(Math.random() * 6 - 3, now);

    // Bowl envelope: gentle attack, long sustain, slow decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(h.gain, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 4);
  });
}

function onBowlClick() {
  playBowlSound(bowlNoteIndex);
  bowlNoteIndex = (bowlNoteIndex + 1) % BOWL_NOTES.length;
}

// Attach bowl sounds to all interactive elements
function initBowlSounds() {
  const interactiveEls = document.querySelectorAll(
    'a, button, .option-card, .nav-cta, .btn-primary, .btn-submit, .gallery-item'
  );

  interactiveEls.forEach(el => {
    el.addEventListener('mousedown', onBowlClick, { passive: true });
  });

  // Also play on first touch (mobile)
  document.addEventListener('touchstart', function firstTouch() {
    initAudio();
    document.removeEventListener('touchstart', firstTouch);
  }, { once: true, passive: true });
}

// =============================================
// PHONE PREFIX AUTO-DETECTION
// =============================================

const COUNTRY_PREFIXES = {
  MX: '+52', US: '+1', CA: '+1', GT: '+502', HN: '+504', SV: '+503',
  NI: '+505', CR: '+506', PA: '+507', CO: '+57', VE: '+58', EC: '+593',
  PE: '+51', BO: '+591', CL: '+56', AR: '+54', UY: '+598', PY: '+595',
  BR: '+55', ES: '+34', FR: '+33', DE: '+49', IT: '+39', GB: '+44',
  PT: '+351', NL: '+31', BE: '+32', CH: '+41', AT: '+43', SE: '+46',
  NO: '+47', DK: '+45', FI: '+358', PL: '+48', CZ: '+420', RO: '+40',
  GR: '+30', TR: '+90', RU: '+7', UA: '+380', IN: '+91', CN: '+86',
  JP: '+81', KR: '+82', AU: '+61', NZ: '+64', ZA: '+27', EG: '+20',
  NG: '+234', KE: '+254', IL: '+972', AE: '+971', SA: '+966',
  CU: '+53', DO: '+1', PR: '+1', JM: '+1',
};

async function detectPhonePrefix() {
  const phoneInput = document.getElementById('field-phone');
  if (!phoneInput) return;

  try {
    const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    const countryCode = data.country_code;
    const prefix = COUNTRY_PREFIXES[countryCode] || '+52';

    // Only set if user hasn't typed anything yet
    if (!phoneInput.value) {
      phoneInput.value = prefix + ' ';
      phoneInput.dataset.prefix = prefix;
    }
  } catch {
    // Fallback to Mexico
    if (!phoneInput.value) {
      phoneInput.value = '+52 ';
      phoneInput.dataset.prefix = '+52';
    }
  }
}

// =============================================
// META CONVERSIONS API (CAPI) & COOKIE HELPERS
// =============================================

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
}

function captureMetaCapiParams() {
  const params = new URLSearchParams(window.location.search);
  let fbclid = params.get('fbclid') || sessionStorage.getItem('fbclid') || '';

  if (params.get('fbclid')) {
    sessionStorage.setItem('fbclid', params.get('fbclid'));
  }

  // Handle _fbc cookie (fb.1.timestamp.fbclid)
  let fbc = getCookie('_fbc');
  if (fbclid && (!fbc || !fbc.includes(fbclid))) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
    setCookie('_fbc', fbc, 90);
  }

  // Handle _fbp cookie (fb.1.timestamp.random)
  let fbp = getCookie('_fbp');
  if (!fbp) {
    const randomId = Math.floor(Math.random() * 10000000000);
    fbp = `fb.1.${Date.now()}.${randomId}`;
    setCookie('_fbp', fbp, 90);
  }

  const capiData = {
    fbclid: fbclid,
    fbc: fbc,
    fbp: fbp,
    client_user_agent: navigator.userAgent
  };

  // Push CAPI parameter state to GTM dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'meta_capi_ready',
    'fbc': fbc,
    'fbp': fbp,
    'fbclid': fbclid,
    'client_user_agent': navigator.userAgent
  });

  return capiData;
}

// =============================================
// UTM TRACKING & SESSION PERSISTENCE
// =============================================

function captureUTMs() {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  const utms = {};

  utmKeys.forEach(key => {
    const val = params.get(key);
    if (val) {
      sessionStorage.setItem(key, val);
      utms[key] = val;
    } else {
      utms[key] = sessionStorage.getItem(key) || '';
    }
  });

  // Push to GTM dataLayer on page load
  window.dataLayer = window.dataLayer || [];
  if (utms.utm_source || utms.utm_campaign || utms.fbclid) {
    window.dataLayer.push({
      'event': 'utm_captured',
      'utm_source': utms.utm_source,
      'utm_medium': utms.utm_medium,
      'utm_campaign': utms.utm_campaign,
      'utm_content': utms.utm_content,
      'utm_term': utms.utm_term,
      'fbclid': utms.fbclid
    });
  }

  return utms;
}

// =============================================
// NAV & FLOATING CTA SCROLL
// =============================================

const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

function initFloatingCTA() {
  const floatingCta = document.getElementById('floating-cta-container');
  const formSection = document.getElementById('registro');

  if (!floatingCta) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    let nearForm = false;

    if (formSection) {
      const formRect = formSection.getBoundingClientRect();
      if (formRect.top < window.innerHeight && formRect.bottom > 0) {
        nearForm = true;
      }
    }

    if (scrollY > 350 && !nearForm) {
      floatingCta.classList.add('is-visible');
    } else {
      floatingCta.classList.remove('is-visible');
    }
  }, { passive: true });
}

// =============================================
// REVEAL ON SCROLL
// =============================================

const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -20px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// =============================================
// SMOOTH SCROLL
// =============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// =============================================
// OPTION SELECTORS (Independent groups)
// =============================================

document.querySelectorAll('.option-selector').forEach(group => {
  const cards = group.querySelectorAll('.option-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('sold-out')) return;
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });
});

// =============================================
// INTL PHONE INPUT (Country Picker)
// =============================================

let iti = null;
const phoneInputField = document.getElementById('field-phone');
if (phoneInputField && typeof window.intlTelInput !== 'undefined') {
  iti = window.intlTelInput(phoneInputField, {
    initialCountry: "auto",
    geoIpLookup: function(callback) {
      fetch("https://ipapi.co/json")
        .then(res => res.json())
        .then(data => callback(data.country_code ? data.country_code.toLowerCase() : 'ni'))
        .catch(() => callback('ni'));
    },
    preferredCountries: ['ni', 'cr', 'pa', 'hn', 'sv', 'gt', 'mx', 'us', 'co', 'es'],
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.5.0/build/js/utils.js",
    separateDialCode: true,
    autoPlaceholder: "aggressive",
    formatOnDisplay: true
  });
}

// =============================================
// FORM — GoHighLevel API v2 (LeadConnectorHQ)
// =============================================

const GHL_API_KEY = 'pit-ba0ac45f-f9a9-4609-bbe6-7db9d74cbc98';
const GHL_LOCATION_ID = 'pWmoIvATwHwAM1vn0m0x';
const GHL_API_URL = 'https://services.leadconnectorhq.com/contacts/';

const form = document.getElementById('ghl-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnArrow = document.getElementById('btn-arrow');

if (form) {
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nameEl  = document.getElementById('field-name');
    const emailEl = document.getElementById('field-email');
    const phoneEl = document.getElementById('field-phone');
    const selectedOptionEl = document.querySelector('input[name="eventOption"]:checked');
    const selectedDepositEl = document.querySelector('input[name="depositOption"]:checked');

    const name  = nameEl.value.trim();
    const email = emailEl.value.trim();
    let phone = phoneEl.value.trim();

    // Extract full international E.164 phone number from country picker
    if (iti) {
      const fullNumber = iti.getNumber();
      if (fullNumber) {
        phone = fullNumber;
      } else if (phone && !phone.startsWith('+')) {
        const countryData = iti.getSelectedCountryData();
        if (countryData && countryData.dialCode) {
          phone = `+${countryData.dialCode}${phone.replace(/\D/g, '')}`;
        }
      }
    }

    const selectedOption = selectedOptionEl ? selectedOptionEl.value : 'Evento 3 de Octubre';
    const selectedDeposit = selectedDepositEl ? selectedDepositEl.value : '$77 USD (Pago Completo)';
    const depositNumeric = selectedDeposit.includes('30') ? 30 : selectedDeposit.includes('50') ? 50 : 77;

    // Validation
    let valid = true;
    [{ el: nameEl, val: name }, { el: emailEl, val: email }, { el: phoneEl, val: phone }].forEach(({ el, val }) => {
      if (!val || val === (el.dataset.prefix || '')) {
        el.classList.add('error');
        el.addEventListener('input', () => el.classList.remove('error'), { once: true });
        valid = false;
      }
    });

    if (!valid) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailEl.classList.add('error');
      emailEl.addEventListener('input', () => emailEl.classList.remove('error'), { once: true });
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Enviando...';
    btnArrow.textContent = '⟳';

    // Play a full, rich 4-note bowl sequence that rings out naturally
    playBowlSound(0); // C4 fundamental (0ms)
    setTimeout(() => playBowlSound(3), 300); // G4 fifth (300ms)
    setTimeout(() => playBowlSound(5), 600); // C5 octave (600ms)
    setTimeout(() => playBowlSound(4), 900); // A4 432Hz warmth (900ms)

    // Capture UTMs & Meta CAPI Params
    const utms = captureUTMs();
    const metaCapi = captureMetaCapiParams();

    // Push Standard Meta/GTM 'Lead' Event to dataLayer with value & deposit info
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'Lead',
      'event_name': 'Lead',
      'event_category': 'Form',
      'event_action': 'Submit',
      'event_label': `${selectedOption} | ${selectedDeposit}`,
      'value': depositNumeric,
      'currency': 'USD',
      'deposit_option': selectedDeposit,
      'user_email': email,
      'user_phone': phone,
      'user_name': name,
      'fbc': metaCapi.fbc,
      'fbp': metaCapi.fbp,
      'fbclid': metaCapi.fbclid,
      'client_user_agent': metaCapi.client_user_agent,
      'utm_source': utms.utm_source || 'direct',
      'utm_medium': utms.utm_medium || '',
      'utm_campaign': utms.utm_campaign || '',
      'utm_content': utms.utm_content || '',
      'utm_term': utms.utm_term || ''
    });

    // Also push lead_submitted for custom trigger compatibility
    window.dataLayer.push({
      'event': 'lead_submitted',
      'event_label': `${selectedOption} | ${selectedDeposit}`
    });

    const sourceLabel = utms.utm_source
      ? `Meta Ads (${utms.utm_campaign || utms.utm_source}) — ${selectedOption} [${selectedDeposit}]`
      : `Landing Page — ${selectedOption} [${selectedDeposit}]`;

    const countryData = iti ? iti.getSelectedCountryData() : null;
    const countryTag = (countryData && countryData.iso2) ? `country:${countryData.iso2.toUpperCase()}` : null;
    const depositTag = `abono:$${depositNumeric}`;
    const paymentStatusTag = depositNumeric === 77 ? 'pago_completo' : 'abono_parcial';

    const tags = [
      'terapia grupal',
      'Sound Therapy',
      'Landing Page',
      selectedOption,
      selectedDeposit,
      depositTag,
      paymentStatusTag,
      countryTag,
      utms.utm_source ? `src:${utms.utm_source}` : null,
      utms.utm_campaign ? `campaign:${utms.utm_campaign}` : null,
      utms.utm_content ? `ad:${utms.utm_content}` : null,
      metaCapi.fbclid ? 'meta-click' : null
    ].filter(Boolean);

    const payload = {
      firstName:  name,
      email:      email,
      phone:      phone,
      locationId: GHL_LOCATION_ID,
      source:     sourceLabel,
      tags:       tags,
      attributionSource: {
        url: window.location.href,
        referrer: document.referrer,
        utmSource: utms.utm_source,
        utmMedium: utms.utm_medium,
        utmCampaign: utms.utm_campaign,
        utmContent: utms.utm_content,
        utmTerm: utms.utm_term,
        fbc: metaCapi.fbc,
        fbp: metaCapi.fbp,
        fbclid: metaCapi.fbclid
      }
    };

    // Send API request in background while sound resonates
    const apiPromise = fetch(GHL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version':        '2021-07-28'
      },
      body: JSON.stringify(payload)
    }).then(res => {
      if (!res.ok) {
        res.json().then(data => console.warn(`GHL API warning ${res.status}:`, data)).catch(() => {});
      }
    }).catch(err => {
      console.error('Error al enviar a GoHighLevel:', err);
    });

    // Soft fade-out at 1.8s
    setTimeout(() => {
      document.body.style.transition = 'opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      document.body.style.opacity = '0';
    }, 1800);

    // Wait for the full sound to decay (~2.4s) before entering Thank You Page
    await apiPromise;
    setTimeout(() => {
      window.location.href = 'gracias';
    }, 2400);
  });
}

// =============================================
// VIDEO CONTROLS & OVERLAY MANAGEMENT
// =============================================

function initVideoPlayers() {
  const allVideos = document.querySelectorAll('.custom-video');
  const overlays = document.querySelectorAll('.video-custom-overlay');

  overlays.forEach(overlay => {
    const targetId = overlay.dataset.videoTarget;
    const video = targetId ? document.getElementById(targetId) : overlay.parentElement.querySelector('video');

    if (!video) return;

    overlay.addEventListener('click', () => {
      // Pause all other videos
      allVideos.forEach(v => {
        if (v !== video && !v.paused) {
          v.pause();
        }
      });

      video.play().catch(() => {});
      overlay.classList.add('is-playing');
    });

    video.addEventListener('play', () => {
      allVideos.forEach(v => {
        if (v !== video && !v.paused) {
          v.pause();
        }
      });
      overlay.classList.add('is-playing');
    });

    video.addEventListener('pause', () => {
      overlay.classList.remove('is-playing');
    });

    video.addEventListener('ended', () => {
      overlay.classList.remove('is-playing');
    });
  });
}

// =============================================
// GALLERY LIGHTBOX
// =============================================

function initLightbox() {
  const galleryCards = document.querySelectorAll('.gallery-card');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');

  if (!lightboxModal || !galleryCards.length) return;

  const galleryItems = Array.from(galleryCards).map(card => ({
    largeSrc: card.getAttribute('data-large'),
    caption: card.getAttribute('data-caption') || ''
  }));

  let currentIndex = 0;

  function showImage(index) {
    if (index < 0) index = galleryItems.length - 1;
    if (index >= galleryItems.length) index = 0;
    currentIndex = index;

    const item = galleryItems[currentIndex];
    if (lightboxImg) {
      lightboxImg.style.opacity = '0.3';
      lightboxImg.src = item.largeSrc;
      lightboxImg.onload = () => {
        lightboxImg.style.opacity = '1';
      };
    }

    if (lightboxCaption) lightboxCaption.textContent = item.caption;
    if (lightboxCounter) lightboxCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
  }

  function openLightbox(index) {
    showImage(index);
    lightboxModal.classList.add('is-open');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.remove('is-open');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  galleryCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      openLightbox(idx);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    showImage(currentIndex - 1);
  });
  if (lightboxNext) lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    showImage(currentIndex + 1);
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });

  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  lightboxModal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightboxModal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diffX = touchEndX - touchStartX;
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) showImage(currentIndex - 1);
      else showImage(currentIndex + 1);
    }
  }, { passive: true });
}

// =============================================
// INIT
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initBowlSounds();
  detectPhonePrefix();
  captureUTMs();
  captureMetaCapiParams();
  initVideoPlayers();
  initFloatingCTA();
  initLightbox();
});
