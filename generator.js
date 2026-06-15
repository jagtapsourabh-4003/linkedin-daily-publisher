import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { scrapeReferenceCreative } from './scraper.js';

/**
 * Generates 5 LinkedIn post variations based on scraped trends and category.
 * @param {string} category - 'ai' or 'marketing'
 * @param {Array} trends - Array of scraped trends
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<Array<{id: number, style: string, content: string, hook: string, layout: object, scores: object}>>}
 */
export async function generatePosts(category, trends, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set it in Settings or the .env file.');
  }

  // Initialize SDK
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-pro';

  console.log(`[Generator] Initializing Gemini request for ${category} using ${modelName}`);

  // 1. Scrape reference template image
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

  // 2. Format trends for prompt context
  const trendsContext = trends.map((t, idx) => {
    return `${idx + 1}. [Source: ${t.source}] Title: ${t.title}\nSummary: ${t.description}\nLink: ${t.link}`;
  }).join('\n\n');

  const topicLabel = category.toLowerCase() === 'marketing' ? 'Digital Marketing, Growth Strategy, and Brand Management' : 'Artificial Intelligence, Machine Learning, and Future Tech Trends';

  const systemInstruction = `You are a world-class viral LinkedIn Copywriter, Content Strategist, and Art Director.
Your goal is to write extremely engaging, highly professional, B2B LinkedIn posts AND compile custom HTML5 Canvas-friendly JSON layouts that are visually stunning, vibrant, and highly dynamic.

Guidelines for posts:
1. Tone: Human, direct, highly opinionated, intellectually challenging, and punchy B2B style. Absolutely avoid generic AI greetings or corporate clichés. Write like a seasoned, battle-tested industry leader.
2. Structure: Start with an attention-grabbing hook (line 1) under 6 words. Write the body in short paragraphs (1-2 sentences max each), and end with a non-cliché question or clear call to action, followed by 3-5 hashtags.
3. Formatting: Emojis very sparingly (no more than 2-3). Do NOT use fake bold/italic unicode.
4. Perspectives: First-person ('I' or 'We') as an elite B2B Director who is also a deep AI automation architect.

Visual Layout & Proportions Instructions (Canvas coordinates are 1080x1080):
Translate the attached reference template image (if provided) into a custom 'layout' JSON configuration.
To prevent text overlapping the avatar and ensure professional proportions, you MUST assign explicit canvas coordinates (x, y, w, h) to the layout elements depending on the assigned style:
- Post 1: "Neon Split Panel" (Left Avatar, Right Text Column)
  * Avatar: type "circle", x: 260, y: 540, w: 360, h: 360 (or rectangle card, x: 260, y: 540, w: 360, h: 720).
  * Text Columns: badge x: 520, y: 160, headline x: 520, y: 240, w: 500, subtext x: 520, y: 560, w: 500, cta x: 520, y: 780, w: 260, h: 55.
- Post 2: "Modern Business Grid" (Right Avatar, Left Text Column, drawGrid: true)
  * Avatar: type "rect", x: 820, y: 540, w: 360, h: 720.
  * Text Columns: badge x: 80, y: 160, headline x: 80, y: 240, w: 500, subtext x: 80, y: 560, w: 500, cta x: 80, y: 780, w: 260, h: 55.
- Post 3: "Full Backdrop Banner" (Center Text Overlay, Bottom Avatar)
  * Avatar: type "circle", x: 540, y: 860, w: 160, h: 160.
  * Text Columns: badge x: 420, y: 120, headline x: 90, y: 190, w: 900, subtext x: 90, y: 440, w: 900, cta x: 410, y: 680, w: 260, h: 55.
- Post 4: "Realistic Portrait Split" (Diagonal Split Panel)
  * Avatar: type "card", x: 800, y: 540, w: 440, h: 880 (diagonal split alignment).
  * Text Columns: badge x: 80, y: 120, headline x: 80, y: 190, w: 480, subtext x: 80, y: 520, w: 480, cta x: 80, y: 780, w: 260, h: 55.
- Post 5: "Minimalist Executive Quote" (Big Center Typography, Small Right Avatar)
  * Avatar: type "circle", x: 900, y: 120, w: 120, h: 120.
  * Text Columns: badge x: 80, y: 120, headline x: 140, y: 220, w: 800, subtext x: 140, y: 540, w: 800, cta x: 410, y: 780, w: 260, h: 55.

Choose colors matching one of these vibrant styles per post layout:
- Neon Cyberpunk: Background colors ["#050814", "#0a0314"], Accent/Highlight: "#00f2fe" [Electric Cyan], glows: "#00f2fe" and "#ff007f" [Hot Magenta].
- Solar Flare: Background colors ["#120802", "#1f0f00"], Accent/Highlight: "#ff6b00" [Safety Orange], glows: "#ff6b00" and "#fffb00" [Bright Yellow].
- Acid Lime: Background colors ["#020b08", "#001a12"], Accent/Highlight: "#39ff14" [Lime Green], glows: "#39ff14" and "#0055ff" [Neon Blue].
- Synthwave: Background colors ["#0d0214", "#1c0024"], Accent/Highlight: "#ff007f" [Hot Magenta], glows: "#ff007f" and "#00f2fe" [Electric Cyan].
- Electric Gold: Background colors ["#050505", "#140a00"], Accent/Highlight: "#fbbf24" [Bright Gold], glows: "#fbbf24" and "#8f00ff" [Electric Violet].

Avatar Prompt Customization Guidelines:
Each post object in the JSON array must contain a custom 'avatarPrompt' property. This prompt will be passed to Imagen 3 to generate a portrait of the B2B manager that matches the post topic. The prompt MUST use these base features of the manager to preserve his identity:
- An Indian male manager in his late 30s
- Warm tan skin tone, clean-shaven
- Short styled black hair parted to the side
- Wearing black thick-framed glasses
- Having a friendly smile with visible teeth

Customize the attire, pose, and background of the manager in the prompt to match the post's theme. For example:
- For an AI/Technology post: 'sitting in front of a curved monitor displaying glowing cyan code, wearing a modern charcoal grey blazer over a white crewneck shirt'
- For a growth/business post: 'standing next to a glass whiteboard with marketing diagrams, wearing a smart casual navy polo shirt'
- For a marketing strategy post: 'holding a smartphone, sitting in a vibrant B2B coworking lobby, wearing a professional mustard button-down shirt'
Ensure the prompt ends with: 'Shot on 85mm lens, f/1.8 aperture, realistic lighting, highly detailed features, cinematic, photorealistic, professional color grading, vibrant background, clean composition, high-resolution.'

AI QUALITY CHECK:
Brainstorm exactly 10 candidate posts internally based on the trend context. Rate each candidate out of 100 on these three parameters:
- Design: Visual appeal, readability, professional layout match (out of 100)
- Content: Engagement potential, authority, clarity of the copy (out of 100)
- Branding: Personal branding strength, natural avatar integration (out of 100)
Calculate the average total score. You MUST filter and output ONLY the top 5 highest-scoring options. Each option must have a total score of 85 or above.`;

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
  "avatarPrompt": "The tailored prompt for Imagen 3 image generation following the manager identity instructions, matching the post theme.",
  "scores": {
    "design": 88,
    "content": 92,
    "branding": 86,
    "total": 89
  },
  "layout": {
    "background": {
      "colors": ["#050814", "#0a0314"],
      "isSunburst": true,
      "rayColor": "rgba(255, 255, 255, 0.04)",
      "drawGrid": false,
      "gridColor": "rgba(255, 255, 255, 0.05)",
      "gridSize": 40,
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
      "badge": { "text": "AI TREND", "bgColor": "#ff007f", "glowColor": "#ff007f", "glowBlur": 15, "x": 90, "y": 160 },
      "headline": { "fontSize": 44, "color": "#ffffff", "highlightColor": "#00f2fe", "align": "left", "x": 90, "y": 240, "w": 900 },
      "subtext": { "fontSize": 20, "color": "#cbd5e1", "x": 90, "y": 480, "w": 900 },
      "cta": { "text": "READ POST", "bgColor": "#ff007f", "glowColor": "#ff007f", "glowBlur": 20, "x": 90, "y": 780, "w": 260, "h": 55 }
    },
    "floatingElements": [
      { "type": "linkedin", "x": 160, "y": 480, "size": 36 }
    ]
  }
}`;

  let posts = null;
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

      posts = JSON.parse(responseText.trim());
      if (!Array.isArray(posts) || posts.length === 0) {
        throw new Error('Response is not a valid JSON array or is empty');
      }
      break; // break retry loop if successful
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

  // 3. Generate 5 unique customized AI avatars based on Gemini's returned prompts
  if (posts) {
    console.log('[Generator] Calling Imagen 3 for customized portraits...');
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const dailyAvatarPath = path.resolve('public', `avatar_daily_${post.id}.jpg`);
      
      try {
        const imagePrompt = post.avatarPrompt || `Studio portrait photography of an Indian male manager in his late 30s, warm tan skin, clean-shaven, short styled black hair parted to the side, wearing black thick-framed glasses, friendly smile with visible teeth, wearing a suit, sitting in an office. Shot on 85mm lens, f/1.8 aperture, realistic lighting, highly detailed features, cinematic, photorealistic, professional color grading, vibrant background, clean composition, high-resolution.`;
        console.log(`[Generator] Generating customized avatar for Post ${post.id}... Prompt: "${imagePrompt.slice(0, 100)}..."`);
        
        const imageResponse = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: imagePrompt,
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
          console.log(`[Generator] Successfully saved unique avatar ${post.id}: ${dailyAvatarPath}`);
        } else {
          throw new Error('Image response did not contain images');
        }
      } catch (err) {
        console.warn(`[Generator] Unique avatar ${post.id} generation failed. Falling back to default:`, err.message);
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
  }

  return posts;
}

