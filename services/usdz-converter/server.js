const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs/promises');
const { createReadStream, createWriteStream, existsSync } = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const https = require('https');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const BLENDER_PATH = process.env.BLENDER_PATH || 'blender';

// --- UTILS ---

const downloadFile = (url, destPath) => {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(destPath);
        const protocol = url.startsWith('https') ? https : http;

        const request = protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                file.close();
                return reject(new Error(`HTTP ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => file.close(() => resolve()));
        });

        request.on('error', (err) => {
            file.close();
            reject(err);
        });
    });
};

const runCommand = (cmd, args, cwd) => {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { cwd, stdio: 'inherit' });
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command ${cmd} exited with code ${code}`));
        });
        proc.on('error', (err) => reject(err));
    });
};

// --- ROUTES ---

app.get('/health', (req, res) => res.send('OK'));

app.post('/convert', async (req, res) => {
    const requestId = uuidv4();
    const workDir = path.join(os.tmpdir(), requestId);

    // Cleanup helper
    const cleanup = async () => {
        try { await fs.rm(workDir, { recursive: true, force: true }); } catch { }
    };

    try {
        const { glbUrl } = req.body;
        if (!glbUrl) throw new Error('Missing glbUrl');

        console.log(`[${requestId}] Processing: ${glbUrl}`);
        await fs.mkdir(workDir);

        const inputGlb = path.join(workDir, 'input.glb');
        const outputUsdc = path.join(workDir, 'output.usdc');
        const finalUsdz = path.join(workDir, 'model.usdz');

        // 1. Download
        await downloadFile(glbUrl, inputGlb);

        // 2. Convert (Blender -> USDC)
        // Note: We use -b (background) -P (python script)
        await runCommand(BLENDER_PATH, [
            '-b',
            '-P', '/app/convert.py',
            '--',
            inputGlb,
            outputUsdc
        ], workDir);

        // 3. Verify Output
        try {
            await fs.access(outputUsdc);
        } catch {
            throw new Error('Blender did not produce output.usdc');
        }

        // 4. Pack USDZ (zip -0 store)
        // We include output.usdc and the 'textures' folder if it was created
        const zipArgs = ['-0', '-q', '-r', 'model.usdz', 'output.usdc'];
        if (existsSync(path.join(workDir, 'textures'))) {
            zipArgs.push('textures');
        }

        await runCommand('zip', zipArgs, workDir);

        // 5. Stream Response
        const stats = await fs.stat(finalUsdz);
        if (stats.size === 0) throw new Error('Zero byte USDZ');

        console.log(`[${requestId}] Success: ${stats.size} bytes`);
        res.setHeader('Content-Type', 'model/vnd.usdz+zip');
        res.setHeader('Content-Length', stats.size);

        const stream = createReadStream(finalUsdz);
        stream.pipe(res);
        stream.on('close', cleanup);

    } catch (err) {
        console.error(`[${requestId}] Error: ${err.message}`);
        await cleanup();
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: err.message });
        }
    }
});

app.listen(PORT, () => console.log(`🚀 USDZ Converter ready on port ${PORT}`));
