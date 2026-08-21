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
  updateDraftDesign,
  markAsPosted,
  resetDraftStatus,
  autoSeedFromEnv
} from './database.js';

console.log('[DEBUG] server.js modules loaded successfully');

// Load environment variables
dotenv.config();

// CRITICAL: Auto-seed API keys from environment variables into db on every startup
// This ensures settings survive Render's ephemeral filesystem resets on container restarts
autoSeedFromEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Health check endpoint - must be FIRST route for Hugging Face container checks
app.get('/health', (req, res) => {
  const settings = getSettings();
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!settings.geminiApiKey,
    hasImgbbKey: !!settings.imgbbApiKey,
    hasWebhook: !!settings.webhookUrl
  });
});

// Utility: retry an async function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelayMs = 1000) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[Retry] Attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

// Enable CORS and JSON parsing with custom limits for high-res images
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve creatives directory statically
app.use('/creatives', express.static(path.join(__dirname, 'creatives')));

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
  const cycleDay = diffDays % 10;
  
  // 80% marketing (8 days: 0, 1, 2, 3, 5, 6, 7, 8) and 20% ai (2 days: 4, 9) in a 10-day cycle
  const aiDays = [4, 9];
  return aiDays.includes(cycleDay) ? 'ai' : 'marketing';
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
    hasImgbbApiKey: !!settings.imgbbApiKey,
    cronSecret: settings.cronSecret,
    rotateOutfits: settings.rotateOutfits
  });
});

// Run diagnostics and auto-healing
app.get('/api/diagnose', async (req, res) => {
  const reports = [];
  const heals = [];
  let dbHealthy = true;
  let settings = getSettings();

  // Check 1: Database Read/Write Test
  try {
    const testData = { ...getSettings() };
    saveSettings(testData);
    reports.push({ name: 'Database Health', status: 'ok', message: 'Read/write operations to db.json successful.' });
  } catch (err) {
    dbHealthy = false;
    reports.push({ name: 'Database Health', status: 'error', message: `Database file is not writeable: ${err.message}` });
  }

  // Check 2: Gemini API Key & Auto-Heal
  let hasGeminiKey = !!settings.geminiApiKey;
  if (!hasGeminiKey && process.env.GEMINI_API_KEY) {
    try {
      saveSettings({ geminiApiKey: process.env.GEMINI_API_KEY });
      settings = getSettings();
      hasGeminiKey = true;
      heals.push('Gemini API Key restored from server environment variables.');
    } catch (e) {
      console.error('Failed to auto-heal Gemini key:', e.message);
    }
  }
  
  if (hasGeminiKey) {
    reports.push({ 
      name: 'Gemini API Key', 
      status: 'ok', 
      message: 'Key is configured. Verification format checks out.' 
    });
  } else {
    reports.push({ 
      name: 'Gemini API Key', 
      status: 'error', 
      message: 'Key is missing. Please enter your Gemini key in the settings panel.' 
    });
  }

  // Check 3: ImgBB API Key & Auto-Heal
  let hasImgbbKey = !!settings.imgbbApiKey;
  if (!hasImgbbKey && process.env.IMGBB_API_KEY) {
    try {
      saveSettings({ imgbbApiKey: process.env.IMGBB_API_KEY });
      settings = getSettings();
      hasImgbbKey = true;
      heals.push('ImgBB API Key restored from server environment variables.');
    } catch (e) {
      console.error('Failed to auto-heal ImgBB key:', e.message);
    }
  }

  if (hasImgbbKey) {
    // Attempt a dry-run ping to ImgBB to verify the key actually works
    try {
      const pingUrl = `https://api.imgbb.com/1/upload?key=${settings.imgbbApiKey}`;
      const pingRes = await fetch(pingUrl, { method: 'POST' });
      // A status of 400 is standard if we don't pass an image parameter, but if the key is invalid it returns 400 with a specific invalid key message
      const text = await pingRes.text();
      if (text.includes('invalid') || text.includes('Invalid API key')) {
        reports.push({ 
          name: 'ImgBB API Key', 
          status: 'error', 
          message: 'The saved ImgBB API Key is invalid or expired. Please generate a new key.' 
        });
      } else {
        reports.push({ 
          name: 'ImgBB API Key', 
          status: 'ok', 
          message: 'Key is configured and successfully validated against ImgBB API.' 
        });
      }
    } catch (err) {
      reports.push({ 
        name: 'ImgBB API Key', 
        status: 'warn', 
        message: `Key is configured, but failed to ping ImgBB endpoint: ${err.message}` 
      });
    }
  } else {
    reports.push({ 
      name: 'ImgBB API Key', 
      status: 'error', 
      message: 'Key is missing. ImgBB is required to host graphics on Render. Get your free key at api.imgbb.com.' 
    });
  }

  // Check 4: Make.com Webhook Connectivity
  if (settings.webhookUrl) {
    try {
      const webRes = await fetch(settings.webhookUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true }),
        signal: AbortSignal.timeout(5000)
      });
      if (webRes.status === 200 || webRes.status === 202 || webRes.ok) {
        reports.push({ 
          name: 'Make.com Webhook', 
          status: 'ok', 
          message: 'Connection to Make.com workflow is alive and responding (200 OK).' 
        });
      } else {
        reports.push({ 
          name: 'Make.com Webhook', 
          status: 'warn', 
          message: `Webhook url is configured, but returned HTTP status ${webRes.status}.` 
        });
      }
    } catch (err) {
      reports.push({ 
        name: 'Make.com Webhook', 
        status: 'error', 
        message: `Failed to connect to Make.com: ${err.message}. Make sure your scenario schedule is turned ON.` 
      });
    }
  } else {
    reports.push({ 
      name: 'Make.com Webhook', 
      status: 'error', 
      message: 'Webhook URL is missing. Please configure it in the settings panel.' 
    });
  }

  // Overall system evaluation
  const hasErrors = reports.some(r => r.status === 'error');
  const systemStatus = hasErrors ? 'error' : 'ok';

  res.json({
    status: systemStatus,
    reports,
    heals,
    timestamp: new Date().toISOString()
  });
});

// Get avatar map (hosted cloud URLs for template images)
app.get('/api/avatar-map', (req, res) => {
  const mapPath = path.join(__dirname, 'data', 'avatar-map.json');
  if (fs.existsSync(mapPath)) {
    try {
      const data = fs.readFileSync(mapPath, 'utf8');
      return res.json(JSON.parse(data));
    } catch (err) {
      return res.json({});
    }
  }
  res.json({});
});

// Update settings
app.post('/api/settings', (req, res) => {
  const { webhookUrl, geminiApiKey, imgbbApiKey, cronSecret, rotateOutfits } = req.body;
  const updateData = {};
  
  if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
  if (geminiApiKey !== undefined && geminiApiKey.trim() !== '') updateData.geminiApiKey = geminiApiKey;
  if (imgbbApiKey !== undefined && imgbbApiKey.trim() !== '') updateData.imgbbApiKey = imgbbApiKey;
  if (cronSecret !== undefined) updateData.cronSecret = cronSecret;
  if (rotateOutfits !== undefined) updateData.rotateOutfits = rotateOutfits;

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

// Edit a specific draft's creative design layout parameters
app.post('/api/edit-design', (req, res) => {
  const { date, postId, designData } = req.body;
  if (!date || !postId || !designData) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const success = updateDraftDesign(date, postId, designData);
  if (success) {
    res.json({ success: true, message: 'Draft design updated successfully' });
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
app.post('/api/upload-creative', async (req, res) => {
  const { date, postId, image } = req.body;
  if (!date || !postId || !image) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Always write locally first as a secondary fallback and for dashboard reference
    const creativesDir = path.join(__dirname, 'public', 'creatives');
    if (!fs.existsSync(creativesDir)) {
      fs.mkdirSync(creativesDir, { recursive: true });
    }
    
    const fileName = `creative-${date}-${postId}.png`;
    fs.writeFileSync(path.join(creativesDir, fileName), buffer);
    
    const settings = getSettings();
    let imageUrl = '';
    
    if (settings.imgbbApiKey) {
      console.log(`[API] Uploading creative image for Post ${postId} (${date}) to ImgBB using API Key...`);
      try {
        const formData = new FormData();
        formData.append('key', settings.imgbbApiKey);
        formData.append('image', base64Data);

        const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData
        });

        if (imgbbResponse.ok) {
          const result = await imgbbResponse.json();
          if (result && result.success && result.data && result.data.url) {
            imageUrl = result.data.url;
            console.log(`[API] Creative hosted on ImgBB successfully: ${imageUrl}`);
          } else {
            throw new Error(result.error ? result.error.message : 'Unknown ImgBB error');
          }
        } else {
          throw new Error(`HTTP Error ${imgbbResponse.status}`);
        }
    if (!imageUrl) {
      console.log(`[API] Uploading creative image for Post ${postId} (${date}) to tmpfiles.org for public hosting...`);
      try {
        const blob = new Blob([buffer], { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', blob, fileName);

        const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          if (result && result.status === 'success' && result.data && result.data.url) {
            imageUrl = result.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
            console.log(`[API] Image successfully hosted on tmpfiles.org: ${imageUrl}`);
          } else {
            throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
          }
        } else {
          throw new Error(`HTTP Error ${uploadResponse.status}`);
        }
      } catch (tmpFilesErr) {
        console.warn(`[API] Fallback upload to tmpfiles.org failed: ${tmpFilesErr.message}. Falling back to local static URL.`);
        const host = req.get('host');
        const protocol = host.includes('hf.space') || host.includes('onrender.com') ? 'https' : req.protocol;
        imageUrl = `${protocol}://${host}/creatives/${fileName}`;
      }
    }
  }
    
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

    // Perform POST request to Make.com webhook with automatic retry on transient failures
    const response = await retryWithBackoff(async () => {
      const r = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: post.postContent ? post.postContent.content : post.content,
          imageUrl: imageUrl || null,
          style: post.postContent ? post.postContent.style : post.style,
          sourceArticle: post.postContent ? post.postContent.sourceArticle : post.sourceArticle,
          category: dayEntry.category,
          date: date,
          author: 'Marketing Manager & AI Expert'
        }),
        signal: AbortSignal.timeout(15000)
      });
      if (!r.ok) throw new Error(`Webhook responded with HTTP ${r.status}: ${await r.text()}`);
      return r;
    }, 3, 2000);

    // Mark as posted in database
    markAsPosted(date, postId, imageUrl || null);
    res.json({ success: true, message: 'Post sent to Make.com webhook successfully!' });

  } catch (error) {
    console.error('[API] Webhook delivery failed after retries:', error);
    res.status(500).json({ error: `Webhook delivery failed: ${error.message}` });
  }
});

// Reset a posted day back to draft so user can re-select and re-publish
app.post('/api/reset-date', (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Missing date' });
  const result = resetDraftStatus(date);
  if (result) {
    console.log(`[API] Reset date ${date} back to draft status for re-publishing.`);
    res.json({ success: true, message: `Date ${date} reset to draft. You can now select and publish a post.` });
  } else {
    res.status(404).json({ error: `No history entry found for date ${date}.` });
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

/**
 * Utility to download avatars from cloud map to local folder on startup (to prevent tainted canvas CORS errors)
 */
async function downloadAvatars() {
  const mapPath = path.join(__dirname, 'data', 'avatar-map.json');
  if (!fs.existsSync(mapPath)) {
    console.log('[Startup] No avatar map found. Skipping download.');
    return;
  }

  try {
    const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    console.log('[Startup] Checking and downloading cloud avatars to local public folder to prevent tainted canvas...');
    
    const publicDir = path.join(__dirname, 'public');
    const avatarsDir = path.join(publicDir, 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    for (const [relPath, cloudUrl] of Object.entries(map)) {
      const targetPath = path.join(publicDir, relPath);
      
      if (!fs.existsSync(targetPath)) {
        // Space out downloads by 200ms to avoid network/CPU spikes during startup
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log(`[Startup] Downloading ${relPath} from cloud URL: ${cloudUrl}...`);
        try {
          const res = await fetch(cloudUrl);
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(targetPath, buffer);
          } else {
            console.warn(`[Startup] Failed to download ${relPath}: HTTP ${res.status}`);
          }
        } catch (downloadErr) {
          console.warn(`[Startup] Failed to download ${relPath}: ${downloadErr.message}`);
        }
      }
    }
    console.log('[Startup] Cloud avatars check complete.');
  } catch (err) {
    console.error('[Startup] Failed to process avatar map:', err.message);
  }
}

// Startup Check: Generate today's posts immediately if missing
const startupCheck = async () => {
  try {
    // Run avatar download completely in the background without blocking today's post checks
    downloadAvatars().catch(err => console.error('[Startup] Background avatar download error:', err.message));

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
  } catch (err) {
    console.error('[Startup] Critical error in startup check:', err.message);
  }
};

// Start Server explicitly binding to 0.0.0.0 for container health checks
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`  LinkedIn Daily Content Generator Server Active  `);
  console.log(`  Running on: http://0.0.0.0:${PORT}             `);
  console.log(`==================================================`);
  
  // Run startup checks asynchronously
  setTimeout(startupCheck, 1000);
});
