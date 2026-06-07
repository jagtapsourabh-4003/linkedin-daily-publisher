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
  isLoading: false
};

// Global Image Resources (Custom Avatar)
const avatarImg = new Image();
let avatarImageLoaded = false;
avatarImg.onload = () => {
  avatarImageLoaded = true;
  console.log('[Avatar] Custom profile picture loaded.');
  if (state.history.length > 0) renderActiveDrafts();
};
avatarImg.onerror = () => {
  console.warn('[Avatar] Failed to load avatar.jpg. Canvas will use placeholder.');
};
avatarImg.src = 'avatar.jpg?t=' + Date.now();

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
  inputSecret: document.getElementById('input-secret'),
  inputAvatarFile: document.getElementById('input-avatar-file'),
  avatarPreview: document.getElementById('avatar-preview'),
  inputRotateOutfits: document.getElementById('input-rotate-outfits'),
  toastContainer: document.getElementById('toast-container'),
  glow1: document.getElementById('glow-1'),
  glow2: document.getElementById('glow-2')
};

// Initialize Application
async function init() {
  setupEventListeners();
  await loadSettings();
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
}

// ================= API CALLS & DATA FETCHING =================

// Load Settings from API
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    
    state.settings = await res.json();
    
    // Fill fields
    el.inputWebhook.value = state.settings.webhookUrl || '';
    el.inputSecret.value = state.settings.cronSecret || '';
    el.inputApiKey.placeholder = state.settings.hasApiKey ? '••••••••••••••••••••••••••••••••' : 'Enter API Key';
    el.inputRotateOutfits.checked = state.settings.rotateOutfits !== false;
    el.avatarPreview.src = 'avatar.jpg?t=' + Date.now();

    // Show/hide api key notice
    if (!state.settings.hasApiKey) {
      el.apiKeyNotice.classList.remove('hidden');
    } else {
      el.apiKeyNotice.classList.add('hidden');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// Load History/Drafts from API
async function loadHistory() {
  el.dateSelectorList.innerHTML = '<div class="loading-spinner-small"></div>';
  try {
    const res = await fetch('/api/history');
    if (!res.ok) throw new Error('Failed to load history');
    
    state.history = await res.json();
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
    el.dateSelectorList.innerHTML = '<p class="error-text">Failed to load dates</p>';
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

// Save Settings via API
async function handleSaveSettings(e) {
  e.preventDefault();
  const webhookUrl = el.inputWebhook.value.trim();
  const geminiApiKey = el.inputApiKey.value.trim();
  const rotateOutfits = el.inputRotateOutfits.checked;
  
  try {
    // 1. Upload custom avatar if a new one is selected
    if (el.inputAvatarFile.files && el.inputAvatarFile.files[0]) {
      showToast('Uploading profile picture...', 'info');
      const file = el.inputAvatarFile.files[0];
      const base64Image = await convertFileToBase64(file);
      
      const avatarRes = await fetch('/api/settings/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      
      if (!avatarRes.ok) throw new Error('Failed to upload avatar image');
      
      // Update local cache-busted source
      avatarImageLoaded = false;
      avatarImg.src = 'avatar.jpg?t=' + Date.now();
    }

    // 2. Save configurations
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, geminiApiKey, rotateOutfits })
    });
    
    if (!res.ok) throw new Error('Failed to save settings');
    
    showToast('Settings saved successfully', 'success');
    closeSettings();
    await loadSettings();
    
    if (state.history.length === 0 && geminiApiKey) {
      await loadHistory();
    } else if (state.history.length > 0) {
      renderActiveDrafts();
    }
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
  }
}

// Trigger Daily Post Generation manually
async function triggerManualGeneration() {
  if (!state.settings.hasApiKey) {
    showToast('Cannot generate: Gemini API Key is missing. Check settings.', 'error');
    openSettings();
    return;
  }

  el.btnTriggerGeneration.disabled = true;
  const originalText = el.btnTriggerGeneration.innerHTML;
  el.btnTriggerGeneration.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; display: inline-block;"></span> Generating...`;
  showToast('Scraping trends and generating posts with Gemini. This takes 5-10s...', 'info');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Pipeline execution failed');
    }
    
    const data = await res.json();
    showToast(`Generation completed for ${data.date}!`, 'success');
    
    state.activeDate = data.date;
    await loadHistory();
  } catch (err) {
    showToast(`Generation failed: ${err.message}`, 'error');
  } finally {
    el.btnTriggerGeneration.disabled = false;
    el.btnTriggerGeneration.innerHTML = originalText;
  }
}

// Save an inline draft edit via API
async function saveDraftEdit(date, postId, content) {
  try {
    const res = await fetch('/api/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, postId, content })
    });
    if (!res.ok) throw new Error('Auto-save failed');
    const dayEntry = state.history.find(item => item.date === date);
    if (dayEntry) {
      const post = dayEntry.posts.find(p => p.id === parseInt(postId));
      if (post) post.content = content;
    }
  } catch (err) {
    console.error('[Editor] Failed to auto-save post edit:', err.message);
    showToast('Failed to auto-save draft edits.', 'error');
  }
}

// Send Selected Post & Rendered Graphic to Google Flow Webhook
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
    // 1. Grab matching canvas and export as data URL
    const canvas = document.getElementById(`canvas-${postId}`);
    if (!canvas) throw new Error('Image canvas element not found');
    
    const imageBase64 = canvas.toDataURL('image/png');
    
    // 2. Upload image to server to get public hosting URL
    btnElement.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Uploading graphic...`;
    const uploadRes = await fetch('/api/upload-creative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, postId, image: imageBase64 })
    });
    
    if (!uploadRes.ok) throw new Error('Failed to host image creative on server');
    const uploadData = await uploadRes.json();
    const imageUrl = uploadData.imageUrl;
    
    // 3. Post text and image URL to Webhook
    btnElement.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Publishing...`;
    const res = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, postId, imageUrl })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Server error delivering post');
    }

    showToast('Post and creative graphic sent successfully!', 'success');
    await loadHistory();
  } catch (err) {
    showToast(`Post failed: ${err.message}`, 'error');
    btnElement.disabled = false;
    btnElement.innerHTML = originalHtml;
  }
}

// ================= UI RENDERING & INTERACTION =================

// Render Sidebar Date List
function renderDateList() {
  el.dateSelectorList.innerHTML = '';
  
  if (state.history.length === 0) {
    el.dateSelectorList.innerHTML = '<p class="empty-text">No history drafts found.</p>';
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

  // Apply accent glow themes to the background glows based on topic
  applyTopicTheme(activeEntry.category);

  // Clear posts workspace
  el.draftsContainer.innerHTML = '';

  const isDayPosted = activeEntry.status === 'posted';
  const selectedPostId = activeEntry.selectedPostId;

  activeEntry.posts.forEach(post => {
    const isThisPostSelected = isDayPosted && selectedPostId === post.id;
    const cardEl = document.createElement('article');
    cardEl.className = `draft-card ${isThisPostSelected ? 'posted-item' : ''} ${isDayPosted && !isThisPostSelected ? 'disabled-item' : ''}`;
    cardEl.id = `draft-card-${post.id}`;

    // Calculate details for metadata row
    const charCount = post.content.length;
    const hashtagCount = (post.content.match(/#/g) || []).length;

    cardEl.innerHTML = `
      <div class="draft-card-header">
        <span class="style-tag">${post.style}</span>
        <span class="source-tag">Inspiration: <em>${post.sourceArticle || 'General Trend'}</em></span>
      </div>
      <div class="post-editor-wrapper">
        <textarea 
          class="post-textarea" 
          id="textarea-${post.id}"
          placeholder="Loading post content..."
          aria-label="Edit Post Content"
          ${isDayPosted ? 'disabled' : ''}
        >${post.content}</textarea>
      </div>
      <div class="post-meta-row">
        <span id="char-count-${post.id}">${charCount} characters</span>
        <span id="hashtag-count-${post.id}">${hashtagCount} hashtags</span>
      </div>
      
      <!-- Visual Graphic Preview -->
      <div class="creative-container">
        <div class="creative-toggle-header" id="toggle-creative-${post.id}">
          <span>🖼 View Social Graphic Card</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="creative-content-body hidden" id="creative-body-${post.id}">
          <canvas id="canvas-${post.id}" width="1080" height="1080" class="creative-canvas"></canvas>
        </div>
      </div>

      <div class="draft-card-actions" style="margin-top: 14px;">
        <button class="btn btn-secondary btn-sm" id="btn-copy-${post.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Content
        </button>
        ${
          isThisPostSelected
            ? `<div class="posted-status-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Published with Creative Graphic
               </div>`
            : isDayPosted
              ? `<button class="btn btn-secondary btn-sm" disabled>Unavailable</button>`
              : `<button class="btn btn-primary btn-sm ${activeEntry.category === 'marketing' ? 'marketing-theme' : ''}" id="btn-post-${post.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Select & Publish
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
      drawCreative(canvas, activeEntry.category, post.imageHeadline || "AI Strategy", post.imageSubtext || "Next-Gen Workflows", post.id);
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

    // Copy Content Button Listener
    cardEl.querySelector(`#btn-copy-${post.id}`).addEventListener('click', () => {
      navigator.clipboard.writeText(textarea.value);
      showToast('Copied content to clipboard!', 'success');
    });

    // Post to Google Flow button listener
    if (!isDayPosted) {
      cardEl.querySelector(`#btn-post-${post.id}`).addEventListener('click', (e) => {
        postToGoogleFlow(post.id, e.target);
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
function drawCreative(canvas, category, headline, subtext, postId = 1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;  // 1080
  const h = canvas.height; // 1080
  
  // 1. Clear & draw overall background
  ctx.fillStyle = '#eaeef3'; // Light grey/blue clean color matching template
  ctx.fillRect(0, 0, w, h);
  
  // 2. Select layout style and photo filters dynamically based on postId (1 to 5)
  const styleIdx = (postId - 1) % 5;
  
  const filters = [
    'grayscale(100%) contrast(1.15)', // Post 1: Classic B&W
    'sepia(45%) contrast(1.1) brightness(0.95)', // Post 2: Vintage Warm
    'contrast(1.2) brightness(1.02) saturate(1.1)', // Post 3: High Contrast Natural
    'hue-rotate(220deg) saturate(70%) contrast(1.1) brightness(0.95)', // Post 4: Cool Slate Blue
    'brightness(1.05) contrast(1.05) saturate(1.2)' // Post 5: Soft Saturated Warm
  ];
  
  ctx.save();
  
  // Render selected layout
  if (styleIdx === 0) {
    // Style 1: Classic Dome (Text Left, Photo Right)
    drawLeftCardDome(ctx, category, 70, 100, 500, 880, headline, subtext);
    drawRightImageDome(ctx, 600, 160, 410, 760, filters[0], styleIdx);
  } 
  else if (styleIdx === 1) {
    // Style 2: Swapped Dome (Text Right, Photo Left)
    drawLeftCardDome(ctx, category, 510, 100, 500, 880, headline, subtext);
    drawRightImageDome(ctx, 70, 160, 410, 760, filters[1], styleIdx);
  } 
  else if (styleIdx === 2) {
    // Style 3: Capsule Pill-Frame
    drawLeftCardPill(ctx, category, 80, 100, 480, 880, headline, subtext);
    drawRightImagePill(ctx, 600, 160, 400, 760, filters[2], styleIdx);
  } 
  else if (styleIdx === 3) {
    // Style 4: Sleek Diagonal Split
    drawDiagonalSplit(ctx, category, headline, subtext, filters[3], styleIdx);
  } 
  else if (styleIdx === 4) {
    // Style 5: Minimalist Circle Border
    drawMinimalistCircle(ctx, category, headline, subtext, filters[4], styleIdx);
  }
  
  ctx.restore();
}

// Drawing Sub-routines
function drawLeftCardDome(ctx, category, lx, ly, lw, lh, headline, subtext) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(lx, ly, lw, lh, [250, 250, 0, 0]);
  
  const grad = ctx.createLinearGradient(lx, ly, lx, ly + lh);
  if (category === 'marketing') {
    grad.addColorStop(0, '#0f4c81');
    grad.addColorStop(1, '#1b2a47');
  } else {
    grad.addColorStop(0, '#7f00ff');
    grad.addColorStop(1, '#0f172a');
  }
  ctx.fillStyle = grad;
  ctx.fill();
  
  drawTextInsideCard(ctx, category, lx, ly, lw, lh, headline, subtext);
  ctx.restore();
}

function drawRightImageDome(ctx, rx, ry, rw, rh, filter, styleIdx) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, [205, 205, 0, 0]);
  ctx.clip();
  
  drawAvatar(ctx, rx, ry, rw, rh, filter, styleIdx);
  ctx.restore();
}

function drawLeftCardPill(ctx, category, lx, ly, lw, lh, headline, subtext) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(lx, ly, lw, lh, [240, 240, 240, 240]);
  
  const grad = ctx.createLinearGradient(lx, ly, lx, ly + lh);
  if (category === 'marketing') {
    grad.addColorStop(0, '#311042');
    grad.addColorStop(1, '#0f172a');
  } else {
    grad.addColorStop(0, '#0369a1');
    grad.addColorStop(1, '#020617');
  }
  ctx.fillStyle = grad;
  ctx.fill();
  
  drawTextInsideCard(ctx, category, lx, ly, lw, lh, headline, subtext);
  ctx.restore();
}

function drawRightImagePill(ctx, rx, ry, rw, rh, filter, styleIdx) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, [200, 200, 200, 200]);
  ctx.clip();
  
  drawAvatar(ctx, rx, ry, rw, rh, filter, styleIdx);
  ctx.restore();
}

function drawDiagonalSplit(ctx, category, headline, subtext, filter, styleIdx) {
  const lx = 70;
  const ly = 100;
  const lw = 940;
  const lh = 880;
  
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(lx, ly, lw, lh, 40);
  ctx.clip();
  
  const grad = ctx.createLinearGradient(lx, ly, lx, ly + lh);
  if (category === 'marketing') {
    grad.addColorStop(0, '#be185d');
    grad.addColorStop(1, '#310418');
  } else {
    grad.addColorStop(0, '#2563eb');
    grad.addColorStop(1, '#0b1329');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(lx, ly, lw, lh);
  
  drawTextInsideCard(ctx, category, lx, ly, 460, lh, headline, subtext);
  ctx.restore();
  
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(lx, ly, lw, lh, 40);
  ctx.clip();
  
  ctx.beginPath();
  ctx.moveTo(lx + lw, ly);
  ctx.lineTo(lx + 520, ly);
  ctx.lineTo(lx + 430, ly + lh);
  ctx.lineTo(lx + lw, ly + lh);
  ctx.closePath();
  ctx.clip();
  
  drawAvatar(ctx, lx + 430, ly, lw - 430, lh, filter, styleIdx);
  ctx.restore();
}

function drawMinimalistCircle(ctx, category, headline, subtext, filter, styleIdx) {
  const lx = 70;
  const ly = 100;
  const lw = 940;
  const lh = 880;
  
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(lx, ly, lw, lh, 30);
  
  const grad = ctx.createLinearGradient(lx, ly, lx, ly + lh);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lx + 480, ly + 50);
  ctx.lineTo(lx + 480, ly + lh - 50);
  ctx.stroke();
  
  drawTextInsideCard(ctx, category, lx, ly, 460, lh, headline, subtext);
  ctx.restore();
  
  const cx = lx + 700;
  const cy = ly + lh/2;
  const radius = 210;
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  
  drawAvatar(ctx, cx - radius, cy - radius, radius * 2, radius * 2, filter, styleIdx);
  ctx.restore();
  
  ctx.save();
  ctx.strokeStyle = category === 'marketing' ? '#f472b6' : '#60a5fa';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Dynamic avatar selection & drawing helper (rotates professional outfits)
function drawAvatar(ctx, x, y, w, h, filter, styleIdx = 0) {
  // Use rotating AI outfits if toggled on, else fall back to the custom uploaded avatarImg
  const useAiOutfit = state.settings.rotateOutfits !== false && styledAvatarsLoaded[styleIdx];
  const img = useAiOutfit ? styledAvatars[styleIdx] : avatarImg;
  const isLoaded = useAiOutfit || avatarImageLoaded;
  
  ctx.save();
  if (isLoaded && img.complete && img.naturalWidth !== 0) {
    // Apply filters
    ctx.filter = filter;
    
    const imgRatio = img.width / img.height;
    const destRatio = w / h;
    let sw, sh, sx, sy;
    
    if (imgRatio > destRatio) {
      sh = img.height;
      sw = sh * destRatio;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / destRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#64748b';
    ctx.font = '24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Loading Image...', x + w/2, y + h/2);
  }
  ctx.restore();
}

function drawTextInsideCard(ctx, category, lx, ly, lw, lh, headline, subtext) {
  ctx.save();
  ctx.textAlign = 'center';
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 18px Outfit';
  ctx.fillText('⚡ AI EXPERT & MARKETING MANAGER', lx + lw/2, ly + 80);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 46px Outfit';
  const headlineY = ly + 210;
  wrapText(ctx, headline.toUpperCase(), lx + 30, headlineY, lw - 60, 56);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '24px Inter';
  ctx.fillText('•••••••••••••••••', lx + lw/2, ly + 520);
  
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 24px Inter';
  const subtextY = ly + 575;
  wrapText(ctx, subtext, lx + 40, subtextY, lw - 80, 36);
  
  const badgeW = 280;
  const badgeH = 65;
  const badgeX = lx + (lw - badgeW)/2;
  const badgeY = ly + 720;
  
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
  ctx.fillStyle = category === 'marketing' ? '#0284c7' : '#8b5cf6';
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Outfit';
  ctx.fillText('READ FULL POST', lx + lw/2, badgeY + 41);
  
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 22px Inter';
  ctx.fillText('linkedin.com/in/jagtapsourabh', lx + lw/2, ly + 830);
  
  ctx.restore();
}

// Wrap text canvas utility
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  
  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x + maxWidth/2, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x + maxWidth/2, currentY);
}

// ================= HELPERS & UTILS =================

// Modal control
function openSettings() {
  el.settingsModal.classList.remove('hidden');
}

// Close Settings Modal
function closeSettings() {
  el.settingsModal.classList.add('hidden');
}

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
