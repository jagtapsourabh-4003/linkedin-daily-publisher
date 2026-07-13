import fs from 'fs';
import path from 'path';

async function uploadToCloud(filePath) {
  const buffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const blob = new Blob([buffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, fileName);

  const response = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const result = await response.json();
    if (result && result.status === 'success' && result.data && result.data.url) {
      return result.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
    }
  }
  throw new Error(`Failed to upload ${fileName}`);
}

async function run() {
  console.log('Uploading all avatars and portraits to cloud hosting...');
  const map = {};

  // 1. Upload basic avatars
  for (let i = 1; i <= 18; i++) {
    const localPath = `public/avatars/avatar-${i}.png`;
    if (fs.existsSync(localPath)) {
      try {
        const url = await uploadToCloud(localPath);
        map[`avatars/avatar-${i}.png`] = url;
        console.log(`Uploaded avatar-${i}.png -> ${url}`);
      } catch (err) {
        console.error(`Error uploading avatar-${i}:`, err.message);
      }
    }
  }

  // 2. Upload main avatar and daily backups
  const mainFiles = ['public/avatar.jpg', 'public/avatar_daily.jpg'];
  for (let i = 1; i <= 18; i++) {
    mainFiles.push(`public/avatar_daily_${i}.jpg`);
  }

  for (const file of mainFiles) {
    if (fs.existsSync(file)) {
      try {
        const url = await uploadToCloud(file);
        // Map as relative to public folder, e.g. "avatar.jpg"
        const key = path.relative('public', file).split(path.sep).join('/');
        map[key] = url;
        console.log(`Uploaded ${file} -> ${url}`);
      } catch (err) {
        console.error(`Error uploading ${file}:`, err.message);
      }
    }
  }

  // Save the mapping file
  const mapPath = 'data/avatar-map.json';
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
  console.log(`SUCCESS: All avatars hosted. Map saved to ${mapPath}`);
}

run();
