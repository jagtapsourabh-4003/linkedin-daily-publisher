import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scrapeTrends } from './scraper.js';
import { generatePosts } from './generator.js';
import { 
  getSettings, 
  saveSettings, 
  getHistory, 
  saveGeneration, 
  updateDraftPost, 
  markAsPosted 
} from './database.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing with custom limits for high-res images
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Utility to get formatted date string in local time (YYYY-MM-DD)
 */
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Utility to determine the alternating category for a specific date.
 * Uses a fixed baseline epoch to ensure strict daily rotation.
 */
function getCategoryForDate(dateStr) {
  const baseline = new Date('2026-01-01T00:00:00Z');
  const current = new Date(`${dateStr}T00:00:00Z`);
  const diffTime = Math.abs(current - baseline);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays % 2 === 0 ? 'marketing' : 'ai';
}

/**
 * Core function to run the daily scrape & generate pipeline
 */
async function runDailyPipeline(dateStr) {
  const settings = getSettings();
  if (!settings.geminiApiKey) {
    throw new Error('Missing Gemini API Key. Please add it to your settings.');
  }

  const category = getCategoryForDate(dateStr);
  console.log(`[Pipeline] Running pipeline for date ${dateStr} - Category: ${category}`);

  // 1. Scrape latest trends
  const trends = await scrapeTrends(category);

  // 2. Generate drafts via Gemini
  const posts = await generatePosts(category, trends, settings.geminiApiKey);

  // 3. Save to local database
  saveGeneration(dateStr, category, posts);
  console.log(`[Pipeline] Pipeline completed and saved for ${dateStr}`);
  return { category, posts };
}

/**
 * Middleware to secure cron/trigger routes
 */
function verifyCronSecret(req, res, next) {
  const settings = getSettings();
  const clientSecret = req.query.secret || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);

  if (settings.cronSecret && clientSecret !== settings.cronSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid cron secret' });
  }
  next();
}

// ================= API ENDPOINTS =================

// Get settings (masking API key for frontend safety)
app.get('/api/settings', (req, res) => {
  const settings = getSettings();
  res.json({
    webhookUrl: settings.webhookUrl,
    hasApiKey: !!settings.geminiApiKey,
    cronSecret: settings.cronSecret
  });
});

// Update settings
app.post('/api/settings', (req, res) => {
  const { webhookUrl, geminiApiKey, cronSecret } = req.body;
  const updateData = {};
  
  if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
  if (geminiApiKey !== undefined && geminiApiKey.trim() !== '') updateData.geminiApiKey = geminiApiKey;
  if (cronSecret !== undefined) updateData.cronSecret = cronSecret;

  saveSettings(updateData);
  res.json({ success: true, message: 'Settings updated successfully' });
});

// Get post generation history & drafts
app.get('/api/history', (req, res) => {
  res.json(getHistory());
});

// Trigger generation manually for a specific day
app.post('/api/generate', async (req, res) => {
  const dateStr = req.body.date || getLocalDateString();
  try {
    const data = await runDailyPipeline(dateStr);
    res.json({ success: true, date: dateStr, ...data });
  } catch (error) {
    console.error(`[API] Generation failed for ${dateStr}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Edit a specific draft's content
app.post('/api/edit', (req, res) => {
  const { date, postId, content } = req.body;
  if (!date || !postId || !content) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const success = updateDraftPost(date, postId, content);
  if (success) {
    res.json({ success: true, message: 'Draft updated successfully' });
  } else {
    res.status(404).json({ error: 'Draft post not found' });
  }
});

// Upload custom user avatar
app.post('/api/settings/avatar', (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Missing image data' });
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(__dirname, 'public', 'avatar.jpg'), buffer);
    res.json({ success: true, message: 'Avatar updated successfully' });
  } catch (err) {
    console.error('[API] Avatar upload failed:', err);
    res.status(500).json({ error: `Avatar upload failed: ${err.message}` });
  }
});

// Upload rendered post creative image
app.post('/api/upload-creative', (req, res) => {
  const { date, postId, image } = req.body;
  if (!date || !postId || !image) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const creativesDir = path.join(__dirname, 'public', 'creatives');
    if (!fs.existsSync(creativesDir)) {
      fs.mkdirSync(creativesDir, { recursive: true });
    }
    
    const fileName = `creative-${date}-${postId}.png`;
    fs.writeFileSync(path.join(creativesDir, fileName), buffer);
    
    const host = req.get('host');
    const protocol = req.protocol;
    const imageUrl = `${protocol}://${host}/creatives/${fileName}`;
    
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('[API] Creative upload failed:', err);
    res.status(500).json({ error: `Creative upload failed: ${err.message}` });
  }
});

// Post a selected draft to Google Flow Webhook
app.post('/api/post', async (req, res) => {
  const { date, postId, imageUrl } = req.body;
  if (!date || !postId) {
    return res.status(400).json({ error: 'Missing date or postId' });
  }

  const settings = getSettings();
  if (!settings.webhookUrl) {
    return res.status(400).json({ error: 'Google Flow webhook URL is not configured in settings.' });
  }

  const history = getHistory();
  const dayEntry = history.find(item => item.date === date);
  if (!dayEntry) {
    return res.status(404).json({ error: 'No posts found for the specified date.' });
  }

  const post = dayEntry.posts.find(p => p.id === parseInt(postId));
  if (!post) {
    return res.status(404).json({ error: 'Specified post ID not found.' });
  }

  try {
    console.log(`[API] Sending post ${postId} from ${date} to webhook: ${settings.webhookUrl}`);
    
    // Perform POST request to user's Google Flow
    const response = await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: post.content,
        imageUrl: imageUrl || null,
        style: post.style,
        sourceArticle: post.sourceArticle,
        category: dayEntry.category,
        date: date,
        author: 'Marketing Manager & AI Expert'
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}: ${await response.text()}`);
    }

    // Mark as posted in database
    markAsPosted(date, postId, imageUrl || null);
    res.json({ success: true, message: 'Post sent to Google Flow successfully!' });

  } catch (error) {
    console.error('[API] Webhook delivery failed:', error);
    res.status(500).json({ error: `Webhook delivery failed: ${error.message}` });
  }
});

// Secure endpoint for external Cron Trigger (e.g. from Cloud Scheduler or cron-job.org)
app.post('/api/cron/trigger', verifyCronSecret, async (req, res) => {
  const dateStr = getLocalDateString();
  console.log(`[Cron Route] External trigger received for ${dateStr}`);
  try {
    const data = await runDailyPipeline(dateStr);
    res.json({ success: true, date: dateStr, category: data.category, message: 'Cron job executed successfully' });
  } catch (error) {
    console.error(`[Cron Route] Trigger execution failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// ================= SCHEDULING & STARTUP =================

// Internal Cron Job: Run daily at 9:00 AM local time
cron.schedule('0 9 * * *', async () => {
  const dateStr = getLocalDateString();
  console.log(`[Internal Cron] Triggering daily generation at 9:00 AM for ${dateStr}`);
  try {
    await runDailyPipeline(dateStr);
  } catch (error) {
    console.error(`[Internal Cron] Daily pipeline execution failed:`, error.message);
  }
});

// Startup Check: Generate today's posts immediately if missing
const startupCheck = async () => {
  const todayStr = getLocalDateString();
  const history = getHistory();
  const hasToday = history.some(item => item.date === todayStr);

  if (!hasToday) {
    console.log(`[Startup] Today's posts (${todayStr}) are missing. Running auto-generation...`);
    const settings = getSettings();
    if (!settings.geminiApiKey) {
      console.warn('[Startup] API Key is missing. Skipping auto-generation. Please configure it via the dashboard.');
      return;
    }
    try {
      await runDailyPipeline(todayStr);
    } catch (error) {
      console.error('[Startup] Failed to execute startup generation:', error.message);
    }
  } else {
    console.log(`[Startup] Today's posts (${todayStr}) already exist. Ready.`);
  }
};

// Start Server
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`  LinkedIn Daily Content Generator Server Active  `);
  console.log(`  Running on: http://localhost:${PORT}             `);
  console.log(`==================================================`);
  
  // Run startup checks asynchronously
  setTimeout(startupCheck, 1000);
});
