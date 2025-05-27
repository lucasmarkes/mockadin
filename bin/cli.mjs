#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import inquirer from 'inquirer';
import { faker } from '@faker-js/faker';

const program = new Command();

program
  .name('mockadin')
  .description('CLI to initialize and serve mock APIs')
  .version('1.0.0');

program
  .command('init [projectName]')
  .description('Initialize a mockadin project')
  .action(async (projectName) => {
    console.log(
      chalk.bold.cyan('\nWelcome to mockadin!') +
      chalk.gray('\nLet\'s create your new mock API project.\n')
    );
    if (!projectName) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      projectName = await new Promise((resolve) => {
        rl.question('Project folder name: ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
      if (!projectName) {
        console.log(chalk.red('❌ Project name can\'t be empty.'));
        process.exit(1);
      }
    }

    const projectRoot = path.join(process.cwd(), projectName);
    const mockDir = path.join(projectRoot, 'mocks');
    const serverFile = path.join(projectRoot, 'server/index.mjs');
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (fs.existsSync(projectRoot)) {
      console.log(chalk.red(`❌ The folder "${projectName}" already exists.`));
      process.exit(1);
    }

    fs.mkdirSync(projectRoot, { recursive: true });
    console.log(chalk.green(`✔ Project folder created: ${projectName}/`));

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

const port = process.env.PORT || 4000;
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
        name: 'mockadin-project',
        description: 'A mock API project created with mockadin',
        version: '1.0.7',
        type: 'module',
        scripts: {
          start: 'node server/index.mjs'
        },
        dependencies: {
          express: '^4.18.2',
          chokidar: '^3.5.3',
          chalk: '^4.1.2',
          '@faker-js/faker': '^9.8.0',
          inquirer: '^12.6.3'
        }
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(chalk.green('✔ Created: package.json'));
    } else {
      console.log(chalk.yellow('⚠ package.json already exists'));
    }

    console.log(chalk.cyan('\n📦 Installing dependencies...'));
    try {
      execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
      console.log(chalk.green('\n✅ Dependencies installed!'));
    } catch (err) {
      console.error(chalk.red('\n❌ Failed to install dependencies.'));
    }

    console.log(chalk.blue('\n✅ Project initialized successfully!'));
    console.log(chalk.cyan('\nNext step:'));
    console.log(chalk.cyan(`  cd ${projectName} && mockadin serve`));
  });

program
  .command('generate [resource]')
  .description('Generate mock endpoints for a resource')
  .action(async (resource) => {
    const cwd = process.cwd();
    const mocksDir = path.join(cwd, 'mocks');
    const serverDir = path.join(cwd, 'server');
    const packageJsonPath = path.join(cwd, 'package.json');

    console.log(chalk.gray('\nLet\'s create some mock endpoints for your resource.\n'));

    if (!fs.existsSync(mocksDir) || !fs.existsSync(serverDir) || !fs.existsSync(packageJsonPath)) {
      console.log(chalk.red('❌ You must run this inside a mockadin project folder.'));
      process.exit(1);
    }

    if (!resource) {
      const answer = await inquirer.prompt({
        type: 'input',
        name: 'resource',
        message: chalk.yellow('Resource name?')
      });
      resource = answer.resource.trim();
      if (!resource) {
        console.log(chalk.red('❌ Resource name cannot be empty.'));
        process.exit(1);
      }
    }

    const { endpoints } = await inquirer.prompt({
      type: 'checkbox',
      name: 'endpoints',
      message: chalk.yellow('Which endpoints do you want to generate?'),
      choices: [
        { name: 'GET', value: 'get', checked: true },
        { name: 'POST', value: 'post' },
        { name: 'PUT', value: 'put' },
        { name: 'DELETE', value: 'delete' }
      ],
      validate: arr => arr.length > 0 || 'Select at least one http method'
    });

    if (endpoints.includes('get')) {
      const { count } = await inquirer.prompt({
        type: 'number',
        name: 'count',
        message: 'How many objects for GET?',
        default: 5,
        validate: n => n > 0 || 'Enter a positive number'
      });
      const fields = [];
      let addMore = true;
      while (addMore) {
        const { fieldName } = await inquirer.prompt({
          type: 'input',
          name: 'fieldName',
          message: 'Field name?'
        });
        const { fieldType } = await inquirer.prompt({
          type: 'list',
          name: 'fieldType',
          message: `Type for "${fieldName}"?`,
          choices: [
            { name: 'String (random word)', value: 'String' },
            { name: 'Number (1-100)', value: 'Number' },
            { name: 'Boolean', value: 'Boolean' },
            { name: 'Date (recent)', value: 'Date' },
            { name: 'UUID', value: 'UUID' },
            { name: 'Email', value: 'Email' },
            { name: 'Name', value: 'Name' }
          ]
        });
        fields.push({ fieldName, fieldType });
        const { more } = await inquirer.prompt({
          type: 'confirm',
          name: 'more',
          message: 'Add another field?',
          default: true
        });
        addMore = more;
      }

      const data = [];
      for (let i = 0; i < count; i++) {
        const obj = {};
        for (const { fieldName, fieldType } of fields) {
          switch (fieldType) {
            case 'String': obj[fieldName] = faker.lorem.word(); break;
            case 'Number': obj[fieldName] = faker.number.int({ min: 1, max: 100 }); break;
            case 'Boolean': obj[fieldName] = faker.datatype.boolean(); break;
            case 'Date': obj[fieldName] = faker.date.recent().toISOString(); break;
            case 'UUID': obj[fieldName] = faker.string.uuid(); break;
            case 'Email': obj[fieldName] = faker.internet.email(); break;
            case 'Name': obj[fieldName] = faker.person.fullName(); break;
          }
        }
        data.push(obj);
      }
      const getDir = path.join(mocksDir, 'get');
      if (!fs.existsSync(getDir)) fs.mkdirSync(getDir, { recursive: true });
      fs.writeFileSync(path.join(getDir, `${resource}.json`), JSON.stringify(data, null, 2));
      console.log(chalk.green(`✔ GET mock created: mocks/get/${resource}.json`));
    }

    const handlerTemplate = (method) => 
`export default (req, res) => {
  res.json({ message: '${method.toUpperCase()} ${resource} endpoint hit!' });
};`;

    for (const method of ['post', 'put', 'delete']) {
      if (endpoints.includes(method)) {
        const dir = path.join(mocksDir, method);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, `${resource}.js`),
          handlerTemplate(method)
        );
        console.log(chalk.green(`✔ ${method.toUpperCase()} mock created: mocks/${method}/${resource}.js`));
      }
    }
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
