import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve('data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initialize database file
function initDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const defaultData = {
        settings: {
          webhookUrl: process.env.WEBHOOK_URL || 'https://hook.eu1.make.com/8hd357m87nxbmvrw8i5f7i3ughh4jp9g',
          geminiApiKey: process.env.GEMINI_API_KEY || '',
          imgbbApiKey: process.env.IMGBB_API_KEY || '',
          cronSecret: process.env.CRON_SECRET || 'linkedin_generator_secret_12345',
          rotateOutfits: true
        },
        history: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      console.log('[Database] Created fresh db.json with defaults from environment.');
    }
  } catch (err) {
    console.error('[Database] Failed to initialize database file:', err.message);
  }
}

// Read database
export function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Database] Error reading database file:', error);
    return { settings: {}, history: [] };
  }
}

// Write database
export function writeDb(data) {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[Database] Error writing to database file:', error);
    return false;
  }
}

// Helper to get settings — always merges env vars so keys survive container restarts
export function getSettings() {
  const db = readDb() || {};
  const settings = db.settings || {};

  // Env vars always win over a blank db value (handles ephemeral filesystem restarts)
  return {
    webhookUrl: settings.webhookUrl || process.env.WEBHOOK_URL || '',
    geminiApiKey: settings.geminiApiKey || process.env.GEMINI_API_KEY || '',
    imgbbApiKey: settings.imgbbApiKey || process.env.IMGBB_API_KEY || '',
    cronSecret: settings.cronSecret || process.env.CRON_SECRET || 'linkedin_generator_secret_12345',
    rotateOutfits: settings.rotateOutfits !== undefined ? settings.rotateOutfits : true
  };
}

// Auto-seed: called at server startup to persist env vars into db
// This ensures keys survive even if db.json is reset by ephemeral filesystem
export function autoSeedFromEnv() {
  try {
    const db = readDb() || {};
    db.settings = db.settings || {};
    let changed = false;

    if (!db.settings.geminiApiKey && process.env.GEMINI_API_KEY) {
      db.settings.geminiApiKey = process.env.GEMINI_API_KEY;
      changed = true;
      console.log('[Database] Auto-seeded Gemini API Key from environment.');
    }
    if (!db.settings.imgbbApiKey && process.env.IMGBB_API_KEY) {
      db.settings.imgbbApiKey = process.env.IMGBB_API_KEY;
      changed = true;
      console.log('[Database] Auto-seeded ImgBB API Key from environment.');
    }
    if (!db.settings.webhookUrl && process.env.WEBHOOK_URL) {
      db.settings.webhookUrl = process.env.WEBHOOK_URL;
      changed = true;
      console.log('[Database] Auto-seeded Webhook URL from environment.');
    }
    if (!db.settings.cronSecret && process.env.CRON_SECRET) {
      db.settings.cronSecret = process.env.CRON_SECRET;
      changed = true;
    }

    if (changed) writeDb(db);
    else console.log('[Database] Auto-seed: All settings already present in db.json.');
  } catch (err) {
    console.error('[Database] Auto-seed failed:', err.message);
  }
}

// Helper to save settings
export function saveSettings(newSettings) {
  const db = readDb() || {};
  db.settings = db.settings || {};
  db.settings = {
    ...db.settings,
    ...newSettings
  };
  return writeDb(db);
}

// Helper to get history
export function getHistory() {
  const db = readDb() || {};
  return db.history || [];
}

// Helper to save a new generation entry
export function saveGeneration(date, category, posts) {
  const db = readDb() || {};
  db.history = db.history || [];
  
  // Check if entry for date already exists, remove it if it does (to overwrite with fresh generate)
  db.history = db.history.filter(item => item.date !== date);
  
  db.history.unshift({
    date,
    category,
    posts,
    selectedPostId: null,
    postedAt: null,
    status: 'draft' // 'draft', 'posted'
  });
  
  // Limit history length to 30 days
  if (db.history.length > 30) {
    db.history = db.history.slice(0, 30);
  }

  writeDb(db);
}

// Helper to update a single draft post content
export function updateDraftPost(date, postId, newContent) {
  const db = readDb() || {};
  db.history = db.history || [];
  const entry = db.history.find(item => item.date === date);
  
  if (entry && entry.posts) {
    const post = entry.posts.find(p => p.id === parseInt(postId));
    if (post) {
      if (post.postContent) {
        post.postContent.content = newContent;
      } else {
        post.content = newContent;
      }
      writeDb(db);
      return true;
    }
  }
  return false;
}

// Helper to mark a draft as selected and posted
export function markAsPosted(date, postId, imageUrl = null) {
  const db = readDb() || {};
  db.history = db.history || [];
  const entry = db.history.find(item => item.date === date);
  
  if (entry) {
    entry.selectedPostId = parseInt(postId);
    entry.status = 'posted';
    entry.postedAt = new Date().toISOString();
    
    if (entry.posts) {
      const post = entry.posts.find(p => p.id === parseInt(postId));
      if (post) {
        post.imageUrl = imageUrl;
      }
    }
    
    writeDb(db);
    return true;
  }
  return false;
}

// Helper to update a draft post's design settings
export function updateDraftDesign(date, postId, designData) {
  const db = readDb();
  const entry = db.history.find(item => item.date === date);
  
  if (entry && entry.posts) {
    const post = entry.posts.find(p => p.id === parseInt(postId));
    if (post) {
      if (designData.layoutFamily !== undefined) post.layoutFamily = designData.layoutFamily;
      if (designData.colorPalette !== undefined) post.colorPalette = designData.colorPalette;
      if (designData.avatarStyleIdx !== undefined) post.avatarStyleIdx = parseInt(designData.avatarStyleIdx);
      if (designData.customColors !== undefined) post.customColors = designData.customColors;
      if (designData.headlineFontSize !== undefined) post.headlineFontSize = parseInt(designData.headlineFontSize);
      if (designData.subtextFontSize !== undefined) post.subtextFontSize = parseInt(designData.subtextFontSize);
      
      if (!post.postContent) post.postContent = {};
      if (designData.imageHeadline !== undefined) post.postContent.imageHeadline = designData.imageHeadline;
      if (designData.imageSubtext !== undefined) post.postContent.imageSubtext = designData.imageSubtext;
      
      writeDb(db);
      return true;
    }
  }
  return false;
}

// Helper to reset a posted day back to draft so it can be re-published
export function resetDraftStatus(date) {
  const db = readDb() || {};
  db.history = db.history || [];
  const entry = db.history.find(item => item.date === date);
  if (entry) {
    entry.status = 'draft';
    delete entry.selectedPostId;
    delete entry.postedAt;
    writeDb(db);
    return true;
  }
  return false;
}
