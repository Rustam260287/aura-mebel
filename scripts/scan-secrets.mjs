import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

const RULES = [
  { name: 'Private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'Firebase service account email', pattern: /firebase-adminsdk-[\w-]+@[\w.-]+\.iam\.gserviceaccount\.com/i },
  { name: 'OpenAI secret key', pattern: /\bsk-(proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Replicate token', pattern: /\br8_[A-Za-z0-9]{20,}\b/ },
];

const findings = [];

const trackedFiles = execSync('git ls-files -z', { encoding: 'utf8' })
  .split('\0')
  .map((file) => file.trim())
  .filter(Boolean);

for (const relPath of trackedFiles) {
  if (relPath.includes('node_modules/')) continue;
  if (relPath.includes('node_modules\\')) continue;
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) continue;
  const stat = fs.statSync(fullPath);
  if (stat.size > 1024 * 1024) continue;
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const rule of RULES) {
    lines.forEach((line, index) => {
      if (rule.pattern.test(line)) {
        findings.push(`${relPath}:${index + 1} ${rule.name}`);
      }
    });
  }
}

if (findings.length > 0) {
  console.error('[scan-secrets] Potential secret leaks found:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log('[scan-secrets] OK');
