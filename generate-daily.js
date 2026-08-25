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

// Comprehensive library of Marketing Concepts (40%), World of Marketing Updates (30%), and AI Marketing (30%)
const TOPICS_LIBRARY = {
  // 40% - Core Marketing Concepts & Frameworks (Purple Cow, Flywheel, Blue Ocean, AIDA, TOFU-BOFU, Lindy, PMF, etc.)
  marketingConcepts: [
    {
      concept: "Purple Cow",
      hook: "Why being very good is no longer enough.",
      topic: "The Purple Cow concept by Seth Godin: Why remarkable products win without spending a fortune on ads.",
      headline: "THE *PURPLE COW*",
      subtext: "Why being remarkable beats being good.",
      badge: "MARKETING CONCEPT",
      content: `Why being very good is no longer enough.

Imagine driving down a country road and seeing a field of brown cows. You admire them for 2 minutes, then you get bored and look away.

Now imagine seeing a PURPLE COW.

You would immediately stop your car, take a photo, and tell all your friends.

In marketing, this is the Purple Cow concept (made famous by Seth Godin):
- "Good" is normal, boring, and invisible.
- "Remarkable" is worth talking about.

3 ways to become a Purple Cow:
1. Do something unexpected: Add a surprise gift or handwritten note with every order.
2. Specialize deeply: Don't be an "agency." Be the only agency for dental clinics.
3. Fix an annoying industry problem: If everyone charges hidden fees, make yours 100% transparent.

Stop trying to be slightly better. Start being remarkable.

What is one brand you think is a true Purple Cow?`
    },
    {
      concept: "The Flywheel Effect",
      hook: "Business growth is not an overnight push.",
      topic: "The Flywheel Effect by Jim Collins: How small, consistent actions compound into unstoppable momentum.",
      headline: "THE *FLYWHEEL EFFECT*",
      subtext: "How small wins create unstoppable momentum.",
      badge: "GROWTH MODEL",
      content: `Business growth is not an overnight push.

Think of your business like a giant, 5,000-pound metal wheel (a Flywheel).

When you first try to turn it:
- Push 1: The wheel barely moves an inch. You are exhausted.
- Push 2: It moves half an inch more.
- Push 100: It completes its first full rotation!

Then something magical happens. The heavy weight of the wheel starts working FOR you. With each push, it spins faster and faster under its own momentum.

How to build your marketing flywheel:
1. Deliver amazing results for client #1.
2. Ask for a quick testimonial or referral.
3. Share that success story to attract client #2 and #3.

Each small win feeds the next step in the loop.

What is the single most important step in your business flywheel?`
    },
    {
      concept: "Red Ocean vs Blue Ocean Strategy",
      hook: "Stop fighting in crowded, bloody waters.",
      topic: "Blue Ocean Strategy: How to create uncontested market space and make the competition irrelevant.",
      headline: "*BLUE OCEAN* STRATEGY",
      subtext: "Create new markets instead of fighting rivals.",
      badge: "STRATEGY MODEL",
      content: `Stop fighting in crowded, bloody waters.

In business strategy, there are two types of oceans:

1. Red Oceans: Crowded markets where rivals fight ruthlessly for the exact same customers. Prices drop, profit margins shrink, and the water turns "red" with cutthroat competition.

2. Blue Oceans: Untapped, wide-open markets where you create something unique and have zero direct competitors.

How Cirque du Soleil created a Blue Ocean:
Instead of competing with traditional circuses (expensive animal acts, cheap kids' tickets), they combined theater, live music, and acrobatics for adults who happily pay premium prices.

3 rules to find your Blue Ocean:
1. Don't fight on price: Compete on a totally different experience.
2. Eliminate what customers hate: Remove the friction everyone else tolerates.
3. Combine two separate worlds: Mix your industry with another to create a fresh category.

Are you swimming in a Red Ocean or building a Blue Ocean?`
    },
    {
      concept: "The Law of Category",
      hook: "If you can't be first, create a new category.",
      topic: "The Law of Category from The 22 Immutable Laws of Marketing: Why pioneering a new niche beats competing head-on.",
      headline: "LAW OF *CATEGORY*",
      subtext: "Be first in a new category you create.",
      badge: "BRAND LAW",
      content: `If you can't be first, create a new category.

Who was the first person to fly solo across the Atlantic Ocean?
Charles Lindbergh. Everyone knows him.

Who was the second person?
Almost nobody remembers.

Who was the first WOMAN to do it?
Amelia Earhart. Everyone knows her!

This is the Law of Category:
If you cannot be the #1 brand in an existing market, invent a new category where you can be first.

How to apply this in your business:
1. Don't be another "web designer": Be the #1 web designer for B2B SaaS companies.
2. Don't be a generic "fitness coach": Be the fitness coach for busy executives over 40.
3. When you own a specific category, you become the only logical choice for that buyer.

What category does your business own?`
    },
    {
      concept: "The Lindy Effect",
      hook: "Why 100-year-old ideas beat weekly trends.",
      topic: "The Lindy Effect: Why timeless marketing principles outlast temporary social media fads.",
      headline: "THE *LINDY EFFECT*",
      subtext: "Why timeless ideas outlast flash-in-the-pan fads.",
      badge: "MENTAL MODEL",
      content: `Why 100-year-old ideas beat weekly trends.

The Lindy Effect is a powerful mental model:
The longer an idea has survived in the past, the longer it is likely to survive in the future.

A book that has been read for 50 years will likely be read for another 50. A trendy social media hack from last week will be forgotten by next month.

What this means for your marketing:
1. Focus on timeless human psychology: People will always care about saving time, making money, feeling respected, and protecting their families.
2. Master clear storytelling: Stories have worked for 10,000 years; algorithms change every 3 months.
3. Build assets that age well: High-quality guides, strong relationships, and genuine trust never go out of style.

Stop chasing every fleeting trend. Invest in timeless principles.

What is one timeless marketing rule you swear by?`
    },
    {
      concept: "The Halo Effect",
      hook: "One great feature makes everything look good.",
      topic: "The Halo Effect in Branding: How one standout positive trait influences the overall impression of a company.",
      headline: "THE *HALO EFFECT*",
      subtext: "How one great detail elevates your entire brand.",
      badge: "PSYCHOLOGY",
      content: `One great feature makes everything look good.

When Apple launched the iPod in 2001, something fascinating happened.

Sales of Apple Mac computers skyrocketed, even though Apple hadn't changed the computers at all!

Why? The Halo Effect.

Customers loved the iPod so much that they assumed ALL Apple products must be incredible. The positive glow of one product created a "halo" over the entire company.

How to create a Halo Effect for your business:
1. Pick one signature strength: Be ridiculously fast, insanely polite, or offer unmatched packaging.
2. Over-deliver on the first impression: Your onboarding experience sets the tone for everything that follows.
3. Let your best product lead: Promote your absolute best offer as the gateway to your business.

What is the single best "halo" feature of your product?`
    },
    {
      concept: "TOFU, MOFU, BOFU Funnel",
      hook: "Stop asking strangers to marry you on day 1.",
      topic: "The TOFU-MOFU-BOFU Framework: How to guide customers step-by-step from awareness to purchase.",
      headline: "*TOFU MOFU* BOFU",
      subtext: "How to guide buyers step-by-step to a sale.",
      badge: "MARKETING FRAMEWORK",
      content: `Stop asking strangers to marry you on day 1.

The biggest mistake in marketing is trying to sell to someone who just discovered you 5 seconds ago.

Smart marketers use the 3-stage funnel:

1. TOFU (Top of Funnel - Awareness):
Teach something genuinely helpful for free. No hard pitch. Help them realize their problem.

2. MOFU (Middle of Funnel - Consideration):
Show them how your method solves their problem. Share case studies, breakdowns, and comparison guides.

3. BOFU (Bottom of Funnel - Decision):
Give them a clear, risk-free offer to buy (free trial, money-back guarantee, direct call to action).

Meet customers where they are in their journey.

Which part of your funnel needs the most attention right now?`
    },
    {
      concept: "The AIDA Model",
      hook: "The 4-step formula behind every great post.",
      topic: "The AIDA Model (Attention, Interest, Desire, Action): The classic copywriting framework that drives conversions.",
      headline: "THE *AIDA MODEL*",
      subtext: "4 simple steps to turn readers into buyers.",
      badge: "COPYWRITING MODEL",
      content: `The 4-step formula behind every great post.

Ever wonder why some posts and landing pages convert effortlessly while others get ignored?

They follow the classic AIDA framework:

1. Attention (Hook):
Grab their eyes in the first 5 words. (e.g. "Stop sending boring sales emails.")

2. Interest (Engage):
Share a surprising fact or relatable truth that makes them want to keep reading.

3. Desire (Solve):
Paint a clear picture of how much easier their life will be with your solution.

4. Action (CTA):
Tell them exactly what single step to take next (e.g. "Click the link", "Leave a comment").

Save this formula for your next post or sales page!

Have you tried using AIDA in your writing?`
    },
    {
      concept: "Product-Market Fit (PMF)",
      hook: "How to know if people really want your offer.",
      topic: "Product-Market Fit (PMF): The ultimate milestone where customer demand pulls your business forward.",
      headline: "PRODUCT *MARKET FIT*",
      subtext: "When customers pull your product forward.",
      badge: "CORE CONCEPT",
      content: `How to know if people really want your offer.

Before Product-Market Fit (PMF), marketing feels like pushing a boulder uphill.

After Product-Market Fit, marketing feels like steering a speedboat.

Marc Andreessen defined PMF simply:
"Being in a good market with a product that can satisfy that market."

3 signs you have reached PMF:
1. Customers get upset if your product goes down.
2. Word of mouth happens naturally without paid ads.
3. Your main challenge is keeping up with demand, not finding buyers.

If you don't have PMF yet, spend 100% of your time talking to users, not buying ads.

How did you know when your product hit its sweet spot?`
    },
    {
      concept: "Share of Voice (SOV)",
      hook: "The brand that speaks most consistently wins.",
      topic: "Share of Voice (SOV) vs Share of Market: Why staying visible is the ultimate long-term growth lever.",
      headline: "SHARE OF *VOICE*",
      subtext: "Why owning the conversation owns the market.",
      badge: "GROWTH LAW",
      content: `The brand that speaks most consistently wins.

Share of Voice (SOV) measures how much of the conversation in your industry is about YOUR brand compared to competitors.

Decades of research show a clear rule:
If your Share of Voice is higher than your market share, your business will grow to match it over time.

How to increase your Share of Voice on a budget:
1. Post consistently on LinkedIn: 5 days a week of high-value insights puts you in the top 1%.
2. Engage on others' posts: Leave smart, thoughtful comments on key industry accounts.
3. Be known for ONE topic: When people think of your niche, make sure your name comes to mind first.

Visibility leads to familiarity. Familiarity leads to trust. Trust leads to sales.

What is your daily routine for staying visible?`
    },
    {
      concept: "Jobs To Be Done (JTBD)",
      hook: "People don't buy drills. They buy holes.",
      topic: "Jobs To Be Done (JTBD) by Clayton Christensen: Why customers hire products to solve progress struggles.",
      headline: "JOBS TO *BE DONE*",
      subtext: "Why customers hire your product for a job.",
      badge: "CUSTOMER INSIGHT",
      content: `People don't buy drills. They buy holes.

Harvard Professor Clayton Christensen discovered that customers don't buy products because of demographics.

They "hire" a product to get a specific job done in their life.

Classic example: McDonald's Milkshakes.
Why did people buy milkshakes at 8 AM?
Not because they loved dessert for breakfast.
They hired the milkshake because it was thick, lasted their entire 30-minute boring commute, and kept one hand clean while driving!

When writing your marketing copy:
- Don't sell the product features.
- Sell the progress the customer wants to make.

What "job" is your customer hiring you to do?`
    },
    {
      concept: "The Decoy Effect",
      hook: "Why the medium popcorn always sells.",
      topic: "The Decoy Effect in Pricing: How adding an intentional third choice guides buyer decisions.",
      headline: "THE *DECOY EFFECT*",
      subtext: "How pricing options guide customer choice.",
      badge: "PRICING PSYCHOLOGY",
      content: `Why the medium popcorn always sells.

At the movie theater:
- Small Popcorn: $3.00
- Large Popcorn: $7.00
Most people choose Small because $7 feels expensive.

Now add a "Decoy":
- Small: $3.00
- Medium: $6.50
- Large: $7.00

Suddenly, almost everyone buys the Large! For just 50 cents more than Medium, Large feels like an irresistible bargain.

How to use the Decoy Effect in your business:
1. Offer 3 packages: Basic, Standard, and Premium.
2. Price the Standard package close to the Premium package.
3. The Premium tier will naturally look like the best value for money.

Pricing is psychology, not just math.

Have you tested a 3-tier pricing structure for your offers?`
    }
  ],

  // 30% - Updates from the World of Marketing & Real Growth Strategies
  marketingUpdates: [
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
    }
  ],

  // 30% - AI-Related Marketing Concepts, Practical Tools & Workflows
  aiMarketing: [
    {
      hook: "Most people search Google the wrong way.",
      topic: "How everyday buyers are using AI tools to find quick answers online instead of clicking 10 blue links.",
      headline: "AI SEARCH *IS HERE*",
      subtext: "How customers find answers today.",
      badge: "AI MARKETING",
      content: `Most people search Google the wrong way.

Instead of clicking through 10 different website links, people now just ask AI tools like ChatGPT or Gemini to give them one quick, direct answer.

If you run a business or create content, here is what to do:

1. Give direct answers: Put the important answers right at the top of your page.
2. Answer real questions: What does your product cost? How does it help?
3. Keep it simple: Write like you are explaining it to a smart friend.

Think of it like being the friendly person everyone turns to for advice.

Have you started using AI to search for things instead of Google? Let me know below!`
    },
    {
      hook: "AI is your marketing intern, not your replacement.",
      topic: "How savvy marketers use AI to brainstorm 20 content ideas in 5 minutes without losing their authentic voice.",
      headline: "AI AS *YOUR INTERN*",
      subtext: "How to save 5 hours every week.",
      badge: "AI PLAYBOOK",
      content: `AI is your marketing intern, not your replacement.

It is here to replace the boring, repetitive tasks you hate doing.

Think of AI like having a super fast intern who works 24/7:

1. Brainstorming hooks: Ask it for 10 title ideas when you are feeling stuck.
2. Summarizing long notes: Turn a 5-page case study into 3 key bullet points in seconds.
3. Fixing your grammar: Clean up typos and make your writing easier to read.

You are still the pilot. AI is just the co-pilot.

What is the #1 marketing task you wish AI could do for you automatically?`
    },
    {
      hook: "How to write better prompts in 10 seconds.",
      topic: "A simple 3-part prompt formula to get high-converting marketing copy from AI every time.",
      headline: "BETTER *AI PROMPTS*",
      subtext: "A simple 3-step formula that works.",
      badge: "AI TUTORIAL",
      content: `How to write better prompts in 10 seconds.

If you give AI a vague question, it gives you a boring, robotic answer.

To get amazing marketing copy, use this simple 3-step formula:

1. Who it is: "Act as a friendly marketing coach."
2. What you need: "Write a short 3-sentence email invite for a free webinar."
3. The audience: "Make it simple for small shop owners to understand."

The clearer you are with AI, the better answers you get.

Try this formula today and see the difference!`
    },
    {
      hook: "Why you should never copy-paste raw AI copy.",
      topic: "Why adding your real experience and human tone makes AI-assisted marketing 10x more effective.",
      headline: "HUMAN + *AI TEAMWORK*",
      subtext: "Why your personal voice matters.",
      badge: "AI ADVICE",
      content: `Why you should never copy-paste raw AI copy.

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
      hook: "Turn 1 piece of content into 10 with AI.",
      topic: "How to use AI to repurpose a single podcast, client story, or blog post into a full week of social posts.",
      headline: "CONTENT *MULTIPLIER*",
      subtext: "Turn 1 post into 10 with AI.",
      badge: "AI WORKFLOW",
      content: `Turn 1 piece of content into 10 with AI.

Stop trying to write 5 brand new posts from scratch every week.

Instead, create ONE great piece of content and let AI help you repurpose it:

1. Step 1: Record a 3-minute voice note about a client win or business lesson.
2. Step 2: Feed the transcript into AI and ask for 3 LinkedIn posts, 1 newsletter paragraph, and 5 short tips.
3. Step 3: Edit each piece with your personal tone before publishing.

Create once, publish everywhere.

How many pieces of content do you create each week?`
    }
  ]
};

// Standalone fallback post generator (Guarantees exactly 40% Concepts, 30% Updates, 30% AI Marketing every single day)
function buildFallbackPosts(category, dateStr) {
  // Deterministic seed based on date string to ensure daily variety and smooth rotation
  const baseline = new Date('2026-01-01T00:00:00Z');
  const current = new Date(`${dateStr}T00:00:00Z`);
  const diffDays = Math.floor(Math.abs(current - baseline) / (1000 * 60 * 60 * 24));
  
  const archetypes = [
    { name: 'Marketing Concept Explained', layout: 'news-card', palette: 'Corporate Navy', role: 'Business Advisor', env: 'Technology command center', cam: 'Looking at camera', suit: 'Navy business suit' },
    { name: 'Marketing Framework Playbook', layout: 'presentation-slide', palette: 'Emerald Green', role: 'Business Coach', env: 'Executive boardroom', cam: 'Presentation shot', suit: 'Charcoal executive suit' },
    { name: 'World of Marketing Strategy', layout: 'magazine-cover', palette: 'Electric Blue', role: 'Startup Founder', env: 'Luxury office', cam: 'Half-body portrait', suit: 'Smart casual blazer' },
    { name: 'AI Marketing Concept', layout: 'podcast-layout', palette: 'Cyber Purple', role: 'Podcast Host', env: 'Podcast studio', cam: 'Sitting at desk', suit: 'Turtleneck with blazer' },
    { name: 'AI Marketing Workflow', layout: 'hero-center', palette: 'Crimson Red', role: 'Speaker', env: 'Auditorium stage', cam: 'Speaking on stage', suit: 'Conference speaker outfit' }
  ];

  // Map 5 daily posts according to the required mix:
  // Post 1: 40% - Core Marketing Concept #1
  // Post 2: 40% - Core Marketing Concept #2
  // Post 3: 30% - World of Marketing Update & Growth Strategy
  // Post 4: 30% - AI-Related Marketing Concept
  // Post 5: 30% - AI-Related Marketing Workflow
  const pool1 = TOPICS_LIBRARY.marketingConcepts;
  const pool2 = TOPICS_LIBRARY.marketingConcepts;
  const pool3 = TOPICS_LIBRARY.marketingUpdates;
  const pool4 = TOPICS_LIBRARY.aiMarketing;
  const pool5 = TOPICS_LIBRARY.aiMarketing;

  const selectedTopics = [
    pool1[(diffDays * 2 + 0) % pool1.length],
    pool2[(diffDays * 2 + 1) % pool2.length],
    pool3[diffDays % pool3.length],
    pool4[(diffDays * 2 + 0) % pool4.length],
    pool5[(diffDays * 2 + 1) % pool5.length]
  ];

  return archetypes.map((arch, idx) => {
    const t = selectedTopics[idx];
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
