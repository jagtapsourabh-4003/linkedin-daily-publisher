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
    { name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' },
    { name: 'Google News AI', url: 'https://news.google.com/rss/search?q=artificial+intelligence+OR+generative+AI+OR+LLMs&hl=en-US&gl=US&ceid=US:en' }
  ],
  marketing: [
    { name: 'HubSpot Marketing', url: 'https://blog.hubspot.com/marketing/rss.xml' },
    { name: 'Social Media Today', url: 'https://www.socialmediatoday.com/feeds/news/' },
    { name: 'Moz Blog', url: 'https://moz.com/feeds/blog.rss' },
    { name: 'Google News Marketing', url: 'https://news.google.com/rss/search?q=digital+marketing+OR+brand+strategy+OR+marketing+technology&hl=en-US&gl=US&ceid=US:en' }
  ]
};

// Fallback topics to use in case RSS feeds fail or are blocked
const FALLBACK_TOPICS = {
  ai: [
    { title: 'AI Agents in Action', content: 'How autonomous agents are shifting from simple chat interfaces to executing complex workflows (e.g. scheduling, booking, coding).' },
    { title: 'Generative AI Video Production', content: 'Midjourney, Sora, and Runway Gen-3 are revolutionizing creative marketing. How brands are starting to use AI-generated video.' },
    { title: 'The Rise of Local/On-Device LLMs', content: 'Privacy-focused enterprises are moving away from API calls to run models locally (like Llama-3-8B or Phi-3) on employee laptops.' },
    { title: 'Prompt Engineering vs Fine-Tuning', content: 'When should a business fine-tune an open-source model versus simply improving their prompt structure and retrieval-augmented generation (RAG)?' },
    { title: 'AI and Code Generation', content: 'Copilots are writing over 50% of enterprise code. What this means for junior engineers and software quality in the next 3 years.' },
    { title: 'Voice AI Assistants', content: 'Multi-modal voice models (like GPT-4o and Gemini Live) enable real-time, low-latency conversations. The impact on customer service and user experience.' },
    { title: 'Small Language Models (SLMs)', content: 'Why small, specialized models (under 10B parameters) are outperforming giant models on specific corporate tasks at a fraction of the cost.' },
    { title: 'AI Regulations & Compliance', content: 'The practical impact of the EU AI Act and US executive orders on tech startups and enterprise deployments.' },
    { title: 'RAG (Retrieval-Augmented Generation)', content: 'Why simple LLM prompts fail without search context, and how to connect company databases safely to models.' },
    { title: 'The Ethics of Synthetic Data', content: 'Training new models on AI-generated data. Can it solve the data shortage crisis, or will it lead to model collapse and bias?' },
    { title: 'Apple Intelligence', content: 'How Apple is embedding AI features directly into macOS and iOS, changing how everyday consumers interact with smart devices.' },
    { title: 'Vector Databases', content: 'Why tools like Pinecone, Milvus, and pgvector are crucial for building semantic search and long-term memory for AI systems.' },
    { title: 'AI Search Engines vs Traditional SEO', content: 'How Perplexity, OpenAI Search, and Google AI Overviews are changing how users find information, bypassing standard web pages.' },
    { title: 'Custom GPTs & Internal Knowledge Bots', content: 'Building private, role-based chatbots for HR, sales onboarding, and engineering documentation.' },
    { title: 'Cost Optimization for LLMs', content: 'Techniques like caching prompt prefixes, using model routing, and switching to lighter models to reduce API bills.' },
    { title: 'AI in Drug Discovery and Biotech', content: 'How deep learning models are predicting protein structures and shortening clinical trial design timelines.' },
    { title: 'Explainable AI (XAI)', content: 'Demystifying the black box of neural networks for regulated industries like finance, healthcare, and insurance.' },
    { title: 'Open Source vs Closed Source LLMs', content: 'Comparing the rapid growth of Meta\'s Llama and Mistral with proprietary models from OpenAI, Anthropic, and Google.' },
    { title: 'AI Agents in Customer Support', content: 'Building autonomous support bots that can authenticate users, lookup orders, and process refunds without human intervention.' },
    { title: 'Shadow AI in the Workplace', content: 'The security risks of employees copy-pasting sensitive company code and data into public LLM tools, and how to govern it.' }
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
      const parsedFeed = await parser.parseURL(feed.url);
      
      // Take top 5 items from each feed
      const items = parsedFeed.items.slice(0, 5).map(item => ({
        title: item.title || '',
        description: cleanText(item.contentSnippet || item.content || ''),
        source: feed.name,
        link: item.link || ''
      }));
      
      results.push(...items);
      console.log(`[Scraper] Successfully fetched ${items.length} items from ${feed.name}`);
    } catch (error) {
      console.error(`[Scraper] Failed to fetch feed ${feed.name}:`, error.message);
      // Continue to next feed if one fails
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
