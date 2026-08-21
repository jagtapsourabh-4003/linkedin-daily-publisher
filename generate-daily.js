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

// Utility to determine the category for a specific date (80% marketing, 20% ai split)
function getCategoryForDate(dateStr) {
  const baseline = new Date('2026-01-01T00:00:00Z');
  const current = new Date(`${dateStr}T00:00:00Z`);
  const diffTime = Math.abs(current - baseline);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const cycleDay = diffDays % 10;
  
  // 8 days marketing (0, 1, 2, 3, 5, 6, 7, 8) and 2 days ai (4, 9) in a 10-day cycle (exactly 80% / 20%)
  const aiDays = [4, 9];
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

// Comprehensive library of 30+ Marketing and 20+ AI topics for rich daily diversity
const TOPICS_LIBRARY = {
  marketing: [
    { hook: "AI search is changing SEO forever.", topic: "HubSpot AEO vs Profound: Optimizing brand visibility for conversational answer engines.", headline: "*AI* SEARCH *EXPLODES*", subtext: "New tools track brand visibility in AI answers.", badge: "AI TREND" },
    { hook: "Stop writing generic B2B emails.", topic: "How high-converting brands use personalized RAG prompts and intent triggers for outreach.", headline: "B2B *EMAIL* *PLAYBOOK*", subtext: "Step-by-step framework to double response rates.", badge: "PLAYBOOK" },
    { hook: "Why third-party cookies don't matter.", topic: "First-party data attribution and server-side tracking are the new competitive moat.", headline: "COOKIE-LESS *FUTURE*", subtext: "3 first-party data strategies for 2026.", badge: "STRATEGY" },
    { hook: "The #1 landing page mistake.", topic: "Focusing on feature lists instead of visceral customer pain points cuts conversions in half.", headline: "THE *BIGGEST* *MISTAKE*", subtext: "Why feature lists decrease landing page conversions.", badge: "CASE STUDY" },
    { hook: "5 predictions for digital growth.", topic: "Why retention loops generate 70% higher ROI than paid ad acquisition in 2026.", headline: "2026 *GROWTH* *OUTLOOK*", subtext: "Future-proofing your brand's digital presence.", badge: "PREDICTION" },
    { hook: "Zero-click content is winning LinkedIn.", topic: "How to build high-authority thought leadership when social platforms punish external links.", headline: "ZERO-CLICK *AUTHORITY*", subtext: "Deliver 100% value directly in the feed.", badge: "LINKEDIN GROWTH" },
    { hook: "Dark social drives 80% of your sales.", topic: "Conversational referrals on Slack, WhatsApp, and podcasts that traditional analytics fail to measure.", headline: "DARK *SOCIAL* *POWER*", subtext: "Measuring word-of-mouth pipeline in B2B.", badge: "ATTRIBUTION" },
    { hook: "The 5-slide carousel anatomy.", topic: "How visual teardowns generated 1.2M organic impressions with zero advertising budget.", headline: "VIRAL *CAROUSEL* *GUIDE*", subtext: "Slide-by-slide structure for B2B engagement.", badge: "PLAYBOOK" },
    { hook: "Tier-anchoring will boost your SaaS revenue.", topic: "How pricing page visual decoys and feature tiers increase average revenue per user.", headline: "PRICING *PSYCHOLOGY*", subtext: "Design tactics that drive enterprise plan upgrades.", badge: "GROWTH" },
    { hook: "Interactive calculators outperform ebooks.", topic: "Why free web tools and ROI calculators convert 4x better than generic PDF whitepapers.", headline: "INTERACTIVE *LEAD* *GEN*", subtext: "Building self-serve tools that capture pipeline.", badge: "CONVERSION" },
    { hook: "Kill your boring case studies.", topic: "The 'Hero-Villain-Resolution' storytelling framework that turns dry testimonials into closing assets.", headline: "STORYTELLING *MASTERY*", subtext: "How to write case studies that actually close.", badge: "CASE STUDY" },
    { hook: "Founder videos beat agency ad studios.", topic: "Why raw smartphone talking-head videos consistently out-convert $10k commercial productions.", headline: "AUTHENTIC *VIDEO* *ADS*", subtext: "Low-budget creative formats winning on paid feeds.", badge: "PAID MEDIA" },
    { hook: "Community-led growth cuts CAC by 60%.", topic: "Building customer Slack communities and roundtables that turn users into brand evangelists.", headline: "COMMUNITY *GROWTH* *MOAT*", subtext: "How peer networks replace expensive search ads.", badge: "STRATEGY" },
    { hook: "The 3-second homepage clarity test.", topic: "Fixing above-the-fold value propositions to double free trial and demo signups.", headline: "HOMEPAGE *CONVERSION*", subtext: "Simple copy tweaks that double signup rates.", badge: "CRO" },
    { hook: "The 4-part onboarding email sequence.", topic: "How to structure day-1 to day-7 onboarding emails to reduce customer churn by 45%.", headline: "RETENTION *PLAYBOOK*", subtext: "Automated nurture flows that activate users.", badge: "EMAIL MARKETING" }
  ],
  ai: [
    { hook: "Generative AI video is here.", topic: "Runway Gen-3 & Sora workflows: How ad agencies produce dynamic video variations in minutes.", headline: "AI *VIDEO* *REVOLUTION*", subtext: "Lower ad costs with dynamic AI video assets.", badge: "AI NEWS" },
    { hook: "Build your own marketing copilot.", topic: "How to fine-tune a private SLM on your historical sales letters and high-converting copy.", headline: "CUSTOM *MARKETING* *COPILOT*", subtext: "Train lightweight models on your brand voice.", badge: "TUTORIAL" },
    { hook: "AI copy isn't replacing writers.", topic: "Why human editing is mandatory for high-converting brand messaging and tone integrity.", headline: "HUMAN + *AI* *SYNERGY*", subtext: "Drafting fast without sacrificing authentic tone.", badge: "DEBATE" },
    { hook: "Why public AI tools leak data.", topic: "Implementing enterprise data governance to prevent customer data leaks in public AI writers.", headline: "ENTERPRISE *AI* *SECURITY*", subtext: "Preventing sensitive data leaks in AI writers.", badge: "GUIDE" },
    { hook: "Voice search is taking over.", topic: "How multi-modal Gemini Live and GPT-4o voice changes brand discovery habits.", headline: "VOICE *SEARCH* *ERA*", subtext: "Optimizing content for conversational AI queries.", badge: "FUTURE TREND" },
    { hook: "Autonomous marketing agents are live.", topic: "Deploying multi-agent research pipelines to monitor competitor pricing and ads 24/7.", headline: "AUTONOMOUS *AI* *AGENTS*", subtext: "Automate competitor intelligence around the clock.", badge: "AI TECH" },
    { hook: "Synthetic focus groups test ad copy.", topic: "Simulating user persona reactions with AI agents before spending $50k on ad campaigns.", headline: "SYNTHETIC *PERSONA* *TESTS*", subtext: "Predicting ad performance before campaign launch.", badge: "EXPERIMENT" },
    { hook: "Semantic RAG stops AI hallucinations.", topic: "Grounding internal brand copilots in product specs to generate 100% accurate marketing copy.", headline: "ACCURATE *BRAND* *RAG*", subtext: "Eliminate hallucinations in marketing workflows.", badge: "TUTORIAL" },
    { hook: "Predictive ML lead scoring.", topic: "Using machine learning to score inbound demo requests and route top-tier accounts to senior reps.", headline: "PREDICTIVE *LEAD* *SCORING*", subtext: "AI routing that shortens sales cycle times.", badge: "B2B AI" },
    { hook: "Dynamic real-time ad copy.", topic: "Serving personalized ad copy dynamically tailored to the viewer's industry and tech stack.", headline: "REAL-TIME *AD* *COPY*", subtext: "AI personalization that boosts click-throughs.", badge: "PAID MEDIA" }
  ]
};

// Standalone fallback post generator (Guarantees drafts generation with rich dynamic variety)
function buildFallbackPosts(category, dateStr) {
  const isMarketing = category.toLowerCase() === 'marketing';
  const pool = isMarketing ? TOPICS_LIBRARY.marketing : TOPICS_LIBRARY.ai;
  
  // Deterministic seed based on date string to ensure different posts each day
  const baseline = new Date('2026-01-01T00:00:00Z');
  const current = new Date(`${dateStr}T00:00:00Z`);
  const diffDays = Math.floor(Math.abs(current - baseline) / (1000 * 60 * 60 * 24));
  
  const archetypes = [
    { name: 'News Anchor', layout: 'news-card', palette: 'Corporate Navy', role: 'AI Consultant', env: 'Technology command center', cam: 'Looking at camera', suit: 'Navy business suit' },
    { name: 'Consultant Presentation', layout: 'presentation-slide', palette: 'Emerald Green', role: 'Business Coach', env: 'Executive boardroom', cam: 'Presentation shot', suit: 'Charcoal executive suit' },
    { name: 'Forbes Cover', layout: 'magazine-cover', palette: 'Electric Blue', role: 'Startup Founder', env: 'Luxury office', cam: 'Half-body portrait', suit: 'Smart casual blazer' },
    { name: 'Podcast Host', layout: 'podcast-layout', palette: 'Cyber Purple', role: 'Podcast Host', env: 'Podcast studio', cam: 'Sitting at desk', suit: 'Turtleneck with blazer' },
    { name: 'TED Speaker', layout: 'hero-center', palette: 'Crimson Red', role: 'TED Speaker', env: 'Auditorium stage', cam: 'Speaking on stage', suit: 'Conference speaker outfit' }
  ];

  return archetypes.map((arch, idx) => {
    const topicIndex = (diffDays * 5 + idx) % pool.length;
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
        content: `${t.hook}\n\n${t.topic}\n\nHigh-growth teams are operationalizing these strategies right now to win market share and build defensible brand moats.\n\nWhat is your team's approach for this?`,
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
