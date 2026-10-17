const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Abhinav\\.gemini\\antigravity-ide\\scratch\\bankready';
const destDir = 'C:\\Users\\Abhinav\\.gemini\\antigravity-ide\\scratch\\bankready_github_upload';

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(srcDir, destDir);
console.log('Clean upload folder created at:', destDir);
