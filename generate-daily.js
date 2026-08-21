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

// Comprehensive library of beginner-friendly, simple layman Marketing and AI topics
const TOPICS_LIBRARY = {
  marketing: [
    {
      hook: "Most people search Google the wrong way.",
      topic: "How everyday people are using AI tools to find quick answers online instead of clicking 10 blue links.",
      headline: "SEARCH *IS CHANGING*",
      subtext: "How customers find answers today.",
      badge: "SIMPLE GUIDE",
      content: `Most people search Google the wrong way.

Instead of clicking through 10 different website links, people now just ask AI tools like ChatGPT to give them one quick, direct answer.

If you run a business or create content, here is what to do:

1. Give direct answers: Put the important answers right at the top of your page.
2. Answer real questions: What does your product cost? How does it help?
3. Keep it simple: Write like you are explaining it to a smart friend.

Think of it like being the friendly person everyone turns to for advice.

Have you started using AI to search for things instead of Google? Let me know below!`
    },
    {
      hook: "Stop sending boring sales emails.",
      topic: "Simple rules to write friendly emails that people actually want to open and reply to.",
      headline: "BETTER *SALES EMAILS*",
      subtext: "3 simple rules to get real replies.",
      badge: "HELPFUL TIP",
      content: `Stop sending boring sales emails.

Nobody likes opening an email that looks like a robot copied and pasted it to 1,000 strangers.

Here are 3 simple rules to get real replies:

1. Talk to one person: Write like you are sending a note to a colleague.
2. Focus on their problem: Don't brag about your company. Ask how you can help them.
3. Keep it short: If they can't read it in 30 seconds on their phone, they will delete it.

Good marketing is just good conversation.

What is the best sales email you ever received?`
    },
    {
      hook: "Why your website isn't making sales.",
      topic: "The #1 mistake businesses make on their homepage: listing complex features instead of simple benefits.",
      headline: "FIX YOUR *WEBSITE*",
      subtext: "The #1 mistake most businesses make.",
      badge: "CASE STUDY",
      content: `Why your website isn't making sales.

When a customer lands on your website, you have about 3 seconds to answer one question:

"How does this help ME?"

Most websites make the mistake of listing complicated features instead of explaining the real benefit in plain English.

Here is a simple example:
- Complicated: "We provide high-speed automated cloud sync technology."
- Simple & Clear: "Never lose a file again. Access your work from anywhere in 1 click."

Always sell the result, not the tool.

Does your website pass the 3-second test?`
    },
    {
      hook: "People buy from people, not logos.",
      topic: "Why personal stories and honest founder posts build 10x more trust than corporate brand pages.",
      headline: "BUILDING *REAL TRUST*",
      subtext: "Why founder stories win every time.",
      badge: "GROWTH TIP",
      content: `People buy from people, not logos.

Notice how the most popular accounts on LinkedIn are real people sharing honest lessons, not boring corporate company pages?

Here is how to build trust without being fake:

1. Share your lessons: What went wrong this week and what did you learn from it?
2. Show behind the scenes: People love seeing how things are actually made.
3. Be helpful for free: Share your best advice without asking for anything back.

When you build trust first, customers come to you naturally.

Do you prefer buying from a person or a company?`
    },
    {
      hook: "The cheapest way to grow your business.",
      topic: "Why taking great care of existing customers is 5x cheaper than spending money on ads.",
      headline: "KEEP YOUR *CUSTOMERS*",
      subtext: "Why happy customers beat expensive ads.",
      badge: "STRATEGY",
      content: `The cheapest way to grow your business.

Most companies spend thousands of dollars on ads trying to get new strangers to buy from them.

Yet they completely forget about the customers who already trust them!

Here are 3 simple ways to keep customers happy:

1. Check in after the sale: Send a quick message asking how everything is going.
2. Fix issues fast: A fast apology and quick fix turns an unhappy buyer into a loyal fan.
3. Reward loyalty: Give special perks or discounts to people who stay with you.

Keeping a happy customer is 5x cheaper than finding a new one.

How do you stay in touch with your past clients?`
    },
    {
      hook: "If you confuse people, you lose them.",
      topic: "Why replacing fancy buzzwords with simple everyday words doubles your sales.",
      headline: "WRITE *SIMPLE WORDS*",
      subtext: "How clear words double your sales.",
      badge: "WRITING TIP",
      content: `If you confuse people, you lose them.

Many businesses think using big, fancy words makes them look smart and professional.

In reality, fancy buzzwords just confuse your customers and make them leave.

Try these simple word swaps today:
- Instead of "utilize" -> use "use"
- Instead of "facilitate" -> use "help"
- Instead of "commence" -> use "start"
- Instead of "synergize" -> use "work together"

Clear writing is clear thinking.

What is one business buzzword you wish people would stop using?`
    },
    {
      hook: "The #1 marketing tool you can't buy.",
      topic: "How delivering outstanding service turns everyday customers into your biggest promoters.",
      headline: "WORD OF *MOUTH POWER*",
      subtext: "How great service creates free growth.",
      badge: "SUCCESS TIP",
      content: `The #1 marketing tool you can't buy.

Think about the last app, book, or service you bought. Chances are, a friend recommended it to you.

Word of mouth is still the most powerful growth engine in the world.

How to get people talking about your business:

1. Be insanely easy to work with.
2. Deliver faster than you promised.
3. Do one small unexpected nice gesture for every client.

Make your service so good that people can't stop telling their friends.

What is the last product you recommended to someone?`
    }
  ],
  ai: [
    {
      hook: "AI is not here to replace you.",
      topic: "How everyday professionals use AI to save 5 hours every week on repetitive tasks.",
      headline: "WORK *SMARTER WITH AI*",
      subtext: "How to save 5 hours every week.",
      badge: "AI BASICS",
      content: `AI is not here to replace you.

It is here to replace the boring, repetitive tasks you hate doing.

Think of AI like having a super fast intern who works 24/7:

1. Brainstorming ideas: Ask it for 10 title ideas when you are feeling stuck.
2. Summarizing long notes: Turn a 5-page document into 3 key bullet points in seconds.
3. Fixing your grammar: Clean up typos and make your writing easier to read.

You are still the pilot. AI is just the co-pilot.

What is the #1 task you wish AI could do for you automatically?`
    },
    {
      hook: "How to write better prompts in 10 seconds.",
      topic: "A simple 3-part formula to get great answers from ChatGPT or Gemini every time.",
      headline: "BETTER *AI PROMPTS*",
      subtext: "A simple 3-step formula that works.",
      badge: "QUICK TUTORIAL",
      content: `How to write better prompts in 10 seconds.

If you give AI a vague question, it gives you a boring, robotic answer.

To get amazing results, use this simple 3-step formula:

1. Who it is: "Act as a friendly marketing coach."
2. What you need: "Write a short 3-sentence email invite for a free webinar."
3. The audience: "Make it simple for small shop owners to understand."

The clearer you are with AI, the better answers you get.

Try this formula today and see the difference!`
    },
    {
      hook: "Why you should never copy-paste AI text.",
      topic: "Why human editing and your real voice are essential when using AI writing tools.",
      headline: "HUMAN + *AI TEAMWORK*",
      subtext: "Why your personal voice matters.",
      badge: "AI ADVICE",
      content: `Why you should never copy-paste AI text.

AI tools are great at making a first draft in 5 seconds.

But if you post raw AI text without editing it, everyone can tell. It sounds generic, stiff, and robotic.

Here is the smart way to use AI:
1. Use AI to get your ideas down fast.
2. Add your own personal stories and real experiences.
3. Remove fancy buzzwords and make it sound like YOU.

Use AI for speed, but keep your human heart in the story.

Do you edit what AI writes, or post it directly?`
    },
    {
      hook: "Creating videos with AI just got simple.",
      topic: "How new video AI tools allow anyone to create professional short video clips from text.",
      headline: "AI *VIDEO CREATION*",
      subtext: "Create video clips in minutes.",
      badge: "NEW TECH",
      content: `Creating videos with AI just got simple.

You used to need expensive cameras, studio lights, and editing software to create product videos.

Now, new AI tools can create clean background videos and animations from a simple text sentence.

What this means for small businesses:
1. Faster testing: Test 5 different video ideas in an afternoon.
2. Lower costs: No need to hire a film crew for simple social clips.
3. More creativity: Turn any idea into a visual story in minutes.

Technology is making creative tools accessible to everyone.

Have you tried generating an AI video yet?`
    },
    {
      hook: "Keep your private data safe with AI.",
      topic: "Simple common-sense safety rules when using public AI tools for work.",
      headline: "SAFE *AI PRACTICES*",
      subtext: "Simple rules to protect your privacy.",
      badge: "SAFETY GUIDE",
      content: `Keep your private data safe with AI.

AI tools are powerful, but you have to be smart about what you share with them.

Here are 3 simple safety rules for your daily work:

1. Never paste private passwords, bank details, or secret client names into public AI tools.
2. Use placeholder words: Change "John from ABC Corp" to "Client A from a retail store."
3. Check the facts: Always double-check numbers and claims before publishing.

AI is an amazing assistant when used with common sense.

Does your company have clear guidelines for using AI?`
    }
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
    { name: 'News Anchor', layout: 'news-card', palette: 'Corporate Navy', role: 'Business Advisor', env: 'Technology command center', cam: 'Looking at camera', suit: 'Navy business suit' },
    { name: 'Consultant Presentation', layout: 'presentation-slide', palette: 'Emerald Green', role: 'Business Coach', env: 'Executive boardroom', cam: 'Presentation shot', suit: 'Charcoal executive suit' },
    { name: 'Forbes Cover', layout: 'magazine-cover', palette: 'Electric Blue', role: 'Startup Founder', env: 'Luxury office', cam: 'Half-body portrait', suit: 'Smart casual blazer' },
    { name: 'Podcast Host', layout: 'podcast-layout', palette: 'Cyber Purple', role: 'Podcast Host', env: 'Podcast studio', cam: 'Sitting at desk', suit: 'Turtleneck with blazer' },
    { name: 'TED Speaker', layout: 'hero-center', palette: 'Crimson Red', role: 'Speaker', env: 'Auditorium stage', cam: 'Speaking on stage', suit: 'Conference speaker outfit' }
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
        content: t.content,
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
