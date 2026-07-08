import fs from 'fs';
import path from 'path';

const HF_TOKEN = process.argv[2];
if (!HF_TOKEN) {
  console.error('Error: Hugging Face token not provided.');
  process.exit(1);
}

const REPO_ID = 'SourabhJagtap/Linkedin';
const IGNORE_PATTERNS = [
  '.git',
  'node_modules',
  '.env',
  '.agents',
  'upload.py',
  'upload.js',
  'create-zip.ps1',
  'project.zip',
  'host-avatars.js',
  'test-catbox.js',
  'test-webhook.js',
  'test-upload.js',
  'db.json',
  'data/db.json'
];

function shouldIgnore(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.zip', '.exe'].includes(ext)) {
    return true;
  }
  return IGNORE_PATTERNS.some(pattern => {
    return filePath.split(path.sep).some(part => part === pattern);
  });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (shouldIgnore(fullPath)) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function run() {
  console.log(`Scanning directory for files to upload to Hugging Face Space: ${REPO_ID}...`);
  const allFiles = getAllFiles('.');
  console.log(`Found ${allFiles.length} files to commit.`);

  const filesPayload = allFiles.map(filePath => {
    const contentBuffer = fs.readFileSync(filePath);
    const base64Content = contentBuffer.toString('base64');
    
    // Normalize path to use forward slashes and ensure no leading ./
    const relativePath = path.relative('.', filePath);
    const pathInRepo = relativePath.split(path.sep).join('/');
    
    return {
      path: pathInRepo,
      content: base64Content,
      encoding: 'base64'
    };
  });

  console.log('Sending commit payload to Hugging Face API...');
  const url = `https://huggingface.co/api/spaces/${REPO_ID}/commit/main`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: 'Sync files via Node.js API',
        repo_type: 'space',
        files: filesPayload
      })
    });


    console.log(`Response Status: ${response.status}`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('\n==================================================');
      console.log('   SUCCESS: All files uploaded to Hugging Face!   ');
      console.log('==================================================');
    } else {
      console.error('Failed to commit changes:', JSON.stringify(result, null, 2));
    }
  } catch (err) {
    console.error('Error sending request:', err);
  }
}

run();
