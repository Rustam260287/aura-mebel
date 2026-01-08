
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const INPUT_SVG = path.join(PUBLIC_DIR, 'icon.svg');

// Colors
const ICON_BG_COLOR = '#1C1C1C';

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function generateIcons() {
    console.log(`Generating icons from ${INPUT_SVG}...`);

    if (!fs.existsSync(INPUT_SVG)) {
        console.error(`Error: Source file ${INPUT_SVG} not found!`);
        process.exit(1);
    }

    const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

    // 1. Generate Standard Icons (Transparent Corners if any, though our SVG has rect)
    // Since SVG has a <rect> background, it will be square/rounded rect as defined in SVG.
    // We render it as is.
    for (const size of sizes) {
        const filename = `icon-${size}x${size}.png`;
        // For 16x16 and 32x32, we also want to overwrite favicon-NxN.png
        if (size === 16) {
            await sharp(INPUT_SVG).resize(16, 16).png().toFile(path.join(ICONS_DIR, 'favicon-16x16.png'));
        }
        if (size === 32) {
            await sharp(INPUT_SVG).resize(32, 32).png().toFile(path.join(ICONS_DIR, 'favicon-32x32.png'));
            // Try to create favicon.ico (as PNG content renamed, widely supported)
            // Or better: use toFormat('png') and write to public/favicon.ico
            await sharp(INPUT_SVG).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, 'favicon.ico'));
        }

        await sharp(INPUT_SVG)
            .resize(size, size)
            .png()
            .toFile(path.join(ICONS_DIR, filename));

        console.log(`Generated ${filename}`);
    }

    // 2. Generate Apple Touch Icon (Special)
    // iOS adds its own rounding. We usually provide a square opaque icon.
    // Our SVG has a rounded rect. If we render it, it has transparent corners.
    // iOS will turn transparent pixels to black.
    // Since our BG is #1C1C1C (almost black), this merge is acceptable.
    // HOWEVER, to be perfect: we should flatten comp onto #1C1C1C to ensure it's square.
    // Or, we render the SVG, then compost it over a filled square.

    console.log('Generating apple-touch-icon.png...');

    await sharp(INPUT_SVG)
        .resize(180, 180)
        .flatten({ background: ICON_BG_COLOR }) // Fills transparent corners with the brand color
        .png()
        .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));

    console.log('Done!');
}

generateIcons().catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
});
