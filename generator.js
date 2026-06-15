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
      prompt: `A professional, crisp 1080x1080 headshot portrait of a confident male B2B marketing director in his early 30s. He has short styled dark hair, neat grooming, and wears a ${attire}. He is located in a ${background}. The lighting is natural, soft and professional, with a shallow depth of field. High-end photography, photorealistic, premium branding aesthetic.`,
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
The canvas is exactly 1080x1080 pixels (center is 540, 540). Customize the background gradient, shapes, text positions, and avatar crop frame to match the reference layout's visual structure.
The layout JSON MUST follow this schema structure:
{
  "background": {
    "colors": ["#hex1", "#hex2"],
    "isSunburst": true | false,
    "rayColor": "rgba(r,g,b,alpha)"
  },
  "shapes": [
    {
      "type": "circle" | "rect",
      "x": 540, "y": 540, "r": 380, "w": 400, "h": 600,
      "color": "rgba(r,g,b,alpha)",
      "strokeColor": "rgba(r,g,b,alpha)",
      "lineWidth": 4
    }
  ],
  "avatar": {
    "type": "circle" | "rect" | "phone" | "standing",
    "x": 300, "y": 500, "w": 300, "h": 500,
    "tilt": -0.05,
    "popout": true | false
  },
  "text": {
    "badge": { "text": "AI TREND", "x": 60, "y": 80, "bgColor": "#hex" },
    "headline": { "x": 60, "y": 160, "fontSize": 42, "color": "#hex" },
    "subtext": { "x": 60, "y": 480, "fontSize": 20, "color": "#hex" },
    "cta": { "text": "READ POST", "x": 60, "y": 780, "bgColor": "#hex" }
  },
  "floatingElements": [
    { "type": "linkedin" | "instagram" | "facebook" | "twitter" | "emoji", "emoji": "🔥", "x": 420, "y": 110, "size": 36 }
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
  "imageHeadline": "A short, ultra-punchy graphic title in ALL CAPS (exactly 1-3 words) designed by a premium copywriter (e.g. 'AI IS DEAD?', '99% FAILED', 'THE $0 STACK', 'STOP CODING').",
  "imageSubtext": "A highly compelling graphic subtitle (exactly 5-8 words) explaining the metric or curious strategy behind the headline (e.g. 'Why simple prompts beat custom agents').",
  "layout": {
    "background": {
      "colors": ["#hex1", "#hex2"],
      "isSunburst": true,
      "rayColor": "rgba(255, 255, 255, 0.04)"
    },
    "shapes": [
      { "type": "circle", "x": 540, "y": 540, "r": 380, "color": "rgba(255, 255, 255, 0.05)" }
    ],
    "avatar": {
      "type": "circle", "x": 300, "y": 500, "w": 300, "h": 500, "tilt": -0.05, "popout": true
    },
    "text": {
      "badge": { "text": "AI TREND", "x": 60, "y": 80, "bgColor": "#2563eb" },
      "headline": { "x": 60, "y": 160, "fontSize": 42, "color": "#ffffff" },
      "subtext": { "x": 60, "y": 480, "fontSize": 20, "color": "#cbd5e1" },
      "cta": { "text": "READ POST", "x": 60, "y": 780, "bgColor": "#2563eb" }
    },
    "floatingElements": [
      { "type": "linkedin", "x": 420, "y": 110, "size": 36 }
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
