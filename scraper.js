import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  timeout: 10000 // 10s timeout
});

const FEEDS = {
  ai: [
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'Search Engine Land AI Search', url: 'https://searchengineland.com/feed' },
    { name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' },
    { name: 'Google News AI Marketing Case Studies', url: 'https://news.google.com/rss/search?q=(artificial+intelligence+OR+generative+AI)+AND+(marketing+case+study+OR+copywriting+OR+growth+strategy+OR+AEO)&hl=en-US&gl=US&ceid=US:en' }
  ],
  marketing: [
    { name: 'Seth Godin Marketing Ideation', url: 'https://seths.blog/feed/' },
    { name: 'HubSpot Marketing & Case Studies', url: 'https://blog.hubspot.com/marketing/rss.xml' },
    { name: 'Social Media Today', url: 'https://www.socialmediatoday.com/feeds/news/' },
    { name: 'Search Engine Land Strategy', url: 'https://searchengineland.com/feed' },
    { name: 'Google News Marketing Case Studies', url: 'https://news.google.com/rss/search?q=(B2B+marketing+case+study+OR+growth+breakdown+OR+customer+acquisition+case+study)&hl=en-US&gl=US&ceid=US:en' },
    { name: 'Google News Marketing Concepts & Mental Models', url: 'https://news.google.com/rss/search?q=(marketing+concept+OR+mental+model+OR+pricing+psychology+OR+brand+positioning+OR+growth+framework)&hl=en-US&gl=US&ceid=US:en' },
    { name: 'Google News Brand Strategy Updates', url: 'https://news.google.com/rss/search?q=(digital+marketing+trend+OR+consumer+psychology+OR+copywriting+framework)&hl=en-US&gl=US&ceid=US:en' }
  ]
};

// Fallback topics to use in case RSS feeds fail or are blocked
const FALLBACK_TOPICS = {
  ai: [
    { title: 'AI-Driven Customer Experience (CX)', content: 'How brands use real-time conversational agents to personalize customer journeys and drive conversion rates.' },
    { title: 'Generative AI Video in Advertising', content: 'Midjourney, Runway Gen-3, and Sora are revolutionizing ad creative production, reducing costs, and enabling hyper-personalized video ads.' },
    { title: 'AI Personalization in B2B Email Campaigns', content: 'Beyond templates, using lightweight language models to draft dynamic, context-specific outreach emails based on prospect intent.' },
    { title: 'AI-Powered Search Engine Optimization (SEO)', content: 'Optimizing brand content for AI-first search engines like Perplexity, Gemini, and Google AI Overviews rather than traditional rank lists.' },
    { title: 'AI Guardrails for Content Creation', content: 'Implementing system parameters and brand guidelines to ensure AI copywriting tools match the brand\'s unique tone and messaging style.' },
    { title: 'Voice Search Marketing and Brand Identity', content: 'How multi-modal voice systems (e.g. Gemini Live, GPT-4o) change how users discover brands verbally, demanding new audio branding strategies.' },
    { title: 'Cost-Effective Scaled Copywriting', content: 'Leveraging small, specialized models (SLMs) to draft product descriptions and email campaigns at a fraction of the cost of commercial APIs.' },
    { title: 'Brand Asset Ownership & AI Copyright', content: 'Navigating the legalities of publishing AI-generated graphics and copy, ensuring legal safety for brand trademarks.' },
    { title: 'Semantic Memory for Marketing Assistants', content: 'Using Retrieval-Augmented Generation (RAG) to ground AI writers in the company’s internal product specs, historical messaging, and style guides.' },
    { title: 'Synthetic Customer Personas', content: 'Simulating user research by querying custom-profiled AI agents to test ad headlines and copy variations before launching paid campaigns.' },
    { title: 'On-Device Consumer AI & Ad Delivery', content: 'How Apple Intelligence and Android Gemini features change user habits, shifting ad placements to personalized device notifications.' },
    { title: 'AI-Powered Competitor Intel', content: 'Automating competitor analysis by using language models to monitor competitor pricing, ad copy, and social media announcements.' },
    { title: 'Brand Reputation & AI Hallucinations', content: 'How public relations teams manage and monitor AI search engines to prevent false or inaccurate claims about the brand.' },
    { title: 'Custom Marketing Copilots', content: 'Building private, internal agents trained on top-performing ad copy to act as assistants for junior copywriters.' },
    { title: 'Predictive Analytics in Paid Media', content: 'Using AI to analyze conversion history, predict customer acquisition costs (CAC), and allocate ad budgets across channels.' },
    { title: 'AI-Enhanced Visual Identity', content: 'Using models to generate creative mood boards, logo iterations, and brand graphics during initial product launches.' },
    { title: 'Disclosing AI Usage in Marketing', content: 'Evaluating when to be transparent about using generative AI in campaigns to build long-term consumer trust.' },
    { title: 'Owning Your Proprietary Fine-Tuned Model', content: 'Why high-growth brands are moving from generic models to fine-tuning private models on their historical high-converting sales letters.' },
    { title: 'Conversational Commerce Conversions', content: 'Using AI chat systems to assist users in selecting products, answering technical specifications, and processing orders instantly.' },
    { title: 'Shadow AI in Corporate Marketing', content: 'Implementing data governance policies to prevent internal teams from pasting proprietary customer data into public AI writers.' }
  ],
  marketing: [
    { title: 'Zero-Click Searches on Google', content: 'Google\'s AI Overviews answer user questions directly on the search page. How marketers must adapt content strategy to survive.' },
    { title: 'Personal Brand Building on LinkedIn', content: 'Why audiences trust individual founders and executives far more than corporate brand pages, and how to build authority.' },
    { title: 'The Death of Third-Party Cookies', content: 'Practical alternatives for marketing attribution, first-party data collection, and tracking campaign performance.' },
    { title: 'Community-Led Growth (CLG)', content: 'Shifting focus from paid search ads to building active, engaged slack communities, forums, and developer ecosystems.' },
    { title: 'Short-Form Video Dominance', content: 'Reels, TikToks, and YouTube Shorts. Why production value matters less than authenticity, and how B2B brands can use this.' },
    { title: 'AI Copywriting Pitfalls', content: 'Why generic AI-generated copy decreases conversion rates, and how to use AI for drafting while keeping a human voice for editing.' },
    { title: 'B2B Influencer Marketing', content: 'Collaborating with industry creators, newsletter writers, and micro-influencers to build trust in niche markets.' },
    { title: 'Value-First Email Marketing', content: 'Moving away from spammy sales pitches to educational newsletters that subscribers actually look forward to opening.' },
    { title: 'Interactive Content', content: 'Quizzes, calculators, and free web tools as highly effective lead magnets that convert better than generic PDFs and ebooks.' },
    { title: 'Dark Social and Attribution', content: 'Conversational referrals on Slack, WhatsApp, and podcasts that traditional analytics tools fail to track, and how to measure them.' },
    { title: 'Product-Led Growth (PLG)', content: 'Designing free trials and freemium models that sell themselves, turning the product itself into the primary acquisition channel.' },
    { title: 'Conversion Rate Optimization (CRO)', content: 'Simple, low-code usability improvements on landing pages that double sign-up rates without increasing ad spend.' },
    { title: 'Local SEO Strategy', content: 'Optimizing for map packs and local intent as voice assistants and smart devices answer queries with local recommendations.' },
    { title: 'B2B Storytelling', content: 'Swapping dry feature lists for emotional customer stories and case studies that highlight the painful problem and successful outcome.' },
    { title: 'AI in Market Research', content: 'Using LLMs to quickly summarize customer reviews, analyze competitor strategies, and identify market gaps.' },
    { title: 'Customer Retention Marketing', content: 'Why keeping an existing customer is 5x cheaper than acquiring a new one, and how to build onboarding email flows.' },
    { title: 'Programmatic Ad Spend Optimization', content: 'Using automated bidding strategies and creative testing to lower customer acquisition costs (CAC).' },
    { title: 'Podcast Sponsorships', content: 'How B2B brands find niche industry podcasts to sponsor, reaching highly targeted audiences at lower CPMs than LinkedIn ads.' },
    { title: 'User-Generated Content (UGC)', content: 'Leveraging real customer reviews, video testimonials, and social posts to build social proof and trust.' },
    { title: 'Dynamic Landing Pages', content: 'Using UTM parameters to personalize the headline and subtext of landing pages based on the ad creative the visitor clicked.' }
  ]
};

/**
 * Scrapes trending articles for the given category ('ai' or 'marketing')
 * @param {string} category 
 * @returns {Promise<Array<{title: string, description: string, source: string, link: string}>>}
 */
export async function scrapeTrends(category) {
  const selectedCategory = category.toLowerCase() === 'marketing' ? 'marketing' : 'ai';
  const feeds = FEEDS[selectedCategory];
  const results = [];

  console.log(`[Scraper] Starting scrape for category: ${selectedCategory}`);

  for (const feed of feeds) {
    try {
      console.log(`[Scraper] Fetching feed: ${feed.name} (${feed.url})`);
      const fetchPromise = parser.parseURL(feed.url);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Feed request timed out after 5s')), 5000)
      );
      const parsedFeed = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Take top 5 items from each feed
      const items = (parsedFeed.items || []).slice(0, 5).map(item => ({
        title: item.title || '',
        description: cleanText(item.contentSnippet || item.content || ''),
        source: feed.name,
        link: item.link || ''
      }));
      
      results.push(...items);
      console.log(`[Scraper] Successfully fetched ${items.length} items from ${feed.name}`);
    } catch (error) {
      console.warn(`[Scraper] Feed ${feed.name} skipped (${error.message})`);
    }
  }

  // If we couldn't scrape anything, return a randomized selection of fallbacks
  if (results.length === 0) {
    console.warn(`[Scraper] Web scraping returned 0 items. Utilizing local fallback topics.`);
    const shuffled = [...FALLBACK_TOPICS[selectedCategory]].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5).map(topic => ({
      title: topic.title,
      description: topic.content,
      source: 'Local Industry Knowledge (Fallback)',
      link: '#'
    }));
  }

  return results;
}

/**
 * Clean up HTML tags and limit text length
 * @param {string} text 
 * @returns {string}
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim()
    .slice(0, 300); // limit snippet size
}

const PINTEREST_FEEDS = [
  'https://www.pinterest.com/creativetemplate/social-media-post-templates.rss',
  'https://www.pinterest.com/designspiration/graphic-design.rss'
];

/**
 * Scrapes a design reference template image from Pinterest RSS feeds.
 * Falls back to Unsplash abstract illustration if feeds are blocked.
 */
export async function scrapeReferenceCreative() {
  console.log('[Scraper] Scraping reference creatives from Pinterest RSS feeds...');
  const imageLinks = [];
  
  for (const feedUrl of PINTEREST_FEEDS) {
    try {
      console.log(`[Scraper] Fetching design RSS: ${feedUrl}`);
      const parsedFeed = await parser.parseURL(feedUrl);
      for (const item of parsedFeed.items) {
        const content = item.content || item.description || '';
        const match = content.match(/src="([^"]+)"/);
        if (match && match[1]) {
          let imgUrl = match[1];
          // Upgrade Pinterest low-res thumbnail links to higher resolution (736x)
          imgUrl = imgUrl.replace('/236x/', '/736x/').replace('/136x/', '/736x/');
          imageLinks.push(imgUrl);
        }
      }
    } catch (err) {
      console.warn(`[Scraper] Failed to parse Pinterest RSS feed ${feedUrl}:`, err.message);
    }
  }
  
  if (imageLinks.length > 0) {
    const selected = imageLinks[Math.floor(Math.random() * imageLinks.length)];
    console.log(`[Scraper] Successfully scraped reference template: ${selected}`);
    return {
      imageUrl: selected,
      isFallback: false
    };
  }
  
  console.warn('[Scraper] Pinterest scraping returned 0 images. Using high-quality abstract graphic fallback.');
  return {
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&h=1080&fit=crop',
    isFallback: true
  };
}
