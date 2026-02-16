import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const pngPath = path.join(publicDir, 'pwa-192x192.png');
const svgPath = path.join(publicDir, 'pwa-icon.svg');

try {
  const pngBuffer = fs.readFileSync(pngPath);
  const base64 = pngBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64}`;

  // Original size ~82x65. Scale 4x -> 328x260
  // Center in 512x512: x=(512-328)/2=92, y=(512-260)/2=126
  
  const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="100" fill="#059669"/>
    <image href="${dataUri}" x="92" y="126" width="328" height="260" />
  </svg>`;

  fs.writeFileSync(svgPath, svgContent);
  console.log('SVG Icon generated successfully at', svgPath);
} catch (error) {
  console.error('Error generating SVG:', error);
}
