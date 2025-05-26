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
  .name('mock-api-cli')
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

    const mockFiles = {
      'users.get.json': JSON.stringify([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ], null, 2),

      'products.get.json': JSON.stringify([
        { id: 1, name: 'Laptop' },
        { id: 2, name: 'Phone' }
      ], null, 2),

      'orders.post.js': `export default (req, res) => {
  const { product, quantity } = req.body;
  res.json({
    message: \`Order received: \${quantity}x \${product}\`,
    timestamp: new Date().toISOString(),
  });
};`
    };

    for (const [filename, content] of Object.entries(mockFiles)) {
      const filePath = path.join(mockDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(chalk.green(`✔ Created: mocks/${filename}`));
      } else {
        console.log(chalk.yellow(`⚠ Already exists: mocks/${filename}`));
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

      const loadMocks = async (dir, baseRoute = '') => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const routePath = path.join(baseRoute, entry.name.replace(/\\.(json|js)$/, ''));
          const route = \`/\${routePath.replace(/\\\\/g, '/')}\`;
          const parts = entry.name.split('.');
          const method = parts.length > 1 ? parts[parts.length - 2].toLowerCase() : 'get';
          const validMethods = ['get', 'post', 'put', 'delete'];

          if (entry.isDirectory()) {
            await loadMocks(fullPath, routePath);
          } else if (entry.isFile()) {
            if (entry.name.endsWith('.json')) {
              const content = JSON.parse(await fs.promises.readFile(fullPath, 'utf-8'));
              const handler = (req, res) => res.json(content);

              if (validMethods.includes(method)) {
                app[method](route, handler);
                console.log(chalk.green(\`[\${method.toUpperCase()}] \${route}\`));
              } else {
                app.get(route, handler);
                console.log(chalk.blue(\`[GET] \${route}\`));
              }
            }

            if (entry.name.endsWith('.js')) {
              const handlerModule = await import(\`file://\${fullPath}\`);
              const handler = handlerModule.default;

              if (typeof handler !== 'function') {
                console.log(chalk.red(\`❌ \${entry.name} does not export a default function.\`));
                continue;
              }

              if (validMethods.includes(method)) {
                app[method](route, handler);
                console.log(chalk.magenta(\`[\${method.toUpperCase()}] \${route} (dynamic)\`));
              } else {
                app.get(route, handler);
                console.log(chalk.cyan(\`[GET] \${route} (dynamic)\`));
              }
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
          chokidar: '^3.5.3'
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
    console.log(chalk.cyan('  mock-api-cli serve'));
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
