import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { scrapeTrends } from './scraper.js';
import { generatePosts } from './generator.js';

// Load environment variables for local testing
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'public', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure public/data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Utility to get formatted date string in local time (YYYY-MM-DD)
function getLocalDateString() {
  const d = new Date();
  // Adjust for Indian Standard Time (UTC+5:30) as standard timezone for the user
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Utility to determine the alternating category for a specific date
function getCategoryForDate(dateStr) {
  const baseline = new Date('2026-01-01T00:00:00Z');
  const current = new Date(`${dateStr}T00:00:00Z`);
  const diffTime = Math.abs(current - baseline);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays % 2 === 0 ? 'marketing' : 'ai';
}

// Read existing history
function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[CLI] Failed to read history.json:', err.message);
    return [];
  }
}

// Save generation results
function saveGeneration(date, category, posts) {
  const history = getHistory();
  
  // Filter out today's existing entry if present (to avoid duplicates)
  const filtered = history.filter(item => item.date !== date);
  
  const newEntry = {
    date,
    category,
    posts,
    selectedPostId: null,
    postedAt: null,
    status: 'draft' // 'draft', 'posted'
  };
  
  filtered.unshift(newEntry);
  
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    console.log(`[CLI] Successfully saved daily generation for ${date} to history.json`);
    return true;
  } catch (err) {
    console.error('[CLI] Failed to write history.json:', err.message);
    return false;
  }
}

async function run() {
  console.log('==================================================');
  console.log('   LinkedIn Publisher Daily Generation CLI   ');
  console.log('==================================================\n');

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error('❌ Error: GEMINI_API_KEY environment variable is missing.');
    process.exit(1);
  }

  const todayStr = getLocalDateString();
  const force = process.argv.includes('--force');
  const history = getHistory();
  const hasToday = history.some(item => item.date === todayStr);

  if (hasToday && !force) {
    console.log(`[CLI] Today's drafts (${todayStr}) already exist in history.json.`);
    console.log('Skipping generation. Use "--force" flag to overwrite today\'s drafts.');
    process.exit(0);
  }

  const category = getCategoryForDate(todayStr);
  console.log(`[CLI] Generating drafts for Date: ${todayStr} | Category: ${category}`);

  try {
    console.log('[CLI] Step 1: Scraping latest industry trends...');
    const trends = await scrapeTrends(category);
    console.log(`[CLI] Scraped ${trends.length} trending items.`);

    console.log('[CLI] Step 2: Generating drafts using Gemini AI...');
    const posts = await generatePosts(category, trends, geminiKey);
    console.log(`[CLI] Successfully generated ${posts.length} drafts.`);

    console.log('[CLI] Step 3: Saving drafts to public/data/history.json...');
    saveGeneration(todayStr, category, posts);
    
    console.log('\n🎉 [CLI] Daily generation pipeline completed successfully!');
  } catch (err) {
    console.error('\n❌ [CLI] Generation failed:', err.message);
    process.exit(1);
  }
}

run();
