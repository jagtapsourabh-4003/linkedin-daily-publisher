import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { scrapeReferenceCreative } from './scraper.js';

/**
 * Generates 5 LinkedIn post variations based on scraped trends and category.
 * @param {string} category - 'ai' or 'marketing'
 * @param {Array} trends - Array of scraped trends
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<Array<{id: number, style: string, content: string, hook: string, layout: object}>>}
 */
export async function generatePosts(category, trends, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set it in Settings or the .env file.');
  }

  // Initialize SDK
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash';

  console.log(`[Generator] Initializing Gemini request for ${category} using ${modelName}`);

  // 1. Generate new daily AI avatar portrait (shifting clothes/backgrounds daily)
  const dailyAvatarPath = path.resolve('public', 'avatar_daily.jpg');
  try {
    console.log('[Generator] Generating daily AI avatar using Imagen 3...');
    const attires = [
      "casual dark grey hoodie",
      "premium smart-casual navy blue polo shirt",
      "modern olive green linen button-up shirt",
      "classic white oxford shirt with open collar",
      "stylish beige crewneck sweater",
      "professional charcoal grey blazer over a white t-shirt"
    ];
    const backgrounds = [
      "modern coworking space with plants and windows",
      "cozy cafe with warm lighting and blurred wooden details",
      "minimalist corporate office lobby with neutral tones",
      "creative studio setup with a soft color gradient background",
      "urban outdoor setting with blurred modern architecture"
    ];
    const dayIdx = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const attire = attires[dayIdx % attires.length];
    const background = backgrounds[dayIdx % backgrounds.length];
    
    const imageResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: `Studio portrait photography of a confident male B2B marketing manager in his early 30s, who has short styled dark hair, clean-cut professional appearance, wearing a ${attire}, sitting in a ${background}. Shot on 85mm lens, f/1.8 aperture, realistic lighting, highly detailed features, cinematic, photorealistic, professional color grading, vibrant background, corporate branding style, clean composition, high-resolution.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1'
      }
    });
    
    if (imageResponse && imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
      const imgBytes = imageResponse.generatedImages[0].image.imageBytes;
      const buffer = Buffer.from(imgBytes, "base64");
      fs.writeFileSync(dailyAvatarPath, buffer);
      console.log(`[Generator] Successfully saved new daily avatar image: ${dailyAvatarPath}`);
    } else {
      throw new Error('Image response did not contain images');
    }
  } catch (err) {
    console.warn('[Generator] Daily avatar generation failed. Using avatar.jpg fallback:', err.message);
    const defaultAvatarPath = path.resolve('public', 'avatar.jpg');
    if (fs.existsSync(defaultAvatarPath)) {
      fs.copyFileSync(defaultAvatarPath, dailyAvatarPath);
      console.log('[Generator] Copied default avatar.jpg to public/avatar_daily.jpg as fallback');
    }
  }

  // 2. Scrape reference template image
  const designRef = await scrapeReferenceCreative();
  let base64Image = null;
  let mimeType = 'image/jpeg';
  try {
    console.log(`[Generator] Downloading reference creative: ${designRef.imageUrl}`);
    const res = await fetch(designRef.imageUrl);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      base64Image = Buffer.from(buffer).toString('base64');
      if (designRef.imageUrl.endsWith('.png')) mimeType = 'image/png';
    } else {
      console.warn(`[Generator] Failed to fetch image, response code: ${res.status}`);
    }
  } catch (err) {
    console.warn('[Generator] Failed to download reference image for layout mapping:', err.message);
  }

  // 3. Format trends for prompt context
  const trendsContext = trends.map((t, idx) => {
    return `${idx + 1}. [Source: ${t.source}] Title: ${t.title}\nSummary: ${t.description}\nLink: ${t.link}`;
  }).join('\n\n');

  const topicLabel = category.toLowerCase() === 'marketing' ? 'Digital Marketing, Growth Strategy, and Brand Management' : 'Artificial Intelligence, Machine Learning, and Future Tech Trends';

  const systemInstruction = `You are a world-class viral LinkedIn Copywriter, Content Strategist, and Art Director.
Your goal is to write extremely engaging, highly professional, authentic LinkedIn posts AND extract visual layouts from the provided reference creative image to compile custom HTML5 Canvas-friendly JSON layouts.

Guidelines for posts:
1. Tone: Human, direct, highly opinionated, intellectually challenging, and punchy. Absolutely avoid generic AI greetings, corporate clichés, or standard fluff ("In today's fast-paced digital world...", "Here are X ways...", "Welcome to the future of..."). Write like a seasoned, battle-tested leader.
2. Structure: Start with an attention-grabbing hook (line 1) which MUST be under 6 words and create visual friction or high curiosity. Leave a blank line, write the body in highly readable short paragraphs (1-2 sentences max each), and end with a thought-provoking, non-cliché question or clear call to action, followed by 3-5 relevant hashtags.
3. Formatting: Use emojis very sparingly and tastefully to format lists or draw visual focus (no more than 2-3 emojis per post). Use line breaks generously. Do NOT use fake bold/italic unicode symbols.
4. Perspectives: Speak from the first-person perspective ('I' or 'We') as an elite Marketing Director who is also a deep AI automation architect.

Visual Layout Instructions:
Analyze the attached reference template image (if provided) and translate its visual composition into a detailed Canvas-friendly 'layout' JSON configuration.
The canvas is exactly 1080x1080 pixels (center is 540, 540). Customize the background gradient, glows, shapes, text positions, and avatar crop frame to match the reference layout's visual structure.
To achieve high-vibrancy, neon glow effects matching modern professional graphics, you MUST use one of the following Cyberpunk B2B styling profiles for colors and apply shadow glows to elements:

VIBRANT NEON STYLING PROFILES:
- Neon Cyberpunk: Background colors `["#050814", "#0a0314"]`, Accent/Highlight: `#00f2fe` [Electric Cyan], glows: `#00f2fe` and `#ff007f` [Hot Magenta].
- Solar Flare: Background colors `["#120802", "#1f0f00"]`, Accent/Highlight: `#ff6b00` [Safety Orange], glows: `#ff6b00` and `#fffb00` [Bright Yellow].
- Acid Lime: Background colors `["#020b08", "#001a12"]`, Accent/Highlight: `#39ff14` [Lime Green], glows: `#39ff14` and `#0055ff` [Neon Blue].
- Synthwave: Background colors `["#0d0214", "#1c0024"]`, Accent/Highlight: `#ff007f` [Hot Magenta], glows: `#ff007f` and `#00f2fe` [Electric Cyan].
- Electric Gold: Background colors `["#050505", "#140a00"]`, Accent/Highlight: `#fbbf24` [Bright Gold], glows: `#fbbf24` and `#8f00ff` [Electric Violet].

The layout JSON MUST follow this schema structure (all colors MUST be valid CSS hex codes or rgba strings, e.g., "#ff007f", "rgba(0, 242, 254, 0.05)"):
{
  "background": {
    "colors": ["#050814", "#0a0314"],
    "isSunburst": true,
    "rayColor": "rgba(0, 242, 254, 0.04)",
    "glows": [
      { "x": 300, "y": 600, "r": 500, "color": "rgba(0, 242, 254, 0.2)" },
      { "x": 700, "y": 300, "r": 600, "color": "rgba(255, 0, 127, 0.25)" }
    ]
  },
  "shapes": [
    {
      "type": "circle",
      "x": 300, "y": 600, "r": 250,
      "color": "rgba(255, 255, 255, 0.02)",
      "strokeColor": "rgba(0, 242, 254, 0.4)",
      "lineWidth": 3,
      "glowColor": "#00f2fe",
      "glowBlur": 30
    }
  ],
  "avatar": {
    "type": "circle",
    "x": 300, "y": 600, "w": 320, "h": 320,
    "tilt": 0,
    "glowColor": "#ff007f",
    "glowBlur": 40,
    "strokeColor": "#ff007f",
    "lineWidth": 4
  },
  "text": {
    "badge": { "text": "AI REPORT", "bgColor": "#ff007f", "glowColor": "#ff007f", "glowBlur": 15 },
    "headline": { "fontSize": 48, "color": "#ffffff", "highlightColor": "#00f2fe", "align": "left" },
    "subtext": { "fontSize": 22, "color": "#cbd5e1", "highlightColor": null },
    "cta": { "text": "EXPLORE NOW", "bgColor": "#00f2fe", "glowColor": "#00f2fe", "glowBlur": 20 }
  },
  "floatingElements": [
    { "type": "linkedin", "x": 160, "y": 480, "size": 36 }
  ]
}

Ensure the 5 generated posts represent 5 distinct copywriting formats. Keep the style labels creative and diverse!`;

  const prompt = `Generate exactly 5 LinkedIn posts on the topic of: ${topicLabel}.
Use the following scraped web trends as context and inspiration:

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
  "imageHeadline": "A short, ultra-punchy graphic title in ALL CAPS (exactly 2-4 words). Wrap the most important 1-2 words in asterisks for neon highlight styling (e.g., 'STOP *CODING* NOW', '*99% FAILED*', 'THE *$0 STACK*', 'AI IS *DEAD*?').",
  "imageSubtext": "A highly compelling graphic subtitle (exactly 5-9 words) explaining the metric or curious strategy behind the headline (e.g. 'Why simple prompts *beat* custom agents').",
  "layout": {
    "background": {
      "colors": ["#050814", "#0a0314"],
      "isSunburst": true,
      "rayColor": "rgba(255, 255, 255, 0.04)",
      "glows": [
        { "x": 300, "y": 600, "r": 500, "color": "rgba(0, 242, 254, 0.25)" }
      ]
    },
    "shapes": [
      { "type": "circle", "x": 300, "y": 600, "r": 250, "color": "rgba(255, 255, 255, 0.02)", "strokeColor": "rgba(0, 242, 254, 0.4)", "lineWidth": 3, "glowColor": "#00f2fe", "glowBlur": 30 }
    ],
    "avatar": {
      "type": "circle", "x": 300, "y": 600, "w": 320, "h": 320, "tilt": 0, "glowColor": "#ff007f", "glowBlur": 40, "strokeColor": "#ff007f", "lineWidth": 4
    },
    "text": {
      "badge": { "text": "AI TREND", "bgColor": "#ff007f", "glowColor": "#ff007f", "glowBlur": 15 },
      "headline": { "fontSize": 44, "color": "#ffffff", "highlightColor": "#00f2fe" },
      "subtext": { "fontSize": 20, "color": "#cbd5e1" },
      "cta": { "text": "READ POST", "bgColor": "#ff007f", "glowColor": "#ff007f", "glowBlur": 20 }
    },
    "floatingElements": [
      { "type": "linkedin", "x": 160, "y": 480, "size": 36 }
    ]
  }
}`;

  let attempts = 3;
  let delay = 3000; // start with 3 seconds delay
  
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`[Generator] Initiating Gemini call (attempt ${i + 1}/${attempts})...`);
      
      const contents = [];
      if (base64Image) {
        contents.push({
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        });
        contents.push(`REFERENCE CREATIVE TEMPLATE IMAGE PROVIDED. Map the layout parameters of this image into each post's layout JSON.`);
      }
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
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
