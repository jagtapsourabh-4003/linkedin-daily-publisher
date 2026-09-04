/**
 * Automated Daily LinkedIn Publisher
 * Reads today's generated draft and automatically triggers the Make.com Webhook.
 * LOCK: Only fires ONCE per day — subsequent cron runs are skipped automatically.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, 'docs', 'data', 'history.json');
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://hook.eu1.make.com/fqv4xdxxh3q219mqfx8ui5a3b29reg3s';
const BASE_URL = 'https://jagtapsourabh-4003.github.io/linkedin-daily-publisher';

async function autoPublishToday() {
  console.log('[Auto-Publisher] Starting daily automated publishing workflow...');
  
  if (!fs.existsSync(HISTORY_FILE)) {
    console.error('[Auto-Publisher] history.json not found!');
    process.exit(1);
  }

  const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  if (!history || history.length === 0) {
    console.error('[Auto-Publisher] history.json is empty!');
    process.exit(1);
  }

  // Get current IST date
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const todayStr = istDate.toISOString().slice(0, 10);

  console.log(`[Auto-Publisher] Today (IST): ${todayStr}`);

  // Find today's entry or fallback to latest entry
  let entry = history.find(h => h.date === todayStr);
  if (!entry) {
    console.warn(`[Auto-Publisher] No entry found for ${todayStr}. Using latest date: ${history[0].date}`);
    entry = history[0];
  }

  if (!entry.posts || entry.posts.length === 0) {
    console.error('[Auto-Publisher] No posts found in entry!');
    process.exit(1);
  }

  // DUPLICATE LOCK — Only publish ONCE per day regardless of how many cron jobs run
  if (entry.autoPublished === true) {
    console.log(`✅ [Auto-Publisher] Already published for ${entry.date} at ${entry.autoPublishedAt}. Skipping duplicate.`);
    process.exit(0);
  }

  // Pick Post 1 as default daily auto-publish post
  const post = entry.posts[0];
  const postContent = (post.postContent && post.postContent.content) ? post.postContent.content : post.content;
  
  // Use the high-resolution 1080x1080 rendered creative graphic
  const imageUrl = `${BASE_URL}/creative_1.png`;

  console.log(`[Auto-Publisher] Selected Post 1 for ${entry.date}: "${post.headline || (post.postContent && post.postContent.imageHeadline)}"`);
  console.log(`[Auto-Publisher] Creative Image URL: ${imageUrl}`);

  const payload = {
    text: postContent,
    content: postContent,
    post: postContent,
    body: postContent,
    commentary: postContent,
    message: postContent,
    imageUrl: imageUrl,
    image_url: imageUrl,
    mediaUrl: imageUrl,
    media_url: imageUrl,
    image: imageUrl,
    photo: imageUrl,
    url: imageUrl,
    headline: post.headline || (post.postContent && post.postContent.imageHeadline) || '',
    title: post.headline || (post.postContent && post.postContent.imageHeadline) || '',
    category: entry.category || 'marketing',
    date: entry.date,
    postId: 1,
    timestamp: new Date().toISOString(),
    author: 'Marketing & Business Expert'
  };

  console.log(`[Auto-Publisher] Sending payload to ${WEBHOOK_URL}...`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`[Auto-Publisher] Webhook response HTTP ${response.status}: ${responseText}`);

    if (response.ok) {
      console.log('✅ [Auto-Publisher] Daily post successfully published to Webhook!');
      entry.autoPublished = true;
      entry.autoPublishedAt = new Date().toISOString();
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
      console.log('✅ [Auto-Publisher] Lock saved — no duplicates will fire today.');
    } else {
      console.error(`❌ [Auto-Publisher] Webhook returned error HTTP ${response.status}: ${responseText}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ [Auto-Publisher] Network error delivering to webhook: ${err.message}`);
    process.exit(1);
  }
}

autoPublishToday();
