// App State
let state = {
  settings: {
    webhookUrl: '',
    hasApiKey: false,
    cronSecret: '',
    rotateOutfits: true
  },
  history: [],
  activeDate: '',
  isLoading: false,
  avatarMap: {}
};

// Global Image Resources (Custom Avatar)
const avatarImg = new Image();
let avatarImageLoaded = false;

// Multi-avatar resources for the 18 draft options
const optionAvatars = [];
const optionAvatarsLoaded = Array(18).fill(false);

for (let i = 1; i <= 18; i++) {
  const img = new Image();
  img.onload = () => {
    optionAvatarsLoaded[i - 1] = true;
    console.log(`[Avatar] Option avatar ${i} loaded.`);
    if (state.history.length > 0) renderActiveDrafts();
  };
  img.onerror = () => {
    console.warn(`[Avatar] Failed to load avatar_daily_${i}.jpg. Falling back to avatars/avatar-${i}.png`);
    if (img.src.indexOf(`avatar_daily_${i}.jpg`) !== -1) {
      img.src = `avatars/avatar-${i}.png`;
    } else if (img.src.indexOf(`avatars/avatar-${i}.png`) !== -1) {
      img.src = 'avatar.jpg?t=' + Date.now();
    }
  };
  optionAvatars.push(img);
}

avatarImg.onload = () => {
  avatarImageLoaded = true;
  console.log('[Avatar] Custom profile picture loaded.');
  if (state.history.length > 0) renderActiveDrafts();
};
avatarImg.onerror = () => {
  console.warn('[Avatar] Failed to load avatar image. Falling back to avatar.jpg');
  if (avatarImg.src.indexOf('avatar_daily.jpg') !== -1) {
    const t = Date.now();
    avatarImg.src = 'avatar.jpg?t=' + t;
    if (typeof el !== 'undefined' && el.avatarPreview) {
      el.avatarPreview.src = 'avatar.jpg?t=' + t;
    }
  }
};

function refreshAvatarImage() {
  avatarImageLoaded = false;
  const t = Date.now();
  if (state.settings && state.settings.rotateOutfits !== false) {
    avatarImg.src = 'avatar_daily.jpg?t=' + t;
    if (typeof el !== 'undefined' && el.avatarPreview) {
      el.avatarPreview.src = 'avatar_daily.jpg?t=' + t;
    }
    // Refresh options
    for (let i = 1; i <= 18; i++) {
      optionAvatarsLoaded[i - 1] = false;
      optionAvatars[i - 1].src = `avatar_daily_${i}.jpg?t=` + t;
    }
  } else {
    avatarImg.src = 'avatar.jpg?t=' + t;
    if (typeof el !== 'undefined' && el.avatarPreview) {
      el.avatarPreview.src = 'avatar.jpg?t=' + t;
    }
    // Fall back options to avatar.jpg
    for (let i = 1; i <= 18; i++) {
      optionAvatarsLoaded[i - 1] = false;
      optionAvatars[i - 1].src = 'avatar.jpg?t=' + t;
    }
  }
}
avatarImg.src = 'avatar_daily.jpg?t=' + Date.now();
// Initialize option avatars
for (let i = 1; i <= 18; i++) {
  optionAvatars[i - 1].src = `avatar_daily_${i}.jpg?t=` + Date.now();
}

const LAYOUT_FAMILIES = [
  'split-left',
  'split-right',
  'hero-center',
  'magazine-cover',
  'quote-card',
  'podcast-layout',
  'presentation-slide',
  'news-card',
  'editorial-cover',
  'phone-mockup',
  'floating-cards',
  'layered-depth',
  'diagonal-layout',
  'asymmetrical-grid',
  'modern-minimal'
];


// Premium Color Palettes for daily rotating theme variations
const PALETTES = [
  {
    name: 'Electric Blue',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    gradStart: '#0b1a3e',
    gradEnd: '#020617',
    rayColor: 'rgba(59, 130, 246, 0.04)',
    textGlow: 'rgba(59, 130, 246, 0.15)',
    badgeBg: '#1d4ed8'
  },
  {
    name: 'Cyber Purple',
    primary: '#a855f7',
    secondary: '#c084fc',
    gradStart: '#1e0a3b',
    gradEnd: '#0b0214',
    rayColor: 'rgba(168, 85, 247, 0.04)',
    textGlow: 'rgba(168, 85, 247, 0.15)',
    badgeBg: '#7e22ce'
  },
  {
    name: 'Emerald Green',
    primary: '#10b981',
    secondary: '#34d399',
    gradStart: '#062217',
    gradEnd: '#020906',
    rayColor: 'rgba(16, 185, 129, 0.04)',
    textGlow: 'rgba(16, 185, 129, 0.15)',
    badgeBg: '#047857'
  },
  {
    name: 'Crimson Red',
    primary: '#ef4444',
    secondary: '#f87171',
    gradStart: '#2b0b0b',
    gradEnd: '#0c0202',
    rayColor: 'rgba(239, 44, 44, 0.04)',
    textGlow: 'rgba(239, 44, 44, 0.15)',
    badgeBg: '#b91c1c'
  },
  {
    name: 'Royal Gold',
    primary: '#1e1b4b',
    secondary: '#000000',
    gradStart: '#ffcc00',
    gradEnd: '#ffcc00',
    rayColor: 'rgba(0, 0, 0, 0.02)',
    textGlow: 'rgba(0, 0, 0, 0.03)',
    badgeBg: '#1e1b4b',
    isLight: true
  },
  {
    name: 'Teal White',
    primary: '#0f172a',
    secondary: '#14b8a6',
    gradStart: '#e0f2fe',
    gradEnd: '#e0f2fe',
    rayColor: 'rgba(0, 0, 0, 0.02)',
    textGlow: 'rgba(0, 0, 0, 0.03)',
    badgeBg: '#0f766e',
    isLight: true
  },
  {
    name: 'Slate Blue',
    primary: '#64748b',
    secondary: '#94a3b8',
    gradStart: '#0f172a',
    gradEnd: '#020617',
    rayColor: 'rgba(100, 116, 139, 0.04)',
    textGlow: 'rgba(100, 116, 139, 0.15)',
    badgeBg: '#475569'
  },
  {
    name: 'Monochrome Black',
    primary: '#ffffff',
    secondary: '#a3a3a3',
    gradStart: '#171717',
    gradEnd: '#0a0a0a',
    rayColor: 'rgba(255, 255, 255, 0.03)',
    textGlow: 'rgba(255, 255, 255, 0.1)',
    badgeBg: '#404040'
  },
  {
    name: 'Neon Cyan',
    primary: '#06b6d4',
    secondary: '#22d3ee',
    gradStart: '#041c24',
    gradEnd: '#01070a',
    rayColor: 'rgba(6, 182, 212, 0.05)',
    textGlow: 'rgba(6, 182, 212, 0.2)',
    badgeBg: '#0e7490'
  },
  {
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#fdba74',
    gradStart: '#2b1408',
    gradEnd: '#0a0300',
    rayColor: 'rgba(249, 115, 22, 0.04)',
    textGlow: 'rgba(249, 115, 22, 0.15)',
    badgeBg: '#c2410c'
  },
  {
    name: 'Deep Indigo',
    primary: '#6366f1',
    secondary: '#818cf8',
    gradStart: '#111827',
    gradEnd: '#030712',
    rayColor: 'rgba(99, 102, 241, 0.04)',
    textGlow: 'rgba(99, 102, 241, 0.15)',
    badgeBg: '#4338ca'
  },
  {
    name: 'Premium Burgundy',
    primary: '#991b1b',
    secondary: '#f87171',
    gradStart: '#27040a',
    gradEnd: '#080002',
    rayColor: 'rgba(153, 27, 27, 0.04)',
    textGlow: 'rgba(153, 27, 27, 0.15)',
    badgeBg: '#7f1d1d'
  },
  {
    name: 'Corporate Navy',
    primary: '#1e3a8a',
    secondary: '#3b82f6',
    gradStart: '#0a122c',
    gradEnd: '#02040a',
    rayColor: 'rgba(30, 58, 138, 0.04)',
    textGlow: 'rgba(30, 58, 138, 0.12)',
    badgeBg: '#1d4ed8'
  },
  {
    name: 'Platinum Grey',
    primary: '#0d9488',
    secondary: '#f97316',
    gradStart: '#f4f4f5',
    gradEnd: '#f4f4f5',
    rayColor: 'rgba(0, 0, 0, 0.02)',
    textGlow: 'rgba(0, 0, 0, 0.03)',
    badgeBg: '#0d9488',
    isLight: true
  },
  {
    name: 'Dark Forest',
    primary: '#15803d',
    secondary: '#22c55e',
    gradStart: '#051b0f',
    gradEnd: '#010704',
    rayColor: 'rgba(21, 128, 61, 0.04)',
    textGlow: 'rgba(21, 128, 61, 0.15)',
    badgeBg: '#166534'
  },
  {
    name: 'Aurora Violet',
    primary: '#c026d3',
    secondary: '#e879f9',
    gradStart: '#1a0028',
    gradEnd: '#0d001a',
    rayColor: 'rgba(192, 38, 211, 0.05)',
    textGlow: 'rgba(192, 38, 211, 0.2)',
    badgeBg: '#86198f'
  },
  {
    name: 'Liquid Gold',
    primary: '#d97706',
    secondary: '#fcd34d',
    gradStart: '#1c1008',
    gradEnd: '#0a0400',
    rayColor: 'rgba(217, 119, 6, 0.05)',
    textGlow: 'rgba(217, 119, 6, 0.2)',
    badgeBg: '#b45309'
  },
  {
    name: 'Midnight Rose',
    primary: '#e11d48',
    secondary: '#fb7185',
    gradStart: '#1a0010',
    gradEnd: '#0a0008',
    rayColor: 'rgba(225, 29, 72, 0.05)',
    textGlow: 'rgba(225, 29, 72, 0.2)',
    badgeBg: '#9f1239'
  },
  {
    name: 'Arctic Blue',
    primary: '#0ea5e9',
    secondary: '#e0f2fe',
    gradStart: '#f0f9ff',
    gradEnd: '#e0f2fe',
    rayColor: 'rgba(0, 0, 0, 0.02)',
    textGlow: 'rgba(0, 0, 0, 0.03)',
    badgeBg: '#0369a1',
    isLight: true
  },
  {
    name: 'Volcanic Amber',
    primary: '#ea580c',
    secondary: '#fdba74',
    gradStart: '#200e04',
    gradEnd: '#0a0200',
    rayColor: 'rgba(234, 88, 12, 0.05)',
    textGlow: 'rgba(234, 88, 12, 0.2)',
    badgeBg: '#c2410c'
  }
];

// Array of Pre-generated AI Outfits
const styledAvatars = [];
const styledAvatarsLoaded = [false, false, false, false, false];

for (let i = 1; i <= 5; i++) {
  const img = new Image();
  img.onload = () => {
    styledAvatarsLoaded[i - 1] = true;
    console.log(`[Avatar] AI Outfit style ${i} loaded.`);
    if (state.history.length > 0) renderActiveDrafts();
  };
  img.onerror = () => {
    console.warn(`[Avatar] Failed to load styled avatar ${i}.`);
  };
  img.src = `avatars/avatar-${i}.png`;
  styledAvatars.push(img);
}

// DOM Elements
// DOM Elements
const el = {
  topicBadge: document.getElementById('topic-badge'),
  topicBadgeText: document.getElementById('topic-badge-text'),
  apiKeyNotice: document.getElementById('api-key-notice'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnBannerSettings: document.getElementById('btn-banner-settings'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  btnRefreshHistory: document.getElementById('btn-refresh-history'),
  btnTriggerGeneration: document.getElementById('btn-trigger-generation'),
  dateSelectorList: document.getElementById('date-selector-list'),
  activeDateTitle: document.getElementById('active-date-title'),
  activeDateSub: document.getElementById('active-date-sub'),
  activeCategoryPill: document.getElementById('active-category-pill'),
  activeCategoryText: document.getElementById('active-category-text'),
  draftsContainer: document.getElementById('drafts-container'),
  settingsModal: document.getElementById('settings-modal'),
  settingsForm: document.getElementById('settings-form'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  inputWebhook: document.getElementById('input-webhook'),
  inputApiKey: document.getElementById('input-apikey'),
  inputImgbbApiKey: document.getElementById('input-imgbb-apikey'),
  inputGithubPat: document.getElementById('input-github-pat'),
  inputGithubOwner: document.getElementById('input-github-owner'),
  inputGithubRepo: document.getElementById('input-github-repo'),
  inputAvatarFile: document.getElementById('input-avatar-file'),
  avatarPreview: document.getElementById('avatar-preview'),
  inputRotateOutfits: document.getElementById('input-rotate-outfits'),
  inputCanvaTemplate: document.getElementById('input-canva-template'),
  inputBrandLogoFile: document.getElementById('input-brand-logo-file'),
  brandLogoPreview: document.getElementById('brand-logo-preview'),
  toastContainer: document.getElementById('toast-container'),
  glow1: document.getElementById('glow-1'),
  glow2: document.getElementById('glow-2'),
};

// Initialize Application
async function init() {
  setupEventListeners();
  await loadSettings();
  
  // Auto-open settings if requested via URL hash (#settings) or query parameter (?settings=true)
  if (window.location.hash === '#settings' || window.location.search.includes('settings')) {
    openSettings();
  }
  
  await loadHistory();
  
  // Set initial badge status based on today's calculated category
  updateHeaderBadge();
}

// Event Listeners
function setupEventListeners() {
  // Settings Modal Toggle
  el.btnOpenSettings.addEventListener('click', openSettings);
  el.btnBannerSettings.addEventListener('click', openSettings);
  el.btnCloseSettings.addEventListener('click', closeSettings);
  el.btnCancelSettings.addEventListener('click', closeSettings);
  
  // Close modal clicking outside
  el.settingsModal.addEventListener('click', (e) => {
    if (e.target === el.settingsModal) closeSettings();
  });

  // Settings Save
  el.settingsForm.addEventListener('submit', handleSaveSettings);



  // Refresh History
  el.btnRefreshHistory.addEventListener('click', loadHistory);

  // Trigger Generation
  el.btnTriggerGeneration.addEventListener('click', triggerManualGeneration);

  // Avatar upload preview change listener
  if (el.inputAvatarFile) {
    el.inputAvatarFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          el.avatarPreview.src = ev.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  // Brand Logo upload preview change listener
  if (el.inputBrandLogoFile) {
    el.inputBrandLogoFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (el.brandLogoPreview) {
            el.brandLogoPreview.src = ev.target.result;
            el.brandLogoPreview.style.display = 'block';
          }
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }
}

// ================= API CALLS & DATA FETCHING (SERVERLESS REFACTOR) =================

// Helper to get local DB overrides from localStorage
function getLocalDb() {
  try {
    return JSON.parse(localStorage.getItem('linkedin_local_db') || '{}');
  } catch (err) {
    return {};
  }
}

// Helper to save local DB overrides to localStorage
function saveLocalDb(db) {
  try {
    localStorage.setItem('linkedin_local_db', JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save local DB overrides:', err);
  }
}

// Bulletproof IST date helper — works on any browser/timezone
function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  // Returns 'YYYY-MM-DD' format in IST regardless of user's system timezone
}

// Load Settings from LocalStorage
async function loadSettings() {
  try {
    let settings = {};
    try {
      settings = JSON.parse(localStorage.getItem('linkedin_settings') || '{}');
    } catch (e) {
      settings = {};
    }
    
    state.settings = {
      webhookUrl: settings.webhookUrl || 'https://hook.eu1.make.com/8hd357m87nxbmvrw8i5f7i3ughh4jp9g',
      geminiApiKey: settings.geminiApiKey || '',
      imgbbApiKey: settings.imgbbApiKey || '',
      rotateOutfits: settings.rotateOutfits !== false,
      customAvatar: settings.customAvatar || '',
      brandLogo: settings.brandLogo || '',
      canvaTemplateUrl: settings.canvaTemplateUrl || '',
      githubPat: settings.githubPat || '',
      githubOwner: settings.githubOwner || 'jagtapsourabh-4003',
      githubRepo: settings.githubRepo || 'linkedin-daily-publisher'
    };
    
    // Fill fields
    el.inputWebhook.value = state.settings.webhookUrl;
    el.inputGithubPat.value = state.settings.githubPat;
    el.inputGithubOwner.value = state.settings.githubOwner;
    el.inputGithubRepo.value = state.settings.githubRepo;
    el.inputApiKey.value = state.settings.geminiApiKey;
    el.inputImgbbApiKey.value = state.settings.imgbbApiKey;
    el.inputRotateOutfits.checked = state.settings.rotateOutfits;
    if (el.inputCanvaTemplate) el.inputCanvaTemplate.value = state.settings.canvaTemplateUrl;
    
    if (state.settings.customAvatar) {
      el.avatarPreview.src = state.settings.customAvatar;
    }

    if (state.settings.brandLogo && el.brandLogoPreview) {
      el.brandLogoPreview.src = state.settings.brandLogo;
      el.brandLogoPreview.style.display = 'block';
    }
    
    refreshAvatarImage();

    // Show/hide api key notice
    if (!state.settings.geminiApiKey) {
      el.apiKeyNotice.classList.remove('hidden');
    } else {
      el.apiKeyNotice.classList.add('hidden');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// Cross-browser safe fetch helper with timeout using AbortController (supported in all JS engines)
async function fetchWithTimeout(resource, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// Load History/Drafts from Static JSON File and Merge Local overrides
async function loadHistory() {
  el.dateSelectorList.innerHTML = '<div class="loading-spinner-small"></div>';
  try {
    const pat = state.settings.githubPat;
    const owner = state.settings.githubOwner || 'jagtapsourabh-4003';
    const repo = state.settings.githubRepo || 'linkedin-daily-publisher';
    
    let res = null;
    if (pat) {
      try {
        // Fetch directly from GitHub API using the PAT to bypass GitHub Pages build/caching delays entirely!
        res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/contents/docs/data/history.json?ref=main`, {
          headers: {
            'Authorization': `token ${pat}`,
            'Accept': 'application/vnd.github.v3.raw',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }, 8000);
      } catch (apiErr) {
        console.warn('[History] GitHub API raw fetch failed, falling back to static path:', apiErr.message);
        res = null; // Ensure fallback triggers
      }
    }
    
    // Fallback if not configured, or if API fails, load from static file
    if (!res || !res.ok) {
      try {
        res = await fetchWithTimeout(`data/history.json?t=${Date.now()}`, {}, 10000);
      } catch (staticErr) {
        console.warn('[History] Static fetch failed:', staticErr.message);
        res = null;
      }
    }

    if (!res || !res.ok) {
      if (res && res.status === 404) {
        // Fresh setup where data/history.json hasn't been generated by GitHub actions yet
        state.history = [];
      } else {
        throw new Error('Could not load history file from GitHub API or static host');
      }
    } else {
      state.history = await res.json();
    }
    
    // Apply local storage overrides (like posted states, text edits, design customizations)
    const localDb = getLocalDb();
    const postedDays = localDb.posted || {};
    const textEdits = localDb.edits || {};
    const designEdits = localDb.designs || {};
    
    state.history.forEach(item => {
      // 1. Merge posted status
      if (postedDays[item.date]) {
        item.status = 'posted';
        item.selectedPostId = postedDays[item.date].selectedPostId;
        item.postedAt = postedDays[item.date].postedAt;
      }
      
      // 2. Merge post content edits and design overrides
      if (item.posts) {
        item.posts.forEach(post => {
          const editKey = `${item.date}-post-${post.id}`;
          if (textEdits[editKey]) {
            if (!post.postContent) post.postContent = {};
            post.postContent.content = textEdits[editKey];
            post.content = textEdits[editKey];
          }
          
          if (designEdits[editKey]) {
            const custom = designEdits[editKey];
            if (custom.layoutFamily !== undefined) post.layoutFamily = custom.layoutFamily;
            if (custom.colorPalette !== undefined) post.colorPalette = custom.colorPalette;
            if (custom.avatarStyleIdx !== undefined) post.avatarStyleIdx = custom.avatarStyleIdx;
            if (custom.customColors !== undefined) post.customColors = custom.customColors;
            if (custom.headlineFontSize !== undefined) post.headlineFontSize = custom.headlineFontSize;
            if (custom.subtextFontSize !== undefined) post.subtextFontSize = custom.subtextFontSize;
            if (custom.imageHeadline !== undefined) {
              if (!post.postContent) post.postContent = {};
              post.postContent.imageHeadline = custom.imageHeadline;
            }
            if (custom.imageSubtext !== undefined) {
              if (!post.postContent) post.postContent = {};
              post.postContent.imageSubtext = custom.imageSubtext;
            }
            if (custom.badgeText !== undefined) {
              if (!post.postContent) post.postContent = {};
              post.postContent.badgeText = custom.badgeText;
              post.badgeText = custom.badgeText;
            }
            if (custom.ctaText !== undefined) {
              if (!post.postContent) post.postContent = {};
              post.postContent.ctaText = custom.ctaText;
              post.ctaText = custom.ctaText;
            }
            if (custom.customCanvaGraphic !== undefined) {
              post.customCanvaGraphic = custom.customCanvaGraphic;
            }
            if (custom.overlayAvatar !== undefined) {
              post.overlayAvatar = custom.overlayAvatar;
            }
            if (custom.removeAvatarBg !== undefined) {
              post.removeAvatarBg = custom.removeAvatarBg;
            }
          }
        });
      }
    });

    renderDateList();
    
    if (state.history.length > 0) {
      const exists = state.history.some(item => item.date === state.activeDate);
      if (!state.activeDate || !exists) {
        state.activeDate = state.history[0].date;
      }
      renderActiveDrafts();
    } else {
      renderEmptyState();
    }
  } catch (err) {
    console.error('[loadHistory] Error:', err);
    el.dateSelectorList.innerHTML = '<div style="padding:10px; color:#f87171; font-size:0.85rem;">Failed to load dates</div>';
    el.draftsContainer.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">⚠️</div>
        <h3 style="color: #f87171; margin-bottom: 8px;">Unable to Load Daily Drafts</h3>
        <p style="color: #94a3b8; max-width: 450px; margin: 0 auto 16px auto; font-size: 0.9rem;">${err.message || 'Network request failed'}</p>
        <button class="btn btn-secondary" onclick="loadHistory()" style="margin-top: 10px;">🔄 Retry Loading</button>
      </div>
    `;
    showToast(`Error: ${err.message}`, 'error');
  }
}

// Convert file to Base64 utility
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Save Settings in LocalStorage
async function handleSaveSettings(e) {
  e.preventDefault();
  const webhookUrl = el.inputWebhook.value.trim();
  const geminiApiKey = el.inputApiKey.value.trim();
  const imgbbApiKey = el.inputImgbbApiKey.value.trim();
  const githubPat = el.inputGithubPat.value.trim();
  const githubOwner = el.inputGithubOwner.value.trim() || 'jagtapsourabh-4003';
  const githubRepo = el.inputGithubRepo.value.trim() || 'linkedin-daily-publisher';
  const rotateOutfits = el.inputRotateOutfits.checked;
  
  try {
    let customAvatarBase64 = state.settings.customAvatar || '';
    let brandLogoBase64 = state.settings.brandLogo || '';
    const canvaTemplateUrl = el.inputCanvaTemplate ? el.inputCanvaTemplate.value.trim() : '';

    // 1. Convert custom avatar if a new one is selected
    if (el.inputAvatarFile && el.inputAvatarFile.files && el.inputAvatarFile.files[0]) {
      showToast('Saving profile picture in browser storage...', 'info');
      const file = el.inputAvatarFile.files[0];
      customAvatarBase64 = await convertFileToBase64(file);
      
      // Update local cache-busted source
      avatarImageLoaded = false;
      avatarImg.src = customAvatarBase64;
    }

    // Convert brand logo if selected
    if (el.inputBrandLogoFile && el.inputBrandLogoFile.files && el.inputBrandLogoFile.files[0]) {
      showToast('Saving brand logo watermark in browser storage...', 'info');
      const logoFile = el.inputBrandLogoFile.files[0];
      brandLogoBase64 = await convertFileToBase64(logoFile);
    }

    // 2. Save configurations in local storage
    const newSettings = {
      webhookUrl,
      geminiApiKey,
      imgbbApiKey,
      rotateOutfits,
      customAvatar: customAvatarBase64,
      brandLogo: brandLogoBase64,
      canvaTemplateUrl,
      githubPat,
      githubOwner,
      githubRepo
    };
    
    localStorage.setItem('linkedin_settings', JSON.stringify(newSettings));
    
    showToast('Settings saved successfully in your browser!', 'success');
    closeSettings();
    await loadSettings();
    
    if (state.history.length === 0) {
      await loadHistory();
    } else {
      renderActiveDrafts();
    }
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
  }
}

// Trigger Daily Post Generation manually (via GitHub Actions API if PAT is configured, otherwise fallback to instructions)
async function triggerManualGeneration() {
  const pat = state.settings.githubPat;
  const owner = state.settings.githubOwner || 'jagtapsourabh-4003';
  const repo = state.settings.githubRepo || 'linkedin-daily-publisher';

  if (!pat) {
    // Show instruction modal since PAT is not configured
    const modalHtml = `
      <div style="text-align: left; line-height: 1.6;">
        <p style="margin-bottom: 12px;">Since the app runs <strong>100% serverless</strong> on GitHub Pages, draft generation is automated via <strong>GitHub Actions</strong> every morning at 9:00 AM.</p>
        <p style="margin-bottom: 12px; color: var(--accent-light); font-weight: bold;">💡 Tip: You can trigger generation directly from this dashboard! Just go to Settings (gear icon) and add a GitHub Personal Access Token (PAT).</p>
        <hr style="border: 0; border-top: 1px solid var(--border-light); margin: 12px 0;">
        <p style="margin-bottom: 12px;"><strong>To trigger manually on GitHub right now:</strong></p>
        <ol style="margin-left: 20px; margin-bottom: 16px;">
          <li>Go to your GitHub Repository.</li>
          <li>Click the <strong>Actions</strong> tab.</li>
          <li>Select <strong>.github/workflows/generate.yml</strong> in the left sidebar.</li>
          <li>Click the <strong>Run workflow</strong> dropdown on the right and click the green button.</li>
        </ol>
        <p style="font-size: 0.85rem; color: #94a3b8;">Once completed (takes ~30s), reload this dashboard page to see the new drafts!</p>
      </div>
    `;
    
    const dialog = document.createElement('div');
    dialog.className = 'modal active';
    dialog.style.zIndex = '9999';
    dialog.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>⚡ Manual Draft Generation</h3>
          <button class="close-btn" id="close-manual-trigger-btn">&times;</button>
        </div>
        <div class="modal-body">${modalHtml}</div>
        <div class="modal-footer" style="justify-content: flex-end;">
          <button class="btn btn-secondary" id="ok-manual-trigger-btn">Got it</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    const close = () => document.body.removeChild(dialog);
    document.getElementById('close-manual-trigger-btn').onclick = close;
    document.getElementById('ok-manual-trigger-btn').onclick = close;
    return;
  }

  // Determine if today's drafts already exist in history
  const todayStr = getTodayIST();
  
  const existing = state.history.find(h => h.date === todayStr);
  let forceVal = "false";
  
  if (existing) {
    const confirmOverwrite = confirm(`Drafts for today (${todayStr}) have already been generated.\n\nDo you want to regenerate and overwrite today's drafts with fresh new content?`);
    if (!confirmOverwrite) return;
    forceVal = "true";
  }

  // Trigger Action remotely using GitHub API
  const btn = el.btnTriggerGeneration;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Starting...`;

  try {
    const triggerRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/generate.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({ 
        ref: 'main',
        inputs: {
          force: forceVal
        }
      })
    });

    if (!triggerRes.ok) {
      const errText = await triggerRes.text().catch(() => '');
      throw new Error(errText ? JSON.parse(errText).message : `HTTP ${triggerRes.status}`);
    }

    showToast('GitHub Actions workflow triggered! Generating drafts...', 'info');
    btn.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Generating...`;

    // Start polling the run status
    let pollAttempts = 0;
    const maxPolls = 120; // 10 minutes maximum (120 * 5s)
    const runStartTime = new Date();

    const interval = setInterval(async () => {
      pollAttempts++;
      const elapsed = Math.round((Date.now() - runStartTime.getTime()) / 1000);
      
      // Progressive reassurance toasts
      if (pollAttempts === 6) { // 30s
        showToast('GitHub is spinning up the server. This takes 15-30 seconds...', 'info');
      }
      if (pollAttempts === 24) { // 2 min
        showToast('AI is generating content and avatar images. Almost there...', 'info');
      }
      
      if (pollAttempts > maxPolls) {
        clearInterval(interval);
        btn.disabled = false;
        btn.innerHTML = originalText;
        showToast('Generation is still running in the background on GitHub. Please reload the page in 1-2 minutes.', 'info');
        return;
      }

      try {
        const runsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?event=workflow_dispatch&per_page=3`, {
          headers: {
            'Authorization': `token ${pat}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        
        if (runsRes.ok) {
          const runsData = await runsRes.json();
          if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
            // Find any workflow_dispatch run created within 5 minutes of our trigger
            const matchingRun = runsData.workflow_runs.find(run => {
              const runTime = new Date(run.created_at);
              return Math.abs(runTime - runStartTime) < 300000; // 5 minute window
            });
            
            if (matchingRun) {
              if (matchingRun.status === 'completed') {
                clearInterval(interval);
                btn.disabled = false;
                btn.innerHTML = originalText;
                
                if (matchingRun.conclusion === 'success') {
                  showToast('Drafts regenerated and saved successfully!', 'success');
                  await loadHistory();
                } else {
                  showToast(`Generation workflow failed: ${matchingRun.conclusion || 'error'}. Check GitHub Actions.`, 'error');
                }
              } else {
                // Update spinner text with real-time elapsed timer
                const statusText = matchingRun.status === 'in_progress' ? 'Generating' : 'Queued';
                btn.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> ${statusText}... ${elapsed}s`;
              }
            } else {
              // Run hasn't appeared yet - GitHub is still queuing
              btn.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Queuing... ${elapsed}s`;
            }
          }
        }
      } catch (pollErr) {
        console.warn('Error polling GitHub Actions runs:', pollErr.message);
      }
    }, 5000); // Poll every 5 seconds

  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = originalText;
    const isBadAuth = err.message.includes('Bad credentials') || err.message.includes('401');
    if (isBadAuth) {
      showToast('🔑 GitHub PAT token expired or invalid. Opening Settings to update...', 'error');
      openSettings();
      if (el.inputGithubPat) {
        el.inputGithubPat.style.borderColor = '#ef4444';
        el.inputGithubPat.focus();
        el.inputGithubPat.placeholder = 'Paste your NEW GitHub PAT here (starts with ghp_...)';
      }
    } else {
      showToast(`Failed to trigger generation: ${err.message}. Please check your GitHub PAT/Username in Settings.`, 'error');
    }
  }
}

// Save an inline draft edit to LocalStorage
async function saveDraftEdit(date, postId, content) {
  try {
    const localDb = getLocalDb();
    localDb.edits = localDb.edits || {};
    localDb.edits[`${date}-post-${postId}`] = content;
    saveLocalDb(localDb);
    
    const dayEntry = state.history.find(item => item.date === date);
    if (dayEntry) {
      const post = dayEntry.posts.find(p => p.id === parseInt(postId));
      if (post) {
        if (post.postContent) {
          post.postContent.content = content;
        } else {
          post.content = content;
        }
      }
    }
    console.log(`[Editor] Auto-saved text edit for ${date} Post ${postId}`);
  } catch (err) {
    console.error('[Editor] Failed to auto-save post edit:', err.message);
  }
}

// Save customized draft creative parameters to LocalStorage
async function saveDesignEdit(date, postId, designData) {
  try {
    const localDb = getLocalDb();
    localDb.designs = localDb.designs || {};
    
    const key = `${date}-post-${postId}`;
    localDb.designs[key] = {
      ...(localDb.designs[key] || {}),
      ...designData
    };
    saveLocalDb(localDb);
    console.log(`[Design] Auto-saved design edits for Post ${postId} in LocalStorage`);
  } catch (err) {
    console.error('[Editor] Failed to auto-save design edit:', err.message);
  }
}

// Direct Web Browser upload to ImgBB and Publish trigger to Make.com Webhook
async function postToGoogleFlow(postId, btnElement) {
  const date = state.activeDate;
  if (!state.settings.webhookUrl) {
    showToast('Google Flow Webhook URL is not configured. Go to Settings.', 'error');
    openSettings();
    return;
  }

  btnElement.disabled = true;
  const originalHtml = btnElement.innerHTML;
  btnElement.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Generating graphic...`;

  try {
    const activeEntry = state.history.find(h => h.date === date);
    const post = activeEntry ? activeEntry.posts.find(p => p.id === postId) : null;

    let imageBase64 = null;

    // 1. If custom Canva graphic is attached to this post card, use it directly!
    if (post && post.customCanvaGraphic) {
      console.log('[Publish] Using attached custom Canva graphic image for LinkedIn publishing');
      imageBase64 = post.customCanvaGraphic;
    } else {
      // Grab matching canvas and export as data URL
      const canvas = document.getElementById(`canvas-${postId}`);
      if (!canvas) throw new Error('Image canvas element not found. Please scroll to the post card first.');

      try {
        imageBase64 = canvas.toDataURL('image/png');
        if (!imageBase64 || imageBase64.length < 5000) {
          throw new Error('Canvas appears blank or tainted');
        }
      } catch (taintErr) {
      console.warn('[Publish] Canvas toDataURL failed (tainted canvas). Re-drawing on a clean offscreen canvas without cross-origin images:', taintErr.message);
      showToast('Redrawing graphic on clean canvas (cross-origin image issue)...', 'info');

      // Fallback: draw on a fresh offscreen canvas with no cross-origin images
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;

      if (activeEntry && post) {
        const headlineText = post.postContent?.imageHeadline || post.imageHeadline || '';
        const subtextText = post.postContent?.imageSubtext || post.imageSubtext || '';
        const savedAvatar = avatarImg.src;
        avatarImg.src = '';
        drawCreative(offscreen, activeEntry.category, headlineText, subtextText, post.id, activeEntry.date, post.layout || post);
        avatarImg.src = savedAvatar;
      }

      try {
        imageBase64 = offscreen.toDataURL('image/png');
      } catch (finalErr) {
        throw new Error(`Cannot export canvas: ${finalErr.message}. Please try re-uploading your profile picture from the Settings panel.`);
      }
    }
    }

    // 2. Upload image directly from the browser to ImgBB
    let imageUrl = '';
    const imgbbKey = state.settings.imgbbApiKey;
    
    if (!imgbbKey) {
      throw new Error('ImgBB API Key is missing. Graphic hosting is required for LinkedIn publishing. Please configure it in Settings.');
    }
    
    btnElement.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Uploading graphic...`;
    
    const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const formData = new FormData();
    formData.append('image', rawBase64);
    
    try {
      const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: 'POST',
        body: formData
      });
      
      if (imgbbResponse.ok) {
        const result = await imgbbResponse.json();
        if (result && result.success && result.data && result.data.url) {
          imageUrl = result.data.url;
          console.log(`[Browser ImgBB] Creative hosted successfully: ${imageUrl}`);
        } else {
          throw new Error(result.error ? result.error.message : 'Unknown ImgBB API response error');
        }
      } else {
        const errText = await imgbbResponse.text().catch(() => `HTTP ${imgbbResponse.status}`);
        throw new Error(`Server responded with ${errText}`);
      }
    } catch (uploadErr) {
      throw new Error(`ImgBB upload failed: ${uploadErr.message}. Check your ImgBB Key in Settings.`);
    }

    // 3. Post text and image URL directly to the Make.com Webhook from the browser
    btnElement.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Publishing...`;
    
    const res = await fetch(state.settings.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: post.postContent ? post.postContent.content : post.content,
        imageUrl: imageUrl || null,
        style: post.postContent ? post.postContent.style : post.style,
        sourceArticle: post.postContent ? post.postContent.sourceArticle : post.sourceArticle,
        category: activeEntry.category,
        date: date,
        author: 'Marketing Manager & AI Expert'
      })
    });

    if (!res.ok) {
      throw new Error(`Webhook responded with HTTP ${res.status}`);
    }

    // 4. Mark as posted in local DB overrides
    const localDb = getLocalDb();
    localDb.posted = localDb.posted || {};
    localDb.posted[date] = {
      status: 'posted',
      selectedPostId: postId,
      postedAt: new Date().toISOString()
    };
    saveLocalDb(localDb);

    showToast('Post and creative graphic sent successfully!', 'success');
    await loadHistory();
  } catch (err) {
    console.error('[Publish] Error:', err);
    showToast(`Post failed: ${err.message}`, 'error');
    btnElement.disabled = false;
    btnElement.innerHTML = originalHtml;
  }
}

// ================= UI RENDERING & INTERACTION =================

// Render Sidebar Date List
function renderDateList() {
  el.dateSelectorList.innerHTML = '';
  
  const todayIST = getTodayIST();
  const hasToday = state.history.some(item => item.date === todayIST);

  // If today's date is not generated yet, show a Pending entry at the top
  if (!hasToday) {
    const todayEl = document.createElement('div');
    todayEl.className = 'date-item today-pending';
    todayEl.style.cssText = 'border: 1px dashed rgba(245, 158, 11, 0.5); background: rgba(245, 158, 11, 0.05); margin-bottom: 8px; cursor: pointer;';
    todayEl.onclick = () => triggerManualGeneration();
    todayEl.title = "Today's drafts have not been generated yet. Click to generate now.";
    todayEl.innerHTML = `
      <div class="date-info">
        <span class="date-text" style="color: #fbbf24; font-weight: 600;">Today (${formatDateHuman(todayIST)})</span>
        <span class="date-cat ai" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);">Pending</span>
      </div>
      <div class="status-indicator" style="background: #f59e0b;" title="Pending generation"></div>
    `;
    el.dateSelectorList.appendChild(todayEl);
  }

  if (state.history.length === 0) {
    el.dateSelectorList.innerHTML += '<p class="empty-text">No history drafts found.</p>';
    return;
  }

  state.history.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = `date-item ${item.date === state.activeDate ? 'active' : ''}`;
    itemEl.id = `date-item-${item.date}`;
    itemEl.onclick = () => selectDate(item.date);
    
    const formattedDate = formatDateHuman(item.date);
    const catClass = item.category === 'marketing' ? 'marketing' : 'ai';
    const statusClass = item.status === 'posted' ? 'posted' : '';

    itemEl.innerHTML = `
      <div class="date-info">
        <span class="date-text">${formattedDate}</span>
        <span class="date-cat ${catClass}">${item.category}</span>
      </div>
      <div class="status-indicator ${statusClass}" title="${item.status === 'posted' ? 'Posted' : 'Draft'}"></div>
    `;
    el.dateSelectorList.appendChild(itemEl);
  });
}

// Render Active Day's Drafts in Workspace
function renderActiveDrafts() {
  const activeEntry = state.history.find(item => item.date === state.activeDate);
  if (!activeEntry) {
    renderEmptyState();
    return;
  }

  // Update header text details
  el.activeDateTitle.textContent = formatDateHuman(state.activeDate);
  el.activeDateSub.textContent = `Draft options generated for this date`;

  // Render active category badge with custom styling
  el.activeCategoryText.textContent = activeEntry.category;
  el.activeCategoryPill.className = `category-indicator ${activeEntry.category}`;

  // Render Today Pending Notice Banner if today's date is missing from history
  const todayIST = getTodayIST();
  const hasToday = state.history.some(item => item.date === todayIST);
  let pendingBanner = document.getElementById('today-pending-banner');
  if (!hasToday) {
    if (!pendingBanner) {
      pendingBanner = document.createElement('div');
      pendingBanner.id = 'today-pending-banner';
      pendingBanner.style.cssText = 'background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; padding: 14px 18px; border-radius: 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 0.9rem; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
      const contentHeader = document.querySelector('.content-header');
      if (contentHeader && contentHeader.parentNode) {
        contentHeader.parentNode.insertBefore(pendingBanner, contentHeader.nextSibling);
      }
    }
    pendingBanner.innerHTML = `
      <div>
        <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">📅 Today's Drafts (${formatDateHuman(todayIST)}) Pending</div>
        <div style="opacity: 0.85; font-size: 0.82rem;">GitHub Actions morning schedule is queued. Click to generate today's 5 fresh drafts right now!</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="triggerManualGeneration()" style="white-space: nowrap; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">⚡ Generate Today's Drafts</button>
    `;
    pendingBanner.style.display = 'flex';
  } else if (pendingBanner) {
    pendingBanner.style.display = 'none';
  }

  // Clear posts workspace
  el.draftsContainer.innerHTML = '';

  const isDayPosted = activeEntry.status === 'posted';
  const selectedPostId = activeEntry.selectedPostId;

  activeEntry.posts.forEach(post => {
    const isThisPostSelected = isDayPosted && selectedPostId === post.id;
    const cardEl = document.createElement('article');
    // Only apply posted-item highlight to the selected card; others remain fully interactive
    cardEl.className = `draft-card ${isThisPostSelected ? 'posted-item' : ''}`;
    cardEl.id = `draft-card-${post.id}`;

    // Gracefully resolve properties from both new structured model schema and legacy fallback schema
    const content = (post.postContent && post.postContent.content) ? post.postContent.content : (post.content || '');
    const hook = (post.postContent && post.postContent.hook) ? post.postContent.hook : (post.hook || '');
    const headlineText = (post.postContent && post.postContent.imageHeadline) ? post.postContent.imageHeadline : (post.imageHeadline || 'AI Strategy');
    const subtextText = (post.postContent && post.postContent.imageSubtext) ? post.postContent.imageSubtext : (post.imageSubtext || 'Next-Gen Workflows');
    const sourceArticle = (post.postContent && post.postContent.sourceArticle) ? post.postContent.sourceArticle : (post.sourceArticle || 'General Trend');
    const badgeText = (post.postContent && (post.postContent.badgeText || post.postContent.badge)) || post.badgeText || (activeEntry.category === 'marketing' ? 'MARKETING TREND' : 'AI TECH TREND');
    const ctaText = (post.postContent && (post.postContent.ctaText || post.postContent.cta)) || post.ctaText || 'READ FULL POST';
    const postStyle = post.designArchetype || (post.postContent && post.postContent.style) || post.style || 'Thought Leadership';

    // Calculate details for metadata row
    const charCount = content.length;
    const hashtagCount = (content.match(/#/g) || []).length;

    // Resolve current active colors to populate picker inputs in real-time
    const activePaletteName = post.colorPalette || 'Electric Blue';
    const activePalette = PALETTES.find(p => p.name.toLowerCase() === activePaletteName.toLowerCase()) || 
                          PALETTES.find(p => activePaletteName.toLowerCase().includes(p.name.toLowerCase())) ||
                          PALETTES[0];

    const curPrimary = (activePaletteName === 'Custom' && post.customColors) ? post.customColors.primary : activePalette.primary;
    const curSecondary = (activePaletteName === 'Custom' && post.customColors) ? post.customColors.secondary : (activePalette.secondary || '#cbd5e1');
    const curBgStart = (activePaletteName === 'Custom' && post.customColors) ? post.customColors.gradStart : activePalette.gradStart;
    const curBgEnd = (activePaletteName === 'Custom' && post.customColors) ? post.customColors.gradEnd : activePalette.gradEnd;
    const curText = (activePaletteName === 'Custom' && post.customColors) ? post.customColors.textColor : (activePalette.textColor || (activePalette.isLight ? '#18181b' : '#ffffff'));

    cardEl.innerHTML = `
      <div class="draft-card-header">
        <div class="header-main-info">
          <span class="style-tag">${postStyle}</span>
          <span class="source-tag">Inspiration: <em>${sourceArticle || 'General Trend'}</em></span>
        </div>
        ${post.scores ? `
        <div class="score-badge-group">
          <div class="score-pill total-score" title="Overall AI Quality Score">
            <span class="score-label">AI Score:</span>
            <span class="score-val">${post.scores.total || 0}</span>
          </div>
        </div>
        ` : ''}
      </div>

      ${(post.designArchetype || post.layoutFamily || post.colorPalette) ? `
      <div class="design-metadata-row">
        <span class="meta-badge archetype-badge" title="Design Archetype">🏛️ ${post.designArchetype || 'Custom'}</span>
        <span class="meta-badge layout-badge" title="Layout Family">📐 ${post.layoutFamily || 'Dynamic'}</span>
        <span class="meta-badge palette-badge" title="Color Palette">🎨 ${post.colorPalette || 'Standard'}</span>
        <span class="meta-badge role-badge" title="Character Persona">💼 ${post.characterRole || 'B2B Manager'}</span>
        <span class="meta-badge wardrobe-badge" title="Clothing Style">👔 ${post.clothingStyle || 'Executive'}</span>
        <span class="meta-badge env-badge" title="Environment">📍 ${post.environment || 'Workspace'}</span>
        <span class="meta-badge camera-badge" title="Camera Style">📷 ${post.cameraStyle || 'Portrait'}</span>
      </div>
      ` : ''}

      <div class="post-editor-wrapper">
        <textarea 
          class="post-textarea" 
          id="textarea-${post.id}"
          placeholder="Loading post content..."
          aria-label="Edit Post Content"
          ${isDayPosted ? 'disabled' : ''}
        >${content}</textarea>
      </div>
      <div class="post-meta-row">
        <div>
          <span id="char-count-${post.id}">${charCount} chars</span> | 
          <span id="hashtag-count-${post.id}">${hashtagCount} hashtags</span>
        </div>
        ${post.scores ? `
        <div class="sub-scores-row">
          <span class="sub-score-badge" title="Design Layout Score">Design: <strong>${post.scores.design}</strong></span>
          <span class="sub-score-badge" title="Content Alignment Score">Content: <strong>${post.scores.content}</strong></span>
          <span class="sub-score-badge" title="Personal Branding & Avatar Integration">Branding: <strong>${post.scores.branding}</strong></span>
        </div>
        ` : ''}
      </div>
      
      <!-- Visual Graphic Preview -->
      <div class="creative-container">
        <div class="creative-toggle-header active" id="toggle-creative-${post.id}">
          <span>🖼 View & Customize Social Graphic Card</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="creative-content-body" id="creative-body-${post.id}">
          <canvas id="canvas-${post.id}" width="1080" height="1080" class="creative-canvas"></canvas>
          
          <!-- Design Customizer Panel -->
          <div class="design-customizer-panel" ${isDayPosted ? 'style="opacity: 0.7; pointer-events: none;"' : ''}>
            <h4 class="customizer-title">🎨 Customize Graphic Design</h4>
            <div class="customizer-row">
              <div class="customizer-field">
                <label for="select-layout-${post.id}">Layout Template</label>
                <select id="select-layout-${post.id}" class="customizer-select">
                  ${LAYOUT_FAMILIES.map(family => 
                    `<option value="${family}" ${post.layoutFamily === family ? 'selected' : ''}>${family}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="customizer-field">
                <label for="select-palette-${post.id}">Color Palette</label>
                <select id="select-palette-${post.id}" class="customizer-select">
                  ${PALETTES.map(p => 
                    `<option value="${p.name}" ${(post.colorPalette && post.colorPalette.toLowerCase() === p.name.toLowerCase()) ? 'selected' : ''}>${p.name}</option>`
                  ).join('')}
                  <option value="Custom" ${post.colorPalette === 'Custom' ? 'selected' : ''}>✨ Custom Colors</option>
                </select>
              </div>
              <div class="customizer-field">
                <label for="select-avatar-${post.id}">Avatar Pose / Outfit</label>
                <select id="select-avatar-${post.id}" class="customizer-select">
                  ${[
                    { val: 0, text: '👔 Outfit 1 (Stage/Thumbs-up)' },
                    { val: 1, text: '🌲 Outfit 2 (Mountains Trail)' },
                    { val: 2, text: '🥂 Outfit 3 (Social Event)' },
                    { val: 3, text: '🎤 Outfit 4 (Podium Speech)' },
                    { val: 4, text: '☕ Outfit 5 (Cafe Workspace)' },
                    { val: 5, text: '🏙️ Outfit 6 (City Street Suit)' },
                    { val: 6, text: '🏔️ Outfit 7 (Mountains Pullover)' },
                    { val: 7, text: '🏫 Outfit 8 (University Campus)' },
                    { val: 8, text: '🎓 Outfit 9 (University Light Blue Blazer)' },
                    { val: 9, text: '💼 Outfit 10 (Boardroom Clasped Hands)' },
                    { val: 10, text: '🎙️ Outfit 11 (TEDx Speaker Stage)' },
                    { val: 11, text: '💻 Outfit 12 (Office Desk Workspace)' },
                    { val: 12, text: '☕ Outfit 13 (Cafe Neon Coffee Shop)' },
                    { val: 13, text: '⛳ Outfit 14 (Polo Shirt Valley)' },
                    { val: 14, text: '🖤 Outfit 15 (Black Hoodie Chalkboard)' },
                    { val: 15, text: '🎙️ Outfit 16 (Podcast Desk & Mic)' },
                    { val: 16, text: '👔 Outfit 17 (Corporate Window City Suit)' },
                    { val: 17, text: '🎓 Outfit 18 (Leadership Summit Speaker)' }
                  ].map(opt => {
                    const selectedAvIdx = post.avatarStyleIdx !== undefined ? post.avatarStyleIdx : ((post.id - 1) % 18);
                    return `<option value="${opt.val}" ${selectedAvIdx === opt.val ? 'selected' : ''}>${opt.text}</option>`;
                  }).join('')}
                </select>
              </div>
            </div>
            
            <!-- Custom Colors Sub-panel -->
            <div id="custom-colors-container-${post.id}" class="custom-colors-row">
              <div class="customizer-field">
                <label for="color-text-${post.id}">Headline Font Color</label>
                <div class="color-picker-wrapper">
                  <input type="color" id="color-text-${post.id}" class="color-picker-input" value="${curText}">
                  <span class="color-hex-label">${curText}</span>
                </div>
              </div>
              <div class="customizer-field">
                <label for="color-primary-${post.id}">Accents / Highlights</label>
                <div class="color-picker-wrapper">
                  <input type="color" id="color-primary-${post.id}" class="color-picker-input" value="${curPrimary}">
                  <span class="color-hex-label">${curPrimary}</span>
                </div>
              </div>
              <div class="customizer-field">
                <label for="color-secondary-${post.id}">Subtext / Secondary</label>
                <div class="color-picker-wrapper">
                  <input type="color" id="color-secondary-${post.id}" class="color-picker-input" value="${curSecondary}">
                  <span class="color-hex-label">${curSecondary}</span>
                </div>
              </div>
              <div class="customizer-field">
                <label for="color-bg-start-${post.id}">Gradient Start</label>
                <div class="color-picker-wrapper">
                  <input type="color" id="color-bg-start-${post.id}" class="color-picker-input" value="${curBgStart}">
                  <span class="color-hex-label">${curBgStart}</span>
                </div>
              </div>
              <div class="customizer-field">
                <label for="color-bg-end-${post.id}">Gradient End</label>
                <div class="color-picker-wrapper">
                  <input type="color" id="color-bg-end-${post.id}" class="color-picker-input" value="${curBgEnd}">
                  <span class="color-hex-label">${curBgEnd}</span>
                </div>
              </div>
            </div>
            <!-- Font Size Overrides Row -->
            <div class="customizer-row" style="margin-top: 10px;">
              <div class="customizer-field">
                <label for="slider-headline-size-${post.id}">Headline Font Size: <span id="val-headline-size-${post.id}">${post.headlineFontSize || 40}px</span></label>
                <input type="range" id="slider-headline-size-${post.id}" min="20" max="80" value="${post.headlineFontSize || 40}" class="customizer-range">
              </div>
              <div class="customizer-field">
                <label for="slider-subtext-size-${post.id}">Subtext Font Size: <span id="val-subtext-size-${post.id}">${post.subtextFontSize || 22}px</span></label>
                <input type="range" id="slider-subtext-size-${post.id}" min="12" max="40" value="${post.subtextFontSize || 22}" class="customizer-range">
              </div>
            </div>
            <div class="customizer-row" style="margin-top: 10px;">
              <div class="customizer-field">
                <label for="input-badge-${post.id}">Top Tag / Badge Text</label>
                <input type="text" id="input-badge-${post.id}" class="customizer-input" value="${badgeText}" placeholder="e.g. AI TREND / MARKETING INSIGHT">
              </div>
              <div class="customizer-field">
                <label for="input-cta-${post.id}">Bottom Button / CTA Text</label>
                <input type="text" id="input-cta-${post.id}" class="customizer-input" value="${ctaText}" placeholder="e.g. TRY WEB APP, READ FULL POST">
              </div>
            </div>
            <div class="customizer-row">
              <div class="customizer-field full-width">
                <label for="input-headline-${post.id}">Creative Headline (supports Enter for new lines)</label>
                <textarea id="input-headline-${post.id}" class="customizer-textarea" rows="2" placeholder="Enter bold headline text...">${headlineText}</textarea>
              </div>
            </div>
            <div class="customizer-row">
              <div class="customizer-field full-width">
                <label for="input-subtext-${post.id}">Creative Subtext (supports Enter for new lines)</label>
                <textarea id="input-subtext-${post.id}" class="customizer-textarea" rows="2" placeholder="Enter subtext info...">${subtextText}</textarea>
              </div>
            </div>
            <!-- Import Canva Graphic Image Section -->
            <div class="customizer-row" style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-light);">
              <div class="customizer-field full-width">
                <label for="input-canva-graphic-${post.id}" style="color: #c084fc; font-weight: 600; display: flex; align-items: center; justify-content: space-between;">
                  <span>📥 Import Final Canva Graphic Image (PNG / JPG)</span>
                  ${post.customCanvaGraphic ? `<span class="badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); font-size: 0.72rem;">✨ Canva Graphic Attached</span>` : ''}
                </label>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="file" id="input-canva-graphic-${post.id}" accept="image/*" class="customizer-input" style="font-size: 0.8rem; padding: 6px 10px;">
                  ${post.customCanvaGraphic ? `<button class="btn btn-sm" id="btn-remove-canva-${post.id}" type="button" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; white-space: nowrap; font-size: 0.78rem;">🗑 Remove</button>` : ''}
                </div>
                <small style="color: #94a3b8; font-size: 0.75rem; display: block; margin-top: 4px;">Upload your finished graphic exported from Canva. It will replace the preview card and automatically publish to LinkedIn when you click "Select &amp; Publish".</small>
              </div>
            </div>
            <!-- Avatar Overlay & Background Removal Tool Options -->
            <div class="customizer-row" style="margin-top: 12px; background: rgba(59, 130, 246, 0.06); padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.25); display: flex; flex-direction: column; gap: 8px;">
              <div style="font-weight: 700; font-size: 0.85rem; color: #93c5fd; display: flex; align-items: center; justify-content: space-between;">
                <span>👤 Avatar &amp; Photo Controls for Graphic</span>
                <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 400;">Apply to Canvas / Uploaded Graphic</span>
              </div>
              <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: #e2e8f0;">
                  <input type="checkbox" id="check-overlay-avatar-${post.id}" ${post.overlayAvatar !== false ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                  📷 Overlay Photo on Graphic
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: #f472b6;">
                  <input type="checkbox" id="check-bg-remove-${post.id}" ${post.removeAvatarBg ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                  ✨ Remove Avatar Background (Cutout)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="draft-card-actions" style="margin-top: 14px;">
        <button class="btn btn-secondary btn-sm" id="btn-copy-${post.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Content
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-canva-${post.id}" title="Copy headline & open Canva editor/template" style="background: rgba(168, 85, 247, 0.12); border-color: rgba(168, 85, 247, 0.3); color: #c084fc;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          Open in Canva
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-photo-${post.id}" title="Open selected photo in new tab to drag directly into Canva" style="background: rgba(59, 130, 246, 0.12); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Open Photo
        </button>
        ${
          isThisPostSelected
            ? `<div class="posted-status-btn" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Published
                </div>
                <button class="btn btn-sm" id="btn-republish-${post.id}" style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#93c5fd;font-size:0.78rem;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
                  Re-publish
                </button>
               </div>`
            : isDayPosted
              ? `<button class="btn btn-secondary btn-sm" id="btn-reselect-${post.id}" style="font-size:0.78rem;opacity:0.8;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Select This Instead
                </button>`
              : `<button class="btn btn-primary btn-sm ${activeEntry.category === 'marketing' ? 'marketing-theme' : ''}" id="btn-post-${post.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Select &amp; Publish
                 </button>`
        }
      </div>
    `;

    el.draftsContainer.appendChild(cardEl);

    // Toggle graphic card menu
    const toggleHeader = cardEl.querySelector(`#toggle-creative-${post.id}`);
    const contentBody = cardEl.querySelector(`#creative-body-${post.id}`);
    toggleHeader.addEventListener('click', () => {
      contentBody.classList.toggle('hidden');
      toggleHeader.classList.toggle('active');
    });

    // Render Canvas
    const canvas = cardEl.querySelector(`#canvas-${post.id}`);
    if (canvas) {
      drawCreative(canvas, activeEntry.category, headlineText, subtextText, post.id, activeEntry.date, post.layout || post);
    }

    // Textarea auto-save and length counters listener
    const textarea = cardEl.querySelector(`#textarea-${post.id}`);
    textarea.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById(`char-count-${post.id}`).textContent = `${val.length} characters`;
      document.getElementById(`hashtag-count-${post.id}`).textContent = `${(val.match(/#/g) || []).length} hashtags`;
    });

    // Save changes when user clicks out or finishes editing
    textarea.addEventListener('change', (e) => {
      saveDraftEdit(state.activeDate, post.id, e.target.value);
    });

    // Design Customizer Event Listeners
    if (!isDayPosted) {
      const layoutSelect = cardEl.querySelector(`#select-layout-${post.id}`);
      const paletteSelect = cardEl.querySelector(`#select-palette-${post.id}`);
      const avatarSelect = cardEl.querySelector(`#select-avatar-${post.id}`);
      const badgeInput = cardEl.querySelector(`#input-badge-${post.id}`);
      const ctaInput = cardEl.querySelector(`#input-cta-${post.id}`);
      const headlineInput = cardEl.querySelector(`#input-headline-${post.id}`);
      const subtextInput = cardEl.querySelector(`#input-subtext-${post.id}`);
      const customColorsContainer = cardEl.querySelector(`#custom-colors-container-${post.id}`);
      const colorText = cardEl.querySelector(`#color-text-${post.id}`);
      const colorPrimary = cardEl.querySelector(`#color-primary-${post.id}`);
      const colorSecondary = cardEl.querySelector(`#color-secondary-${post.id}`);
      const colorBgStart = cardEl.querySelector(`#color-bg-start-${post.id}`);
      const colorBgEnd = cardEl.querySelector(`#color-bg-end-${post.id}`);
      
      const sliderHeadlineSize = cardEl.querySelector(`#slider-headline-size-${post.id}`);
      const sliderSubtextSize = cardEl.querySelector(`#slider-subtext-size-${post.id}`);
      const labelHeadlineSize = cardEl.querySelector(`#val-headline-size-${post.id}`);
      const labelSubtextSize = cardEl.querySelector(`#val-subtext-size-${post.id}`);

      const triggerRedrawAndSave = (isKeystroke = false) => {
        // Update local object memory
        post.layoutFamily = layoutSelect.value;
        post.colorPalette = paletteSelect.value;
        post.avatarStyleIdx = parseInt(avatarSelect.value);
        post.headlineFontSize = parseInt(sliderHeadlineSize.value);
        post.subtextFontSize = parseInt(sliderSubtextSize.value);
        if (!post.postContent) post.postContent = {};
        post.postContent.imageHeadline = headlineInput.value;
        post.postContent.imageSubtext = subtextInput.value;
        post.postContent.badgeText = badgeInput.value;
        post.postContent.ctaText = ctaInput.value;
        post.badgeText = badgeInput.value;
        post.ctaText = ctaInput.value;

        // Custom colors mapping
        if (paletteSelect.value === 'Custom') {
          post.customColors = {
            textColor: colorText.value,
            primary: colorPrimary.value,
            secondary: colorSecondary.value,
            gradStart: colorBgStart.value,
            gradEnd: colorBgEnd.value
          };
        }

        // Re-draw canvas
        drawCreative(canvas, activeEntry.category, headlineInput.value, subtextInput.value, post.id, activeEntry.date, post.layout || post);

        // Save layout modifications to server (only on select change or text input blur)
        if (!isKeystroke) {
          saveDesignEdit(state.activeDate, post.id, {
            layoutFamily: layoutSelect.value,
            colorPalette: paletteSelect.value,
            avatarStyleIdx: parseInt(avatarSelect.value),
            imageHeadline: headlineInput.value,
            imageSubtext: subtextInput.value,
            badgeText: badgeInput.value,
            ctaText: ctaInput.value,
            headlineFontSize: parseInt(sliderHeadlineSize.value),
            subtextFontSize: parseInt(sliderSubtextSize.value),
            customColors: paletteSelect.value === 'Custom' ? {
              textColor: colorText.value,
              primary: colorPrimary.value,
              secondary: colorSecondary.value,
              gradStart: colorBgStart.value,
              gradEnd: colorBgEnd.value
            } : undefined
          });
        }
      };

      layoutSelect.addEventListener('change', () => triggerRedrawAndSave(false));
      
      paletteSelect.addEventListener('change', () => {
        const val = paletteSelect.value;
        if (val !== 'Custom') {
          const matched = PALETTES.find(p => p.name === val) || PALETTES[0];
          
          // Update pickers
          colorText.value = matched.textColor || (matched.isLight ? '#18181b' : '#ffffff');
          colorPrimary.value = matched.primary;
          colorSecondary.value = matched.secondary || '#cbd5e1';
          colorBgStart.value = matched.gradStart;
          colorBgEnd.value = matched.gradEnd;
          
          // Update labels
          cardEl.querySelector(`#color-text-${post.id}`).closest('.color-picker-wrapper').querySelector('.color-hex-label').textContent = colorText.value;
          cardEl.querySelector(`#color-primary-${post.id}`).closest('.color-picker-wrapper').querySelector('.color-hex-label').textContent = colorPrimary.value;
          cardEl.querySelector(`#color-secondary-${post.id}`).closest('.color-picker-wrapper').querySelector('.color-hex-label').textContent = colorSecondary.value;
          cardEl.querySelector(`#color-bg-start-${post.id}`).closest('.color-picker-wrapper').querySelector('.color-hex-label').textContent = colorBgStart.value;
          cardEl.querySelector(`#color-bg-end-${post.id}`).closest('.color-picker-wrapper').querySelector('.color-hex-label').textContent = colorBgEnd.value;
        }
        triggerRedrawAndSave(false);
      });

      avatarSelect.addEventListener('change', () => triggerRedrawAndSave(false));
      
      badgeInput.addEventListener('input', () => triggerRedrawAndSave(true));
      badgeInput.addEventListener('change', () => triggerRedrawAndSave(false));
      
      ctaInput.addEventListener('input', () => triggerRedrawAndSave(true));
      ctaInput.addEventListener('change', () => triggerRedrawAndSave(false));

      headlineInput.addEventListener('input', () => triggerRedrawAndSave(true));
      headlineInput.addEventListener('change', () => triggerRedrawAndSave(false));
      
      subtextInput.addEventListener('input', () => triggerRedrawAndSave(true));
      subtextInput.addEventListener('change', () => triggerRedrawAndSave(false));

      // Font size sliders listeners
      sliderHeadlineSize.addEventListener('input', () => {
        labelHeadlineSize.textContent = `${sliderHeadlineSize.value}px`;
        triggerRedrawAndSave(true);
      });
      sliderHeadlineSize.addEventListener('change', () => triggerRedrawAndSave(false));

      sliderSubtextSize.addEventListener('input', () => {
        labelSubtextSize.textContent = `${sliderSubtextSize.value}px`;
        triggerRedrawAndSave(true);
      });
      sliderSubtextSize.addEventListener('change', () => triggerRedrawAndSave(false));

      // Color pickers listeners
      [colorText, colorPrimary, colorSecondary, colorBgStart, colorBgEnd].forEach(picker => {
        picker.addEventListener('input', (e) => {
          // Force dropdown palette selection to 'Custom' in the UI and state
          paletteSelect.value = 'Custom';
          
          // Update hex label next to color input
          const wrapper = e.target.closest('.color-picker-wrapper');
          if (wrapper) {
            const label = wrapper.querySelector('.color-hex-label');
            if (label) label.textContent = e.target.value;
          }
          triggerRedrawAndSave(true);
        });
        picker.addEventListener('change', () => {
          paletteSelect.value = 'Custom';
          triggerRedrawAndSave(false);
        });
      });
    }

    // Copy Content Button Listener
    cardEl.querySelector(`#btn-copy-${post.id}`).addEventListener('click', () => {
      navigator.clipboard.writeText(textarea.value);
      showToast('Copied content to clipboard!', 'success');
    });

    // Open in Canva Button Listener (Minimalist Export + Photo URL)
    const canvaBtn = cardEl.querySelector(`#btn-canva-${post.id}`);
    if (canvaBtn) {
      canvaBtn.addEventListener('click', () => {
        const headlineVal = (document.getElementById(`input-headline-${post.id}`) || {}).value || headlineText;
        const subtextVal = (document.getElementById(`input-subtext-${post.id}`) || {}).value || subtextText;
        const badgeVal = (document.getElementById(`input-badge-${post.id}`) || {}).value || badgeText;
        const ctaVal = (document.getElementById(`input-cta-${post.id}`) || {}).value || ctaText;
        
        // Construct selected photo / avatar URL for Canva template
        const originUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
        const photoUrl = state.settings.customAvatar ? state.settings.customAvatar : `${originUrl}/avatar_daily_${post.id}.jpg`;

        // Minimalist payload - NO huge post body text
        const payloadText = `[HEADLINE]\n${headlineVal}\n\n[SUBTEXT]\n${subtextVal}\n\n[TOP TAG]\n${badgeVal}\n\n[CTA BUTTON]\n${ctaVal}\n\n[SELECTED PHOTO LINK]\n${photoUrl}`;
        
        navigator.clipboard.writeText(payloadText);
        if (!state.settings.canvaTemplateUrl) {
          showToast('Copied minimalist text & photo URL to clipboard! Opening Canva...', 'info');
        } else {
          showToast('Copied minimalist text & photo URL! Opening your custom Canva template...', 'success');
        }
        
        const canvaTargetUrl = state.settings.canvaTemplateUrl || 'https://www.canva.com/';
        window.open(canvaTargetUrl, '_blank');
      });
    }

    // Open Photo Button Listener (Opens selected avatar/profile photo in dedicated tab to drag & drop into Canva)
    const photoBtn = cardEl.querySelector(`#btn-photo-${post.id}`);
    if (photoBtn) {
      photoBtn.addEventListener('click', () => {
        let photoSrc = '';
        if (state.settings.customAvatar) {
          photoSrc = state.settings.customAvatar;
        } else {
          const originUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
          photoSrc = `${originUrl}/avatar_daily_${post.id}.jpg`;
        }
        
        const win = window.open();
        if (win) {
          win.document.write(`<html><head><title>Selected Photo - Post ${post.id}</title></head><body style="background:#0f172a; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; color:#fff;">
            <h3 style="margin-bottom:12px;">📷 Your Selected Photo (Drag & Drop into Canva)</h3>
            <img src="${photoSrc}" style="max-width:80vw; max-height:75vh; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5);" />
            <p style="margin-top:16px; opacity:0.85; font-size:0.9rem;">Drag this image directly into your open Canva tab or right-click to copy image!</p>
          </body></html>`);
          showToast('Opened selected photo in a new tab! Drag & drop it directly into Canva.', 'success');
        }
      });
    }

    // Canva Graphic File Uploader Listener
    const canvaFileInput = cardEl.querySelector(`#input-canva-graphic-${post.id}`);
    if (canvaFileInput) {
      canvaFileInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          showToast('Attaching custom Canva graphic to this card...', 'info');
          const base64Data = await convertFileToBase64(e.target.files[0]);
          
          const localDb = getLocalDb();
          localDb.designs = localDb.designs || {};
          localDb.designs[`${state.activeDate}-post-${post.id}`] = localDb.designs[`${state.activeDate}-post-${post.id}`] || {};
          localDb.designs[`${state.activeDate}-post-${post.id}`].customCanvaGraphic = base64Data;
          saveLocalDb(localDb);
          
          post.customCanvaGraphic = base64Data;
          showToast('✨ Custom Canva graphic attached! It will publish with this post.', 'success');
          renderActiveDrafts();
        }
      });
    }

    // Remove Canva Graphic Listener
    const removeCanvaBtn = cardEl.querySelector(`#btn-remove-canva-${post.id}`);
    if (removeCanvaBtn) {
      removeCanvaBtn.addEventListener('click', () => {
        const localDb = getLocalDb();
        if (localDb.designs && localDb.designs[`${state.activeDate}-post-${post.id}`]) {
          delete localDb.designs[`${state.activeDate}-post-${post.id}`].customCanvaGraphic;
          saveLocalDb(localDb);
        }
        delete post.customCanvaGraphic;
        showToast('Removed custom Canva graphic. Reverted to default canvas preview.', 'info');
        renderActiveDrafts();
      });
    }

    // Avatar Overlay & Background Removal Checkbox Listeners
    const checkOverlayAvatar = cardEl.querySelector(`#check-overlay-avatar-${post.id}`);
    const checkBgRemove = cardEl.querySelector(`#check-bg-remove-${post.id}`);

    if (checkOverlayAvatar) {
      checkOverlayAvatar.addEventListener('change', (e) => {
        post.overlayAvatar = e.target.checked;
        saveCustomizerState(post.id, { overlayAvatar: e.target.checked });
        triggerRedrawAndSave(false);
      });
    }

    if (checkBgRemove) {
      checkBgRemove.addEventListener('change', (e) => {
        post.removeAvatarBg = e.target.checked;
        saveCustomizerState(post.id, { removeAvatarBg: e.target.checked });
        if (e.target.checked) {
          showToast('✨ Automatic background removal applied to avatar cutout!', 'success');
        } else {
          showToast('Restored standard avatar photo frame.', 'info');
        }
        triggerRedrawAndSave(false);
      });
    }

    // Post to Google Flow button listener
    if (!isDayPosted) {
      const postBtn = cardEl.querySelector(`#btn-post-${post.id}`);
      if (postBtn) {
        postBtn.addEventListener('click', (e) => {
          postToGoogleFlow(post.id, e.currentTarget);
        });
      }
    }

    // Re-publish button (on the already-selected/published post)
    const republishBtn = cardEl.querySelector(`#btn-republish-${post.id}`);
    if (republishBtn) {
      republishBtn.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Resetting...';
        try {
          // Reset locally in localStorage
          const localDb = getLocalDb();
          if (localDb.posted) {
            delete localDb.posted[state.activeDate];
            saveLocalDb(localDb);
          }
          showToast('Day reset. Re-publishing...', 'info');
          await loadHistory();
          // After reload, immediately trigger publish for this post
          await postToGoogleFlow(post.id, btn);
        } catch (err) {
          showToast(`Re-publish failed: ${err.message}`, 'error');
          btn.disabled = false;
        }
      });
    }

    // "Select This Instead" button (on non-selected posts when day is already posted)
    const reselectBtn = cardEl.querySelector(`#btn-reselect-${post.id}`);
    if (reselectBtn) {
      reselectBtn.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Switching...';
        try {
          // Reset locally in localStorage
          const localDb = getLocalDb();
          if (localDb.posted) {
            delete localDb.posted[state.activeDate];
            saveLocalDb(localDb);
          }
          showToast('Switched! Publishing this post...', 'info');
          await loadHistory();
          await postToGoogleFlow(post.id, btn);
        } catch (err) {
          showToast(`Failed: ${err.message}`, 'error');
          btn.disabled = false;
        }
      });
    }
  });
}

// Render Empty/No Data State
function renderEmptyState() {
  el.activeDateTitle.textContent = 'Welcome to LinkedIn Assistant';
  el.activeDateSub.textContent = 'Let\'s get started';
  el.activeCategoryPill.className = 'category-indicator hidden';
  el.draftsContainer.innerHTML = `
    <div class="loading-state">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">✍️</div>
      <h3>No LinkedIn Drafts Generated Yet</h3>
      <p style="max-width: 400px; text-align: center; margin-top: 6px;">Configure your settings with a Gemini API key first, then click "Regenerate Today's Drafts" in the sidebar to fetch today's trending posts.</p>
    </div>
  `;
}

// Select a different date from the history sidebar
function selectDate(date) {
  state.activeDate = date;
  
  // Update active items in sidebar UI
  document.querySelectorAll('.date-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.getElementById(`date-item-${date}`);
  if (activeItem) activeItem.classList.add('active');

  renderActiveDrafts();
}

// Helper to update headers based on daily calculation
function updateHeaderBadge() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  // Calculate category rotation
  const baseline = new Date('2026-01-01T00:00:00Z');
  const current = new Date(`${todayStr}T00:00:00Z`);
  const diffTime = Math.abs(current - baseline);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const category = diffDays % 2 === 0 ? 'Marketing Day' : 'AI Trend Day';
  
  el.topicBadgeText.textContent = `Today: ${category}`;
  
  // Set badge pulse dot color
  const pulseDot = el.topicBadge.querySelector('.pulse-dot');
  if (category.includes('Marketing')) {
    pulseDot.style.backgroundColor = 'var(--color-marketing)';
    pulseDot.style.boxShadow = '0 0 8px var(--color-marketing)';
  } else {
    pulseDot.style.backgroundColor = 'var(--color-ai)';
    pulseDot.style.boxShadow = '0 0 8px var(--color-ai)';
  }
}

// Change background glow sizes and colors dynamically depending on the active post topic
function applyTopicTheme(category) {
  if (category === 'marketing') {
    el.glow1.style.background = 'var(--grad-marketing)';
    el.glow1.style.opacity = '0.12';
    el.glow2.style.background = 'var(--grad-ai)';
    el.glow2.style.opacity = '0.05';
  } else {
    el.glow1.style.background = 'var(--grad-ai)';
    el.glow1.style.opacity = '0.12';
    el.glow2.style.background = 'var(--grad-marketing)';
    el.glow2.style.opacity = '0.05';
  }
}

// ================= DYNAMIC CANVAS RENDER PIPELINE =================

// Draw custom creative card matching user template design structure
// Generate a unique day counter since 2026-01-01 for layout rotation
function getDayIndex(dateStr) {
  if (!dateStr) return 0;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 0;
  const d = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
  const baseline = new Date(Date.UTC(2026, 0, 1));
  const diffTime = Math.abs(d - baseline);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Draw custom creative card matching user template design structure
// Helper to compile dynamic design configurations for the 15 Layout Families
function buildLayoutFromFamily(layoutFamily, palette, headline, subtext, category, postId) {
  const layout = {
    background: {
      colors: [palette.gradStart, palette.gradEnd],
      isSunburst: false,
      rayColor: palette.rayColor,
      drawGrid: false,
      gridColor: 'rgba(255, 255, 255, 0.03)',
      gridSize: 40,
      glows: []
    },
    shapes: [],
    avatar: {
      type: 'rect',
      x: 540,
      y: 540,
      w: 360,
      h: 360,
      glowColor: palette.primary + '33',
      glowBlur: 30,
      strokeColor: palette.primary,
      lineWidth: 3,
      tilt: 0
    },
    text: {
      badge: { text: category === 'marketing' ? 'MARKETING TREND' : 'AI TECH TREND', bgColor: palette.badgeBg, x: 80, y: 120, w: 220, h: 36 },
      headline: { fontSize: 40, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 190, w: 900 },
      subtext: { fontSize: 22, color: '#cbd5e1', align: 'left', x: 80, y: 520, w: 900 },
      cta: { text: 'READ POST', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 780, w: 260, h: 55 }
    },
    floatingElements: []
  };

  // Add LinkedIn icon by default floating around
  layout.floatingElements.push({ type: 'linkedin', x: 980, y: 80, size: 36 });

  const fam = (layoutFamily || '').toLowerCase().trim();

  switch (fam) {
    case 'split-left':
      if (palette.isLight) {
        layout.background.drawGrid = false;
        layout.shapes.push({ type: 'circle', x: 280, y: 540, r: 400, color: '#18181b' });
        layout.shapes.push({ type: 'circle', x: 100, y: 980, r: 250, color: palette.gradStart });
        layout.avatar = {
          type: 'rect',
          x: 280,
          y: 540,
          w: 420,
          h: 780,
          glowColor: 'transparent',
          strokeColor: 'transparent',
          lineWidth: 0
        };
        layout.text.badge = { text: layout.text.badge.text, bgColor: '#18181b', x: 550, y: 180, w: 220, h: 36 };
        layout.text.headline = { fontSize: 42, color: '#18181b', highlightColor: palette.primary, align: 'left', x: 550, y: 250, w: 450 };
        layout.text.subtext = { fontSize: 22, color: '#374151', align: 'left', x: 550, y: 560, w: 450 };
        layout.text.cta = { text: 'READ FULL POST', bgColor: '#18181b', glowColor: 'transparent', glowBlur: 0, x: 550, y: 800, w: 260, h: 55 };
      } else {
        layout.background.drawGrid = true;
        layout.background.glows.push({ x: 280, y: 540, r: 500, color: palette.textGlow });
        layout.avatar = {
          type: 'rect',
          x: 280,
          y: 540,
          w: 420,
          h: 780,
          glowColor: palette.primary + '40',
          glowBlur: 40,
          strokeColor: palette.primary,
          lineWidth: 4
        };
        layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 550, y: 180, w: 220, h: 36 };
        layout.text.headline = { fontSize: 42, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 550, y: 250, w: 450 };
        layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 550, y: 560, w: 450 };
        layout.text.cta = { text: 'READ FULL POST', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 550, y: 800, w: 260, h: 55 };
      }
      break;

    case 'split-right':
      if (palette.isLight) {
        layout.shapes.push({ type: 'rect', x: 800, y: 540, w: 420, h: 780, color: palette.secondary || '#f97316', borderRadius: 24, tilt: -0.08 });
        layout.shapes.push({ type: 'rect', x: 920, y: 800, w: 180, h: 180, color: palette.primary || '#0d9488', borderRadius: 24 });
        layout.avatar = {
          type: 'rect',
          x: 800,
          y: 540,
          w: 380,
          h: 700,
          glowColor: 'transparent',
          strokeColor: 'transparent',
          lineWidth: 0
        };
        layout.text.badge = { text: layout.text.badge.text, bgColor: palette.primary || '#0d9488', x: 80, y: 180, w: 220, h: 36 };
        layout.text.headline = { fontSize: 42, color: '#1f2937', highlightColor: palette.primary, align: 'left', x: 80, y: 250, w: 450 };
        layout.text.subtext = { fontSize: 22, color: '#4b5563', align: 'left', x: 80, y: 560, w: 450 };
        layout.text.cta = { text: 'READ FULL POST', bgColor: palette.primary || '#0d9488', glowColor: 'transparent', glowBlur: 0, x: 80, y: 800, w: 260, h: 55 };
      } else {
        layout.background.drawGrid = true;
        layout.background.glows.push({ x: 800, y: 540, r: 500, color: palette.textGlow });
        layout.avatar = {
          type: 'rect',
          x: 800,
          y: 540,
          w: 420,
          h: 780,
          glowColor: palette.primary + '40',
          glowBlur: 40,
          strokeColor: palette.primary,
          lineWidth: 4
        };
        layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 80, y: 180, w: 220, h: 36 };
        layout.text.headline = { fontSize: 42, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 250, w: 450 };
        layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 80, y: 560, w: 450 };
        layout.text.cta = { text: 'READ FULL POST', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 800, w: 260, h: 55 };
      }
      break;

    case 'hero-center':
      layout.background.isSunburst = true;
      layout.background.glows.push({ x: 540, y: 540, r: 600, color: palette.textGlow });
      layout.shapes.push({ type: 'circle', x: 540, y: 780, r: 200, color: 'rgba(255, 255, 255, 0.02)', strokeColor: 'rgba(255, 255, 255, 0.05)', lineWidth: 2 });
      layout.avatar = {
        type: 'circle',
        x: 540,
        y: 780,
        w: 320,
        h: 320,
        glowColor: palette.primary + '40',
        glowBlur: 35,
        strokeColor: palette.primary,
        lineWidth: 4
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 420, y: 120, w: 240, h: 36 };
      layout.text.headline = { fontSize: 44, color: '#ffffff', highlightColor: palette.primary, align: 'center', x: 90, y: 200, w: 900 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'center', x: 140, y: 460, w: 800 };
      layout.text.cta = { text: 'READ POST', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 410, y: 975, w: 260, h: 55 };
      break;

    case 'magazine-cover':
      layout.shapes.push({
        type: 'rect',
        x: 540,
        y: 540,
        w: 1020,
        h: 1020,
        color: 'transparent',
        strokeColor: palette.primary,
        lineWidth: 4,
        borderRadius: 0
      });
      layout.avatar = {
        type: 'rect',
        x: 690,
        y: 560,
        w: 600,
        h: 880,
        glowColor: 'transparent',
        strokeColor: 'rgba(255,255,255,0.15)',
        lineWidth: 2
      };
      layout.background.glows.push({ x: 740, y: 540, r: 600, color: palette.textGlow });
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 80, y: 120, w: 220, h: 36 };
      layout.text.headline = { fontSize: 50, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 190, w: 560 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 80, y: 580, w: 500 };
      layout.text.cta = { text: 'READ COVER STORY', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 840, w: 280, h: 55 };
      break;

    case 'quote-card':
      layout.shapes.push({ type: 'text', text: '“', x: 80, y: 350, font: 'bold 360px Georgia', color: 'rgba(255, 255, 255, 0.08)' });
      layout.avatar = {
        type: 'rect',
        x: 820,
        y: 540,
        w: 480,
        h: 900,
        glowColor: 'transparent',
        strokeColor: 'transparent',
        lineWidth: 0
      };
      layout.text.badge = { text: 'INSIGHT OF THE DAY', bgColor: palette.badgeBg, x: 80, y: 100, w: 240, h: 36 };
      layout.text.headline = { fontSize: 38, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 240, w: 650 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 80, y: 580, w: 650 };
      layout.text.cta = { text: 'VIEW FULL POST', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 820, w: 240, h: 55 };
      break;

    case 'podcast-layout':
      layout.shapes.push({ type: 'line', x1: 100, y1: 850, x2: 980, y2: 850, strokeColor: 'rgba(255, 255, 255, 0.15)', lineWidth: 3 });
      layout.shapes.push({ type: 'line', x1: 100, y1: 850, x2: 480, y2: 850, strokeColor: palette.primary, lineWidth: 5 });
      layout.shapes.push({ type: 'circle', x: 480, y: 850, r: 10, color: palette.primary, strokeColor: '#ffffff', lineWidth: 2 });
      layout.background.glows.push({ x: 280, y: 400, r: 400, color: palette.textGlow });
      layout.avatar = {
        type: 'rect',
        x: 280,
        y: 400,
        w: 360,
        h: 360,
        glowColor: palette.primary + '30',
        glowBlur: 30,
        strokeColor: palette.primary,
        lineWidth: 4
      };
      layout.text.badge = { text: 'NOW PLAYING • PODCAST', bgColor: palette.badgeBg, x: 500, y: 220, w: 260, h: 36 };
      layout.text.headline = { fontSize: 38, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 500, y: 280, w: 480 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 500, y: 520, w: 480 };
      layout.text.cta = { text: 'LISTEN TO EPISODE', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 500, y: 700, w: 260, h: 55 };
      break;

    case 'presentation-slide':
      layout.shapes.push({ type: 'rect', x: 540, y: 60, w: 1080, h: 120, color: 'rgba(0,0,0,0.35)', strokeColor: 'rgba(255,255,255,0.05)', borderRadius: 0 });
      layout.avatar = {
        type: 'rect',
        x: 900,
        y: 350,
        w: 240,
        h: 340,
        glowColor: 'transparent',
        strokeColor: 'rgba(255,255,255,0.1)',
        lineWidth: 2
      };
      layout.background.glows.push({ x: 900, y: 350, r: 400, color: palette.textGlow });
      layout.text.badge = { text: 'SLIDE DECK INSIGHT', bgColor: palette.badgeBg, x: 80, y: 42, w: 240, h: 36 };
      layout.text.headline = { fontSize: 42, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 220, w: 680 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 80, y: 460, w: 680 };
      layout.text.cta = { text: 'ACCESS FULL DECK', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 880, w: 280, h: 55 };
      break;

    case 'news-card':
      layout.shapes.push({ type: 'rect', x: 540, y: 960, w: 1080, h: 80, color: palette.primary, strokeColor: 'transparent', borderRadius: 0 });
      layout.shapes.push({ type: 'rect', x: 100, y: 960, w: 80, h: 40, color: '#ef4444', strokeColor: '#ffffff', borderRadius: 4 });
      layout.avatar = {
        type: 'rect',
        x: 840,
        y: 480,
        w: 400,
        h: 600,
        glowColor: palette.primary + '20',
        strokeColor: 'transparent',
        lineWidth: 0
      };
      layout.text.badge = { text: 'LIVE NEWS EXCLUSIVE', bgColor: palette.badgeBg, x: 80, y: 140, w: 260, h: 36 };
      layout.text.headline = { fontSize: 44, color: '#ffffff', highlightColor: '#ffffff', align: 'left', x: 80, y: 210, w: 520 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 80, y: 560, w: 520 };
      layout.text.cta = { text: 'GET THE REPORT', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 800, w: 260, h: 55 };
      break;

    case 'editorial-cover':
      layout.background.drawGrid = true;
      layout.shapes.push({ type: 'rect', x: 550, y: 430, w: 800, h: 500, color: 'transparent', strokeColor: 'rgba(255, 255, 255, 0.1)', lineWidth: 1, borderRadius: 24 });
      layout.shapes.push({
        type: 'rect',
        x: 540,
        y: 800,
        w: 920,
        h: 340,
        color: 'rgba(15, 23, 42, 0.85)',
        strokeColor: palette.primary + '66',
        borderRadius: 24
      });
      layout.avatar = {
        type: 'rect',
        x: 540,
        y: 420,
        w: 780,
        h: 480,
        glowColor: palette.primary + '15',
        strokeColor: palette.primary,
        lineWidth: 2
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 120, y: 670, w: 220, h: 36 };
      layout.text.headline = { fontSize: 38, color: '#ffffff', highlightColor: palette.primary, align: 'center', x: 100, y: 740, w: 880 };
      layout.text.subtext = { fontSize: 20, color: '#94a3b8', align: 'center', x: 100, y: 910, w: 880 };
      layout.text.cta = { text: 'READ ARTICLE', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 760, y: 660, w: 200, h: 50 };
      break;

    case 'phone-mockup':
      layout.avatar = {
        type: 'phone',
        x: 800,
        y: 540,
        w: 420,
        h: 840,
        glowColor: palette.primary + '33',
        glowBlur: 40,
        strokeColor: 'transparent',
        lineWidth: 0
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 80, y: 180, w: 220, h: 36 };
      layout.text.headline = { fontSize: 42, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 250, w: 460 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 80, y: 560, w: 460 };
      layout.text.cta = { text: 'TRY WEB APP', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 800, w: 260, h: 55 };
      break;

    case 'floating-cards':
      layout.shapes.push({ type: 'rect', x: 340, y: 540, w: 500, h: 800, color: 'rgba(255, 255, 255, 0.04)', strokeColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 24 });
      layout.shapes.push({ type: 'rect', x: 800, y: 540, w: 420, h: 700, color: 'rgba(255, 255, 255, 0.03)', strokeColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 24 });
      layout.avatar = {
        type: 'rect',
        x: 800,
        y: 540,
        w: 380,
        h: 640,
        glowColor: palette.primary + '20',
        strokeColor: palette.primary,
        lineWidth: 2
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 120, y: 180, w: 220, h: 36 };
      layout.text.headline = { fontSize: 38, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 120, y: 250, w: 400 };
      layout.text.subtext = { fontSize: 20, color: '#cbd5e1', align: 'left', x: 120, y: 550, w: 400 };
      layout.text.cta = { text: 'LEARN MORE', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 120, y: 780, w: 240, h: 55 };
      break;

    case 'layered-depth':
      layout.background.drawGrid = true;
      layout.shapes.push({ type: 'rect', x: 540, y: 540, w: 980, h: 980, color: 'transparent', strokeColor: 'rgba(255, 255, 255, 0.08)', lineWidth: 3, borderRadius: 24 });
      layout.avatar = {
        type: 'rect',
        x: 540,
        y: 540,
        w: 580,
        h: 580,
        glowColor: palette.primary + '33',
        glowBlur: 40,
        strokeColor: palette.primary,
        lineWidth: 4
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 100, y: 90, w: 220, h: 36 };
      layout.text.headline = { fontSize: 44, color: '#ffffff', highlightColor: palette.primary, align: 'center', x: 100, y: 160, w: 880 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'center', x: 100, y: 870, w: 880 };
      layout.text.cta = { text: 'VIEW FULL POST', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 410, y: 975, w: 260, h: 55 };
      break;

    case 'diagonal-layout':
      layout.shapes.push({ type: 'line', x1: 0, y1: 850, x2: 1080, y2: 450, strokeColor: palette.primary, lineWidth: 6 });
      layout.shapes.push({ type: 'line', x1: 0, y1: 830, x2: 1080, y2: 430, strokeColor: palette.secondary || '#ffffff', lineWidth: 2 });
      layout.avatar = {
        type: 'rect',
        x: 820,
        y: 720,
        w: 360,
        h: 460,
        glowColor: palette.primary + '25',
        glowBlur: 30,
        strokeColor: palette.primary,
        lineWidth: 3,
        tilt: 0.08
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 80, y: 120, w: 220, h: 36 };
      layout.text.headline = { fontSize: 42, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 190, w: 680 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 80, y: 460, w: 520 };
      layout.text.cta = { text: 'GET STARTED', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 780, w: 260, h: 55 };
      break;

    case 'asymmetrical-grid':
      layout.shapes.push({ type: 'line', x1: 540, y1: 0, x2: 540, y2: 1080, strokeColor: 'rgba(255,255,255,0.05)', lineWidth: 1 });
      layout.shapes.push({ type: 'line', x1: 0, y1: 540, x2: 1080, y2: 540, strokeColor: 'rgba(255,255,255,0.05)', lineWidth: 1 });
      layout.avatar = {
        type: 'rect',
        x: 300,
        y: 700,
        w: 420,
        h: 560,
        glowColor: palette.primary + '25',
        glowBlur: 30,
        strokeColor: palette.primary,
        lineWidth: 3
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 570, y: 160, w: 220, h: 36 };
      layout.text.headline = { fontSize: 40, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 570, y: 230, w: 450 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'left', x: 570, y: 560, w: 450 };
      layout.text.cta = { text: 'READ STORY', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 570, y: 820, w: 260, h: 55 };
      break;

    case 'modern-minimal':
      layout.shapes.push({ type: 'rect', x: 540, y: 540, w: 1000, h: 1000, color: 'transparent', strokeColor: 'rgba(255,255,255,0.05)', lineWidth: 1, borderRadius: 0 });
      layout.avatar = {
        type: 'circle',
        x: 920,
        y: 920,
        w: 120,
        h: 120,
        glowColor: 'transparent',
        strokeColor: 'rgba(255,255,255,0.2)',
        lineWidth: 2
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: '#18181b', x: 440, y: 180, w: 200, h: 36 };
      layout.text.headline = { fontSize: 42, color: '#ffffff', highlightColor: palette.primary, align: 'center', x: 140, y: 260, w: 800 };
      layout.text.subtext = { fontSize: 22, color: '#cbd5e1', align: 'center', x: 190, y: 580, w: 700 };
      layout.text.cta = { text: 'DETAILS', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 410, y: 800, w: 260, h: 55 };
      break;

    case 'glassmorphism-card':
      // Back light bursts
      layout.background.glows.push({ x: 200, y: 200, r: 400, color: palette.primary + '33' });
      layout.background.glows.push({ x: 880, y: 880, r: 450, color: palette.secondary + '26' });
      // Organic retro shapes behind the glass card
      layout.shapes.push({ type: 'circle', x: 250, y: 750, r: 180, color: palette.primary + '15' });
      layout.shapes.push({ type: 'rect', x: 800, y: 300, w: 240, h: 240, color: palette.secondary + '12', borderRadius: 40, tilt: 0.15 });
      // Glass card overlay in center
      layout.shapes.push({
        type: 'rect',
        x: 540,
        y: 540,
        w: 920,
        h: 920,
        color: 'rgba(15, 23, 42, 0.45)',
        strokeColor: 'rgba(255, 255, 255, 0.12)',
        lineWidth: 2,
        borderRadius: 32
      });
      // Smart subtle avatar placement
      layout.avatar = {
        type: 'rect',
        x: 770,
        y: 690,
        w: 360,
        h: 520,
        glowColor: palette.primary + '15',
        glowBlur: 25,
        strokeColor: 'rgba(255, 255, 255, 0.1)',
        lineWidth: 1
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.primary, x: 140, y: 150, w: 240, h: 36 };
      layout.text.headline = { fontSize: 44, color: '#ffffff', highlightColor: palette.secondary, align: 'left', x: 140, y: 220, w: 500 };
      layout.text.subtext = { fontSize: 21, color: '#cbd5e1', align: 'left', x: 140, y: 580, w: 460 };
      layout.text.cta = { text: 'GET THE PLAYBOOK', bgColor: 'rgba(255, 255, 255, 0.08)', strokeColor: 'rgba(255, 255, 255, 0.2)', glowColor: 'transparent', glowBlur: 0, x: 140, y: 840, w: 280, h: 55 };
      break;

    case 'neon-border':
      layout.background.drawGrid = true;
      layout.background.gridColor = 'rgba(255, 255, 255, 0.02)';
      // Dual layer outer neon border frame
      layout.shapes.push({
        type: 'rect',
        x: 540,
        y: 540,
        w: 1000,
        h: 1000,
        color: 'transparent',
        strokeColor: palette.primary + '20',
        lineWidth: 8,
        borderRadius: 16
      });
      layout.shapes.push({
        type: 'rect',
        x: 540,
        y: 540,
        w: 994,
        h: 994,
        color: 'transparent',
        strokeColor: palette.primary,
        lineWidth: 2,
        borderRadius: 14
      });
      // Cyber neon accents
      layout.shapes.push({ type: 'rect', x: 80, y: 80, w: 20, h: 2, color: palette.secondary });
      layout.shapes.push({ type: 'rect', x: 80, y: 80, w: 2, h: 20, color: palette.secondary });
      layout.shapes.push({ type: 'rect', x: 1000, y: 1000, w: 20, h: 2, color: palette.secondary });
      layout.shapes.push({ type: 'rect', x: 1000, y: 1000, w: 2, h: 20, color: palette.secondary });
      
      layout.avatar = {
        type: 'rect',
        x: 820,
        y: 540,
        w: 400,
        h: 740,
        glowColor: palette.primary + '50',
        glowBlur: 45,
        strokeColor: palette.primary,
        lineWidth: 3
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 100, y: 160, w: 240, h: 36 };
      layout.text.headline = { fontSize: 40, color: '#ffffff', highlightColor: palette.secondary, align: 'left', x: 100, y: 230, w: 480 };
      layout.text.subtext = { fontSize: 21, color: '#94a3b8', align: 'left', x: 100, y: 550, w: 480 };
      layout.text.cta = { text: 'EXPLORE NEXT', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 25, x: 100, y: 800, w: 260, h: 55 };
      break;

    case 'bold-typographic':
      layout.background.colors = [palette.gradEnd, '#000000'];
      // Swiss design cross hair
      layout.shapes.push({ type: 'line', x1: 60, y1: 540, x2: 1020, y2: 540, strokeColor: 'rgba(255, 255, 255, 0.05)', lineWidth: 1 });
      layout.shapes.push({ type: 'line', x1: 540, y1: 60, x2: 540, y2: 1020, strokeColor: 'rgba(255, 255, 255, 0.05)', lineWidth: 1 });
      
      // Giant typographic layout where text rules 60% of vertical
      layout.avatar = {
        type: 'circle',
        x: 820,
        y: 780,
        w: 280,
        h: 280,
        glowColor: palette.primary + '20',
        glowBlur: 20,
        strokeColor: palette.primary,
        lineWidth: 2
      };
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 80, y: 100, w: 220, h: 36 };
      layout.text.headline = { fontSize: 52, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 170, w: 920 };
      layout.text.subtext = { fontSize: 24, color: '#94a3b8', align: 'left', x: 80, y: 590, w: 600 };
      layout.text.cta = { text: 'READ STORY', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 15, x: 80, y: 840, w: 240, h: 55 };
      break;

    case 'infographic-side':
      layout.background.drawGrid = true;
      layout.background.gridSize = 60;
      layout.background.gridColor = 'rgba(255,255,255,0.015)';
      // Left border line
      layout.shapes.push({ type: 'line', x1: 420, y1: 80, x2: 420, y2: 1000, strokeColor: 'rgba(255, 255, 255, 0.08)', lineWidth: 2 });
      
      // Sidebar avatar
      layout.avatar = {
        type: 'rect',
        x: 230,
        y: 540,
        w: 320,
        h: 580,
        glowColor: palette.primary + '20',
        glowBlur: 25,
        strokeColor: palette.primary,
        lineWidth: 2
      };
      
      // Right sidebar structured info cards
      layout.shapes.push({ type: 'rect', x: 740, y: 620, w: 560, h: 140, color: 'rgba(255, 255, 255, 0.02)', strokeColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12 });
      layout.shapes.push({ type: 'rect', x: 740, y: 790, w: 560, h: 140, color: 'rgba(255, 255, 255, 0.02)', strokeColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12 });
      
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 480, y: 120, w: 240, h: 36 };
      layout.text.headline = { fontSize: 44, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 480, y: 190, w: 520 };
      layout.text.subtext = { fontSize: 20, color: '#cbd5e1', align: 'left', x: 480, y: 520, w: 520 };
      layout.text.cta = { text: 'TAKE PLAYBOOK', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 480, y: 940, w: 260, h: 55 };
      break;

    case 'cinematic-wide':
      // Cinematic dark borders on top and bottom (letterbox style)
      layout.shapes.push({ type: 'rect', x: 540, y: 40, w: 1080, h: 80, color: '#000000', borderRadius: 0 });
      layout.shapes.push({ type: 'rect', x: 540, y: 1040, w: 1080, h: 80, color: '#000000', borderRadius: 0 });
      // Accent lines
      layout.shapes.push({ type: 'line', x1: 0, y1: 80, x2: 1080, y2: 80, strokeColor: palette.primary + '50', lineWidth: 2 });
      layout.shapes.push({ type: 'line', x1: 0, y1: 1000, x2: 1080, y2: 1000, strokeColor: palette.primary + '50', lineWidth: 2 });
      
      layout.avatar = {
        type: 'rect',
        x: 800,
        y: 540,
        w: 480,
        h: 840,
        glowColor: palette.primary + '15',
        glowBlur: 30,
        strokeColor: 'transparent',
        lineWidth: 0
      };
      
      layout.text.badge = { text: layout.text.badge.text, bgColor: palette.badgeBg, x: 80, y: 140, w: 220, h: 36 };
      layout.text.headline = { fontSize: 44, color: '#ffffff', highlightColor: palette.primary, align: 'left', x: 80, y: 210, w: 460 };
      layout.text.subtext = { fontSize: 22, color: '#94a3b8', align: 'left', x: 80, y: 550, w: 460 };
      layout.text.cta = { text: 'WATCH BRIEF', bgColor: palette.primary, glowColor: palette.primary, glowBlur: 20, x: 80, y: 880, w: 260, h: 55 };
      break;
  }

  return layout;
}

// Pure JS client-side image background removal helper
function createCutoutAvatarCanvas(sourceImg, sensitivity = 45) {
  const c = document.createElement('canvas');
  c.width = sourceImg.naturalWidth || sourceImg.width || 400;
  c.height = sourceImg.naturalHeight || sourceImg.height || 400;
  const ctx = c.getContext('2d');
  ctx.drawImage(sourceImg, 0, 0, c.width, c.height);

  try {
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const data = imgData.data;

    // Sample background colors from top-left, top-right, and top-center corners
    const bgR = (data[0] + data[(c.width - 1) * 4] + data[Math.floor(c.width / 2) * 4]) / 3;
    const bgG = (data[1] + data[(c.width - 1) * 4 + 1] + data[Math.floor(c.width / 2) * 4 + 1]) / 3;
    const bgB = (data[2] + data[(c.width - 1) * 4 + 2] + data[Math.floor(c.width / 2) * 4 + 2]) / 3;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate Euclidean distance in RGB color space from background color
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

      if (dist < sensitivity) {
        data[i + 3] = 0; // Make pixel 100% transparent
      } else if (dist < sensitivity + 20) {
        // Feather alpha edge for smooth cutout blending
        data[i + 3] = Math.floor(((dist - sensitivity) / 20) * 255);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('[Cutout] Canvas ImageData access failed:', e.message);
  }
  return c;
}

// Draw custom creative card matching user template design structure
function drawCreative(canvas, category, headline, subtext, postId = 1, dateStr = '', customLayout = null) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;  // 1080
  const h = canvas.height; // 1080
  
  // Extract custom layout flags
  const overlayAvatar = customLayout ? (customLayout.overlayAvatar !== false) : true;
  const removeAvatarBg = customLayout ? !!customLayout.removeAvatarBg : false;

  // 0. IF CUSTOM CANVA GRAPHIC IS ATTACHED, DRAW CANVA GRAPHIC + OPTIONAL OVERLAY AVATAR & EXIT IMMEDIATELY!
  const customGraphic = (customLayout && customLayout.customCanvaGraphic) 
    ? customLayout.customCanvaGraphic 
    : (customLayout && customLayout.post && customLayout.post.customCanvaGraphic) 
      ? customLayout.post.customCanvaGraphic 
      : null;

  if (customGraphic) {
    const renderCustomWithAvatar = (cImg) => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(cImg, 0, 0, w, h);

      // Draw Avatar Photo Overlay on top of custom uploaded graphic if enabled!
      if (overlayAvatar) {
        let styleIdx = (postId - 1) % 5;
        if (customLayout && customLayout.avatarStyleIdx !== undefined) styleIdx = customLayout.avatarStyleIdx;
        let activeAvImg = avatarImg;
        if (state.settings.rotateOutfits !== false && optionAvatarsLoaded[styleIdx]) {
          activeAvImg = optionAvatars[styleIdx];
        }

        if (activeAvImg && (activeAvImg.complete || activeAvImg.naturalWidth > 0)) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetX = -10;
          ctx.shadowOffsetY = 15;

          const avW = 320;
          const avH = 460;
          const avX = w - avW - 50;
          const avY = h - avH - 30;

          if (removeAvatarBg) {
            // Cutout transparent avatar without background
            const cutoutCanvas = createCutoutAvatarCanvas(activeAvImg, 50);
            ctx.drawImage(cutoutCanvas, avX, avY, avW, avH);
          } else {
            // Draw clean rounded avatar frame
            ctx.beginPath();
            ctx.roundRect(avX, avY, avW, avH, 20);
            ctx.clip();
            ctx.drawImage(activeAvImg, avX, avY, avW, avH);
          }
          ctx.restore();
        }
      }
    };

    const cImg = new Image();
    cImg.onload = () => renderCustomWithAvatar(cImg);
    cImg.src = customGraphic;
    if (cImg.complete && cImg.naturalWidth > 0) {
      renderCustomWithAvatar(cImg);
    }
    return; // Stop! Do not draw background gradients or default layout shapes over the custom image!
  }

  // Calculate common visual variables used by both customLayout and fallback branches
  const dayIdx = getDayIndex(dateStr);
  const layoutIdx = (dayIdx + postId - 1) % 5;
  let styleIdx = (postId - 1) % 5; // Outfit style rotates by postId
  if (customLayout && customLayout.avatarStyleIdx !== undefined) {
    styleIdx = customLayout.avatarStyleIdx;
  }
  
  const paletteIdx = (dayIdx + postId - 1) % PALETTES.length;
  const palette = PALETTES[paletteIdx];
  
  const filters = [
    'contrast(1.1) brightness(1.02) saturate(1.1)', // Clean Natural
    'contrast(1.15) brightness(1.05) saturate(1.15)', // Vibrant
    'brightness(1.02) contrast(1.08) saturate(1.05)', // Soft Warm
    'hue-rotate(350deg) saturate(95%) contrast(1.1) brightness(1.02)', // Soft Rose
    'contrast(1.1) brightness(1.02) saturate(1.08)', // Neutral Tech
    'contrast(1.1) brightness(1.02) saturate(1.1)', // Clean Natural
    'contrast(1.15) brightness(1.05) saturate(1.15)', // Vibrant
    'brightness(1.02) contrast(1.08) saturate(1.05)', // Soft Warm
    'contrast(1.1) brightness(1.02) saturate(1.1)', // Clean Natural
    'contrast(1.15) brightness(1.05) saturate(1.15)', // Vibrant
    'brightness(1.02) contrast(1.08) saturate(1.05)', // Soft Warm
    'hue-rotate(350deg) saturate(95%) contrast(1.1) brightness(1.02)', // Soft Rose
    'contrast(1.1) brightness(1.02) saturate(1.08)', // Neutral Tech
    'contrast(1.1) brightness(1.02) saturate(1.1)', // Clean Natural
    'contrast(1.15) brightness(1.05) saturate(1.15)', // Vibrant
    'brightness(1.02) contrast(1.08) saturate(1.05)', // Soft Warm
    'hue-rotate(350deg) saturate(95%) contrast(1.1) brightness(1.02)', // Soft Rose
    'contrast(1.1) brightness(1.02) saturate(1.08)' // Neutral Tech
  ];
  const filter = filters[styleIdx] || 'none';
  
  let activeAvImg = avatarImg;
  if (state.settings.rotateOutfits !== false && optionAvatarsLoaded[styleIdx]) {
    activeAvImg = optionAvatars[styleIdx];
  }
  
  // Dynamic design layout mapping
  let activeLayout = null;
  if (customLayout) {
    if (customLayout.layoutFamily || customLayout.colorPalette || customLayout.postContent) {
      const colorPaletteName = customLayout.colorPalette || 'Electric Blue';
      let matchedPalette;
      if (colorPaletteName.toLowerCase() === 'custom') {
        const cc = customLayout.customColors || {};
        matchedPalette = {
          name: 'Custom',
          primary: cc.primary || '#3b82f6',
          secondary: cc.secondary || '#60a5fa',
          gradStart: cc.gradStart || '#0b1a3e',
          gradEnd: cc.gradEnd || '#020617',
          rayColor: 'rgba(255, 255, 255, 0.02)',
          textGlow: (cc.primary || '#3b82f6') + '26',
          badgeBg: cc.primary || '#1d4ed8',
          isLight: false
        };
      } else {
        matchedPalette = PALETTES.find(p => p.name.toLowerCase() === colorPaletteName.toLowerCase()) || 
                         PALETTES.find(p => colorPaletteName.toLowerCase().includes(p.name.toLowerCase())) ||
                         palette;
      }
      const resolvedBadge = (customLayout.postContent && (customLayout.postContent.badgeText || customLayout.postContent.badge)) || customLayout.badgeText || (category === 'marketing' ? 'MARKETING TREND' : 'AI TECH TREND');
      const resolvedCta = (customLayout.postContent && (customLayout.postContent.ctaText || customLayout.postContent.cta)) || customLayout.ctaText || 'READ FULL POST';
      activeLayout = buildLayoutFromFamily(customLayout.layoutFamily || 'split-left', matchedPalette, headline, subtext, category, postId);
      if (activeLayout.text && activeLayout.text.badge) {
        activeLayout.text.badge.text = resolvedBadge.toUpperCase();
      }
      if (activeLayout.text && activeLayout.text.cta) {
        activeLayout.text.cta.text = resolvedCta.toUpperCase();
      }
      if (colorPaletteName.toLowerCase() === 'custom') {
        if (activeLayout.text) {
          if (activeLayout.text.headline) {
            activeLayout.text.headline.color = matchedPalette.textColor;
          }
          if (activeLayout.text.subtext) {
            activeLayout.text.subtext.color = matchedPalette.secondary;
          }
        }
      }
      if (customLayout.headlineFontSize !== undefined) {
        if (activeLayout.text && activeLayout.text.headline) {
          activeLayout.text.headline.fontSize = parseInt(customLayout.headlineFontSize);
        }
      }
      if (customLayout.subtextFontSize !== undefined) {
        if (activeLayout.text && activeLayout.text.subtext) {
          activeLayout.text.subtext.fontSize = parseInt(customLayout.subtextFontSize);
        }
      }
    } else {
      activeLayout = customLayout;
    }
  }

  if (activeLayout) {
    try {
      console.log('[Canvas] Drawing custom dynamic layout:', activeLayout);
      // 1. Draw Background
      if (activeLayout.background) {
        ctx.save();
        const colors = activeLayout.background.colors || ['#080b16', '#020617'];
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, colors[0]);
        if (colors.length > 2) {
          grad.addColorStop(0.5, colors[1]);
          grad.addColorStop(1, colors[colors.length - 1]);
        } else {
          grad.addColorStop(1, colors[colors.length - 1]);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        
        // Sunburst rays
        if (activeLayout.background.isSunburst) {
          const cx = w / 2;
          const cy = h / 2;
          const numRays = 24;
          const radius = Math.max(w, h) * 1.5;
          ctx.translate(cx, cy);
          ctx.fillStyle = activeLayout.background.rayColor || 'rgba(255, 255, 255, 0.04)';
          for (let i = 0; i < numRays; i++) {
            const angleStart = (i * 2 * Math.PI) / numRays;
            const angleEnd = ((i + 0.5) * 2 * Math.PI) / numRays;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angleStart, angleEnd);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
          ctx.save();
        }
        
        // Radial glows/light bursts
        if (Array.isArray(activeLayout.background.glows)) {
          activeLayout.background.glows.forEach(glow => {
            ctx.save();
            const radGlow = ctx.createRadialGradient(glow.x, glow.y, 10, glow.x, glow.y, glow.r || w/2);
            radGlow.addColorStop(0, glow.color || 'rgba(0, 242, 254, 0.2)');
            radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = radGlow;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
          });
        } else {
          // Central radial glow highlight
          const textGlow = activeLayout.background.textGlow || 'rgba(0, 242, 254, 0.15)';
          const radialGlow = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w/2);
          radialGlow.addColorStop(0, textGlow);
          radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radialGlow;
          ctx.fillRect(0, 0, w, h);
        }
        
        // Draw blueprint grid lines on background if specified
        if (activeLayout.background.drawGrid) {
          ctx.save();
          ctx.strokeStyle = activeLayout.background.gridColor || 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          const gridSize = activeLayout.background.gridSize || 40;
          for (let xPos = 0; xPos < w; xPos += gridSize) {
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, h);
            ctx.stroke();
          }
          for (let yPos = 0; yPos < h; yPos += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(w, yPos);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
      }
      
      // 2. Draw Decorative Shapes
      if (Array.isArray(activeLayout.shapes)) {
        activeLayout.shapes.forEach(shape => {
          ctx.save();
          if (shape.tilt) {
            ctx.translate(shape.x, shape.y);
            ctx.rotate(shape.tilt);
            ctx.translate(-shape.x, -shape.y);
          }
          ctx.fillStyle = shape.color || 'rgba(255,255,255,0.05)';
          ctx.strokeStyle = shape.strokeColor || 'transparent';
          ctx.lineWidth = shape.lineWidth || 1;
          
          if (shape.glowColor) {
            ctx.shadowColor = shape.glowColor;
            ctx.shadowBlur = shape.glowBlur || 30;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
          
          if (shape.type === 'circle') {
            ctx.beginPath();
            ctx.arc(shape.x, shape.y, shape.r || 100, 0, Math.PI * 2);
            ctx.fill();
            if (shape.strokeColor && shape.strokeColor !== 'transparent') ctx.stroke();
          } else if (shape.type === 'rect') {
            ctx.beginPath();
            const rRadius = shape.borderRadius !== undefined ? shape.borderRadius : 24;
            ctx.roundRect(shape.x - shape.w/2, shape.y - shape.h/2, shape.w, shape.h, rRadius);
            ctx.fill();
            if (shape.strokeColor && shape.strokeColor !== 'transparent') ctx.stroke();
          } else if (shape.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
          } else if (shape.type === 'text') {
            ctx.font = shape.font || 'bold 120px Georgia';
            ctx.fillStyle = shape.color || 'rgba(255,255,255,0.1)';
            ctx.fillText(shape.text, shape.x, shape.y);
          }
          ctx.restore();
        });
      }
      
      // 3. Draw Avatar
      if (activeLayout.avatar) {
        const av = activeLayout.avatar;
        
        ctx.save();
        if (av.tilt) {
          ctx.translate(av.x, av.y);
          ctx.rotate(av.tilt);
          ctx.translate(-av.x, -av.y);
        }
        
        // Glow backdrop behind avatar
        if (av.glowColor) {
          ctx.save();
          ctx.shadowColor = av.glowColor;
          ctx.shadowBlur = av.glowBlur || 40;
          ctx.fillStyle = av.glowColor;
          ctx.beginPath();
          if (av.type === 'circle') {
            ctx.arc(av.x, av.y, av.w / 2, 0, Math.PI * 2);
          } else {
            ctx.roundRect(av.x - av.w/2, av.y - av.h/2, av.w, av.h, 24);
          }
          ctx.fill();
          ctx.restore();
        }
        
        // Draw the avatar
        let dynamicAvImg = activeAvImg;

        if (av.type === 'circle') {
          drawAvatarForCircle(ctx, av.x, av.y, av.w / 2, av.filter, styleIdx, dynamicAvImg);
        } else if (av.type === 'phone') {
          drawPhoneMockup(ctx, av.x - av.w/2, av.y - av.h/2, av.w, av.h, true, dynamicAvImg, av.filter, styleIdx, palette);
        } else {
          drawAvatarForCard(ctx, av.x - av.w/2, av.y - av.h/2, av.w, av.h, av.filter, styleIdx, dynamicAvImg);
        }
        
        // Neon stroke border outline on top
        if (av.strokeColor) {
          ctx.save();
          ctx.strokeStyle = av.strokeColor;
          ctx.lineWidth = av.lineWidth || 4;
          ctx.beginPath();
          if (av.type === 'circle') {
            ctx.arc(av.x, av.y, av.w / 2, 0, Math.PI * 2);
          } else if (av.type !== 'phone') {
            ctx.roundRect(av.x - av.w/2, av.y - av.h/2, av.w, av.h, 24);
          }
          ctx.stroke();
          ctx.restore();
        }
        
        ctx.restore();
      }
      
      // 4. Draw Texts (using explicit custom coordinates if provided, else sequential vertical flow layout)
      if (activeLayout.text) {
        const txt = activeLayout.text;
        
        // Default column positions if not explicitly overridden
        let tx = 60;
        let tw = 480;
        let align = 'left';
        
        if (activeLayout.avatar) {
          const ax = activeLayout.avatar.x;
          if (ax < 450) {
            tx = 530;
            tw = 490;
            align = 'left';
          } else if (ax > 630) {
            tx = 60;
            tw = 490;
            align = 'left';
          } else {
            tx = 90;
            tw = 900;
            align = 'center';
          }
        }
        
        // Override alignment if explicitly specified by layout JSON
        if (txt.headline && txt.headline.align) align = txt.headline.align;
        
        // Check if explicit coordinates exist for elements
        const hasExplicitHeadline = txt.headline && txt.headline.x !== undefined && txt.headline.y !== undefined;
        const hasExplicitSubtext = txt.subtext && txt.subtext.x !== undefined && txt.subtext.y !== undefined;
        const hasExplicitBadge = txt.badge && txt.badge.x !== undefined && txt.badge.y !== undefined;
        const hasExplicitCta = txt.cta && txt.cta.x !== undefined && txt.cta.y !== undefined;
        
        let currentY = 160; // Fallback starting Y
        
        // Badge
        if (txt.badge) {
          ctx.save();
          ctx.beginPath();
          const badgeW = txt.badge.w || 240;
          const badgeH = txt.badge.h || 36;
          const bx = hasExplicitBadge ? txt.badge.x : (align === 'center' ? tx + (tw - badgeW)/2 : tx);
          const by = hasExplicitBadge ? txt.badge.y : currentY;
          ctx.roundRect(bx, by, badgeW, badgeH, 8);
          
          if (txt.badge.glowColor) {
            ctx.shadowColor = txt.badge.glowColor;
            ctx.shadowBlur = txt.badge.glowBlur || 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
          
          ctx.fillStyle = txt.badge.bgColor || '#db2777';
          ctx.fill();
          ctx.restore();
          
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(txt.badge.text || (category === 'marketing' ? 'MARKETING TREND' : 'AI TECH TREND'), bx + badgeW/2, by + 23);
          ctx.restore();
          
          if (!hasExplicitBadge) {
            currentY += badgeH + 35; // increment with padding
          }
        }
        
        let headlineHeightDelta = 0;
        let ctaHeightDelta = 0;
        
        // Headline
        if (txt.headline) {
          ctx.save();
          ctx.fillStyle = txt.headline.color || (palette.isLight ? '#18181b' : '#ffffff');
          const fontSize = txt.headline.fontSize || 38;
          ctx.font = `800 ${fontSize}px Outfit`;
          const hlColor = txt.headline.highlightColor || palette.primary;
          
          const hx = hasExplicitHeadline ? txt.headline.x : tx;
          const hy = hasExplicitHeadline ? txt.headline.y : currentY;
          const hw = hasExplicitHeadline ? (txt.headline.w || tw) : tw;
          
          const endY = wrapTextAligned(ctx, headline.toUpperCase(), hx, hy, hw, fontSize + 10, align, true, hlColor);
          ctx.restore();
          
          if (hasExplicitHeadline && txt.subtext && hasExplicitSubtext) {
            const minGap = 20; // minimum gap between headline end and subtext start
            if (endY + minGap > txt.subtext.y) {
              headlineHeightDelta = (endY + minGap) - txt.subtext.y;
            }
          }
          
          if (!hasExplicitHeadline) {
            currentY = endY + 20; // padding
          }
        }
        
        // Dots separator (only draw in fallback or if not using explicit layout to avoid clutter)
        if (!hasExplicitHeadline && !hasExplicitSubtext) {
          ctx.save();
          ctx.fillStyle = palette.isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)';
          ctx.font = '22px Inter';
          ctx.textAlign = align;
          const linkX = align === 'center' ? tx + tw/2 : tx;
          ctx.fillText('•••••••••••••••••', linkX, currentY);
          ctx.restore();
          currentY += 35;
        }
        
        // Subtext
        if (txt.subtext) {
          ctx.save();
          ctx.fillStyle = txt.subtext.color || (palette.isLight ? '#374151' : '#cbd5e1');
          const fontSize = txt.subtext.fontSize || 20;
          ctx.font = `500 ${fontSize}px Inter`;
          const hlColor = txt.subtext.highlightColor || null;
          
          const sx = hasExplicitSubtext ? txt.subtext.x : tx;
          const sy = hasExplicitSubtext ? (txt.subtext.y + headlineHeightDelta) : currentY;
          const sw_val = hasExplicitSubtext ? (txt.subtext.w || tw) : tw;
          
          const endY = wrapTextAligned(ctx, subtext, sx, sy, sw_val, fontSize + 10, align, false, hlColor);
          ctx.restore();
          
          if (hasExplicitSubtext && txt.cta && hasExplicitCta) {
            const minGapCta = 25;
            if (endY + minGapCta > txt.cta.y) {
              ctaHeightDelta = (endY + minGapCta) - txt.cta.y;
            }
          }
          
          if (!hasExplicitSubtext) {
            currentY = endY + 40; // padding
          }
        }
        
        // CTA Button
        if (txt.cta) {
          ctx.save();
          ctx.beginPath();
          const btnW = txt.cta.w || 260;
          const btnH = txt.cta.h || 55;
          const btnX = hasExplicitCta ? txt.cta.x : (align === 'center' ? tx + (tw - btnW)/2 : tx);
          const btnY = hasExplicitCta ? (txt.cta.y + ctaHeightDelta) : Math.min(currentY, 880); 
          ctx.roundRect(btnX, btnY, btnW, btnH, 12);
          
          if (txt.cta.glowColor && txt.cta.glowColor !== 'transparent') {
            ctx.shadowColor = txt.cta.glowColor;
            ctx.shadowBlur = txt.cta.glowBlur || 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
          
          ctx.fillStyle = txt.cta.bgColor || '#db2777';
          ctx.fill();
          ctx.restore();
          
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Outfit';
          ctx.textAlign = 'center';
          ctx.fillText(txt.cta.text || 'READ FULL POST', btnX + btnW/2, btnY + 35);
          
          // Profile link
          ctx.fillStyle = palette.isLight ? '#374151' : '#94a3b8';
          ctx.font = '600 20px Inter';
          ctx.textAlign = (hasExplicitCta || align === 'center') ? 'center' : 'left';
          const profileX = hasExplicitCta ? btnX + btnW/2 : (align === 'center' ? tx + tw/2 : btnX);
          ctx.fillText('linkedin.com/in/jagtapsourabh', profileX, btnY + 100);
          ctx.restore();
        }
      }
      
      // 5. Draw Floating Elements
      if (Array.isArray(activeLayout.floatingElements)) {
        activeLayout.floatingElements.forEach(elem => {
          ctx.save();
          if (elem.type === 'emoji') {
            drawEmojiBubble(ctx, elem.x, elem.y, elem.size || 28, elem.emoji || '🔥', 0);
          } else if (elem.type === 'linkedin' || elem.type === 'instagram' || elem.type === 'facebook' || elem.type === 'twitter') {
            drawLogoBubble(ctx, elem.x, elem.y, elem.size || 36, elem.type, 0);
          }
          ctx.restore();
        });
      }
      
      // Apply noise and return
      applyNoiseTexture(ctx, w, h, 0.015);
      console.log('[Canvas] Dynamic layout rendering complete!');
      return;
    } catch (e) {
      console.error('[Canvas] Failed to render dynamic activeLayout, falling back:', e);
    }
  }

  // (Using pre-calculated common visual variables defined at top of drawCreative)

  // 4. Clear canvas & render the chosen layout structure
  if (layoutIdx === 0) {
    // Structure A1: Slanted Phone Pop-Out (Phone Left, Text Right)
    drawRadiantBackground(ctx, w, h, palette, true);
    
    // Draw Glassmorphic Card behind Text
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
    
    const glassGrad = ctx.createLinearGradient(500, 150, 1020, 930);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
    glassGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.55)');
    glassGrad.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.roundRect(500, 150, 520, 780, 24);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    const borderGrad = ctx.createLinearGradient(500, 150, 1020, 930);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    borderGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)');
    borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    const sheenGrad = ctx.createRadialGradient(760, 540, 50, 760, 540, 500);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    sheenGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sheenGrad;
    ctx.fill();
    ctx.restore();
    
    // Draw Phone mockup on Left
    drawPhoneMockup(ctx, 70, 160, 380, 760, true, activeAvImg, filter, styleIdx, palette);
    
    // Draw floating 3D social icons and emojis
    drawLogoBubble(ctx, 450, 220, 36, 'instagram', 0);
    drawLogoBubble(ctx, 80, 130, 42, 'linkedin', 1.5); // Foreground slightly blurred
    drawLogoBubble(ctx, 60, 550, 34, 'facebook', 2.5); // Background blurred
    drawLogoBubble(ctx, 420, 740, 32, 'youtube', 2.0); // Background blurred
    drawEmojiBubble(ctx, 430, 410, 30, '❤️', 0);
    drawEmojiBubble(ctx, 90, 830, 28, '🔥', 0.5);
    
    // Draw Text column on Right
    drawTextColumn(ctx, category, 530, 190, 460, 700, headline, subtext, 'left', palette);
  } 
  else if (layoutIdx === 1) {
    // Structure A2: Slanted Phone Pop-Out (Phone Right, Text Left)
    drawRadiantBackground(ctx, w, h, palette, true);
    
    // Draw Glassmorphic Card behind Text
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
    
    const glassGrad = ctx.createLinearGradient(60, 150, 580, 930);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
    glassGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.55)');
    glassGrad.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.roundRect(60, 150, 520, 780, 24);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    const borderGrad = ctx.createLinearGradient(60, 150, 580, 930);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    borderGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)');
    borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    const sheenGrad = ctx.createRadialGradient(320, 540, 50, 320, 540, 500);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    sheenGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sheenGrad;
    ctx.fill();
    ctx.restore();
    
    // Draw Phone mockup on Right
    drawPhoneMockup(ctx, 630, 160, 380, 760, false, activeAvImg, filter, styleIdx, palette);
    
    // Draw floating 3D social icons and emojis
    drawLogoBubble(ctx, 590, 220, 36, 'instagram', 0);
    drawLogoBubble(ctx, 1000, 130, 42, 'linkedin', 1.5);
    drawLogoBubble(ctx, 1020, 550, 34, 'facebook', 2.5);
    drawLogoBubble(ctx, 600, 740, 32, 'telegram', 2.0);
    drawEmojiBubble(ctx, 610, 410, 30, '👍', 0);
    drawEmojiBubble(ctx, 990, 830, 28, '🚀', 0.5);
    
    // Draw Text column on Left
    drawTextColumn(ctx, category, 90, 190, 460, 700, headline, subtext, 'left', palette);
  } 
  else if (layoutIdx === 2) {
    // Structure B: Premium Circle Frame Pop-Out with Floating Emojis (Centered Circle)
    drawRadiantBackground(ctx, w, h, palette, true);
    
    const cx = w / 2;
    const cy = h / 2 + 50;
    const r = 210;
    
    // Circle background shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Screen Base Gradient inside circle
    ctx.save();
    const circleScreenGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    circleScreenGrad.addColorStop(0, palette.gradStart);
    circleScreenGrad.addColorStop(1, palette.gradEnd);
    ctx.fillStyle = circleScreenGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw Avatar inside Circle (Clipped)
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    drawAvatarForCircle(ctx, cx, cy, r, filter, styleIdx, activeAvImg);
    ctx.restore();
    
    // Circular Border (gradient stroke)
    ctx.save();
    const borderGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    borderGrad.addColorStop(0, palette.primary);
    borderGrad.addColorStop(1, palette.secondary);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    // Pop-Out upper body
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - r - 20, cy - r - 200, r * 2 + 40, r * 1.15 + 200);
    ctx.clip();
    drawAvatarForCircle(ctx, cx, cy, r, filter, styleIdx, activeAvImg);
    ctx.restore();
    
    // Floating bubbles
    drawLogoBubble(ctx, cx - 250, cy + 100, 36, 'instagram', 0);
    drawLogoBubble(ctx, cx - 220, cy - 160, 42, 'linkedin', 1.0);
    drawLogoBubble(ctx, cx + 240, cy + 110, 38, 'whatsapp', 0);
    drawLogoBubble(ctx, cx + 220, cy - 170, 36, 'youtube', 1.5);
    drawLogoBubble(ctx, cx - 280, cy - 30, 30, 'facebook', 2.5);
    drawEmojiBubble(ctx, cx - 110, cy + 180, 28, '❤️', 0);
    drawEmojiBubble(ctx, cx + 110, cy + 180, 28, '😂', 0);
    drawEmojiBubble(ctx, cx + 280, cy - 20, 26, '🔥', 2.0);
    
    // Header & Subtext at the top
    ctx.save();
    ctx.textAlign = 'center';
    
    // Badge
    ctx.beginPath();
    ctx.roundRect(cx - 150, 60, 300, 36, 8);
    ctx.fillStyle = palette.badgeBg;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter';
    ctx.fillText(category === 'marketing' ? '⚡ DIGITAL MARKETING' : '⚡ AI & FUTURE TECH', cx, 83);
    
    // Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 46px Outfit';
    wrapTextAligned(ctx, headline.toUpperCase(), 100, 120, 880, 52, 'center', true);
    
    // Subtext at bottom
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 22px Inter';
    wrapTextAligned(ctx, subtext, 120, 810, 840, 34, 'center');
    
    // CTA Button
    ctx.beginPath();
    ctx.roundRect(cx - 140, 875, 280, 55, 12);
    ctx.fillStyle = palette.primary;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit';
    ctx.fillText('READ FULL POST', cx, 909);
    
    // Profile URL
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px Inter';
    ctx.fillText('linkedin.com/in/jagtapsourabh', cx, 975);
    ctx.restore();
  } 
  else if (layoutIdx === 3) {
    // Structure C: Magazine Split / Checklist Layout
    // Background: Vertical split (solid left, radiant right)
    drawRadiantBackground(ctx, w, h, palette, false); // No sunburst on full, we'll split
    
    // Draw radiant ray background only on the right panel
    ctx.save();
    ctx.beginPath();
    ctx.rect(600, 0, 480, h);
    ctx.clip();
    const rightGrad = ctx.createLinearGradient(600, 0, w, h);
    rightGrad.addColorStop(0, palette.gradStart);
    rightGrad.addColorStop(1, '#000000');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(600, 0, 480, h);
    
    // Draw sunburst rays in right panel
    const cx = 840;
    const cy = h / 2;
    ctx.translate(cx, cy);
    ctx.fillStyle = palette.rayColor;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 800, (i * 2 * Math.PI) / 16, ((i + 0.5) * 2 * Math.PI) / 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    
    // Left column: Typography & checklist
    ctx.save();
    ctx.textAlign = 'left';
    
    // Badge
    ctx.beginPath();
    ctx.roundRect(60, 60, 240, 36, 8);
    ctx.fillStyle = palette.badgeBg;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(category === 'marketing' ? 'GROWTH STRATEGY' : 'AI & AUTOMATION', 180, 83);
    ctx.textAlign = 'left';
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 46px Outfit';
    wrapTextAligned(ctx, headline.toUpperCase(), 60, 130, 480, 52, 'left', true);
    
    // Checklist panel
    ctx.beginPath();
    ctx.roundRect(60, 420, 480, 350, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    
    // List items based on category
    const items = category === 'marketing' 
      ? ['📈 Content Strategy & SEO', '📈 Paid Ad Optimization', '📈 Social Analytics Reporting', '📈 B2B Lead Generation']
      : ['⚡ Deep Neural Networks', '⚡ Automated AI Agents', '⚡ LLM RAG Pipelines', '⚡ Autonomous Workflows'];
      
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit';
    ctx.fillText('CORE AREAS OF FOCUS:', 90, 470);
    
    ctx.font = '500 20px Inter';
    ctx.fillStyle = '#cbd5e1';
    items.forEach((item, idx) => {
      const iy = 530 + idx * 55;
      // Draw tick box/bullet
      ctx.fillStyle = palette.primary;
      ctx.font = 'bold 22px Inter';
      ctx.fillText('✓', 95, iy);
      
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 20px Inter';
      ctx.fillText(item, 130, iy);
    });
    
    // Profile URL
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px Inter';
    ctx.fillText('linkedin.com/in/jagtapsourabh', 60, 830);
    
    // CTA Button
    ctx.beginPath();
    ctx.roundRect(60, 880, 260, 55, 12);
    ctx.fillStyle = palette.primary;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('READ FULL POST', 190, 914);
    ctx.restore();
    
    // Right column: Sheared Avatar Card Frame
    ctx.save();
    ctx.translate(820, 520);
    ctx.transform(1, -0.04, 0.04, 0.98, 0, 0); // Sheared angle
    
    // Card background & shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    
    const cw = 360;
    const ch = 740;
    ctx.beginPath();
    ctx.roundRect(-cw/2, -ch/2, cw, ch, 24);
    ctx.fill();
    
    // Glowing border matching theme
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = palette.secondary + '40';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Clip to card and draw Avatar
    ctx.beginPath();
    ctx.roundRect(-cw/2, -ch/2, cw, ch, 24);
    ctx.clip();
    
    // Draw avatar inside card with cover fit
    drawAvatarForCard(ctx, -cw/2, -ch/2, cw, ch, filter, styleIdx, activeAvImg);
    ctx.restore();
  } 
  else if (layoutIdx === 4) {
    // Structure D: Sleek Diagonal Split Pop-Out
    // Draw diagonal background
    ctx.save();
    const grad1 = ctx.createLinearGradient(0, 0, w, h);
    grad1.addColorStop(0, '#090d1a');
    grad1.addColorStop(1, '#020408');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, w, h);
    
    ctx.beginPath();
    ctx.moveTo(w * 0.45, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(w * 0.15, h);
    ctx.closePath();
    
    const grad2 = ctx.createLinearGradient(w * 0.45, 0, w, h);
    grad2.addColorStop(0, palette.secondary);
    grad2.addColorStop(1, palette.gradStart);
    ctx.fillStyle = grad2;
    ctx.fill();
    
    // Draw dividing glowing border
    ctx.strokeStyle = palette.primary + '73';
    ctx.lineWidth = 10;
    ctx.shadowColor = palette.primary;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, 0);
    ctx.lineTo(w * 0.15, h);
    ctx.stroke();
    ctx.restore();
    
    // Draw Avatar standing on the right side, popping over the diagonal border
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = -15;
    ctx.shadowOffsetY = 20;
    
    const img = activeAvImg;
    
    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.filter = filter;
      // Standing position on the right: maintain aspect ratio
      const size = 900;
      ctx.drawImage(img, 800 - size/2, 1080 - size, size, size);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(610, 200, 360, 740, 20);
      ctx.fill();
    }
    ctx.restore();
    
    // Left side text column
    ctx.save();
    ctx.textAlign = 'left';
    
    // Badge
    ctx.beginPath();
    ctx.roundRect(60, 80, 260, 36, 8);
    ctx.fillStyle = palette.badgeBg;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(category === 'marketing' ? 'LATEST MARKETING CASE' : 'BREAKING TECH STUDY', 190, 103);
    ctx.textAlign = 'left';
    
    // Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 46px Outfit';
    wrapTextAligned(ctx, headline.toUpperCase(), 60, 150, 420, 52, 'left', true);
    
    // Subtext
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 20px Inter';
    wrapTextAligned(ctx, subtext, 60, 480, 420, 32, 'left');
    
    // CTA Button
    ctx.beginPath();
    ctx.roundRect(60, 760, 260, 55, 12);
    ctx.fillStyle = palette.primary;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('READ FULL POST', 190, 794);
    
    // Profile URL
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('linkedin.com/in/jagtapsourabh', 60, 860);
    ctx.restore();
    
    // Draw some floating bubbles to tie it all together
    drawLogoBubble(ctx, 420, 110, 36, 'linkedin', 1.0);
    drawLogoBubble(ctx, 950, 140, 40, 'instagram', 0);
    drawEmojiBubble(ctx, 430, 420, 28, '🔥', 0);
  }
  
  // 4. Apply a subtle premium noise/grain texture over the entire creative card
  applyNoiseTexture(ctx, w, h, 0.015);

  // 5. Apply Brand Logo Watermark if configured in Settings
  if (state.settings.brandLogo) {
    try {
      const logoImg = new Image();
      logoImg.src = state.settings.brandLogo;
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoMaxH = 50;
        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const logoW = Math.min(160, logoMaxH * aspect);
        const logoH = logoW / aspect;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.drawImage(logoImg, w - logoW - 40, 40, logoW, logoH);
        ctx.restore();
      }
    } catch (e) {
      console.warn('[Canvas] Brand logo draw error:', e);
    }
  }
}

// Drawing Sub-routines
function drawRadiantBackground(ctx, w, h, palette, isSunburst = true) {
  ctx.save();
  
  // 1. Create main gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, palette.gradStart);
  grad.addColorStop(0.5, palette.gradStart);
  grad.addColorStop(1, palette.gradEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  
  // 2. Radiant rays / sunburst effect
  if (isSunburst) {
    const cx = w / 2;
    const cy = h / 2;
    const numRays = 24;
    const radius = Math.max(w, h) * 1.5;
    
    ctx.translate(cx, cy);
    ctx.fillStyle = palette.rayColor;
      
    for (let i = 0; i < numRays; i++) {
      const angleStart = (i * 2 * Math.PI) / numRays;
      const angleEnd = ((i + 0.5) * 2 * Math.PI) / numRays;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angleStart, angleEnd);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
  }
  
  // 3. Highlight/Glow in the center
  const radialGlow = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w/2);
  radialGlow.addColorStop(0, palette.textGlow);
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, w, h);
  
  ctx.restore();
}

function drawLogoBubble(ctx, x, y, size, type, blurAmount = 0) {
  ctx.save();
  if (blurAmount > 0) {
    ctx.filter = `blur(${blurAmount}px)`;
  }
  
  // Glass bubble drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = size * 0.35;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = size * 0.18;
  
  // Glass bubble circle background
  const bubbleGrad = ctx.createRadialGradient(x - size*0.1, y - size*0.1, size*0.1, x, y, size);
  bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  bubbleGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
  bubbleGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  
  ctx.fillStyle = bubbleGrad;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  
  // Bubble border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
  
  // Reset shadow for drawing the logo icon inside
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  const innerSize = size * 0.55;
  
  // Draw specific logo
  if (type === 'instagram') {
    ctx.save();
    const igGrad = ctx.createLinearGradient(x - size*0.5, y + size*0.5, x + size*0.5, y - size*0.5);
    igGrad.addColorStop(0, '#f9ce34'); // Yellow
    igGrad.addColorStop(0.5, '#ee2a7b'); // Pink/Red
    igGrad.addColorStop(1, '#6228d7'); // Purple
    
    ctx.strokeStyle = igGrad;
    ctx.lineWidth = innerSize * 0.18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Outer rounded rectangle
    const rx = x - innerSize * 0.5;
    const ry = y - innerSize * 0.5;
    const rw = innerSize;
    const rh = innerSize;
    const rr = innerSize * 0.25;
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, rr);
    ctx.stroke();
    
    // Lens circle
    ctx.beginPath();
    ctx.arc(x, y, innerSize * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    
    // Flash dot
    ctx.fillStyle = igGrad;
    ctx.beginPath();
    ctx.arc(x + innerSize * 0.28, y - innerSize * 0.28, innerSize * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } 
  else if (type === 'facebook') {
    ctx.save();
    ctx.fillStyle = '#1877f2';
    ctx.beginPath();
    ctx.arc(x, y, innerSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${innerSize * 1.5}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', x + innerSize*0.12, y + innerSize*0.05);
    ctx.restore();
  } 
  else if (type === 'linkedin') {
    ctx.save();
    ctx.fillStyle = '#0a66c2';
    ctx.beginPath();
    ctx.roundRect(x - innerSize, y - innerSize, innerSize * 2, innerSize * 2, innerSize * 0.3);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${innerSize * 1.1}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('in', x, y);
    ctx.restore();
  } 
  else if (type === 'youtube') {
    ctx.save();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.roundRect(x - innerSize, y - innerSize * 0.7, innerSize * 2, innerSize * 1.4, innerSize * 0.4);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - innerSize * 0.25, y - innerSize * 0.35);
    ctx.lineTo(x + innerSize * 0.35, y);
    ctx.lineTo(x - innerSize * 0.25, y + innerSize * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } 
  else if (type === 'whatsapp') {
    ctx.save();
    ctx.fillStyle = '#25d366';
    ctx.beginPath();
    ctx.arc(x, y, innerSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `${innerSize * 1.1}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📞', x, y);
    ctx.restore();
  } 
  else if (type === 'telegram') {
    ctx.save();
    ctx.fillStyle = '#229ed9';
    ctx.beginPath();
    ctx.arc(x, y, innerSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const px = x - innerSize * 0.1;
    const py = y + innerSize * 0.1;
    ctx.moveTo(px - innerSize*0.6, py - innerSize*0.2);
    ctx.lineTo(px + innerSize*0.8, py - innerSize*0.7);
    ctx.lineTo(px + innerSize*0.2, py + innerSize*0.4);
    ctx.lineTo(px + innerSize*0.05, py + innerSize*0.05);
    ctx.lineTo(px - innerSize*0.2, py + innerSize*0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(px + innerSize*0.8, py - innerSize*0.7);
    ctx.lineTo(px + innerSize*0.05, py + innerSize*0.05);
    ctx.lineTo(px - innerSize*0.1, py - innerSize*0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  // Gloss overlay
  const glossGrad = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  glossGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
  glossGrad.addColorStop(0.5, 'transparent');
  ctx.fillStyle = glossGrad;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawEmojiBubble(ctx, x, y, size, emoji, blurAmount = 0) {
  ctx.save();
  if (blurAmount > 0) {
    ctx.filter = `blur(${blurAmount}px)`;
  }
  
  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = size * 0.3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = size * 0.15;
  
  // Glass bubble background
  const bubbleGrad = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  bubbleGrad.addColorStop(1, 'rgba(240, 243, 248, 0.9)');
  
  ctx.fillStyle = bubbleGrad;
  ctx.beginPath();
  ctx.roundRect(x - size, y - size * 0.8, size * 2, size * 1.6, size * 0.4);
  ctx.fill();
  
  // Draw pointer
  ctx.beginPath();
  ctx.moveTo(x - size * 0.3, y + size * 0.78);
  ctx.lineTo(x - size * 0.6, y + size * 1.15);
  ctx.lineTo(x - size * 0.5, y + size * 0.78);
  ctx.closePath();
  ctx.fill();
  
  // Draw border
  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw emoji
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#000';
  ctx.font = `${size * 0.95}px Inter`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y - size * 0.05);
  
  ctx.restore();
}

function drawPhoneMockup(ctx, px, py, pw, ph, isLeft, avatarImg, filter, styleIdx, palette) {
  ctx.save();
  ctx.translate(px + pw/2, py + ph/2);

  // Apply a 3D tilt
  if (isLeft) {
    ctx.transform(1, -0.06, 0.05, 0.96, 0, 0);
    ctx.rotate(-0.06);
  } else {
    ctx.transform(1, 0.06, -0.05, 0.96, 0, 0);
    ctx.rotate(0.06);
  }

  const x = -pw/2;
  const y = -ph/2;

  // 1. Phone shadow & Neon halo glow
  ctx.save();
  ctx.shadowColor = palette.primary + '80'; // 80 is hex for 50% opacity
  ctx.shadowBlur = 55;
  ctx.shadowOffsetX = isLeft ? 10 : -10;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.roundRect(x, y, pw, ph, 45);
  ctx.fill();
  ctx.restore();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 2. Bezel (Phone Outer Frame)
  const bezelWidth = 12;
  const outerBezelGrad = ctx.createLinearGradient(x, y, x + pw, y + ph);
  outerBezelGrad.addColorStop(0, '#475569'); // Slate
  outerBezelGrad.addColorStop(0.5, '#1e293b'); // Dark Slate
  outerBezelGrad.addColorStop(1, '#0f172a'); // Very Dark Slate
  ctx.fillStyle = outerBezelGrad;
  ctx.beginPath();
  ctx.roundRect(x, y, pw, ph, 45);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3. Screen Area
  const sx = x + bezelWidth;
  const sy = y + bezelWidth;
  const sw = pw - bezelWidth * 2;
  const sh = ph - bezelWidth * 2;
  const srad = 35; // Screen radius

  ctx.fillStyle = '#020617'; 
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, srad);
  ctx.fill();

  // Screen Gradient Background
  const screenGrad = ctx.createLinearGradient(sx, sy, sx, sy + sh);
  screenGrad.addColorStop(0, palette.secondary);
  screenGrad.addColorStop(1, palette.gradEnd);
  ctx.fillStyle = screenGrad;
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, srad);
  ctx.fill();

  // Screen Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = sy; i < sy + sh; i += 40) {
    ctx.moveTo(sx, i);
    ctx.lineTo(sx + sw, i);
  }
  ctx.stroke();

  // 4. Draw avatar inside screen (clipped)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, srad);
  ctx.clip();
  drawAvatarForPhone(ctx, sx, sy, sw, sh, filter, styleIdx, avatarImg);
  ctx.restore();

  // 5. Notch
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.roundRect(x + pw/2 - 55, y + bezelWidth + 8, 110, 22, 11);
  ctx.fill();

  // 6. Pop-Out upper body
  ctx.restore(); // Restore tilt transform

  // Re-apply tilt transform for popout overlay
  ctx.save();
  ctx.translate(px + pw/2, py + ph/2);
  if (isLeft) {
    ctx.transform(1, -0.06, 0.05, 0.96, 0, 0);
    ctx.rotate(-0.06);
  } else {
    ctx.transform(1, 0.06, -0.05, 0.96, 0, 0);
    ctx.rotate(0.06);
  }

  // Clip popout to upper part of phone screen & area above
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 200, y - 300, pw + 400, ph * 0.55 + 300);
  ctx.clip();

  // Draw avatar overlay
  drawAvatarForPhone(ctx, sx, sy, sw, sh, filter, styleIdx, avatarImg);

  ctx.restore(); // Restore clip
  ctx.restore(); // Restore tilt transform
}

function drawAvatarForPhone(ctx, x, y, w, h, filter, styleIdx, avatarImg) {
  ctx.save();
  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth !== 0) {
    if (filter) ctx.filter = filter;
    
    const imgW = avatarImg.width;
    const imgH = avatarImg.height;
    
    // Crop a vertical slice from the square image.
    // Since the screen is tall, the height is the bottleneck. Crop 85% of image height.
    const cropH = imgH * 0.85;
    const cropW = cropH * (w / h);
    
    // Center horizontally
    const cropX = (imgW - cropW) / 2;
    // Align near the top (e.g. 5% down) to capture the head and shoulders properly
    const cropY = imgH * 0.05;
    
    ctx.drawImage(avatarImg, cropX, cropY, cropW, cropH, x, y, w, h);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function drawAvatarForCard(ctx, x, y, w, h, filter, styleIdx, avatarImg) {
  ctx.save();
  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth !== 0) {
    if (filter) ctx.filter = filter;
    
    const imgW = avatarImg.width;
    const imgH = avatarImg.height;
    
    // Fill the card rectangle (x, y, w, h) cover-fit
    const destRatio = w / h;
    let cropW, cropH;
    
    if (destRatio > 1) {
      cropW = imgW;
      cropH = imgW / destRatio;
    } else {
      cropH = imgH;
      cropW = imgH * destRatio;
    }
    
    const cropX = (imgW - cropW) / 2;
    const cropY = Math.max(0, (imgH - cropH) * 0.05);
    
    ctx.drawImage(avatarImg, cropX, cropY, cropW, cropH, x, y, w, h);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function drawAvatarForCircle(ctx, cx, cy, r, filter, styleIdx, avatarImg) {
  ctx.save();
  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth !== 0) {
    if (filter) ctx.filter = filter;
    
    const size = r * 2.2;
    ctx.drawImage(avatarImg, cx - size/2, cy - size/2 - r*0.1, size, size);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTextColumn(ctx, category, tx, ty, tw, th, headline, subtext, align = 'left', palette, customLayout = null) {
  ctx.save();
  ctx.textAlign = align;
  
  // 1. Badge / Top Label
  const badgeStr = ((customLayout && (customLayout.badgeText || (customLayout.postContent && customLayout.postContent.badgeText))) || (category === 'marketing' ? 'MARKETING TREND' : 'AI TECH TREND')).toUpperCase();
  ctx.save();
  ctx.font = 'bold 15px Inter';
  const badgeMetrics = ctx.measureText(badgeStr);
  const badgeW = Math.max(240, badgeMetrics.width + 36);
  const badgeH = 36;
  const bx = align === 'center' ? tx + (tw - badgeW)/2 : tx;
  ctx.beginPath();
  ctx.roundRect(bx, ty, badgeW, badgeH, 8);
  ctx.fillStyle = palette.badgeBg;
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(badgeStr, bx + badgeW/2, ty + 23);
  ctx.restore();
  
  // 2. Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px Outfit';
  const headlineY = ty + 95;
  const wrapEnd = wrapTextAligned(ctx, headline.toUpperCase(), tx, headlineY, tw, 48, align, true);
  
  // 3. Dots separator
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.font = '22px Inter';
  const sepY = Math.max(wrapEnd + 10, ty + 380);
  const linkX = align === 'center' ? tx + tw/2 : tx;
  ctx.fillText('•••••••••••••••••', linkX, sepY);
  
  // 4. Subtext
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 20px Inter';
  const subtextY = sepY + 45;
  wrapTextAligned(ctx, subtext, tx, subtextY, tw, 30, align);
  
  // 5. Button/CTA
  const ctaStr = ((customLayout && (customLayout.ctaText || (customLayout.postContent && customLayout.postContent.ctaText))) || 'READ FULL POST').toUpperCase();
  ctx.font = 'bold 20px Outfit';
  const ctaMetrics = ctx.measureText(ctaStr);
  const btnW = Math.max(260, ctaMetrics.width + 44);
  const btnH = 55;
  const btnX = align === 'center' ? tx + (tw - btnW)/2 : tx;
  const btnY = ty + 570;
  
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 12);
  ctx.fillStyle = palette.primary;
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Outfit';
  ctx.textAlign = 'center';
  ctx.fillText(ctaStr, btnX + btnW/2, btnY + 35);
  
  // 6. Profile Link
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 20px Inter';
  ctx.fillText('linkedin.com/in/jagtapsourabh', linkX, ty + 700);
  
  ctx.restore();
}

function drawHighlightedLine(ctx, line, drawX, currentY, align, highlightColor, isHeadline) {
  // If no highlight marker, draw normally
  if (!line.includes('*')) {
    if (isHeadline) ctx.strokeText(line, drawX, currentY);
    ctx.fillText(line, drawX, currentY);
    return;
  }
  
  const parts = line.split('*');
  
  // Measure segments to compute total clean width
  const segments = parts.map((part, index) => {
    const isHighlighted = index % 2 === 1;
    const text = part;
    
    ctx.save();
    if (isHeadline) {
      ctx.font = `800 ${ctx.font.split('px')[0].split(' ').pop()}px Outfit`;
    }
    const width = ctx.measureText(text).width;
    ctx.restore();
    
    return { text, isHighlighted, width };
  });
  
  const totalWidth = segments.reduce((sum, seg) => sum + seg.width, 0);
  
  // Determine starting X position based on alignment
  let startX = drawX;
  if (align === 'center') {
    startX = drawX - totalWidth / 2;
  } else if (align === 'right') {
    startX = drawX - totalWidth;
  }
  
  let currentX = startX;
  
  segments.forEach(seg => {
    ctx.save();
    if (seg.isHighlighted) {
      ctx.fillStyle = highlightColor || '#00f2fe'; // Neon cyan or custom highlight
      if (isHeadline) {
        ctx.font = `800 ${ctx.font.split('px')[0].split(' ').pop()}px Outfit`;
      }
    }
    
    if (isHeadline) {
      ctx.strokeText(seg.text, currentX, currentY);
    }
    ctx.fillText(seg.text, currentX, currentY);
    currentX += seg.width;
    ctx.restore();
  });
}

// Wrap text with custom alignment and premium style outline/gradient support
function wrapTextAligned(ctx, text, x, y, maxWidth, lineHeight, align = 'center', isHeadline = false, highlightColor = null) {
  const lines = text.split('\n');
  let currentY = y;
  
  ctx.save();
  ctx.textAlign = align;
  
  if (isHeadline) {
    // Specular dark outline for contrast against glowing space backgrounds
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;
    
    // Deep drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    
    // Silver-white gradient fill
    const textGrad = ctx.createLinearGradient(x, y, x, y + 150);
    textGrad.addColorStop(0, '#ffffff');
    textGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = textGrad;
  }
  
  for (let i = 0; i < lines.length; i++) {
    const words = lines[i].split(' ');
    let line = '';
    
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let testLineClean = testLine.replace(/\*/g, '');
      let metrics = ctx.measureText(testLineClean);
      let testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        const drawX = align === 'center' ? x + maxWidth/2 : (align === 'right' ? x + maxWidth : x);
        drawHighlightedLine(ctx, line.trim(), drawX, currentY, align, highlightColor, isHeadline);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    const drawX = align === 'center' ? x + maxWidth/2 : (align === 'right' ? x + maxWidth : x);
    drawHighlightedLine(ctx, line.trim(), drawX, currentY, align, highlightColor, isHeadline);
    
    // Move to next line for the next paragraph line break
    if (i < lines.length - 1) {
      currentY += lineHeight;
    }
  }
  
  ctx.restore();
  return currentY + lineHeight;
}

// Generate offscreen film grain noise pattern to prevent banding and unify colors
function applyNoiseTexture(ctx, w, h, opacity = 0.015) {
  ctx.save();
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 100;
  noiseCanvas.height = 100;
  const noiseCtx = noiseCanvas.getContext('2d');
  const imgData = noiseCtx.createImageData(100, 100);
  const data = imgData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(Math.random() * 255);
    data[i] = val;
    data[i+1] = val;
    data[i+2] = val;
    data[i+3] = Math.floor(Math.random() * 255 * opacity);
  }
  noiseCtx.putImageData(imgData, 0, 0);
  
  const pattern = ctx.createPattern(noiseCanvas, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ================= HELPERS & UTILS =================

// Modal control
function openSettings() {
  if (el.settingsModal) el.settingsModal.classList.remove('hidden');
}
window.openSettings = openSettings;

// Close Settings Modal
function closeSettings() {
  if (el.settingsModal) el.settingsModal.classList.add('hidden');
}
window.closeSettings = closeSettings;



// Toast System
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '🔔';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '⚠';
  if (type === 'info') icon = '⚡';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
  
  el.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Human Date Formatter
function formatDateHuman(dateStr) {
  const parts = dateStr.split('-');
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Start on load
window.addEventListener('DOMContentLoaded', init);
