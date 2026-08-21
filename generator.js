import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { scrapeReferenceCreative } from './scraper.js';
import { getHistory } from './database.js';

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
  const modelName = 'gemini-2.5-flash';

  console.log(`[Generator] Initializing Gemini request for ${category} using ${modelName}`);

  // Fetch recent layout history metadata to enforce 30-day design memory (Critical Rule #12)
  let recentDesignMemoryStr = '[]';
  try {
    const history = getHistory();
    const recentPosts = history.slice(0, 30).map(h => h.posts || []).flat();
    const designMemory = recentPosts.map(p => ({
      designArchetype: p.designArchetype || '',
      layoutFamily: p.layoutFamily || '',
      colorPalette: p.colorPalette || '',
      characterRole: p.characterRole || '',
      environment: p.environment || '',
      cameraStyle: p.cameraStyle || '',
      clothingStyle: p.clothingStyle || ''
    })).filter(m => m.designArchetype || m.layoutFamily || m.colorPalette);
    recentDesignMemoryStr = JSON.stringify(designMemory);
  } catch (err) {
    console.warn('[Generator] Failed to fetch layout history for design memory checks:', err.message);
  }

  // 1. Scrape reference template image
  const designRef = await scrapeReferenceCreative();
  let base64Image = null;
  let mimeType = 'image/jpeg';
  try {
    console.log(`[Generator] Downloading reference creative: ${designRef.imageUrl}`);
    const res = await fetch(designRef.imageUrl, { signal: AbortSignal.timeout(10000) });
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

  const topicLabel = category.toLowerCase() === 'marketing' ? 'Digital Marketing, Brand Building, and Growth Strategy' : 'Artificial Intelligence and Generative AI applications in Marketing, Copywriting, and Brand Building';

  const systemInstruction = `You are a world-class viral LinkedIn Copywriter, Content Strategist, and Art Director.
Your goal is to write extremely engaging, highly professional, B2B LinkedIn posts AND define custom visual configurations representing agency-grade creative designs.

CRITICAL RULES:
1. NEVER REPEAT DESIGN STRUCTURES: Assign exactly one unique DESIGN ARCHETYPE per post from this pool: Forbes Cover, TED Speaker, Startup Founder, Apple Keynote, University Chancellor, Harvard Professor, Podcast Host, News Anchor, Investor Pitch, Documentary Interview, Magazine Editorial, LinkedIn Thought Leader, Creative Director, AI Futurist, Business Strategist, Consultant Presentation, Conference Speaker, Corporate Executive, Innovation Lab Researcher, Book Author. No two posts in this batch can use the same archetype.
2. USE LAYOUT FAMILIES INSTEAD OF COORDINATES: Assign exactly one unique LAYOUT FAMILY per post from this pool: split-left, split-right, hero-center, magazine-cover, quote-card, podcast-layout, presentation-slide, news-card, editorial-cover, phone-mockup, floating-cards, layered-depth, diagonal-layout, asymmetrical-grid, modern-minimal. Never output hardcoded coordinates.
3. ROTATE COLOR SYSTEMS: Assign exactly one unique COLOR PALETTE per post from this pool: Electric Blue, Cyber Purple, Emerald Green, Crimson Red, Royal Gold, Teal White, Slate Blue, Monochrome Black, Neon Cyan, Sunset Orange, Deep Indigo, Premium Burgundy, Corporate Navy, Platinum Grey, Dark Forest. Do not repeat palettes within the batch or consecutive days.
4. MAINTAIN FACE IDENTITY: The author portrait must always represent the same individual in the avatarPrompt. Identity rules: Indian male, late 30s, warm tan skin, black hair, black thick-framed glasses, friendly confident expression, professional appearance.
5. DAILY CHARACTER ROLE ROTATION: Assign a unique professional persona for the avatarPrompt from this pool: University Chancellor, TED Speaker, Startup Founder, Author, Professor, Investor, AI Consultant, Business Coach, Innovation Leader, Podcast Host, Researcher, Corporate Executive, Technology Evangelist, Keynote Speaker, Strategy Consultant. This role must dictate the clothing, posture, and environment.
6. ENVIRONMENT VARIATION: Rotate backgrounds dynamically in the avatarPrompt from this pool: Modern university campus, Executive boardroom, Auditorium stage, Innovation lab, Podcast studio, Creative workspace, Luxury office, Coffee shop workspace, City skyline office, Technology command center, Library, Conference venue, Startup hub, Media studio, Futuristic workspace. No duplicates in this batch.
7. CAMERA ANGLE VARIATION: Rotate camera composition in the avatarPrompt from this pool: Close-up portrait, Half-body portrait, Full-body standing, Walking shot, Presentation shot, Side profile, Over-the-shoulder, Looking at camera, Looking away, Speaking on stage, Sitting at desk, Interview setup. No duplicates in this batch.
8. CLOTHING ROTATION: Rotate wardrobe style in the avatarPrompt from this pool: Navy business suit, Charcoal executive suit, Smart casual blazer, Premium polo shirt, Turtleneck with blazer, Modern startup hoodie, White shirt with rolled sleeves, Formal university attire, Conference speaker outfit, Luxury business casual. No duplicates in this batch.
9. VISUAL DEPTH REQUIREMENT: Every avatarPrompt must specify a foreground element (e.g. out-of-focus microphone, glass screen, plants, office frame), midground subject (the manager), and background element (the environment), using shallow depth of field or blur to create cinematic depth.
10. PREMIUM DESIGN QUALITY: The design language must mimic elite brands like Forbes, Apple, McKinsey, TED, Bloomberg, Harvard Business Review, Fortune, or Wired.
11. AVATAR PROMPT CONSTRUCTION: Formulate the avatarPrompt dynamically by chaining: [IDENTITY] + [ROLE] + [ENVIRONMENT] + [CAMERA STYLE] + [CLOTHING] + [LIGHTING]. Always end with the exact suffix: 'Shot on 85mm lens, f/1.8 aperture, realistic lighting, shallow depth of field, premium professional photography, realistic skin texture, highly detailed, cinematic.'
12. DESIGN MEMORY: You MUST NOT repeat any archetype, layout family, color palette, camera style, environment, clothing style, or role used in the last 30 days. Here is the list of recently used combinations:
${recentDesignMemoryStr}

Guidelines for post content:
1. Tone: Crystal clear, friendly, conversational, and simple. Write like you are explaining a concept to a smart friend over coffee. Do NOT sound academic, overly formal, or robotic.
2. LAYMAN-FRIENDLY WRITING RULE (CRITICAL): Write so that ANY beginner or layman can easily understand the core message within 10 seconds. Use plain everyday words. If you introduce an idea about AI or marketing, explain it using a simple real-world analogy. Avoid complex acronyms (explain them in simple words if mentioned).
3. STRICT JARGON BAN: You are strictly forbidden from using confusing buzzwords and corporate jargon. Do NOT use: "delve", "tapestry", "testament", "revolutionize", "beacon", "shaping the future", "paradigm shift", "democratize", "game-changer", "transformative", "cutting-edge", "harnessing", "unveiled", "journey", "crucial", "essential", "furthermore", "moreover", "leverage", "robust", "synergy", "seamless", "operationalize", "heuristic", "retrieval-augmented".
4. Sentence Length: Keep sentences short and punchy (under 12-15 words). Break paragraphs into 1-2 lines maximum for effortless mobile reading.
5. Structure:
   - Line 1: An attention-grabbing, simple hook (under 6-8 words).
   - Problem / Reality: Explain what is happening in simple everyday terms.
   - 3 Simple Takeaways / Steps: Bullet points with numbers (1, 2, 3) that give concrete, easy advice.
   - Friendly Question: Close with an easy question to encourage comments, followed by 3-4 relevant hashtags.
6. Formatting: Emojis very sparingly (no more than 2-3). Do NOT use fake bold/italic unicode characters.
7. Perspectives: First-person ('I' or 'We') as a friendly, knowledgeable mentor who simplifies complex topics.
8. Marketing & Business Focus: Connect every topic directly to real business benefits: getting more customers, saving time, writing better, or standing out online.
9. Post Angles (No Repetition): Each post in the 5-post batch must use a unique angle and style:
   - Post 1: "Breaking Trend" - What is new and what it means in plain English.
   - Post 2: "Step-by-Step Guide" - 3 simple steps anyone can do today.
   - Post 3: "Common Myth" - Bust a popular misconception with simple logic.
   - Post 4: "Mistake to Avoid" - The #1 mistake people make and how to easily fix it.
   - Post 5: "Future Outlook" - A simple, exciting glimpse at where things are going.
10. ZERO TOPIC REPETITION: Base each of the 5 posts on a completely different idea. Keep all 5 variations fresh and unique.`;

  const prompt = `Generate exactly 5 LinkedIn posts on the topic of: ${topicLabel}.
Use the following scraped web trends as context and inspiration:

---
${trendsContext}
---

Your response MUST be a JSON array containing exactly 5 objects. Do not wrap the JSON output in markdown formatting block quotes (e.g. \`\`\`json). Output raw JSON.

Each object in the array must follow this structure. Ensure that the "style" field for each object matches its corresponding mandated angle exactly:
- Object 1 "style": "Breaking Trend/News"
- Object 2 "style": "Actionable Playbook"
- Object 3 "style": "Contrarian Debate"
- Object 4 "style": "Mistake/Failure Study"
- Object 5 "style": "Strategic Prediction"

{
  "designArchetype": "Forbes Cover",
  "layoutFamily": "split-left / split-right / hero-center / magazine-cover / quote-card / podcast-layout / presentation-slide / news-card / editorial-cover / phone-mockup / floating-cards / layered-depth / diagonal-layout / asymmetrical-grid / modern-minimal / glassmorphism-card / neon-border / bold-typographic / infographic-side / cinematic-wide",
  "colorPalette": "Electric Blue / Cyber Purple / Emerald Green / Crimson Red / Royal Gold / Teal White / Slate Blue / Monochrome Black / Neon Cyan / Sunset Orange / Deep Indigo / Premium Burgundy / Corporate Navy / Platinum Grey / Dark Forest / Aurora Violet / Liquid Gold / Midnight Rose / Arctic Blue / Volcanic Amber",
  "characterRole": "AI Consultant",
  "environment": "Innovation lab",
  "cameraStyle": "Half-body portrait",
  "clothingStyle": "Smart casual blazer",
  "avatarPrompt": "Indian male manager in his late 30s...",
  "postContent": {
    "style": "Breaking Trend/News OR Actionable Playbook OR Contrarian Debate OR Mistake/Failure Study OR Strategic Prediction",
    "hook": "The first 1-2 lines of the post (attention-grabbing hook)",
    "content": "The full body of the post, including the hook, paragraphs, call to action, and hashtags. Keep line breaks intact with newlines (\\n).",
    "sourceArticle": "Title of the main article from the trends context that inspired this post, or 'General Trend' if inspired by multiple.",
    "imageHeadline": "A short, ultra-punchy graphic title in ALL CAPS (exactly 2-4 words). Wrap the most important 1-2 words in asterisks for neon highlight styling (e.g. '*99% FAILED*', 'STOP *CODING* NOW', 'THE *$0 STACK*', 'AI IS *DEAD*?').",
    "imageSubtext": "A highly compelling graphic subtitle (exactly 5-9 words) explaining the metric or strategy.",
    "badgeText": "AI TREND / MARKETING INSIGHT",
    "ctaText": "TRY WEB APP / READ FULL POST / GET REPORT"
  },
  "layoutConfig": {
    "dimensions": {
      "width": 1080,
      "height": 1080
    }
  }
}`;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let modelIdx = 0;
  let activeModel = models[modelIdx];
  let posts = null;
  let attempts = 6;
  let delay = 2000;
  
  const responseSchema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        designArchetype: { type: 'STRING' },
        layoutFamily: { type: 'STRING' },
        colorPalette: { type: 'STRING' },
        characterRole: { type: 'STRING' },
        environment: { type: 'STRING' },
        cameraStyle: { type: 'STRING' },
        clothingStyle: { type: 'STRING' },
        avatarPrompt: { type: 'STRING' },
        postContent: {
          type: 'OBJECT',
          properties: {
            style: { type: 'STRING' },
            hook: { type: 'STRING' },
            content: { type: 'STRING' },
            sourceArticle: { type: 'STRING' },
            imageHeadline: { type: 'STRING' },
            imageSubtext: { type: 'STRING' },
            badgeText: { type: 'STRING' },
            ctaText: { type: 'STRING' }
          },
          required: ['style', 'hook', 'content', 'sourceArticle', 'imageHeadline', 'imageSubtext', 'badgeText', 'ctaText']
        },
        layoutConfig: {
          type: 'OBJECT',
          properties: {
            dimensions: {
              type: 'OBJECT',
              properties: {
                width: { type: 'INTEGER' },
                height: { type: 'INTEGER' }
              },
              required: ['width', 'height']
            }
          },
          required: ['dimensions']
        }
      },
      required: [
        'designArchetype',
        'layoutFamily',
        'colorPalette',
        'characterRole',
        'environment',
        'cameraStyle',
        'clothingStyle',
        'avatarPrompt',
        'postContent',
        'layoutConfig'
      ]
    }
  };
  
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`[Generator] Initiating Gemini call using ${activeModel} (attempt ${i + 1}/${attempts})...`);
      
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
        model: activeModel,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.95,
        }
      });
      
      const responseText = response.text;
      console.log('[Generator] Raw response received');

      posts = JSON.parse(responseText.trim());
      if (!Array.isArray(posts) || posts.length === 0) {
        throw new Error('Response is not a valid JSON array or is empty');
      }
      posts.forEach((p, idx) => {
        if (!p.id) p.id = idx + 1;
      });
      break; // break retry loop if successful
    } catch (error) {
      console.warn(`[Generator] Attempt ${i + 1} failed on ${activeModel}:`, error.message);
      
      const isRateLimit = error.message.toLowerCase().includes('429') || 
                          error.message.toLowerCase().includes('quota') || 
                          error.message.toLowerCase().includes('limit') ||
                          error.message.toLowerCase().includes('exhausted') ||
                          error.message.toLowerCase().includes('rate');
                          
      const isTransient = error.message.toLowerCase().includes('503') ||
                          error.message.toLowerCase().includes('500') ||
                          error.message.toLowerCase().includes('504') ||
                          error.message.toLowerCase().includes('unavailable') ||
                          error.message.toLowerCase().includes('demand');
                          
      if ((isRateLimit || isTransient) && modelIdx < models.length - 1) {
        modelIdx++;
        const nextModel = models[modelIdx];
        console.warn(`[Generator] ${activeModel} error (${error.message}). Falling back to ${nextModel} immediately...`);
        activeModel = nextModel;
        continue;
      }
      
      if ((isRateLimit || isTransient) && i < attempts - 1) {
        console.log(`[Generator] Temporary error on ${activeModel}. Waiting ${delay / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      } else {
        console.error('[Generator] Final failure generating posts:', error);
        throw new Error(`Failed to generate posts with Gemini: ${error.message}`);
      }
    }
  }


  // 3. Generate 5 unique customized AI avatars IN PARALLEL (not sequentially!)
  // This reduces total time from ~10 min (5 sequential) to ~2 min (all parallel)
  if (posts) {
    console.log('[Generator] Calling Imagen 4 for all 5 customized portraits IN PARALLEL...');
    
    const avatarPromises = posts.map(async (post) => {
      const dailyAvatarPath = path.resolve('docs', `avatar_daily_${post.id}.jpg`);
      
      try {
        const imagePrompt = post.avatarPrompt || `Studio portrait photography of an Indian male manager in his late 30s, warm tan skin, clean-shaven, short styled black hair parted to the side, wearing black thick-framed glasses, friendly smile with visible teeth, wearing a suit, sitting in an office. Shot on 85mm lens, f/1.8 aperture, realistic lighting, highly detailed features, cinematic, photorealistic, professional color grading, vibrant background, clean composition, high-resolution.`;
        console.log(`[Generator] Starting avatar for Post ${post.id}... Prompt: "${imagePrompt.slice(0, 80)}..."`);
        
        const imageResponse = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
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
          console.log(`[Generator] ✅ Avatar ${post.id} saved: ${dailyAvatarPath}`);
          return { id: post.id, success: true };
        } else {
          throw new Error('Image response did not contain images');
        }
      } catch (err) {
        console.warn(`[Generator] ⚠️ Avatar ${post.id} failed, using fallback:`, err.message);
        const styleAvatarPath = path.resolve('docs', 'avatars', `avatar-${post.id}.png`);
        const defaultAvatarPath = path.resolve('docs', 'avatar.jpg');
        if (fs.existsSync(styleAvatarPath)) {
          fs.copyFileSync(styleAvatarPath, dailyAvatarPath);
        } else if (fs.existsSync(defaultAvatarPath)) {
          fs.copyFileSync(defaultAvatarPath, dailyAvatarPath);
        }
        return { id: post.id, success: false };
      }
    });

    const results = await Promise.allSettled(avatarPromises);
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`[Generator] Avatar generation complete: ${succeeded}/${posts.length} succeeded`);

    // Copy first avatar as the master daily avatar
    const firstAvatar = path.resolve('docs', 'avatar_daily_1.jpg');
    const masterAvatar = path.resolve('docs', 'avatar_daily.jpg');
    if (fs.existsSync(firstAvatar)) {
      fs.copyFileSync(firstAvatar, masterAvatar);
      console.log('[Generator] Copied avatar_daily_1.jpg to avatar_daily.jpg as fallback master');
    }
  }

  return posts;
}

