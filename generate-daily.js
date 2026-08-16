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

const DATA_DIR = path.join(__dirname, 'docs', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure docs/data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Bulletproof IST date string using Intl.DateTimeFormat (works on any runner/timezone)
function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  // Returns 'YYYY-MM-DD' format in IST regardless of system timezone
}

// Get yesterday's date in IST
function getYesterdayIST() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Utility to determine the category for a specific date (70% marketing, 30% ai split)
function getCategoryForDate(dateStr) {
  const baseline = new Date('2026-01-01T00:00:00Z');
  const current = new Date(`${dateStr}T00:00:00Z`);
  const diffTime = Math.abs(current - baseline);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const cycleDay = diffDays % 10;
  
  // 7 days marketing (0, 1, 2, 4, 5, 6, 8) and 3 days ai (3, 7, 9) in a 10-day cycle
  const aiDays = [3, 7, 9];
  return aiDays.includes(cycleDay) ? 'ai' : 'marketing';
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
  
  // Sort by date descending to keep newest first
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    console.log(`[CLI] Successfully saved daily generation for ${date} to history.json`);
    return true;
  } catch (err) {
    console.error('[CLI] Failed to write history.json:', err.message);
    return false;
  }
}

// Standalone fallback post generator (Guarantees drafts generation even if API is unavailable)
function buildFallbackPosts(category, dateStr) {
  const isMarketing = category.toLowerCase() === 'marketing';
  const archetypes = [
    { name: 'News Anchor', layout: 'news-card', palette: 'Corporate Navy', role: 'AI Consultant', env: 'Technology command center', cam: 'Looking at camera', suit: 'Navy business suit' },
    { name: 'Consultant Presentation', layout: 'presentation-slide', palette: 'Emerald Green', role: 'Business Coach', env: 'Executive boardroom', cam: 'Presentation shot', suit: 'Charcoal executive suit' },
    { name: 'Forbes Cover', layout: 'magazine-cover', palette: 'Electric Blue', role: 'Startup Founder', env: 'Luxury office', cam: 'Half-body portrait', suit: 'Smart casual blazer' },
    { name: 'Podcast Host', layout: 'podcast-layout', palette: 'Cyber Purple', role: 'Podcast Host', env: 'Podcast studio', cam: 'Sitting at desk', suit: 'Turtleneck with blazer' },
    { name: 'TED Speaker', layout: 'hero-center', palette: 'Crimson Red', role: 'TED Speaker', env: 'Auditorium stage', cam: 'Speaking on stage', suit: 'Conference speaker outfit' }
  ];

  const templates = isMarketing ? [
    { hook: "AI search is changing SEO forever.", topic: "HubSpot AEO vs Profound: Optimizing for AI answer engines.", headline: "*AI* SEARCH *EXPLODES*", subtext: "New tools track brand visibility in AI answers.", badge: "AI TREND" },
    { hook: "Stop writing generic B2B emails.", topic: "How high-converting brands use personalized RAG prompts for outreach.", headline: "B2B *EMAIL* *PLAYBOOK*", subtext: "Step-by-step framework to double response rates.", badge: "PLAYBOOK" },
    { hook: "Why third-party cookies don't matter.", topic: "First-party data attribution is the new competitive moat.", headline: "COOKIE-LESS *FUTURE*", subtext: "3 first-party data strategies for 2026.", badge: "STRATEGY" },
    { hook: "The 1 biggest marketing mistake.", topic: "Focusing on features instead of customer pain points.", headline: "THE *BIGGEST* *MISTAKE*", subtext: "Why feature lists decrease landing page conversions.", badge: "CASE STUDY" },
    { hook: "5 predictions for digital growth.", topic: "Where marketing automation & voice search are headed in 2027.", headline: "2027 *GROWTH* *OUTLOOK*", subtext: "Future-proofing your brand's digital presence.", badge: "PREDICTION" }
  ] : [
    { hook: "Generative AI video is here.", topic: "Sora & Gen-3 models are revolutionizing ad creative production.", headline: "AI *VIDEO* *REVOLUTION*", subtext: "Lower ad costs with dynamic AI video assets.", badge: "AI NEWS" },
    { hook: "Build your own marketing copilot.", topic: "How to fine-tune a private SLM on your historical sales copy.", headline: "CUSTOM *MARKETING* *COPILOT*", subtext: "Train lightweight models on your brand voice.", badge: "TUTORIAL" },
    { hook: "AI copy isn't replacing writers.", topic: "Why human editing is mandatory for high-converting brand messaging.", headline: "HUMAN + *AI* *SYNERGY*", subtext: "Drafting fast without sacrificing authentic tone.", badge: "DEBATE" },
    { hook: "Why public AI tools leak data.", topic: "Implementing strict enterprise data guardrails for AI tools.", headline: "ENTERPRISE *AI* *SECURITY*", subtext: "Preventing sensitive data leaks in AI writers.", badge: "GUIDE" },
    { hook: "Voice search is taking over.", topic: "How multi-modal Gemini Live changes brand discovery habits.", headline: "VOICE *SEARCH* *ERA*", subtext: "Optimizing content for conversational AI queries.", badge: "FUTURE TREND" }
  ];

  return archetypes.map((arch, idx) => {
    const t = templates[idx];
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
        content: `${t.hook}\n\n${t.topic}\n\nBrands need to adapt their strategy today. Connect these insights directly to your campaigns for maximum impact.\n\nWhat is your team's strategy for this?`,
        sourceArticle: t.topic,
        imageHeadline: t.headline,
        imageSubtext: t.subtext,
        badgeText: t.badge,
        ctaText: "READ FULL POST"
      },
      layoutConfig: { dimensions: { width: 1080, height: 1080 } }
    };
  });
}

// Generate drafts for a single date
async function generateForDate(dateStr, geminiKey, force) {
  const history = getHistory();
  const hasDate = history.some(item => item.date === dateStr);

  if (hasDate && !force) {
    console.log(`[CLI] Drafts for ${dateStr} already exist. Skipping.`);
    return false;
  }

  const category = getCategoryForDate(dateStr);
  console.log(`[CLI] Generating drafts for Date: ${dateStr} | Category: ${category}`);

  let posts = null;

  if (geminiKey) {
    try {
      console.log('[CLI] Step 1: Scraping latest industry trends...');
      const trends = await scrapeTrends(category);
      console.log(`[CLI] Scraped ${trends.length} trending items.`);

      console.log('[CLI] Step 2: Generating drafts using Gemini AI...');
      posts = await generatePosts(category, trends, geminiKey);
      console.log(`[CLI] Successfully generated ${posts.length} AI drafts.`);
    } catch (err) {
      console.warn(`[CLI] ⚠️ Gemini API generation failed (${err.message}). Utilizing structured fallback template engine...`);
    }
  } else {
    console.warn(`[CLI] ⚠️ GEMINI_API_KEY environment variable missing. Utilizing structured fallback template engine...`);
  }

  if (!posts || posts.length === 0) {
    posts = buildFallbackPosts(category, dateStr);
    console.log(`[CLI] Successfully generated ${posts.length} fallback drafts for ${dateStr}.`);
  }

  console.log('[CLI] Step 3: Saving drafts to docs/data/history.json...');
  saveGeneration(dateStr, category, posts);
  return true;
}

async function run() {
  console.log('==================================================');
  console.log('   LinkedIn Publisher Daily Generation CLI   ');
  console.log('==================================================\n');

  const geminiKey = process.env.GEMINI_API_KEY;
  const todayStr = getTodayIST();
  const yesterdayStr = getYesterdayIST();
  const force = process.argv.includes('--force');

  console.log(`[CLI] Today (IST): ${todayStr}`);
  console.log(`[CLI] Yesterday (IST): ${yesterdayStr}`);
  console.log(`[CLI] Force mode: ${force}\n`);

  let generated = false;

  try {
    // Catch-up: If yesterday's drafts are also missing, generate them first
    const history = getHistory();
    const hasYesterday = history.some(item => item.date === yesterdayStr);
    if (!hasYesterday) {
      console.log(`[CLI] ⚠️ Yesterday's drafts (${yesterdayStr}) are missing! Generating catch-up...\n`);
      try {
        await generateForDate(yesterdayStr, geminiKey, false);
        generated = true;
        console.log(`[CLI] ✅ Catch-up for ${yesterdayStr} complete.\n`);
      } catch (catchupErr) {
        console.warn(`[CLI] ⚠️ Catch-up for ${yesterdayStr} failed: ${catchupErr.message}. Continuing with today...`);
      }
    }

    // Generate today's drafts
    const todayGenerated = await generateForDate(todayStr, geminiKey, force);
    if (todayGenerated) generated = true;

    if (generated) {
      console.log('\n🎉 [CLI] Daily generation pipeline completed successfully!');
    } else {
      console.log('\n✅ [CLI] All drafts are up to date. Nothing to generate.');
    }
  } catch (err) {
    console.error('\n❌ [CLI] Generation failed:', err.message);
  }
}

run();
