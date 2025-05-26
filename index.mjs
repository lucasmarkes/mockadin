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
    const routePath = path.join(baseRoute, entry.name.replace(/\.(json|js)$/, ''));
    const route = `/${routePath.replace(/\\/g, '/')}`;
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
          console.log(chalk.green(`[${method.toUpperCase()}] ${route}`));
        } else {
          app.get(route, handler);
          console.log(chalk.blue(`[GET] ${route}`));
        }
      }

      if (entry.name.endsWith('.js')) {
        const handlerModule = await import(`file://${fullPath}`);
        const handler = handlerModule.default;

        if (typeof handler !== 'function') {
          console.log(chalk.red(`❌ ${entry.name} does not export a default function.`));
          continue;
        }

        if (validMethods.includes(method)) {
          app[method](route, handler);
          console.log(chalk.magenta(`[${method.toUpperCase()}] ${route} (dynamic)`));
        } else {
          app.get(route, handler);
          console.log(chalk.cyan(`[GET] ${route} (dynamic)`));
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
    console.log(chalk.yellow(`🚀 Mock API running at http://localhost:${port}`));
  });
});
