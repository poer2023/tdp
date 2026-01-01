const { spawnSync } = require('node:child_process');

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!hasDatabaseUrl) {
  console.log('info: DATABASE_URL not set; skipping prisma migrate deploy and data migration.');
}

if (hasDatabaseUrl) {
  run(pnpmCmd, ['exec', 'prisma', 'migrate', 'deploy']);
}

run(pnpmCmd, ['exec', 'prisma', 'generate']);

if (hasDatabaseUrl) {
  run(pnpmCmd, ['exec', 'tsx', 'scripts/production-data-migration.ts']);
}

run(pnpmCmd, ['exec', 'next', 'build']);
