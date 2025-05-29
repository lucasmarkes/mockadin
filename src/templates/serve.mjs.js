export function getServerTemplate() {
  return `
// server/index.mjs
import chokidar from 'chokidar';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

const app = express();
app.use(express.json());

const methodColor = (method) => {
  switch (method.toLowerCase()) {
    case 'get': return chalk.green;
    case 'post': return chalk.hex('#FFA500');
    case 'put': return chalk.hex('#9b59b6');
    case 'delete': return chalk.red;
    default: return chalk.white;
  }
};

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
        console.log(methodColor(method)(\`[\${method.toUpperCase()}] \${route}\`));
      }
      if (entry.name.endsWith('.js')) {
        const handlerModule = await import(\`file://\${fullPath}\`);
        const handler = handlerModule.default;
        if (typeof handler !== 'function') {
          console.log(chalk.red(\`❌ \${entry.name} does not export a default function.\`));
          continue;
        }
        app[method](route, handler);
        console.log(methodColor(method)(\`[\${method.toUpperCase()}] \${route} (dynamic)\`));
      }
    }
  }
};

let watcher = null;

const startWatching = (watchPath) => {
  if (watcher) {
    watcher.close();
    watcher = null;
  }

  watcher = chokidar.watch(watchPath, {
    persistent: true,
    ignoreInitial: true,
  });

  let reloadTimeout;
  const reload = async () => {
    if (reloadTimeout) clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(async () => {
      console.clear();
      console.log(chalk.cyan('🔄 Reloading mocks...'));
      clearRoutes(app);
      await loadMocks(watchPath);
      console.log(chalk.cyan('✅ Mocks updated!'));
    }, 100);
  };

  watcher
    .on('add', reload)
    .on('change', reload)
    .on('unlink', reload)
    .on('addDir', reload)
    .on('unlinkDir', reload);
};

const port = process.env.PORT || 4000;
const mocksDir = path.resolve(process.cwd(), 'mocks');

loadMocks(mocksDir).then(() => {
  startWatching(mocksDir);
  app.listen(port, () => {
    console.log(chalk.yellow(\`🚀 Mock API running at http://localhost:\${port}\`));
  });
});
`;
}