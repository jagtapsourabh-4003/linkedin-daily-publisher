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

  const systemInstruction = `You are a world-class LinkedIn Content Strategist, Marketing Manager, and AI Expert.
Your goal is to write highly engaging, professional, and authentic LinkedIn posts that establish thought leadership, drive engagement, and provide actionable value to your audience.

Guidelines for posts:
1. Tone: Professional, authoritative yet accessible, intellectual, and forward-looking.
2. Structure: Start with an attention-grabbing hook (line 1), leave a blank line, write the body in readable short paragraphs (1-3 sentences per paragraph), and end with a conversational question or call to action, followed by 3-5 relevant hashtags.
3. Formatting: Use emojis tastefully to format points or draw attention (no more than 3-5 emojis per post). Use line breaks generously. Do NOT use fake bold/italic text generator formatting like Unicode symbols, as screen readers cannot read them.
4. Perspectives: Speak from the first-person perspective ('I' or 'We') as a seasoned Marketing Manager who is also a deep AI Expert.

You must output exactly 5 posts based on the provided trends context. Each post must follow a specific style/angle and utilize a completely unique text structure:
1. "Thought Leadership / Analytical": Focus on deep analysis. Structure as 2-3 readable paragraphs discussing metrics or industry trends.
2. "Actionable / How-To Checklist": Focus on concrete steps. Structure as a clean, emoji-coded checklist (e.g., using ✅ or 📌) with short bullet points.
3. "Trend Contrast / Myth vs Reality": Structure as a direct comparison (e.g., 'The Myth:' vs 'The Reality:' or 'Before:' vs 'After:').
4. "Storytelling / Career Narrative": Tell a short story of a lesson learned. Structure as a narrative dialogue or personal experience reflection, followed by 3 short takeaways.
5. "Short, Punchy & Quote-Style": A brief, high-impact statement (under 100 words). Structure with double-spaced lines and single powerful key takeaways.`;

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
  "imageHeadline": "A short 2-3 word punchy title for a graphic card (e.g. 'AI Agents' or 'B2B SEO Growth')",
  "imageSubtext": "A short 5-8 word description detailing the key takeaway (e.g. 'Automating workflows with generative models')"
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
