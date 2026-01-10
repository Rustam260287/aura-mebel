
import fs from 'node:fs';
import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production' || process.env.FIREBASE_CONFIG;

async function copyDracoWasm() {
    const root = process.cwd();
    const sourcePath = path.join(root, 'node_modules', 'draco3d', 'draco_encoder.wasm');
    const destDir = path.join(root, '.next', 'standalone', 'node_modules', 'draco3d');
    const destPath = path.join(destDir, 'draco_encoder.wasm');

    console.log(`[copy-draco-wasm] Source: ${sourcePath}`);

    if (!fs.existsSync(sourcePath)) {
        console.error(`[copy-draco-wasm] ERROR: Source file not found at ${sourcePath}`);
        process.exit(1);
    }

    // Ensure destination exists
    if (!fs.existsSync(destDir)) {
        console.log(`[copy-draco-wasm] Creating directory: ${destDir}`);
        fs.mkdirSync(destDir, { recursive: true });
    }

    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`[copy-draco-wasm] SUCCESS: Copied to ${destPath}`);
    } catch (err) {
        console.error(`[copy-draco-wasm] FAILED: ${err.message}`);
        process.exit(1);
    }
}

copyDracoWasm();
