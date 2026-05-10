import { spawnSync } from 'node:child_process';

const isCi = process.env.CI === 'true' || process.env.VERCEL === '1';

if (isCi) {
  process.exit(0);
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['husky', 'install'], { stdio: 'inherit' });

if (result.error) {
  console.warn(`Skipping Husky install: ${result.error.message}`);
  process.exit(0);
}

if (result.status !== 0) {
  console.warn('Skipping Husky install: command exited without installing hooks.');
}

process.exit(0);
