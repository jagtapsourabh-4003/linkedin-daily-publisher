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

  // 1. Generate 5 unique daily AI avatar portraits (shifting clothes/backgrounds per option)
  console.log('[Generator] Generating 5 unique AI avatars using Imagen 3...');
  const attires = [
    "formal sharp charcoal grey suit with a crisp white shirt",
    "casual mustard yellow button-down shirt with glasses",
    "premium smart-casual navy blue polo shirt",
    "modern olive green linen button-up shirt",
    "stylish beige crewneck sweater"
  ];
  const backgrounds = [
    "minimalist corporate office lobby with neutral tones",
    "modern coworking space with plants and windows",
    "cozy cafe with warm lighting and blurred wooden details",
    "creative studio setup with a soft color gradient background",
    "urban outdoor setting with blurred modern architecture"
  ];
  
  for (let i = 1; i <= 5; i++) {
    const dailyAvatarPath = path.resolve('public', `avatar_daily_${i}.jpg`);
    try {
      const attire = attires[(i - 1) % attires.length];
      const background = backgrounds[(i - 1) % backgrounds.length];
      
      console.log(`[Generator] Generating avatar ${i}/5 with attire: ${attire}...`);
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
        console.log(`[Generator] Successfully saved unique avatar ${i}: ${dailyAvatarPath}`);
      } else {
        throw new Error('Image response did not contain images');
      }
    } catch (err) {
      console.warn(`[Generator] Unique avatar ${i} generation failed. Falling back to master or default:`, err.message);
      const defaultAvatarPath = path.resolve('public', 'avatar.jpg');
      if (fs.existsSync(defaultAvatarPath)) {
        fs.copyFileSync(defaultAvatarPath, dailyAvatarPath);
      }
    }
  }

  // Copy first avatar as the master daily avatar
  const firstAvatar = path.resolve('public', 'avatar_daily_1.jpg');
  const masterAvatar = path.resolve('public', 'avatar_daily.jpg');
  if (fs.existsSync(firstAvatar)) {
    fs.copyFileSync(firstAvatar, masterAvatar);
    console.log('[Generator] Copied avatar_daily_1.jpg to avatar_daily.jpg as fallback master');
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
Your goal is to write extremely engaging, highly professional, authentic LinkedIn posts AND compile custom HTML5 Canvas-friendly JSON layouts that are visually stunning and highly dynamic.

Guidelines for posts:
1. Tone: Human, direct, highly opinionated, intellectually challenging, and punchy. Absolutely avoid generic AI greetings, corporate clichés, or standard fluff. Write like a seasoned, battle-tested leader.
2. Structure: Start with an attention-grabbing hook (line 1) under 6 words. Write the body in short paragraphs (1-2 sentences max each), and end with a non-cliché question or clear call to action, followed by 3-5 hashtags.
3. Formatting: Emojis very sparingly (no more than 2-3). Do NOT use fake bold/italic unicode.
4. Perspectives: First-person ('I' or 'We') as an elite Marketing Director/AI automation architect.

Visual Layout Instructions:
To guarantee maximum visual variety and layout dynamism across the 5 options, you MUST assign a completely different layout style profile to each of the 5 posts. Do NOT reuse the same structure! You must generate exactly:
- Post 1: "Neon Split Panel" (Left Avatar, Right Text Column)
- Post 2: "Modern Business Grid" (Right Avatar, Left Text Column)
- Post 3: "Full Backdrop Banner" (Center Text Overlay, Bottom Avatar)
- Post 4: "Realistic Portrait Split" (Diagonal Split Panel)
- Post 5: "Minimalist Executive Quote" (Big Center Typography, Small Right Avatar)

Follow these exact layout rules and JSON configurations for the 5 posts:

1. POST 1: "Neon Split Panel" (Left Avatar, Right Text Column)
   - background: colors: ["#050814", "#0a0314"], isSunburst: true, rayColor: "rgba(0, 242, 254, 0.04)", glows: [{ x: 300, y: 600, r: 500, color: "rgba(255, 0, 127, 0.25)" }]
   - shapes: A large translucent circle at x: 300, y: 600, r: 280, color: "rgba(255, 255, 255, 0.02)", strokeColor: "rgba(0, 242, 254, 0.4)", lineWidth: 3, glowColor: "#00f2fe", glowBlur: 30
   - avatar: type: "circle", x: 300, y: 600, w: 340, h: 340, glowColor: "#ff007f", glowBlur: 40, strokeColor: "#ff007f", lineWidth: 4
   - text: badge: { text: "AI STRATEGY", bgColor: "#ff007f", glowColor: "#ff007f", glowBlur: 15 }, headline: { fontSize: 44, color: "#ffffff", highlightColor: "#00f2fe", align: "left" }, subtext: { fontSize: 22, color: "#cbd5e1" }, cta: { text: "READ FULL POST", bgColor: "#00f2fe", glowColor: "#00f2fe", glowBlur: 20 }
   - floatingElements: [{ type: "linkedin", x: 160, y: 480, size: 36 }]

2. POST 2: "Modern Business Grid" (Right Avatar, Left Text Column)
   - background: colors: ["#f8fafc", "#ffffff"], drawGrid: true, gridColor: "rgba(226, 232, 240, 0.7)", gridSize: 40, glows: [{ x: 820, y: 540, r: 400, color: "rgba(249, 115, 22, 0.15)" }]
   - shapes: Grid styling and key structural lines:
     { type: "rect", x: 820, y: 540, w: 430, h: 690, color: "rgba(249, 115, 22, 0.02)", strokeColor: "#ff6b00", lineWidth: 4 },
     { type: "line", x1: 80, y1: 150, x2: 700, y2: 150, strokeColor: "#e2e8f0", lineWidth: 2 }
   - avatar: type: "rect", x: 820, y: 540, w: 420, h: 680, glowColor: "#ff6b00", glowBlur: 20, strokeColor: "#ff6b00", lineWidth: 6
   - text: badge: { text: "GAME CHANGER", bgColor: "#ff6b00", glowColor: "#ff6b00", glowBlur: 15 }, headline: { fontSize: 48, color: "#0f172a", highlightColor: "#ff6b00", align: "left" }, subtext: { fontSize: 20, color: "#475569" }, cta: { text: "EXPLORE NOW", bgColor: "#ff6b00", glowColor: "#ff6b00", glowBlur: 20 }
   - floatingElements: [{ type: "linkedin", x: 920, y: 180, size: 36 }]

3. POST 3: "Full Backdrop Banner" (Center Text Overlay, Bottom Avatar)
   - background: colors: ["#020b08", "#001a12"], isSunburst: true, rayColor: "rgba(57, 255, 20, 0.03)", glows: [{ x: 540, y: 540, r: 500, color: "rgba(57, 255, 20, 0.15)" }]
   - shapes: Translucent center backdrop card:
     { type: "rect", x: 540, y: 380, w: 900, h: 480, color: "rgba(15, 23, 42, 0.65)", strokeColor: "rgba(57, 255, 20, 0.3)", lineWidth: 2, borderRadius: 16 }
   - avatar: type: "circle", x: 540, y: 820, w: 300, h: 300, glowColor: "#39ff14", glowBlur: 35, strokeColor: "#39ff14", lineWidth: 4
   - text: badge: { text: "EXECUTIVE VIEW", bgColor: "#39ff14", glowColor: "#39ff14", glowBlur: 15 }, headline: { fontSize: 44, color: "#ffffff", highlightColor: "#39ff14", align: "center" }, subtext: { fontSize: 20, color: "#cbd5e1" }, cta: { text: "READ POST", bgColor: "#39ff14", glowColor: "#39ff14", glowBlur: 20 }
   - floatingElements: [{ type: "emoji", emoji: "⚡", x: 860, y: 820, size: 32 }]

4. POST 4: "Realistic Portrait Split" (Diagonal Split Panel)
   - background: colors: ["#0d0214", "#1c0024"], isSunburst: true, rayColor: "rgba(255, 0, 160, 0.03)", glows: [{ x: 800, y: 540, r: 600, color: "rgba(0, 242, 254, 0.2)" }]
   - shapes: Abstract circles on the left column:
     { type: "circle", x: 100, y: 800, r: 120, color: "rgba(255, 255, 255, 0.02)", strokeColor: "rgba(255, 0, 160, 0.3)", lineWidth: 2 }
   - avatar: type: "rect", x: 780, y: 540, w: 440, h: 840, tilt: 0.05, glowColor: "#00f2fe", glowBlur: 30, strokeColor: "#00f2fe", lineWidth: 4
   - text: badge: { text: "SYNTH TREND", bgColor: "#ff00a0", glowColor: "#ff00a0", glowBlur: 15 }, headline: { fontSize: 42, color: "#ffffff", highlightColor: "#ff00a0", align: "left" }, subtext: { fontSize: 20, color: "#e2e8f0" }, cta: { text: "GET INSIGHTS", bgColor: "#ff00a0", glowColor: "#ff00a0", glowBlur: 20 }
   - floatingElements: [{ type: "linkedin", x: 500, y: 220, size: 36 }]

5. POST 5: "Minimalist Executive Quote" (Big Center Typography, Small Right Avatar)
   - background: colors: ["#050505", "#140a00"], isSunburst: false, glows: [{ x: 540, y: 540, r: 400, color: "rgba(251, 191, 36, 0.1)" }]
   - shapes: Subtle border line on the left accent stripe:
     { type: "line", x1: 40, y1: 100, x2: 40, y2: 980, strokeColor: "#fbbf24", lineWidth: 8 }
   - avatar: type: "circle", x: 900, y: 180, w: 180, h: 180, glowColor: "#fbbf24", glowBlur: 25, strokeColor: "#fbbf24", lineWidth: 3
   - text: badge: { text: "B2B LEADERSHIP", bgColor: "#fbbf24", glowColor: "#fbbf24", glowBlur: 10 }, headline: { fontSize: 52, color: "#ffffff", highlightColor: "#fbbf24", align: "center" }, subtext: { fontSize: 24, color: "#cbd5e1" }, cta: { text: "READ ESSAY", bgColor: "#fbbf24", glowColor: "#fbbf24", glowBlur: 20 }
   - floatingElements: [{ type: "emoji", emoji: "🔥", x: 920, y: 880, size: 32 }]`;

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
      "colors": ["#hex1", "#hex2"],
      "isSunburst": true,
      "rayColor": "rgba(255, 255, 255, 0.04)",
      "drawGrid": false,
      "glows": [
        { "x": 300, "y": 600, "r": 500, "color": "rgba(0, 0, 0, 0.2)" }
      ]
    },
    "shapes": [
      { "type": "circle", "x": 300, "y": 600, "r": 250, "color": "rgba(255, 255, 255, 0.02)", "strokeColor": "rgba(0, 0, 0, 0.4)", "lineWidth": 3, "glowColor": "#000000", "glowBlur": 30 }
    ],
    "avatar": {
      "type": "circle", "x": 300, "y": 600, "w": 320, "h": 320, "tilt": 0, "glowColor": "#000000", "glowBlur": 40, "strokeColor": "#000000", "lineWidth": 4
    },
    "text": {
      "badge": { "text": "AI TREND", "bgColor": "#000000", "glowColor": "#000000", "glowBlur": 15 },
      "headline": { "fontSize": 44, "color": "#ffffff", "highlightColor": "#000000", "align": "left" },
      "subtext": { "fontSize": 20, "color": "#cbd5e1" },
      "cta": { "text": "READ POST", "bgColor": "#000000", "glowColor": "#000000", "glowBlur": 20 }
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
