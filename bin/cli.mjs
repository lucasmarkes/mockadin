#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const program = new Command();
const projectRoot = process.cwd();
const mockDir = path.join(projectRoot, 'mocks');
const serverFile = path.join(projectRoot, 'server/index.mjs');
const packageJsonPath = path.join(projectRoot, 'package.json');

program
  .name('mockadin')
  .description('CLI to initialize and serve mock APIs')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a mock API project')
  .action(() => {
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir);
      console.log(chalk.green('✔ Created folder: mocks/'));
    } else {
      console.log(chalk.yellow('⚠ Folder already exists: mocks/'));
    }

    const mockFiles = [
    {
      dir: path.join(mockDir, 'get'),
      filename: 'users.json',
      content: JSON.stringify([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ], null, 2)
    },
    {
      dir: path.join(mockDir, 'get'),
      filename: 'products.json',
      content: JSON.stringify([
        { id: 1, name: 'Laptop' },
        { id: 2, name: 'Phone' }
      ], null, 2)
    },
    {
      dir: path.join(mockDir, 'post'),
      filename: 'orders.js',
      content: `export default (req, res) => {
const { product, quantity } = req.body;
  res.json({
    message: \`Order received: \${quantity}x \${product}\`,
    timestamp: new Date().toISOString(),
  });
};`
    }
];

    for (const { dir, filename, content } of mockFiles) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(chalk.green(`✔ Created folder: ${path.relative(projectRoot, dir)}`));
      }
      const filePath = path.join(dir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(chalk.green(`✔ Created: ${path.relative(projectRoot, filePath)}`));
      } else {
        console.log(chalk.yellow(`⚠ Already exists: ${path.relative(projectRoot, filePath)}`));
      }
    }

    if (!fs.existsSync(serverFile)) {
      const serverContent = `
// server/index.mjs
import chokidar from 'chokidar';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

const app = express();
app.use(express.json());

const clearRoutes = (app) => {
  if (!app._router) return;
  app._router.stack = app._router.stack.filter(
    (layer) => !layer.route
  );
};

const validMethods = ['get', 'post', 'put', 'delete'];

const isValidName = (name) => /^[\\w\\-\\.]+$/.test(name);

const loadMocks = async (dir, method = null, baseRoute = '') => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (
      !isValidName(entry.name) ||
      entry.name.startsWith('.') ||
      entry.name.includes('..') ||
      entry.name.includes('/') ||
      entry.name.includes('\\\\') 
    ) {
      console.log(chalk.red(\`❌ Ignoring invalid file or folder name: \${entry.name}\`));
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (validMethods.includes(entry.name.toLowerCase())) {
        await loadMocks(fullPath, entry.name.toLowerCase(), '');
      } else {
        await loadMocks(fullPath, method, path.join(baseRoute, entry.name));
      }
    } else if (entry.isFile() && method) {
      const route = '/' + path.join(baseRoute, entry.name.replace(/\\.(json|js)$/, '')).replace(/\\\\/g, '/');
      if (entry.name.endsWith('.json')) {
        const content = JSON.parse(await fs.promises.readFile(fullPath, 'utf-8'));
        const handler = (req, res) => res.json(content);
        app[method](route, handler);
        console.log(chalk.green(\`[\${method.toUpperCase()}] \${route}\`));
      }
      if (entry.name.endsWith('.js')) {
        const handlerModule = await import(\`file://\${fullPath}\`);
        const handler = handlerModule.default;
        if (typeof handler !== 'function') {
          console.log(chalk.red(\`❌ \${entry.name} does not export a default function.\`));
          continue;
        }
        app[method](route, handler);
        console.log(chalk.magenta(\`[\${method.toUpperCase()}] \${route} (dynamic)\`));
      }
    }
  }
};

const startWatching = (watchPath) => {
  const watcher = chokidar.watch(watchPath, {
    persistent: true,
    ignoreInitial: true,
  });

  const reload = async () => {
    console.clear();
    console.log(chalk.cyan('🔄 Reloading mocks...'));
    clearRoutes(app);
    await loadMocks(watchPath);
    console.log(chalk.cyan('✅ Mocks updated!'));
  };

  watcher
    .on('add', reload)
    .on('change', reload)
    .on('unlink', reload)
    .on('addDir', reload)
    .on('unlinkDir', reload);
};

const port = process.env.PORT || 3000;
const mocksDir = path.resolve(process.cwd(), 'mocks');

loadMocks(mocksDir).then(() => {
  startWatching(mocksDir);
  app.listen(port, () => {
    console.log(chalk.yellow(\`🚀 Mock API running at http://localhost:\${port}\`));
  });
});
`;
      fs.mkdirSync(path.dirname(serverFile), { recursive: true });
      fs.writeFileSync(serverFile, serverContent);
      console.log(chalk.green('✔ Created: server/index.mjs'));
    } else {
      console.log(chalk.yellow('⚠ server/index.mjs already exists'));
    }

    if (!fs.existsSync(packageJsonPath)) {
      const packageJson = {
        name: 'mock-api-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          start: 'node server/index.mjs'
        },
        dependencies: {
          express: '^4.18.2',
          chokidar: '^3.5.3',
          chalk: '^4.1.2'
        }
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(chalk.green('✔ Created: package.json'));
    } else {
      console.log(chalk.yellow('⚠ package.json already exists'));
    }

    console.log(chalk.cyan('\n📦 Installing dependencies...'));
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log(chalk.green('\n✅ Dependencies installed!'));
    } catch (err) {
      console.error(chalk.red('\n❌ Failed to install dependencies.'));
    }

    console.log(chalk.blue('\n✅ Project initialized successfully!'));
    console.log(chalk.cyan('\nNext step:'));
    console.log(chalk.cyan('  mockadin serve'));
  });

program
  .command('serve')
  .description('Start the mock API server')
  .action(() => {
    const childProcess = import('child_process');
    childProcess.then(({ spawn }) => {
      const child = spawn('node', ['server/index.mjs'], {
        stdio: 'inherit',
      });

      child.on('close', (code) => {
        process.exit(code);
      });
    });
  });

program.parse(process.argv);
