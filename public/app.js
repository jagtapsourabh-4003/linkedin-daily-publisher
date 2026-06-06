// App State
let state = {
  settings: {
    webhookUrl: '',
    hasApiKey: false,
    cronSecret: ''
  },
  history: [],
  activeDate: '',
  isLoading: false
};

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
      // Default to first item (most recent) if activeDate is empty or not in history
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

// Save Settings via API
async function handleSaveSettings(e) {
  e.preventDefault();
  const webhookUrl = el.inputWebhook.value.trim();
  const geminiApiKey = el.inputApiKey.value.trim();
  
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, geminiApiKey })
    });
    
    if (!res.ok) throw new Error('Failed to save settings');
    
    showToast('Settings saved successfully', 'success');
    closeSettings();
    await loadSettings();
    
    // If they just added an API key, trigger a reload to run startup checks/refresh drafts
    if (geminiApiKey && state.history.length === 0) {
      await loadHistory();
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
    // Update local state copy quietly
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

// Send Selected Post to Google Flow Webhook
async function postToGoogleFlow(postId, btnElement) {
  const date = state.activeDate;
  if (!state.settings.webhookUrl) {
    showToast('Google Flow Webhook URL is not configured. Go to Settings.', 'error');
    openSettings();
    return;
  }

  btnElement.disabled = true;
  const originalHtml = btnElement.innerHTML;
  btnElement.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Sending...`;

  try {
    const res = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, postId })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Server error delivering post');
    }

    showToast('Post sent to Google Flow successfully!', 'success');
    
    // Refresh history and re-render to reflect "Posted" state
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
      <div class="draft-card-actions">
        <button class="btn btn-secondary btn-sm" id="btn-copy-${post.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Content
        </button>
        ${
          isThisPostSelected
            ? `<div class="posted-status-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Published via Google Flow
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

// ================= HELPERS & UTILS =================

// Modal control
function openSettings() {
  el.settingsModal.classList.remove('hidden');
}

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
  
  // Smoothly remove toast
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
