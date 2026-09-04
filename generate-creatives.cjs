/**
 * generate-creatives.cjs — Render 1080x1080 professional creative cards for daily posts.
 * Generates docs/creative_1.png ... docs/creative_5.png
 * Uses @napi-rs/canvas for high-fidelity server-side rendering.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const HISTORY_FILE = path.join(__dirname, 'docs', 'data', 'history.json');
const DOCS_DIR = path.join(__dirname, 'docs');

const FONT_TITLE = '900 58px "Segoe UI", Arial, sans-serif';
const FONT_SUBTEXT = '500 32px "Segoe UI", Arial, sans-serif';
const FONT_BADGE = 'bold 18px "Segoe UI", Arial, sans-serif';
const FONT_AUTHOR_NAME = 'bold 32px "Segoe UI", Arial, sans-serif';
const FONT_AUTHOR_TITLE = '500 22px "Segoe UI", Arial, sans-serif';
const FONT_AUTHOR_TAG = '600 18px "Segoe UI", Arial, sans-serif';
const FONT_CTA = 'bold 16px "Segoe UI", Arial, sans-serif';

const PALETTES = [
  { name: 'Navy Modern', bgStart: '#080d1a', bgEnd: '#020617', primary: '#38bdf8', secondary: '#cbd5e1', badge: '#0284c7', glow: 'rgba(56, 189, 248, 0.18)' },
  { name: 'Emerald Growth', bgStart: '#051813', bgEnd: '#020d0a', primary: '#34d399', secondary: '#d1fae5', badge: '#059669', glow: 'rgba(52, 211, 153, 0.18)' },
  { name: 'Violet Vision', bgStart: '#100b22', bgEnd: '#060312', primary: '#a78bfa', secondary: '#e0e7ff', badge: '#7c3aed', glow: 'rgba(167, 139, 250, 0.18)' },
  { name: 'Amber Strategy', bgStart: '#191004', bgEnd: '#0d0701', primary: '#fbbf24', secondary: '#fef3c7', badge: '#d97706', glow: 'rgba(251, 191, 36, 0.18)' },
  { name: 'Rose Impact', bgStart: '#1a0712', bgEnd: '#0a0206', primary: '#fb7185', secondary: '#ffe4e6', badge: '#e11d48', glow: 'rgba(251, 113, 133, 0.18)' }
];

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY + lineHeight;
}

async function renderPostCreative(post, category, date, outPath) {
  const w = 1080;
  const h = 1080;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const palette = PALETTES[(post.id - 1) % PALETTES.length];
  const postContent = post.postContent || {};
  const headline = (postContent.imageHeadline || post.headline || 'MARKETING INSIGHT').toUpperCase().replace(/\*/g, '');
  const subtext = postContent.imageSubtext || post.subtext || '';
  const badgeText = (postContent.badgeText || (category === 'marketing' ? 'MARKETING LAW' : 'AI STRATEGY')).toUpperCase();

  // 1. Background Gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, palette.bgStart);
  grad.addColorStop(1, palette.bgEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. Radial Atmospheric Glow
  const radial = ctx.createRadialGradient(w * 0.25, h * 0.25, 40, w * 0.25, h * 0.25, 650);
  radial.addColorStop(0, palette.glow);
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);

  // 3. Subtle Blueprint Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // 4. Accent Border Top Line
  const topGrad = ctx.createLinearGradient(0, 0, w, 0);
  topGrad.addColorStop(0, 'rgba(0,0,0,0)');
  topGrad.addColorStop(0.25, palette.primary);
  topGrad.addColorStop(0.75, palette.primary);
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, 5);

  // 5. Category Badge Pill
  ctx.save();
  ctx.font = FONT_BADGE;
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = Math.max(180, badgeMetrics.width + 48);
  const badgeH = 44;
  const badgeX = 80;
  const badgeY = 90;

  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
  ctx.fillStyle = palette.badge;
  ctx.shadowColor = palette.primary;
  ctx.shadowBlur = 18;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 28);
  ctx.restore();

  // 6. Main Headline (Bold, punchy, modern)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = FONT_TITLE;
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  const headlineEndY = wrapText(ctx, headline, 80, 210, 920, 74);
  ctx.restore();

  // 7. Divider Accent Line
  const divY = Math.max(headlineEndY + 24, 380);
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, divY);
  ctx.lineTo(260, divY);
  ctx.stroke();

  // 8. Subtext Explanation
  if (subtext) {
    ctx.save();
    ctx.fillStyle = palette.secondary;
    ctx.font = FONT_SUBTEXT;
    ctx.textAlign = 'left';
    wrapText(ctx, subtext, 80, divY + 56, 920, 48);
    ctx.restore();
  }

  // 9. Bottom Profile Card with Avatar Photo
  const cardW = 920;
  const cardH = 200;
  const cardX = 80;
  const cardY = h - cardH - 80;

  // Glassmorphic background for profile card
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fillStyle = 'rgba(11, 18, 33, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 15;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Load avatar image
  let avatarImage = null;
  const avatarDailyPath = path.join(DOCS_DIR, `avatar_daily_${post.id}.jpg`);
  const avatarDefaultPath = path.join(DOCS_DIR, 'avatar.jpg');

  try {
    if (fs.existsSync(avatarDailyPath)) {
      avatarImage = await loadImage(avatarDailyPath);
    } else if (fs.existsSync(avatarDefaultPath)) {
      avatarImage = await loadImage(avatarDefaultPath);
    }
  } catch (err) {
    console.warn(`Could not load avatar image for post ${post.id}:`, err.message);
  }

  // Draw Avatar circular / rounded photo
  const avSize = 144;
  const avX = cardX + 28;
  const avY = cardY + (cardH - avSize) / 2;

  if (avatarImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImage, avX, avY, avSize, avSize);
    ctx.restore();

    // Circular glowing border around avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = palette.primary;
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();
  }

  // Author Info Text
  const textLeft = avX + avSize + 32;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = FONT_AUTHOR_NAME;
  ctx.fillText('Sourabh Jagtap', textLeft, cardY + 72);

  ctx.fillStyle = palette.secondary;
  ctx.font = FONT_AUTHOR_TITLE;
  ctx.fillText('Senior Marketing & Brand Leader | 15+ Yrs', textLeft, cardY + 110);

  ctx.fillStyle = palette.primary;
  ctx.font = FONT_AUTHOR_TAG;
  ctx.fillText('Integrated Media • Digital • Brand Strategy', textLeft, cardY + 146);
  ctx.restore();

  // CTA Pill on bottom right of the card
  ctx.save();
  const ctaW = 196;
  const ctaH = 48;
  const ctaX = cardX + cardW - ctaW - 28;
  const ctaY = cardY + (cardH - ctaH) / 2;

  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 12);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = FONT_CTA;
  ctx.textAlign = 'center';
  ctx.fillText('READ FULL POST →', ctaX + ctaW / 2, ctaY + 30);
  ctx.restore();

  // Save to disk as PNG
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buf);
  console.log(`[Creatives] ✅ Saved: ${path.basename(outPath)} (${(buf.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('[Creatives] Starting creative graphic generation...');

  if (!fs.existsSync(HISTORY_FILE)) {
    console.error('history.json not found!');
    process.exit(1);
  }

  const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  if (!history || history.length === 0) {
    console.error('history.json is empty!');
    process.exit(1);
  }

  // Get current IST date
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const todayStr = istDate.toISOString().slice(0, 10);

  let entry = history.find(h => h.date === todayStr);
  if (!entry) {
    console.log(`No entry for ${todayStr}, using latest entry: ${history[0].date}`);
    entry = history[0];
  }

  console.log(`[Creatives] Generating graphics for date: ${entry.date} (${entry.posts.length} posts)...`);

  for (const post of entry.posts) {
    const outPath = path.join(DOCS_DIR, `creative_${post.id}.png`);
    await renderPostCreative(post, entry.category || 'marketing', entry.date, outPath);
  }

  // Also create a default creative.png pointing to post 1
  const defaultPath = path.join(DOCS_DIR, 'creative.png');
  fs.copyFileSync(path.join(DOCS_DIR, 'creative_1.png'), defaultPath);
  console.log(`[Creatives] ✅ Created default creative.png -> creative_1.png`);

  console.log('[Creatives] 🎉 All 5 creative graphics generated successfully!');
}

main().catch(err => {
  console.error('[Creatives] Error:', err);
  process.exit(1);
});
