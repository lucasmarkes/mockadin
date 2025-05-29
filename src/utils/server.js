import { spawn } from 'child_process';
import path from 'path';
import chalk from 'chalk';

export function startServer() {
  const serverPath = path.join(process.cwd(), 'server', 'index.mjs');
  if (!serverPath || !serverPath.endsWith('index.mjs')) {
    console.log(chalk.red('❌ Could not find server/index.mjs. Are you in a mockadin project folder?'));
    process.exit(1);
  }
  console.log(chalk.cyan('🚀 Starting Mockadin server...\n'));
  const child = spawn('node', [serverPath], { stdio: 'inherit' });
  child.on('exit', code => process.exit(code));
}