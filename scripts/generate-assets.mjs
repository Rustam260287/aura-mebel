
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- КОНФИГУРАЦИЯ ---
const OPTIONS = {
  types: ['sofa'], 
  sizes: ['compact', 'standard', 'grand'],
  styles: ['soft', 'modern', 'classic'],
  // materials: ['fabric'] // Пока упростим, цвет зависит от стиля в текущей логике
};

const MASTER_MODELS_DIR = path.join(__dirname, '../assets/masters'); // Папка с .blend файлами
const OUTPUT_DIR = path.join(__dirname, '../public/models');         
const PYTHON_SCRIPT = path.join(__dirname, 'blender_script.py');

// Путь к Blender. В CI/CD это может быть просто 'blender'.
// На Mac это часто: '/Applications/Blender.app/Contents/MacOS/Blender'
const BLENDER_PATH = process.env.BLENDER_PATH || 'blender'; 

// --- ЛОГИКА ---

function generateCombinations() {
  const combos = [];
  OPTIONS.types.forEach(type => {
    OPTIONS.sizes.forEach(size => {
      OPTIONS.styles.forEach(style => {
          combos.push({ type, size, style });
      });
    });
  });
  return combos;
}

async function processConfig(config) {
  const filenameBase = `${config.type}_${config.style}_${config.size}`; // sofa_modern_compact.glb
  const glbPath = path.join(OUTPUT_DIR, `${filenameBase}.glb`);
  const usdzPath = path.join(OUTPUT_DIR, `${filenameBase}.usdz`);
  
  // Мастер-файл должен существовать: assets/masters/sofa_master.blend
  const masterFile = path.join(MASTER_MODELS_DIR, `${config.type}_master.blend`);
  
  if (!fs.existsSync(masterFile)) {
      console.warn(`⚠️ Master file not found: ${masterFile}. Skipping.`);
      return;
  }

  // Временный конфиг для Python
  const tempConfigPath = path.join(OUTPUT_DIR, `temp_${filenameBase}.json`);
  fs.writeFileSync(tempConfigPath, JSON.stringify(config));

  console.log(`🔨 Processing: ${filenameBase}...`);

  try {
    // 1. Blender -> GLB
    const blenderCmd = `"${BLENDER_PATH}" -b "${masterFile}" -P "${PYTHON_SCRIPT}" -- "${tempConfigPath}" "${glbPath}"`;
    // console.log(`Running: ${blenderCmd}`); 
    await execAsync(blenderCmd);
    console.log(`  ✅ GLB created`);

    // 2. GLB -> USDZ (Docker way)
    // Требует установленного Docker и образа leon/usd-from-gltf
    // Если Docker нет, этот шаг упадет, поэтому обернем в try/catch или проверку
    try {
        // const usdzCmd = `docker run --rm -v "${OUTPUT_DIR}:/usr/app" leon/usd-from-gltf:latest "/usr/app/${filenameBase}.glb" "/usr/app/${filenameBase}.usdz"`;
        // await execAsync(usdzCmd);
        // console.log(`  ✅ USDZ created`);
        console.log(`  ⚠️ USDZ conversion skipped (Docker required). Enable in scripts/generate-assets.mjs`);
    } catch (e) {
        console.warn(`  ❌ USDZ conversion failed: ${e.message}`);
    }

  } catch (error) {
    console.error(`❌ Error generating ${filenameBase}:`);
    console.error(error.stdout || error.message);
  } finally {
    if (fs.existsSync(tempConfigPath)) fs.unlinkSync(tempConfigPath);
  }
}

// --- ЗАПУСК ---
(async () => {
  console.log("🚀 Starting 3D Asset Pre-generation...");
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(MASTER_MODELS_DIR)) {
      console.error(`❌ Assets directory not found: ${MASTER_MODELS_DIR}`);
      console.log("   Please create 'assets/masters' and put 'sofa_master.blend' there.");
      process.exit(1);
  }

  const combinations = generateCombinations();
  console.log(`📦 Queue size: ${combinations.length} variants`);

  // Последовательная обработка
  for (const config of combinations) {
    await processConfig(config);
  }

  console.log('🎉 Generation complete.');
})();
