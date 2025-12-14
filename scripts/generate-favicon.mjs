
import fs from 'fs';
import path from 'path';

const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="512" height="512" rx="100" ry="100" fill="#5D4037"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-weight="bold" font-size="350" fill="white" dy=".1em">L</text>
</svg>
`.trim();

const publicDir = path.join(process.cwd(), 'public');
const filePath = path.join(publicDir, 'icon.svg');

fs.writeFileSync(filePath, svgContent);

console.log(`Favicon generated at ${filePath}`);
