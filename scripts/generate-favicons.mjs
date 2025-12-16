import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const repoRoot = process.cwd();
const sourceSvg = path.join(repoRoot, 'public', 'splash', 'labelcom-medallion-icon.svg');
const outDir = path.join(repoRoot, 'public', 'icons');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
];

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;

  pngBuffers.forEach((buf, i) => {
    const size = [16, 32, 48][i] ?? 0;
    const w = size === 256 ? 0 : size;
    const h = size === 256 ? 0 : size;
    const entryOffset = i * 16;

    entries.writeUInt8(w, entryOffset + 0);
    entries.writeUInt8(h, entryOffset + 1);
    entries.writeUInt8(0, entryOffset + 2); // color count
    entries.writeUInt8(0, entryOffset + 3); // reserved
    entries.writeUInt16LE(1, entryOffset + 4); // planes
    entries.writeUInt16LE(32, entryOffset + 6); // bit count
    entries.writeUInt32LE(buf.length, entryOffset + 8); // bytes
    entries.writeUInt32LE(offset, entryOffset + 12); // offset

    offset += buf.length;
  });

  return Buffer.concat([header, entries, ...pngBuffers]);
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const svgBuffer = await fs.readFile(sourceSvg);
  const rendered = sharp(svgBuffer, { density: 192 });

  const pngBySize = new Map();

  await Promise.all(
    sizes.map(async ({ name, size }) => {
      const outPath = path.join(outDir, name);
      const buf = await rendered
        .clone()
        .resize(size, size, { fit: 'cover' })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
      pngBySize.set(size, buf);
      await fs.writeFile(outPath, buf);
    }),
  );

  const icoPngs = [16, 32, 48].map(async (s) => {
    if (pngBySize.has(s)) return pngBySize.get(s);
    return rendered
      .clone()
      .resize(s, s, { fit: 'cover' })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
  });

  const icoBuffers = await Promise.all(icoPngs);
  const ico = buildIco(icoBuffers);
  await fs.writeFile(path.join(repoRoot, 'public', 'favicon.ico'), ico);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
