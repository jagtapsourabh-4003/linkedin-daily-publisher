import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  timeout: 10000 // 10s timeout
});

const FEEDS = {
  ai: [
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'Wired AI', url: 'https://www.wired.com/feed/category/ai/latest/rss' }
  ],
  marketing: [
    { name: 'Content Marketing Institute', url: 'https://contentmarketinginstitute.com/feed/' },
    { name: 'Copyblogger', url: 'https://copyblogger.com/feed/' },
    { name: 'Social Media Examiner', url: 'https://www.socialmediaexaminer.com/feed/' }
  ]
};

// Fallback topics to use in case RSS feeds fail or are blocked
const FALLBACK_TOPICS = {
  ai: [
    { title: 'Generative AI in Enterprise Workflows', content: 'Integrating LLMs into daily operations, productivity boosts, and deployment patterns.' },
    { title: 'AI Agents & Autonomous Workflows', content: 'The shift from chat interfaces to action-taking autonomous agents in software and operations.' },
    { title: 'Multimodal AI Models (Video, Voice, Images)', content: 'Advancements in models that process voice, video, and text simultaneously (e.g., Gemini 1.5, GPT-4o).' },
    { title: 'AI Ethics, Regulation & Safety', content: 'The impact of international regulations (EU AI Act) on AI development and deployment.' },
    { title: 'Custom LLMs vs Commercial APIs', content: 'Evaluating fine-tuning open-source models (Llama 3, Mistral) vs using API services.' }
  ],
  marketing: [
    { title: 'AI-Powered Content Creation and SEO Strategy', content: 'Balancing generative AI content with Google Search algorithms and E-E-A-T criteria.' },
    { title: 'Omnichannel B2B Marketing in 2026', content: 'Integrating email, LinkedIn content, events, and performance marketing into a cohesive pipeline.' },
    { title: 'Zero-Click Searches and Changing SEO Tactics', content: 'Creating content optimized for AI Overviews and snippet consumption directly on search engines.' },
    { title: 'Personal Brand Building on LinkedIn', content: 'How executives and managers use storytelling to drive organic reach and build authority.' },
    { title: 'Privacy-First Analytics and Attribution', content: 'Navigating marketing attribution after the cookieless transition and privacy regulations.' }
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
    return FALLBACK_TOPICS[selectedCategory].map(topic => ({
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
