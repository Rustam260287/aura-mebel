import { execSync } from 'child_process';

const commands = [
  'npm run typecheck',
  'npm test -- --runInBand',
  'npm run build',
  'node scripts/scan-secrets.mjs',
];

for (const command of commands) {
  console.log(`[verify-release] ${command}`);
  execSync(command, { stdio: 'inherit' });
}

console.log('[verify-release] OK');
