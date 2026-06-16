import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve('data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initialize database file
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      settings: {
        webhookUrl: 'https://hook.eu1.make.com/8hd357m87nxbmvrw8i5f7i3ughh4jp9g',
        geminiApiKey: 'AQ.Ab8RN6IzlFk-XmPTlKn9o1-OIVwbMpRkR6d6WJDgoi6l7UvbAw',
        cronSecret: 'linkedin_generator_secret_12345',
        rotateOutfits: true
      },
      history: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
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

// Helper to get settings
export function getSettings() {
  const db = readDb();
  
  // Merge with environment variables as fallbacks
  return {
    webhookUrl: db.settings.webhookUrl || process.env.WEBHOOK_URL || '',
    geminiApiKey: db.settings.geminiApiKey || process.env.GEMINI_API_KEY || '',
    cronSecret: db.settings.cronSecret || process.env.CRON_SECRET || 'linkedin_generator_secret_12345',
    rotateOutfits: db.settings.rotateOutfits !== undefined ? db.settings.rotateOutfits : true
  };
}

// Helper to save settings
export function saveSettings(newSettings) {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...newSettings
  };
  return writeDb(db);
}

// Helper to get history
export function getHistory() {
  const db = readDb();
  return db.history || [];
}

// Helper to save a new generation entry
export function saveGeneration(date, category, posts) {
  const db = readDb();
  
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
  const db = readDb();
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
  const db = readDb();
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
