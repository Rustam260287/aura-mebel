const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs/promises');
const { createReadStream, createWriteStream, existsSync } = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const https = require('https');
const gltfPipeline = require('gltf-pipeline');

const app = express();
app.use(express.json({ limit: '100mb' }));

const PORT = process.env.PORT || 8080;
const BLENDER_PATH = process.env.BLENDER_PATH || 'blender';

// --- UTILS ---
const downloadFile = (url, destPath) => {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(destPath);
        const protocol = url.startsWith('https') ? https : http;
        const request = protocol.get(url, (response) => {
            if (response.statusCode !== 200) return reject(new Error(`HTTP ${response.statusCode}`));
            response.pipe(file);
            file.on('finish', () => file.close(() => resolve()));
        });
        request.on('error', (err) => { file.close(); reject(err); });
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

// ENDPOINT 1: Optimize GLB (Draco + Textures)
app.post('/optimize', async (req, res) => {
    const requestId = uuidv4();
    const workDir = path.join(os.tmpdir(), requestId);
    try {
        const { glbUrl, maxTextureSize = 1024 } = req.body;
        if (!glbUrl) throw new Error('Missing glbUrl');

        await fs.mkdir(workDir);
        const inputGlb = path.join(workDir, 'input.glb');
        const outputGlb = path.join(workDir, 'optimized.glb');

        await downloadFile(glbUrl, inputGlb);
        const buffer = await fs.readFile(inputGlb);

        console.log(`[${requestId}] Optimizing GLB...`);
        const options = {
            dracoOptions: { compressionLevel: 7 },
            resourceDirectory: workDir
        };

        const result = await gltfPipeline.processGlb(buffer, options);
        await fs.writeFile(outputGlb, result.glb);

        res.setHeader('Content-Type', 'model/gltf-binary');
        createReadStream(outputGlb).pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ENDPOINT 2: Convert to USDZ
app.post('/convert', async (req, res) => {
    const requestId = uuidv4();
    const workDir = path.join(os.tmpdir(), requestId);
    try {
        const { glbUrl } = req.body;
        await fs.mkdir(workDir);
        const inputGlb = path.join(workDir, 'input.glb');
        const outputUsdc = path.join(workDir, 'output.usdc');
        const finalUsdz = path.join(workDir, 'model.usdz');

        await downloadFile(glbUrl, inputGlb);
        await runCommand(BLENDER_PATH, ['-b', '-P', '/app/convert.py', '--', inputGlb, outputUsdc], workDir);

        const zipArgs = ['-0', '-q', '-r', 'model.usdz', 'output.usdc'];
        if (existsSync(path.join(workDir, 'textures'))) zipArgs.push('textures');
        await runCommand('zip', zipArgs, workDir);

        res.setHeader('Content-Type', 'model/vnd.usdz+zip');
        createReadStream(finalUsdz).pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 3D Processor ready on port ${PORT}`));
