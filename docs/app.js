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
avatarImg.crossOrigin = 'anonymous';
let avatarImageLoaded = false;

// Multi-avatar resources for the 18 draft options
const optionAvatars = [];
const optionAvatarsLoaded = Array(18).fill(false);

for (let i = 1; i <= 18; i++) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
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

// Pre-cutout transparent avatar resources (AI remove.bg transparent cutouts)
const personalAvatarCutout = new Image();
personalAvatarCutout.crossOrigin = 'anonymous';
personalAvatarCutout.src = 'avatars_cutout/personal_avatar.png';

const optionCutoutAvatars = [];
const optionCutoutAvatarsLoaded = Array(18).fill(false);

for (let i = 1; i <= 18; i++) {
  const cImg = new Image();
  cImg.crossOrigin = 'anonymous';
  cImg.onload = () => {
    optionCutoutAvatarsLoaded[i - 1] = true;
  };
  cImg.onerror = () => {
    if (cImg.src.indexOf(`avatars_cutout/avatar-${i}.png`) !== -1) {
      cImg.src = `avatars_cutout/avatar_daily_${i}.png`;
    }
  };
  cImg.src = `avatars_cutout/avatar-${i}.png`;
  optionCutoutAvatars.push(cImg);
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
  inputRemovebgApiKey: document.getElementById('input-removebg-apikey'),
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
      removebgApiKey: settings.removebgApiKey || '',
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
    if (el.inputRemovebgApiKey) el.inputRemovebgApiKey.value = state.settings.removebgApiKey;
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
            if (custom.avatarShape !== undefined) {
              post.avatarShape = custom.avatarShape;
            }
            if (custom.avatarPos !== undefined) {
              post.avatarPos = custom.avatarPos;
            }
            if (custom.avatarLayer !== undefined) {
              post.avatarLayer = custom.avatarLayer;
            }
            if (custom.avatarSize !== undefined) {
              post.avatarSize = custom.avatarSize;
            }
            if (custom.bgSensitivity !== undefined) {
              post.bgSensitivity = custom.bgSensitivity;
            }
            if (custom.avatarOffsetX !== undefined) {
              post.avatarOffsetX = custom.avatarOffsetX;
            }
            if (custom.avatarOffsetY !== undefined) {
              post.avatarOffsetY = custom.avatarOffsetY;
            }
            if (custom.avatarRotation !== undefined) {
              post.avatarRotation = custom.avatarRotation;
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
  const removebgApiKey = el.inputRemovebgApiKey ? el.inputRemovebgApiKey.value.trim() : '';
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
      removebgApiKey,
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

// Instant client-side draft generator with simple, layman-friendly language (80% Marketing / 20% AI)
const CLIENT_TOPICS_LIBRARY = {
  marketing: [
    {
      hook: "Most people search Google the wrong way.",
      topic: "How everyday people are using AI tools to find quick answers online instead of clicking 10 blue links.",
      headline: "SEARCH *IS CHANGING*",
      subtext: "How customers find answers today.",
      badge: "SIMPLE GUIDE",
      content: `Most people search Google the wrong way.

Instead of clicking through 10 different website links, people now just ask AI tools like ChatGPT to give them one quick, direct answer.

If you run a business or create content, here is what to do:

1. Give direct answers: Put the important answers right at the top of your page.
2. Answer real questions: What does your product cost? How does it help?
3. Keep it simple: Write like you are explaining it to a smart friend.

Think of it like being the friendly person everyone turns to for advice.

Have you started using AI to search for things instead of Google? Let me know below!`
    },
    {
      hook: "Stop sending boring sales emails.",
      topic: "Simple rules to write friendly emails that people actually want to open and reply to.",
      headline: "BETTER *SALES EMAILS*",
      subtext: "3 simple rules to get real replies.",
      badge: "HELPFUL TIP",
      content: `Stop sending boring sales emails.

Nobody likes opening an email that looks like a robot copied and pasted it to 1,000 strangers.

Here are 3 simple rules to get real replies:

1. Talk to one person: Write like you are sending a note to a colleague.
2. Focus on their problem: Don't brag about your company. Ask how you can help them.
3. Keep it short: If they can't read it in 30 seconds on their phone, they will delete it.

Good marketing is just good conversation.

What is the best sales email you ever received?`
    },
    {
      hook: "Why your website isn't making sales.",
      topic: "The #1 mistake businesses make on their homepage: listing complex features instead of simple benefits.",
      headline: "FIX YOUR *WEBSITE*",
      subtext: "The #1 mistake most businesses make.",
      badge: "CASE STUDY",
      content: `Why your website isn't making sales.

When a customer lands on your website, you have about 3 seconds to answer one question:

"How does this help ME?"

Most websites make the mistake of listing complicated features instead of explaining the real benefit in plain English.

Here is a simple example:
- Complicated: "We provide high-speed automated cloud sync technology."
- Simple & Clear: "Never lose a file again. Access your work from anywhere in 1 click."

Always sell the result, not the tool.

Does your website pass the 3-second test?`
    },
    {
      hook: "People buy from people, not logos.",
      topic: "Why personal stories and honest founder posts build 10x more trust than corporate brand pages.",
      headline: "BUILDING *REAL TRUST*",
      subtext: "Why founder stories win every time.",
      badge: "GROWTH TIP",
      content: `People buy from people, not logos.

Notice how the most popular accounts on LinkedIn are real people sharing honest lessons, not boring corporate company pages?

Here is how to build trust without being fake:

1. Share your lessons: What went wrong this week and what did you learn from it?
2. Show behind the scenes: People love seeing how things are actually made.
3. Be helpful for free: Share your best advice without asking for anything back.

When you build trust first, customers come to you naturally.

Do you prefer buying from a person or a company?`
    },
    {
      hook: "The cheapest way to grow your business.",
      topic: "Why taking great care of existing customers is 5x cheaper than spending money on ads.",
      headline: "KEEP YOUR *CUSTOMERS*",
      subtext: "Why happy customers beat expensive ads.",
      badge: "STRATEGY",
      content: `The cheapest way to grow your business.

Most companies spend thousands of dollars on ads trying to get new strangers to buy from them.

Yet they completely forget about the customers who already trust them!

Here are 3 simple ways to keep customers happy:

1. Check in after the sale: Send a quick message asking how everything is going.
2. Fix issues fast: A fast apology and quick fix turns an unhappy buyer into a loyal fan.
3. Reward loyalty: Give special perks or discounts to people who stay with you.

Keeping a happy customer is 5x cheaper than finding a new one.

How do you stay in touch with your past clients?`
    },
    {
      hook: "If you confuse people, you lose them.",
      topic: "Why replacing fancy buzzwords with simple everyday words doubles your sales.",
      headline: "WRITE *SIMPLE WORDS*",
      subtext: "How clear words double your sales.",
      badge: "WRITING TIP",
      content: `If you confuse people, you lose them.

Many businesses think using big, fancy words makes them look smart and professional.

In reality, fancy buzzwords just confuse your customers and make them leave.

Try these simple word swaps today:
- Instead of "utilize" -> use "use"
- Instead of "facilitate" -> use "help"
- Instead of "commence" -> use "start"
- Instead of "synergize" -> use "work together"

Clear writing is clear thinking.

What is one business buzzword you wish people would stop using?`
    },
    {
      hook: "The #1 marketing tool you can't buy.",
      topic: "How delivering outstanding service turns everyday customers into your biggest promoters.",
      headline: "WORD OF *MOUTH POWER*",
      subtext: "How great service creates free growth.",
      badge: "SUCCESS TIP",
      content: `The #1 marketing tool you can't buy.

Think about the last app, book, or service you bought. Chances are, a friend recommended it to you.

Word of mouth is still the most powerful growth engine in the world.

How to get people talking about your business:

1. Be insanely easy to work with.
2. Deliver faster than you promised.
3. Do one small unexpected nice gesture for every client.

Make your service so good that people can't stop telling their friends.

What is the last product you recommended to someone?`
    }
  ],
  ai: [
    {
      hook: "AI is not here to replace you.",
      topic: "How everyday professionals use AI to save 5 hours every week on repetitive tasks.",
      headline: "WORK *SMARTER WITH AI*",
      subtext: "How to save 5 hours every week.",
      badge: "AI BASICS",
      content: `AI is not here to replace you.

It is here to replace the boring, repetitive tasks you hate doing.

Think of AI like having a super fast intern who works 24/7:

1. Brainstorming ideas: Ask it for 10 title ideas when you are feeling stuck.
2. Summarizing long notes: Turn a 5-page document into 3 key bullet points in seconds.
3. Fixing your grammar: Clean up typos and make your writing easier to read.

You are still the pilot. AI is just the co-pilot.

What is the #1 task you wish AI could do for you automatically?`
    },
    {
      hook: "How to write better prompts in 10 seconds.",
      topic: "A simple 3-part formula to get great answers from ChatGPT or Gemini every time.",
      headline: "BETTER *AI PROMPTS*",
      subtext: "A simple 3-step formula that works.",
      badge: "QUICK TUTORIAL",
      content: `How to write better prompts in 10 seconds.

If you give AI a vague question, it gives you a boring, robotic answer.

To get amazing results, use this simple 3-step formula:

1. Who it is: "Act as a friendly marketing coach."
2. What you need: "Write a short 3-sentence email invite for a free webinar."
3. The audience: "Make it simple for small shop owners to understand."

The clearer you are with AI, the better answers you get.

Try this formula today and see the difference!`
    },
    {
      hook: "Why you should never copy-paste AI text.",
      topic: "Why human editing and your real voice are essential when using AI writing tools.",
      headline: "HUMAN + *AI TEAMWORK*",
      subtext: "Why your personal voice matters.",
      badge: "AI ADVICE",
      content: `Why you should never copy-paste AI text.

AI tools are great at making a first draft in 5 seconds.

But if you post raw AI text without editing it, everyone can tell. It sounds generic, stiff, and robotic.

Here is the smart way to use AI:
1. Use AI to get your ideas down fast.
2. Add your own personal stories and real experiences.
3. Remove fancy buzzwords and make it sound like YOU.

Use AI for speed, but keep your human heart in the story.

Do you edit what AI writes, or post it directly?`
    },
    {
      hook: "Creating videos with AI just got simple.",
      topic: "How new video AI tools allow anyone to create professional short video clips from text.",
      headline: "AI *VIDEO CREATION*",
      subtext: "Create video clips in minutes.",
      badge: "NEW TECH",
      content: `Creating videos with AI just got simple.

You used to need expensive cameras, studio lights, and editing software to create product videos.

Now, new AI tools can create clean background videos and animations from a simple text sentence.

What this means for small businesses:
1. Faster testing: Test 5 different video ideas in an afternoon.
2. Lower costs: No need to hire a film crew for simple social clips.
3. More creativity: Turn any idea into a visual story in minutes.

Technology is making creative tools accessible to everyone.

Have you tried generating an AI video yet?`
    },
    {
      hook: "Keep your private data safe with AI.",
      topic: "Simple common-sense safety rules when using public AI tools for work.",
      headline: "SAFE *AI PRACTICES*",
      subtext: "Simple rules to protect your privacy.",
      badge: "SAFETY GUIDE",
      content: `Keep your private data safe with AI.

AI tools are powerful, but you have to be smart about what you share with them.

Here are 3 simple safety rules for your daily work:

1. Never paste private passwords, bank details, or secret client names into public AI tools.
2. Use placeholder words: Change "John from ABC Corp" to "Client A from a retail store."
3. Check the facts: Always double-check numbers and claims before publishing.

AI is an amazing assistant when used with common sense.

Does your company have clear guidelines for using AI?`
    }
  ]
};

function generateClientSideDrafts(dateStr) {
  const baseline = new Date('2026-01-01T00:00:00Z');
  const current = new Date(`${dateStr}T00:00:00Z`);
  const diffDays = Math.floor(Math.abs(current - baseline) / (1000 * 60 * 60 * 24));
  const cycleDay = diffDays % 10;
  
  // 80% Marketing (8 days: 0, 1, 2, 3, 5, 6, 7, 8) and 20% AI (2 days: 4, 9)
  const isAi = [4, 9].includes(cycleDay);
  const category = isAi ? 'ai' : 'marketing';
  const pool = isAi ? CLIENT_TOPICS_LIBRARY.ai : CLIENT_TOPICS_LIBRARY.marketing;
  
  const archetypes = [
    { name: 'News Anchor', layout: 'news-card', palette: 'Corporate Navy', role: 'Business Advisor', env: 'Technology command center', cam: 'Looking at camera', suit: 'Navy business suit' },
    { name: 'Consultant Presentation', layout: 'presentation-slide', palette: 'Emerald Green', role: 'Business Coach', env: 'Executive boardroom', cam: 'Presentation shot', suit: 'Charcoal executive suit' },
    { name: 'Forbes Cover', layout: 'magazine-cover', palette: 'Electric Blue', role: 'Startup Founder', env: 'Luxury office', cam: 'Half-body portrait', suit: 'Smart casual blazer' },
    { name: 'Podcast Host', layout: 'podcast-layout', palette: 'Cyber Purple', role: 'Podcast Host', env: 'Podcast studio', cam: 'Sitting at desk', suit: 'Turtleneck with blazer' },
    { name: 'TED Speaker', layout: 'hero-center', palette: 'Crimson Red', role: 'Speaker', env: 'Auditorium stage', cam: 'Speaking on stage', suit: 'Conference speaker outfit' }
  ];

  // Randomize start offset on each manual regeneration so user gets unique posts every click
  const randomShift = Math.floor(Math.random() * pool.length);

  const newPosts = archetypes.map((arch, idx) => {
    const topicIndex = (diffDays * 5 + idx + randomShift) % pool.length;
    const t = pool[topicIndex];
    return {
      id: idx + 1,
      designArchetype: arch.name,
      layoutFamily: arch.layout,
      colorPalette: arch.palette,
      characterRole: arch.role,
      environment: arch.env,
      cameraStyle: arch.cam,
      clothingStyle: arch.suit,
      avatarPrompt: `Indian male, late 30s, warm tan skin, black hair, black thick-framed glasses, friendly confident expression, professional appearance, ${arch.role} in a ${arch.env}, ${arch.cam}, ${arch.suit}. Shot on 85mm lens, f/1.8 aperture, realistic lighting, shallow depth of field, premium professional photography, realistic skin texture, highly detailed, cinematic.`,
      postContent: {
        style: arch.name,
        hook: t.hook,
        content: t.content,
        sourceArticle: t.topic,
        imageHeadline: t.headline,
        imageSubtext: t.subtext,
        badgeText: t.badge,
        ctaText: "READ FULL POST"
      },
      layoutConfig: { dimensions: { width: 1080, height: 1080 } }
    };
  });

  const entryIndex = state.history.findIndex(h => h.date === dateStr);
  const newEntry = {
    date: dateStr,
    category: category,
    posts: newPosts,
    selectedPostId: null,
    postedAt: null,
    status: 'draft'
  };

  if (entryIndex !== -1) {
    state.history[entryIndex] = newEntry;
  } else {
    state.history.unshift(newEntry);
  }

  state.activeDate = dateStr;

  const localDb = getLocalDb();
  localDb.clientHistory = state.history;
  saveLocalDb(localDb);

  showToast(`⚡ Generated fresh ${category.toUpperCase()} drafts for ${dateStr}!`, 'success');
  renderDateList();
  renderActiveDrafts();
}

// Trigger Daily Post Generation manually (Instant 0.1-second client-side generation + optional remote trigger)
async function triggerManualGeneration() {
  const pat = state.settings.githubPat;
  const owner = state.settings.githubOwner || 'jagtapsourabh-4003';
  const repo = state.settings.githubRepo || 'linkedin-daily-publisher';
  const todayStr = getTodayIST();

  // 1. INSTANTLY REGENERATED ON CLICK - ZERO DIALOGS, ZERO POLLING, ZERO DELAYS!
  generateClientSideDrafts(todayStr);

  // 2. IF PAT IS CONFIGURED, ALSO TRIGGER REMOTE GITHUB ACTIONS IN BACKGROUND SILENTLY
  if (pat) {
    try {
      fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/generate.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({ 
          ref: 'main',
          inputs: { force: 'true' }
        })
      }).catch(e => console.warn('Remote trigger notice:', e.message));
    } catch (e) {
      console.warn('Background trigger failed:', e.message);
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

    // 1. Capture the exact live rendered canvas from the screen that user sees
    const onScreenCanvas = document.getElementById(`canvas-${postId}`);
    if (onScreenCanvas) {
      try {
        imageBase64 = onScreenCanvas.toDataURL('image/png');
      } catch (err) {
        console.warn('[Publish] Direct canvas export failed, creating offscreen buffer:', err.message);
      }
    }

    // Fallback: draw directly if onScreenCanvas export was unavailable
    if (!imageBase64 || imageBase64.length < 5000) {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1080;
      exportCanvas.height = 1080;
      const headlineText = (post && post.postContent && post.postContent.imageHeadline) || (post && post.imageHeadline) || '';
      const subtextText = (post && post.postContent && post.postContent.imageSubtext) || (post && post.imageSubtext) || '';
      if (activeEntry && post) {
        drawCreative(exportCanvas, activeEntry.category, headlineText, subtextText, post.id, activeEntry.date, Object.assign({}, post.layout || {}, post));
      }
      imageBase64 = exportCanvas.toDataURL('image/png');
    }

    // 2. Upload image to ImgBB if key is present, otherwise include base64 payload
    let imageUrl = '';
    const imgbbKey = state.settings.imgbbApiKey;
    
    if (imgbbKey) {
      btnElement.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Uploading graphic...`;
      try {
        const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const formData = new FormData();
        formData.append('image', rawBase64);
        
        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: 'POST',
          body: formData
        });
        
        if (imgbbResponse.ok) {
          const result = await imgbbResponse.json();
          if (result && result.success && result.data && result.data.url) {
            imageUrl = result.data.url;
            console.log(`[Browser ImgBB] Creative hosted successfully: ${imageUrl}`);
          }
        }
      } catch (uploadErr) {
        console.warn('[Publish] ImgBB upload skipped/failed, falling back to direct base64 transmission:', uploadErr.message);
      }
    }

    // 3. Post text and image directly to Webhook (Google Apps Script / Make.com / Zapier)
    btnElement.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Publishing to LinkedIn...`;
    
    const postContentText = (post && post.postContent && post.postContent.content) ? post.postContent.content : (post ? post.content : '');

    const postPayload = {
      text: postContentText,
      content: postContentText,
      post: postContentText,
      body: postContentText,
      imageUrl: imageUrl || '',
      image_url: imageUrl || '',
      image: imageUrl || imageBase64,
      mediaUrl: imageUrl || '',
      media_url: imageUrl || '',
      imageBase64: imageBase64 || '',
      image_base64: imageBase64 || '',
      dataUri: imageBase64 || '',
      style: (post && post.postContent && post.postContent.style) || (post && post.style) || 'Thought Leadership',
      sourceArticle: (post && post.postContent && post.postContent.sourceArticle) || (post && post.sourceArticle) || '',
      headline: (post && post.postContent && post.postContent.imageHeadline) || (post && post.imageHeadline) || '',
      category: activeEntry.category,
      date: date,
      timestamp: new Date().toISOString(),
      author: 'Marketing & Business Expert'
    };

    console.log('[Publish] Sending payload to webhook:', postPayload);

    // Send payload using text/plain to avoid CORS preflight failures on Google Apps Script / Make / Zapier
    let publishSuccess = false;
    try {
      const res = await fetch(state.settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(postPayload)
      });
      if (res.ok || res.type === 'opaque' || res.status === 200 || res.status === 302) {
        publishSuccess = true;
      }
    } catch (corsErr) {
      console.warn('[Publish] Standard fetch failed, attempting no-cors fallback for Google Flow...', corsErr.message);
      try {
        await fetch(state.settings.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(postPayload)
        });
        publishSuccess = true;
      } catch (noCorsErr) {
        throw new Error(`Webhook transmission error: ${noCorsErr.message}`);
      }
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

    showToast('🎉 Post and creative graphic sent successfully to your publishing flow!', 'success');
    await loadHistory();
  } catch (err) {
    console.error('[Publish] Error:', err);
    showToast(`Publish failed: ${err.message}`, 'error');
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

  // Option Tab Bar (Tabs for Option 1, 2, 3, 4, 5 and View All 5)
  if (Array.isArray(activeEntry.posts) && activeEntry.posts.length > 0) {
    if (state.activeTabPostId === undefined) state.activeTabPostId = 'all';

    const tabContainer = document.createElement('div');
    tabContainer.className = 'options-tab-container';
    tabContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; align-items: center; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); padding: 8px 12px; border-radius: 12px; margin-bottom: 20px;';

    const tabTitle = document.createElement('span');
    tabTitle.style.cssText = 'font-size: 0.85rem; font-weight: 700; color: #60a5fa; margin-right: 4px;';
    tabTitle.textContent = '📑 5 Post Options:';
    tabContainer.appendChild(tabTitle);

    // "View All 5" button
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    const isAllActive = (state.activeTabPostId === 'all');
    allBtn.className = `btn btn-sm ${isAllActive ? 'btn-primary' : 'btn-secondary'}`;
    allBtn.style.cssText = `font-size: 0.8rem; padding: 6px 12px; font-weight: 600; ${isAllActive ? 'box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);' : ''}`;
    allBtn.textContent = '👁️ View All (5)';
    allBtn.addEventListener('click', () => {
      state.activeTabPostId = 'all';
      renderActiveDrafts();
    });
    tabContainer.appendChild(allBtn);

    // Add individual tab buttons for each of the 5 posts
    activeEntry.posts.forEach(p => {
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      const isTabActive = (state.activeTabPostId === p.id);
      tabBtn.className = `btn btn-sm ${isTabActive ? 'btn-primary' : 'btn-secondary'}`;
      tabBtn.style.cssText = `font-size: 0.8rem; padding: 6px 12px; font-weight: 600; ${isTabActive ? 'box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);' : ''}`;
      const pStyle = p.designArchetype || (p.postContent && p.postContent.style) || `Option ${p.id}`;
      tabBtn.textContent = `Option ${p.id}: ${pStyle}`;
      tabBtn.addEventListener('click', () => {
        state.activeTabPostId = p.id;
        renderActiveDrafts();
      });
      tabContainer.appendChild(tabBtn);
    });

    if (isDayPosted) {
      const resetDayBtn = document.createElement('button');
      resetDayBtn.type = 'button';
      resetDayBtn.className = 'btn btn-secondary btn-sm';
      resetDayBtn.style.cssText = 'font-size: 0.8rem; padding: 6px 12px; font-weight: 600; margin-left: auto; background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); color: #93c5fd;';
      resetDayBtn.innerHTML = '🔄 Unlock &amp; Reset to Draft';
      resetDayBtn.addEventListener('click', () => {
        const localDb = getLocalDb();
        if (localDb.posted) {
          delete localDb.posted[state.activeDate];
          saveLocalDb(localDb);
        }
        activeEntry.status = 'draft';
        activeEntry.selectedPostId = null;
        showToast('🔓 Unlocked! You can edit and re-publish anytime.', 'success');
        renderActiveDrafts();
      });
      tabContainer.appendChild(resetDayBtn);
    }

    el.draftsContainer.appendChild(tabContainer);
  }

  const postsToRender = (state.activeTabPostId === 'all' || !state.activeTabPostId) 
    ? activeEntry.posts 
    : activeEntry.posts.filter(p => p.id === state.activeTabPostId);

  const finalPosts = (postsToRender.length > 0) ? postsToRender : activeEntry.posts;

  finalPosts.forEach(post => {
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
        <div class="header-main-info" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span class="badge" style="background: rgba(59, 130, 246, 0.25); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); font-weight: 700; font-size: 0.78rem; padding: 3px 8px; border-radius: 6px;">Option ${post.id} of 5</span>
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
          <div class="design-customizer-panel">
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
                    { val: -1, text: '👤 My Personal Uploaded Photo (Settings)' },
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
            <!-- Avatar Overlay, Position, Offset X/Y, Size, Rotation & Background Removal Controls -->
            <div class="customizer-row" style="margin-top: 12px; background: rgba(59, 130, 246, 0.06); padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.25); display: flex; flex-direction: column; gap: 12px;">
              <div style="font-weight: 700; font-size: 0.88rem; color: #93c5fd; display: flex; align-items: center; justify-content: space-between;">
                <span>👤 Avatar &amp; Photo Overlay Controls</span>
                <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 400;">Move, Scale, Rotate &amp; Cutout Photo</span>
              </div>
              <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: #e2e8f0;">
                  <input type="checkbox" id="check-overlay-avatar-${post.id}" ${post.overlayAvatar !== false ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                  📷 Overlay Photo
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: #f472b6;">
                  <input type="checkbox" id="check-bg-remove-${post.id}" ${post.removeAvatarBg ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                  ✨ Remove Background (Cutout)
                </label>
                <div style="margin-left: auto; display: flex; gap: 4px; align-items: center; background: rgba(15, 23, 42, 0.7); padding: 4px 6px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.35);">
                  <button type="button" id="btn-layer-front-${post.id}" class="btn btn-sm ${(!post.avatarLayer || post.avatarLayer === 'front') ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.75rem; padding: 4px 10px; line-height: 1.2;">
                    ⬆️ In Front
                  </button>
                  <button type="button" id="btn-layer-back-${post.id}" class="btn btn-sm ${post.avatarLayer === 'back' ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.75rem; padding: 4px 10px; line-height: 1.2; ${post.avatarLayer === 'back' ? 'background: #ec4899; border-color: #db2777;' : ''}">
                    ⬇️ Send to Background
                  </button>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div>
                  <label for="select-avatar-shape-${post.id}" style="font-size: 0.78rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Photo Framing (Shape)</label>
                  <select id="select-avatar-shape-${post.id}" class="customizer-select" style="font-size: 0.8rem; padding: 5px 8px;">
                    <option value="popout-circle" ${(!post.avatarShape || post.avatarShape === 'popout-circle') ? 'selected' : ''}>🔘 3D Circle Pop-Out</option>
                    <option value="card" ${post.avatarShape === 'card' ? 'selected' : ''}>🔲 Rounded Card Frame</option>
                    <option value="cutout" ${post.avatarShape === 'cutout' ? 'selected' : ''}>👤 Free Silhouette</option>
                    <option value="phone" ${post.avatarShape === 'phone' ? 'selected' : ''}>📱 3D Phone Mockup</option>
                  </select>
                </div>
                <div>
                  <label for="select-avatar-pos-${post.id}" style="font-size: 0.78rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Position Anchor</label>
                  <select id="select-avatar-pos-${post.id}" class="customizer-select" style="font-size: 0.8rem; padding: 5px 8px;">
                    <option value="auto" ${(!post.avatarPos || post.avatarPos === 'auto') ? 'selected' : ''}>📍 Auto (Match Post Layout)</option>
                    <option value="bottom-right" ${post.avatarPos === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
                    <option value="bottom-left" ${post.avatarPos === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
                    <option value="top-right" ${post.avatarPos === 'top-right' ? 'selected' : ''}>Top Right</option>
                    <option value="top-left" ${post.avatarPos === 'top-left' ? 'selected' : ''}>Top Left</option>
                    <option value="center" ${post.avatarPos === 'center' ? 'selected' : ''}>Center</option>
                  </select>
                </div>
                <div>
                  <label for="slider-avatar-size-${post.id}" style="font-size: 0.78rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Avatar Size: <strong id="val-avatar-size-${post.id}" style="color: #60a5fa;">${post.avatarSize || 340}px</strong></label>
                  <input type="range" id="slider-avatar-size-${post.id}" min="100" max="800" step="10" value="${post.avatarSize || 340}" class="customizer-range">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div>
                  <label for="slider-avatar-x-${post.id}" style="font-size: 0.75rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Position X: <strong id="val-avatar-x-${post.id}" style="color: #38bdf8;">${post.avatarOffsetX || 0}px</strong></label>
                  <input type="range" id="slider-avatar-x-${post.id}" min="-450" max="450" step="5" value="${post.avatarOffsetX || 0}" class="customizer-range">
                </div>
                <div>
                  <label for="slider-avatar-y-${post.id}" style="font-size: 0.75rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Position Y: <strong id="val-avatar-y-${post.id}" style="color: #38bdf8;">${post.avatarOffsetY || 0}px</strong></label>
                  <input type="range" id="slider-avatar-y-${post.id}" min="-450" max="450" step="5" value="${post.avatarOffsetY || 0}" class="customizer-range">
                </div>
                <div>
                  <label for="slider-avatar-rot-${post.id}" style="font-size: 0.75rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Tilt Angle: <strong id="val-avatar-rot-${post.id}" style="color: #a7f3d0;">${post.avatarRotation || 0}°</strong></label>
                  <input type="range" id="slider-avatar-rot-${post.id}" min="-45" max="45" step="1" value="${post.avatarRotation || 0}" class="customizer-range">
                </div>
              </div>
              <div>
                <label for="slider-bg-sensitivity-${post.id}" style="font-size: 0.78rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Cutout Sensitivity (Background Remover): <strong id="val-bg-sensitivity-${post.id}" style="color: #f472b6;">${post.bgSensitivity || 55}</strong></label>
                <input type="range" id="slider-bg-sensitivity-${post.id}" min="15" max="130" step="5" value="${post.bgSensitivity || 55}" class="customizer-range">
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
                <span class="badge" style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3); padding:6px 12px; border-radius:6px; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Published
                </span>
                <button class="btn btn-primary btn-sm ${activeEntry.category === 'marketing' ? 'marketing-theme' : ''}" id="btn-post-${post.id}" title="Re-publish this post with your latest edits to LinkedIn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
                  Re-publish to LinkedIn
                </button>
                <button class="btn btn-secondary btn-sm" id="btn-reset-draft-${post.id}" title="Reset to Draft so you can start fresh" style="font-size:0.78rem;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  Reset to Draft
                </button>
               </div>`
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
      drawCreative(canvas, activeEntry.category, headlineText, subtextText, post.id, activeEntry.date, Object.assign({}, post.layout || {}, post));
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

    // Design Customizer Event Listeners (Always active for infinite editing!)
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
      const checkOverlayAvatar = cardEl.querySelector(`#check-overlay-avatar-${post.id}`);
      const checkBgRemove = cardEl.querySelector(`#check-bg-remove-${post.id}`);
      const selectAvatarShape = cardEl.querySelector(`#select-avatar-shape-${post.id}`);
      const selectAvatarPos = cardEl.querySelector(`#select-avatar-pos-${post.id}`);
      const sliderAvatarSize = cardEl.querySelector(`#slider-avatar-size-${post.id}`);
      const labelAvatarSize = cardEl.querySelector(`#val-avatar-size-${post.id}`);
      const sliderBgSensitivity = cardEl.querySelector(`#slider-bg-sensitivity-${post.id}`);
      const labelBgSensitivity = cardEl.querySelector(`#val-bg-sensitivity-${post.id}`);
      const sliderAvatarX = cardEl.querySelector(`#slider-avatar-x-${post.id}`);
      const labelAvatarX = cardEl.querySelector(`#val-avatar-x-${post.id}`);
      const sliderAvatarY = cardEl.querySelector(`#slider-avatar-y-${post.id}`);
      const labelAvatarY = cardEl.querySelector(`#val-avatar-y-${post.id}`);
      const sliderAvatarRot = cardEl.querySelector(`#slider-avatar-rot-${post.id}`);
      const labelAvatarRot = cardEl.querySelector(`#val-avatar-rot-${post.id}`);

      const triggerRedrawAndSave = (isKeystroke = false) => {
        // Update local object memory
        post.layoutFamily = layoutSelect.value;
        post.colorPalette = paletteSelect.value;
        post.avatarStyleIdx = parseInt(avatarSelect.value);
        post.headlineFontSize = parseInt(sliderHeadlineSize.value);
        post.subtextFontSize = parseInt(sliderSubtextSize.value);
        if (checkOverlayAvatar) post.overlayAvatar = checkOverlayAvatar.checked;
        if (checkBgRemove) post.removeAvatarBg = checkBgRemove.checked;
        if (selectAvatarShape) post.avatarShape = selectAvatarShape.value;
        if (selectAvatarPos) post.avatarPos = selectAvatarPos.value;
        post.avatarLayer = post.avatarLayer || 'front';
        if (sliderAvatarSize) post.avatarSize = parseInt(sliderAvatarSize.value);
        if (sliderBgSensitivity) post.bgSensitivity = parseInt(sliderBgSensitivity.value);
        if (sliderAvatarX) post.avatarOffsetX = parseInt(sliderAvatarX.value);
        if (sliderAvatarY) post.avatarOffsetY = parseInt(sliderAvatarY.value);
        if (sliderAvatarRot) post.avatarRotation = parseInt(sliderAvatarRot.value);

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
        drawCreative(canvas, activeEntry.category, headlineInput.value, subtextInput.value, post.id, activeEntry.date, Object.assign({}, post.layout || {}, post));

        // Save layout modifications to server/localStorage (only on select change or text input blur)
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
            overlayAvatar: checkOverlayAvatar ? checkOverlayAvatar.checked : true,
            removeAvatarBg: checkBgRemove ? checkBgRemove.checked : false,
            avatarShape: selectAvatarShape ? selectAvatarShape.value : (post.avatarShape || 'popout-circle'),
            avatarPos: selectAvatarPos ? selectAvatarPos.value : (post.avatarPos || 'auto'),
            avatarLayer: post.avatarLayer || 'front',
            avatarSize: sliderAvatarSize ? parseInt(sliderAvatarSize.value) : 340,
            avatarOffsetX: sliderAvatarX ? parseInt(sliderAvatarX.value) : 0,
            avatarOffsetY: sliderAvatarY ? parseInt(sliderAvatarY.value) : 0,
            avatarRotation: sliderAvatarRot ? parseInt(sliderAvatarRot.value) : 0,
            bgSensitivity: sliderBgSensitivity ? parseInt(sliderBgSensitivity.value) : 55,
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

      // Avatar customizer sliders & dropdowns listeners
      if (checkOverlayAvatar) {
        checkOverlayAvatar.addEventListener('change', () => triggerRedrawAndSave(false));
      }
      if (checkBgRemove) {
        checkBgRemove.addEventListener('change', (e) => {
          if (e.target.checked) {
            showToast('✨ Automatic background removal applied to photo cutout!', 'success');
          } else {
            showToast('Restored default avatar photo frame.', 'info');
          }
          triggerRedrawAndSave(false);
        });
      }
      if (selectAvatarShape) {
        selectAvatarShape.addEventListener('change', () => triggerRedrawAndSave(false));
      }
      if (selectAvatarPos) {
        selectAvatarPos.addEventListener('change', () => triggerRedrawAndSave(false));
      }
      const btnLayerFront = cardEl.querySelector(`#btn-layer-front-${post.id}`);
      const btnLayerBack = cardEl.querySelector(`#btn-layer-back-${post.id}`);
      if (btnLayerFront) {
        btnLayerFront.addEventListener('click', () => {
          post.avatarLayer = 'front';
          btnLayerFront.className = 'btn btn-sm btn-primary';
          btnLayerFront.style.background = '';
          btnLayerFront.style.borderColor = '';
          if (btnLayerBack) {
            btnLayerBack.className = 'btn btn-sm btn-secondary';
            btnLayerBack.style.background = '';
            btnLayerBack.style.borderColor = '';
          }
          showToast('⬆️ Avatar moved to front of card!', 'info');
          triggerRedrawAndSave(false);
        });
      }
      if (btnLayerBack) {
        btnLayerBack.addEventListener('click', () => {
          post.avatarLayer = 'back';
          btnLayerBack.className = 'btn btn-sm btn-primary';
          btnLayerBack.style.background = '#ec4899';
          btnLayerBack.style.borderColor = '#db2777';
          if (btnLayerFront) {
            btnLayerFront.className = 'btn btn-sm btn-secondary';
          }
          showToast('⬇️ Avatar moved to background of post!', 'success');
          triggerRedrawAndSave(false);
        });
      }
      if (sliderAvatarSize) {
        sliderAvatarSize.addEventListener('input', () => {
          if (labelAvatarSize) labelAvatarSize.textContent = `${sliderAvatarSize.value}px`;
          triggerRedrawAndSave(true);
        });
        sliderAvatarSize.addEventListener('change', () => triggerRedrawAndSave(false));
      }
      if (sliderAvatarX) {
        sliderAvatarX.addEventListener('input', () => {
          if (labelAvatarX) labelAvatarX.textContent = `${sliderAvatarX.value}px`;
          triggerRedrawAndSave(true);
        });
        sliderAvatarX.addEventListener('change', () => triggerRedrawAndSave(false));
      }
      if (sliderAvatarY) {
        sliderAvatarY.addEventListener('input', () => {
          if (labelAvatarY) labelAvatarY.textContent = `${sliderAvatarY.value}px`;
          triggerRedrawAndSave(true);
        });
        sliderAvatarY.addEventListener('change', () => triggerRedrawAndSave(false));
      }
      if (sliderAvatarRot) {
        sliderAvatarRot.addEventListener('input', () => {
          if (labelAvatarRot) labelAvatarRot.textContent = `${sliderAvatarRot.value}°`;
          triggerRedrawAndSave(true);
        });
        sliderAvatarRot.addEventListener('change', () => triggerRedrawAndSave(false));
      }
      if (sliderBgSensitivity) {
        sliderBgSensitivity.addEventListener('input', () => {
          if (labelBgSensitivity) labelBgSensitivity.textContent = sliderBgSensitivity.value;
          triggerRedrawAndSave(true);
        });
        sliderBgSensitivity.addEventListener('change', () => triggerRedrawAndSave(false));
      }

      // Attach Interactive Mouse Drag, Drop & Scroll-Resize to Canvas
      if (canvas) {
        makeCanvasInteractive(canvas, post, cardEl, activeEntry.category, state.activeDate);
      }

    // Copy Content Button Listener
    const copyBtn = cardEl.querySelector(`#btn-copy-${post.id}`);
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textarea.value);
        showToast('Copied content to clipboard!', 'success');
      });
    }

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

        // Minimalist payload
        const payloadText = `[HEADLINE]\n${headlineVal}\n\n[SUBTEXT]\n${subtextVal}\n\n[TOP TAG]\n${badgeVal}\n\n[CTA BUTTON]\n${ctaVal}\n\n[SELECTED PHOTO LINK]\n${photoUrl}`;
        
        navigator.clipboard.writeText(payloadText);
        if (!state.settings.canvaTemplateUrl) {
          showToast('Copied text & photo URL to clipboard! Opening Canva...', 'info');
        } else {
          showToast('Copied text & photo URL! Opening your custom Canva template...', 'success');
        }
        
        const canvaTargetUrl = state.settings.canvaTemplateUrl || 'https://www.canva.com/';
        window.open(canvaTargetUrl, '_blank');
      });
    }

    // Open Photo Button Listener
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

    // Post / Re-publish to Google Flow button listener (Always active!)
    const postBtn = cardEl.querySelector(`#btn-post-${post.id}`);
    if (postBtn) {
      postBtn.addEventListener('click', (e) => {
        postToGoogleFlow(post.id, e.currentTarget);
      });
    }

    // Reset to Draft button listener
    const resetDraftBtn = cardEl.querySelector(`#btn-reset-draft-${post.id}`);
    if (resetDraftBtn) {
      resetDraftBtn.addEventListener('click', () => {
        const localDb = getLocalDb();
        if (localDb.posted) {
          delete localDb.posted[state.activeDate];
          saveLocalDb(localDb);
        }
        activeEntry.status = 'draft';
        activeEntry.selectedPostId = null;
        showToast('🔄 Reset to draft! You can now edit and re-publish whenever you wish.', 'info');
        renderActiveDrafts();
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
  const cycleDay = diffDays % 10;
  const isAi = [4, 9].includes(cycleDay); // 80% Marketing, 20% AI
  const category = isAi ? 'AI Trend Day' : 'Marketing Day';
  
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

// High-Resolution Background Removal Helper
// Checks pre-cutout HD images first (0ms instantaneous), falls back to remove.bg API
function createCutoutAvatarCanvas(sourceImg, styleIdx = -1) {
  // 1. If stock avatar pose (0..17), use pre-cutout HD transparent image
  if (styleIdx >= 0 && optionCutoutAvatars[styleIdx] && (optionCutoutAvatars[styleIdx].complete || optionCutoutAvatarsLoaded[styleIdx])) {
    return optionCutoutAvatars[styleIdx];
  }

  // 2. If personal photo (-1), check cached personal cutout or local file
  if (styleIdx === -1 || !sourceImg) {
    if (personalAvatarCutout && (personalAvatarCutout.complete || personalAvatarCutout.naturalWidth > 0)) {
      return personalAvatarCutout;
    }
  }

  // 3. Check memory cache by image source
  const imgSrc = (sourceImg && (sourceImg.src || sourceImg.currentSrc)) ? (sourceImg.src || sourceImg.currentSrc) : 'img';
  const cacheKey = `removebg_${imgSrc.substring(imgSrc.length - 60)}`;

  if (avatarCutoutCache.has(cacheKey)) {
    const cached = avatarCutoutCache.get(cacheKey);
    if (cached && (cached.complete || cached.naturalWidth > 0)) {
      return cached;
    }
  }

  // 4. If already processing this image, return original while API finishes
  if (avatarCutoutPending.has(cacheKey)) {
    return sourceImg;
  }

  const apiKey = (state.settings && state.settings.removebgApiKey) ? state.settings.removebgApiKey : 'xjhELgTo5gxqmGRyvX99FoCJ';
  if (!apiKey) {
    return sourceImg;
  }

  // 5. Asynchronously call remove.bg API for custom uploaded images
  avatarCutoutPending.add(cacheKey);
  console.log('[Cutout] Calling Remove.bg API...');

  const tempCanvas = document.createElement('canvas');
  const tw = (sourceImg && (sourceImg.naturalWidth || sourceImg.width)) ? (sourceImg.naturalWidth || sourceImg.width) : 800;
  const th = (sourceImg && (sourceImg.naturalHeight || sourceImg.height)) ? (sourceImg.naturalHeight || sourceImg.height) : 800;
  tempCanvas.width = tw;
  tempCanvas.height = th;
  const tempCtx = tempCanvas.getContext('2d');
  if (sourceImg) tempCtx.drawImage(sourceImg, 0, 0, tw, th);

  let base64Data;
  try {
    base64Data = tempCanvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, '');
  } catch (e) {
    console.warn('[Cutout] Cannot export image for API:', e.message);
    avatarCutoutPending.delete(cacheKey);
    return sourceImg;
  }

  const formData = new FormData();
  formData.append('image_file_b64', base64Data);
  formData.append('size', 'auto');

  fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => {
        throw new Error(err.errors ? err.errors.map(e => e.title).join(', ') : `HTTP ${res.status}`);
      });
    }
    return res.blob();
  })
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const cutoutImg = new Image();
    cutoutImg.crossOrigin = 'anonymous';
    cutoutImg.onload = () => {
      avatarCutoutCache.set(cacheKey, cutoutImg);
      avatarCutoutPending.delete(cacheKey);
      console.log('[Cutout] Background removed successfully!');
      showToast('✅ Background removed via AI!', 'info');
      if (state.history.length > 0) renderActiveDrafts();
    };
    cutoutImg.src = url;
  })
  .catch(err => {
    avatarCutoutPending.delete(cacheKey);
    console.warn('[Cutout] Remove.bg fallback:', err.message);
  });

  return sourceImg;
}

// Calculate exact bounding box of avatar photo on 1080x1080 canvas
function getAvatarBoundingBox(canvas, post, w = 1080, h = 1080) {
  if (canvas && canvas._avatarBBox) {
    return canvas._avatarBBox;
  }
  const avW = post.avatarSize || 340;
  const avH = Math.round(avW * 1.38);
  const pos = post.avatarPos || 'bottom-right';

  let baseAvX = w - avW - 40;
  let baseAvY = h - avH - 20;

  if (post.customCanvaGraphic) {
    if (pos === 'bottom-left') {
      baseAvX = 40;
      baseAvY = h - avH - 20;
    } else if (pos === 'top-right') {
      baseAvX = w - avW - 40;
      baseAvY = 40;
    } else if (pos === 'top-left') {
      baseAvX = 40;
      baseAvY = 40;
    } else if (pos === 'center') {
      baseAvX = Math.round((w - avW) / 2);
      baseAvY = Math.round((h - avH) / 2);
    }
  } else {
    const layoutFam = (post.layoutFamily || 'split-left').toLowerCase();
    if (layoutFam === 'split-left') {
      baseAvX = 280 - avW / 2;
      baseAvY = 540 - avH / 2;
    } else if (layoutFam === 'hero-center') {
      baseAvX = 540 - avW / 2;
      baseAvY = 450 - avH / 2;
    } else if (layoutFam === 'news-card') {
      baseAvX = 750 - avW / 2;
      baseAvY = 540 - avH / 2;
    } else if (layoutFam === 'magazine-cover') {
      baseAvX = 540 - avW / 2;
      baseAvY = 540 - avH / 2;
    } else {
      if (pos === 'bottom-left') {
        baseAvX = 40;
        baseAvY = h - avH - 20;
      } else if (pos === 'top-right') {
        baseAvX = w - avW - 40;
        baseAvY = 40;
      } else if (pos === 'top-left') {
        baseAvX = 40;
        baseAvY = 40;
      } else if (pos === 'center') {
        baseAvX = Math.round((w - avW) / 2);
        baseAvY = Math.round((h - avH) / 2);
      } else {
        baseAvX = w - avW - 40;
        baseAvY = h - avH - 20;
      }
    }
  }

  const avX = baseAvX + (post.avatarOffsetX || 0);
  const avY = baseAvY + (post.avatarOffsetY || 0);

  return { x: avX, y: avY, w: avW, h: avH, cx: avX + avW / 2, cy: avY + avH / 2, r: avW / 2 };
}

// Draw interactive bounding box & drag handles around avatar photo when hovering/dragging
function drawInteractiveAvatarOverlay(canvas, post) {
  if (post.overlayAvatar === false) return;
  const ctx = canvas.getContext('2d');
  const bbox = getAvatarBoundingBox(canvas, post, canvas.width, canvas.height);

  ctx.save();
  const rotation = post.avatarRotation || 0;
  if (rotation !== 0) {
    const cx = bbox.x + bbox.w / 2;
    const cy = bbox.y + bbox.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  // Draw dashed neon border outline around avatar photo
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(bbox.x - 6, bbox.y - 6, bbox.w + 12, bbox.h + 12);
  ctx.setLineDash([]);

  // Draw corner resize handle (bottom right)
  const handleSize = 28;
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(bbox.x + bbox.w + 6, bbox.y + bbox.h + 6, handleSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw top-left handle
  ctx.beginPath();
  ctx.arc(bbox.x - 6, bbox.y - 6, handleSize / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Drag Helper Label Badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(bbox.x, Math.max(10, bbox.y - 42), bbox.w, 34, 8);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✋ Click & Drag | Scroll Wheel to Resize', bbox.x + bbox.w / 2, Math.max(32, bbox.y - 20));

  ctx.restore();
}

// Attach interactive mouse drag, drop & wheel resize listeners directly to canvas element
function makeCanvasInteractive(canvas, post, cardEl, category, activeDate) {
  let isDragging = false;
  let isResizing = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let initOffsetX = 0;
  let initOffsetY = 0;
  let initSize = 340;

  const sliderX = cardEl.querySelector(`#slider-avatar-x-${post.id}`);
  const labelX = cardEl.querySelector(`#val-avatar-x-${post.id}`);
  const sliderY = cardEl.querySelector(`#slider-avatar-y-${post.id}`);
  const labelY = cardEl.querySelector(`#val-avatar-y-${post.id}`);
  const sliderSize = cardEl.querySelector(`#slider-avatar-size-${post.id}`);
  const labelSize = cardEl.querySelector(`#val-avatar-size-${post.id}`);

  const getHeadlineVal = () => {
    const el = cardEl.querySelector(`#input-headline-${post.id}`);
    return el ? el.value : (post.postContent ? (post.postContent.imageHeadline || '') : '');
  };
  const getSubtextVal = () => {
    const el = cardEl.querySelector(`#input-subtext-${post.id}`);
    return el ? el.value : (post.postContent ? (post.postContent.imageSubtext || '') : '');
  };

  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const isMouseOverAvatar = (mx, my) => {
    const bbox = getAvatarBoundingBox(canvas, post, canvas.width, canvas.height);
    return (
      mx >= bbox.x - 30 &&
      mx <= bbox.x + bbox.w + 30 &&
      my >= bbox.y - 30 &&
      my <= bbox.y + bbox.h + 30
    );
  };

  const isMouseOverResizeHandle = (mx, my) => {
    const bbox = getAvatarBoundingBox(canvas, post, canvas.width, canvas.height);
    const handleX = bbox.x + bbox.w;
    const handleY = bbox.y + bbox.h;
    return Math.hypot(mx - handleX, my - handleY) < 50;
  };

  let animFrameId = null;
  const scheduleRedraw = (showOverlay = true) => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(() => {
      animFrameId = null;
      drawCreative(canvas, category, getHeadlineVal(), getSubtextVal(), post.id, activeDate, Object.assign({}, post.layout || {}, post));
      if (showOverlay) {
        drawInteractiveAvatarOverlay(canvas, post);
      }
    });
  };

  const onPointerMove = (clientX, clientY) => {
    const { x, y } = getCanvasCoords(clientX, clientY);

    if (!isDragging && !isResizing) {
      if (isMouseOverResizeHandle(x, y)) {
        canvas.style.cursor = 'nwse-resize';
      } else if (isMouseOverAvatar(x, y)) {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'default';
      }
      return;
    }

    if (isDragging) {
      canvas.style.cursor = 'grabbing';
      const dx = Math.round(x - startMouseX);
      const dy = Math.round(y - startMouseY);

      post.avatarOffsetX = Math.max(-600, Math.min(600, initOffsetX + dx));
      post.avatarOffsetY = Math.max(-600, Math.min(600, initOffsetY + dy));

      if (sliderX) sliderX.value = post.avatarOffsetX;
      if (labelX) labelX.textContent = `${post.avatarOffsetX}px`;
      if (sliderY) sliderY.value = post.avatarOffsetY;
      if (labelY) labelY.textContent = `${post.avatarOffsetY}px`;

      scheduleRedraw(true);
    } else if (isResizing) {
      canvas.style.cursor = 'nwse-resize';
      const dx = Math.round(x - startMouseX);
      post.avatarSize = Math.max(100, Math.min(800, initSize + dx));

      if (sliderSize) sliderSize.value = post.avatarSize;
      if (labelSize) labelSize.textContent = `${post.avatarSize}px`;

      scheduleRedraw(true);
    }
  };

  const onPointerDown = (clientX, clientY, e) => {
    const { x, y } = getCanvasCoords(clientX, clientY);

    if (isMouseOverResizeHandle(x, y)) {
      isResizing = true;
      startMouseX = x;
      startMouseY = y;
      initSize = post.avatarSize || 340;
      if (e) e.preventDefault();
    } else if (isMouseOverAvatar(x, y)) {
      isDragging = true;
      startMouseX = x;
      startMouseY = y;
      initOffsetX = post.avatarOffsetX || 0;
      initOffsetY = post.avatarOffsetY || 0;
      canvas.style.cursor = 'grabbing';
      if (e) e.preventDefault();
    }
  };

  const onPointerUp = () => {
    if (isDragging || isResizing) {
      isDragging = false;
      isResizing = false;
      canvas.style.cursor = 'grab';

      saveDesignEdit(activeDate, post.id, {
        avatarOffsetX: post.avatarOffsetX || 0,
        avatarOffsetY: post.avatarOffsetY || 0,
        avatarSize: post.avatarSize || 340,
        avatarRotation: post.avatarRotation || 0,
        avatarPos: post.avatarPos || 'auto'
      });
      showToast('🎯 Photo position updated via mouse!', 'info');
      // Redraw clean canvas without overlay
      scheduleRedraw(false);
    }
  };

  // Mouse event listeners
  canvas.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
  canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY, e));
  window.addEventListener('mouseup', onPointerUp);

  // Touch event listeners for touchscreens & mobile
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY, e);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      if (isDragging || isResizing) e.preventDefault();
    }
  }, { passive: false });

  canvas.addEventListener('touchend', onPointerUp);

  // Mouse wheel scroll to resize avatar size smoothly
  canvas.addEventListener('wheel', (e) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    if (isMouseOverAvatar(x, y)) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 15 : -15;
      const curSize = post.avatarSize || 340;
      post.avatarSize = Math.max(100, Math.min(800, curSize + delta));

      if (sliderSize) sliderSize.value = post.avatarSize;
      if (labelSize) labelSize.textContent = `${post.avatarSize}px`;

      scheduleRedraw(true);

      saveDesignEdit(activeDate, post.id, { avatarSize: post.avatarSize });
    }
  }, { passive: false });
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
        let styleIdx = (postId - 1) % 18;
        if (customLayout && customLayout.avatarStyleIdx !== undefined) styleIdx = customLayout.avatarStyleIdx;
        
        let activeAvImg = avatarImg;
        // If user selected a specific stock avatar pose (0..17), use that option avatar!
        // If user selected -1 (Personal Profile Photo), use avatarImg!
        if (styleIdx >= 0 && optionAvatars[styleIdx] && (optionAvatars[styleIdx].complete || optionAvatarsLoaded[styleIdx])) {
          activeAvImg = optionAvatars[styleIdx];
        }

        if (activeAvImg && (activeAvImg.complete || activeAvImg.naturalWidth > 0)) {
          ctx.save();

          const avW = (customLayout && customLayout.avatarSize) ? customLayout.avatarSize : 340;
          const avH = Math.round(avW * 1.38);
          const pos = (customLayout && customLayout.avatarPos) ? customLayout.avatarPos : 'bottom-right';
          let baseAvX = w - avW - 40;
          let baseAvY = h - avH - 20;

          if (pos === 'bottom-left') {
            baseAvX = 40;
            baseAvY = h - avH - 20;
          } else if (pos === 'top-right') {
            baseAvX = w - avW - 40;
            baseAvY = 40;
          } else if (pos === 'top-left') {
            baseAvX = 40;
            baseAvY = 40;
          } else if (pos === 'center') {
            baseAvX = Math.round((w - avW) / 2);
            baseAvY = Math.round((h - avH) / 2);
          }

          const offsetX = (customLayout && customLayout.avatarOffsetX) ? customLayout.avatarOffsetX : 0;
          const offsetY = (customLayout && customLayout.avatarOffsetY) ? customLayout.avatarOffsetY : 0;
          const rotation = (customLayout && customLayout.avatarRotation) ? customLayout.avatarRotation : 0;

          const avX = baseAvX + offsetX;
          const avY = baseAvY + offsetY;

          // Store exact computed bounding box on canvas for custom graphic
          canvas._avatarBBox = {
            x: avX,
            y: avY,
            w: avW,
            h: avH,
            cx: avX + avW / 2,
            cy: avY + avH / 2,
            r: avW / 2
          };

          const sensitivity = (customLayout && customLayout.bgSensitivity) ? customLayout.bgSensitivity : 55;

          if (rotation !== 0) {
            const cx = avX + avW / 2;
            const cy = avY + avH / 2;
            ctx.translate(cx, cy);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-cx, -cy);
          }

          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetX = -10;
          ctx.shadowOffsetY = 15;

          if (removeAvatarBg) {
            // Cutout transparent avatar without background
            const cutoutCanvas = createCutoutAvatarCanvas(activeAvImg, styleIdx);
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
  let styleIdx = (postId - 1) % 18; // Outfit style rotates by postId
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
  if (optionAvatars[styleIdx] && (optionAvatars[styleIdx].complete || optionAvatarsLoaded[styleIdx])) {
    activeAvImg = optionAvatars[styleIdx];
  } else if (state.settings.rotateOutfits !== false && optionAvatarsLoaded[styleIdx % 18]) {
    activeAvImg = optionAvatars[styleIdx % 18];
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
      
      const isAvatarInBack = (customLayout && customLayout.avatarLayer === 'back');

      // Helper function to render avatar
      const renderAvatar = () => {
        const overlayAvatar = customLayout ? (customLayout.overlayAvatar !== false) : true;
        if (!activeLayout.avatar || !overlayAvatar) return;

        const av = Object.assign({}, activeLayout.avatar);

        let styleIdx = (postId - 1) % 18;
        if (customLayout && customLayout.avatarStyleIdx !== undefined) styleIdx = customLayout.avatarStyleIdx;

        let dynamicAvImg = avatarImg;
        if (styleIdx >= 0 && optionAvatars[styleIdx] && (optionAvatars[styleIdx].complete || optionAvatarsLoaded[styleIdx])) {
          dynamicAvImg = optionAvatars[styleIdx];
        }

        // Apply custom size scaling if modified
        if (customLayout && customLayout.avatarSize) {
          const newW = customLayout.avatarSize;
          const ratio = newW / (av.w || 340);
          av.w = newW;
          av.h = Math.round((av.h || 340) * ratio);
        }

        // Apply position anchor override if explicitly specified (not auto/template)
        if (customLayout && customLayout.avatarPos && customLayout.avatarPos !== 'auto') {
          const pos = customLayout.avatarPos;
          if (pos === 'bottom-right') {
            av.x = w - av.w / 2 - 40;
            av.y = h - av.h / 2 - 20;
          } else if (pos === 'bottom-left') {
            av.x = av.w / 2 + 40;
            av.y = h - av.h / 2 - 20;
          } else if (pos === 'top-right') {
            av.x = w - av.w / 2 - 40;
            av.y = av.h / 2 + 40;
          } else if (pos === 'top-left') {
            av.x = av.w / 2 + 40;
            av.y = av.h / 2 + 40;
          } else if (pos === 'center') {
            av.x = w / 2;
            av.y = h / 2;
          }
        }

        // Apply manual X and Y offsets
        if (customLayout && customLayout.avatarOffsetX) av.x += customLayout.avatarOffsetX;
        if (customLayout && customLayout.avatarOffsetY) av.y += customLayout.avatarOffsetY;

        // Store exact computed bounding box on canvas for seamless interactive mouse controls
        canvas._avatarBBox = {
          x: av.x - av.w / 2,
          y: av.y - av.h / 2,
          w: av.w,
          h: av.h,
          cx: av.x,
          cy: av.y,
          r: av.w / 2
        };

        const rotation = (customLayout && customLayout.avatarRotation) ? customLayout.avatarRotation : 0;
        const removeAvatarBg = customLayout ? !!customLayout.removeAvatarBg : false;

        ctx.save();
        
        // Tilt or manual rotation
        const totalRotation = (av.tilt || 0) + (rotation * Math.PI / 180);
        if (totalRotation !== 0) {
          ctx.translate(av.x, av.y);
          ctx.rotate(totalRotation);
          ctx.translate(-av.x, -av.y);
        }
        
        // Glow backdrop behind avatar
        if (av.glowColor && !removeAvatarBg) {
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
        
        // Draw the avatar with auto-shape matching & 3D pop-out
        const effectiveShape = (customLayout && customLayout.avatarShape && customLayout.avatarShape !== 'auto') 
          ? customLayout.avatarShape 
          : (av.type || 'popout-circle');

        if (effectiveShape === 'popout-circle' || effectiveShape === 'circle') {
          // 3D Pop-out circle: body clipped in circle, head pops out over the top!
          drawAvatarPopoutCircle(ctx, av.x, av.y, av.w / 2, dynamicAvImg, palette, av.filter, removeAvatarBg, styleIdx);
        } else if (effectiveShape === 'card' || effectiveShape === 'rect') {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(av.x - av.w/2, av.y - av.h/2, av.w, av.h, 24);
          ctx.clip();
          drawAvatarForCard(ctx, av.x - av.w/2, av.y - av.h/2, av.w, av.h, av.filter, styleIdx, dynamicAvImg, removeAvatarBg);
          ctx.restore();
        } else if (effectiveShape === 'phone') {
          drawPhoneMockup(ctx, av.x - av.w/2, av.y - av.h/2, av.w, av.h, true, dynamicAvImg, av.filter, styleIdx, palette);
        } else {
          // Free silhouette cutout
          if (removeAvatarBg) {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 10;
            const cutoutResult = createCutoutAvatarCanvas(dynamicAvImg, styleIdx);
            ctx.drawImage(cutoutResult, av.x - av.w/2, av.y - av.h/2, av.w, av.h);
            ctx.restore();
          } else {
            drawAvatarForCard(ctx, av.x - av.w/2, av.y - av.h/2, av.w, av.h, av.filter, styleIdx, dynamicAvImg, false);
          }
        }
        
        // Neon stroke border outline on top
        if (av.strokeColor && !removeAvatarBg) {
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
      };

      // If Avatar is configured as "Back", draw it FIRST directly in the background!
      if (isAvatarInBack) {
        renderAvatar();
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
      
      // If Avatar is configured as "Front" (default), render it on top of shapes & text!
      if (!isAvatarInBack) {
        renderAvatar();
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

function drawAvatarForCard(ctx, x, y, w, h, filter, styleIdx, avatarImg, removeBg = false) {
  ctx.save();
  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth !== 0) {
    if (filter) ctx.filter = filter;
    
    let targetImg = avatarImg;
    if (removeBg) {
      targetImg = createCutoutAvatarCanvas(avatarImg, 50);
    }
    
    const imgW = targetImg.width || targetImg.naturalWidth || 400;
    const imgH = targetImg.height || targetImg.naturalHeight || 400;
    
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
    
    ctx.drawImage(targetImg, cropX, cropY, cropW, cropH, x, y, w, h);
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

// 3D Avatar Circle Pop-Out: Body is clipped inside circle, while Head pops out above the top ring!
function drawAvatarPopoutCircle(ctx, cx, cy, r, avatarImg, palette, filter, removeBg, styleIdx) {
  ctx.save();
  
  // 1. Draw Circle Base Shape & Glow
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const circleGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  circleGrad.addColorStop(0, (palette && palette.secondary) ? palette.secondary : '#38bdf8');
  circleGrad.addColorStop(1, (palette && palette.primary) ? palette.primary : '#ec4899');
  ctx.fillStyle = circleGrad;
  ctx.fill();

  // Glow Stroke Ring
  ctx.shadowColor = (palette && palette.primary) ? palette.primary : '#38bdf8';
  ctx.shadowBlur = 28;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  // Resolve active avatar image
  let activeImg = removeBg ? createCutoutAvatarCanvas(avatarImg, styleIdx) : avatarImg;
  if (!activeImg || (!activeImg.complete && activeImg.naturalWidth === 0)) {
    if (styleIdx >= 0 && optionCutoutAvatars[styleIdx]) {
      activeImg = optionCutoutAvatars[styleIdx];
    } else if (personalAvatarCutout) {
      activeImg = personalAvatarCutout;
    } else if (avatarImg) {
      activeImg = avatarImg;
    }
  }

  if (activeImg && (activeImg.complete || activeImg.naturalWidth > 0)) {
    const size = r * 2.38;
    const imgX = cx - size / 2;
    const imgY = cy - size / 2 - r * 0.18; // Lifted slightly so head pops out over circle rim

    // 2. Pass 1: Draw bottom torso clipped inside circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.clip();
    if (filter) ctx.filter = filter;
    ctx.drawImage(activeImg, imgX, imgY, size, size);
    ctx.restore();

    // 3. Pass 2: Draw the head and hair popping OUT above the top rim of the circle
    ctx.save();
    ctx.beginPath();
    // Clip to the upper area above the horizontal center
    ctx.rect(cx - size, cy - size * 1.5, size * 2, size * 0.96);
    ctx.clip();
    if (filter) ctx.filter = filter;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(activeImg, imgX, imgY, size, size);
    ctx.restore();
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
