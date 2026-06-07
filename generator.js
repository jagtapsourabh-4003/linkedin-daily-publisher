import { GoogleGenAI } from '@google/genai';

/**
 * Generates 5 LinkedIn post variations based on scraped trends and category.
 * @param {string} category - 'ai' or 'marketing'
 * @param {Array} trends - Array of scraped trends
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<Array<{id: number, style: string, content: string, hook: string}>>}
 */
export async function generatePosts(category, trends, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set it in Settings or the .env file.');
  }

  // Initialize SDK
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash';

  console.log(`[Generator] Initializing Gemini request for ${category} using ${modelName}`);

  // Format trends for prompt context
  const trendsContext = trends.map((t, idx) => {
    return `${idx + 1}. [Source: ${t.source}] Title: ${t.title}\nSummary: ${t.description}\nLink: ${t.link}`;
  }).join('\n\n');

  const topicLabel = category.toLowerCase() === 'marketing' ? 'Digital Marketing, Growth Strategy, and Brand Management' : 'Artificial Intelligence, Machine Learning, and Future Tech Trends';

  const systemInstruction = `You are a world-class viral LinkedIn Copywriter, Content Strategist, Marketing Manager, and AI thought leader.
Your goal is to write extremely engaging, highly professional, authentic, and creative LinkedIn posts that drive massive engagement, spark active conversations, and establish undeniable thought leadership.

Guidelines for posts:
1. Tone: Human, direct, highly opinionated, intellectually challenging, and punchy. Absolutely avoid generic AI greetings, corporate clichés, or standard fluff ("In today's fast-paced digital world...", "Here are X ways...", "Welcome to the future of..."). Write like a seasoned, battle-tested leader.
2. Structure: Start with an attention-grabbing hook (line 1) which MUST be under 6 words and create visual friction or high curiosity. Leave a blank line, write the body in highly readable short paragraphs (1-2 sentences max each), and end with a thought-provoking, non-cliché question or clear call to action, followed by 3-5 relevant hashtags.
3. Formatting: Use emojis very sparingly and tastefully to format lists or draw visual focus (no more than 2-3 emojis per post). Use line breaks generously to allow breathing room. Do NOT use fake bold/italic unicode symbols.
4. Perspectives: Speak from the first-person perspective ('I' or 'We') as an elite Marketing Director who is also a deep AI automation architect.

You must output exactly 5 posts based on the provided trends context. Each post must follow a completely different style and structural pattern, selected from this pool of 10 formats to ensure daily variety:
- "The Deep Teardown": Analyzing a recent product launch, tech failure, or marketing campaign with numbers and metrics.
- "The Contrarian Angle": Challenging a common industry belief or standard best practice with sound reasoning.
- "The Actionable Checklist": A highly structured, bulleted execution guide for a specific task.
- "The Myth vs Reality": Direct contrast comparison of industry assumptions vs actual results.
- "The Personal Story / Anecdote": A story of a hard-learned career lesson, mistake, or breakthrough.
- "The Mental Model / Analogy": Explaining a complex tech/marketing concept using a simple real-world analogy.
- "The Prediction / Forecast": A bold, reasoned prediction about the future of tech, AI, or B2B growth in the next 12-24 months.
- "The Resource Curation": Curating 3-4 top newsletters, tools, repositories, or frameworks with brief explanations of why they matter.
- "The Quote Commentary": Sharing a powerful quote and expanding on its practical application.
- "The Unpopular Opinion": A strongly held, slightly controversial view about the industry that challenges readers to share their views.

Ensure the 5 generated posts represent 5 distinct formats from the list above. Do not repeat formats within the same run. Keep the style labels creative and diverse!`;

  const prompt = `Generate exactly 5 LinkedIn posts on the topic of: ${topicLabel}.
Use the following scraped web trends as context and inspiration for what is currently happening in the industry:

---
${trendsContext}
---

Your response MUST be a JSON array containing exactly 5 objects. Do not wrap the JSON output in markdown formatting block quotes (e.g. \`\`\`json). Output raw JSON.

Each object in the array must follow this structure:
{
  "id": 1, 
  "style": "Style/Angle Name",
  "hook": "The first 1-2 lines of the post (attention-grabbing hook)",
  "content": "The full body of the post, including the hook, paragraphs, call to action, and hashtags. Keep line breaks intact with newlines (\\n).",
  "sourceArticle": "Title of the main article from the trends context that inspired this post, or 'General Trend' if inspired by multiple.",
  "imageHeadline": "A short, ultra-punchy graphic title in ALL CAPS (exactly 1-3 words) designed by a premium copywriter (e.g. 'AI IS DEAD?', '99% FAILED', 'THE $0 STACK', 'STOP CODING', 'NEVER DO X'). Do NOT use generic labels like 'AI Agents' or 'B2B SEO'. Make it highly provocative and click-worthy.",
  "imageSubtext": "A highly compelling graphic subtitle (exactly 5-8 words) explaining the metric or curious strategy behind the headline (e.g. 'Why simple prompts beat custom agents', 'How we built a $1M pipeline with zero ads')."
}`;

  let attempts = 3;
  let delay = 3000; // start with 3 seconds delay
  
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`[Generator] Initiating Gemini call (attempt ${i + 1}/${attempts})...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });
      
      const responseText = response.text;
      console.log('[Generator] Raw response received');

      const posts = JSON.parse(responseText.trim());
      if (!Array.isArray(posts) || posts.length === 0) {
        throw new Error('Response is not a valid JSON array or is empty');
      }

      return posts;
    } catch (error) {
      console.warn(`[Generator] Attempt ${i + 1} failed:`, error.message);
      
      const isRateLimit = error.message.toLowerCase().includes('429') || 
                          error.message.toLowerCase().includes('quota') || 
                          error.message.toLowerCase().includes('limit') ||
                          error.message.toLowerCase().includes('rate');
                          
      if (isRateLimit && i < attempts - 1) {
        console.log(`[Generator] Rate limit hit. Waiting ${delay / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      } else {
        console.error('[Generator] Error generating posts:', error);
        throw new Error(`Failed to generate posts with Gemini: ${error.message}`);
      }
    }
  }
}
