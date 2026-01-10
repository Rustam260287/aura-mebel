
import fs from 'node:fs';
import path from 'node:path';

async function copyDracoWasm() {
    const root = process.cwd();
    const sourceDir = path.join(root, 'node_modules', 'draco3d');
    const destDir = path.join(root, '.next', 'standalone', 'node_modules', 'draco3d');

    const filesToCopy = ['draco_encoder.wasm', 'draco_decoder.wasm'];

    console.log(`[copy-draco-wasm] Starting copy...`);

    // Ensure destination exists
    if (!fs.existsSync(destDir)) {
        console.log(`[copy-draco-wasm] Creating directory: ${destDir}`);
        fs.mkdirSync(destDir, { recursive: true });
    }

    for (const file of filesToCopy) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);

        if (fs.existsSync(sourcePath)) {
            try {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`[copy-draco-wasm] SUCCESS: Copied ${file} to standalone`);
            } catch (err) {
                console.error(`[copy-draco-wasm] FAILED: Could not copy ${file}: ${err.message}`);
                process.exit(1);
            }
        } else {
            console.warn(`[copy-draco-wasm] WARNING: Source file not found: ${sourcePath}`);
        }
    }
}

copyDracoWasm();
