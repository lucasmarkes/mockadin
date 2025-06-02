import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import chalk from 'chalk';
import { getServerTemplate } from '../templates/serve.mjs.js';

export async function createProjectStructure(projectName) {
  if (!projectName) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    projectName = await new Promise((resolve) => {
      rl.question(chalk.yellow('Project folder name: '), (answer) => {
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

  fs.mkdirSync(mockDir, { recursive: true });
  fs.mkdirSync(path.dirname(serverFile), { recursive: true });

  const getDir = path.join(mockDir, 'get');
  const postDir = path.join(mockDir, 'post');
  const putDir = path.join(mockDir, 'put');
  const deleteDir = path.join(mockDir, 'delete');
  [getDir, postDir, putDir, deleteDir].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

  fs.writeFileSync(
    path.join(getDir, 'users.json'),
    JSON.stringify([
      { id: 1, name: "Alice", email: "alice@email.com" },
      { id: 2, name: "Bob", email: "bob@email.com" }
    ], null, 2)
  );

  fs.writeFileSync(
    path.join(postDir, 'users.js'),
    `export default (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({
    message: \`User created: \${name} (\${email})\`,
    id: Math.floor(Math.random() * 10000),
    timestamp: new Date().toISOString(),
  });
};`
  );

  fs.writeFileSync(
    path.join(putDir, 'users.js'),
    `export default (req, res) => {
  const { id, name, email } = req.body;
  res.json({
    message: \`User updated: \${id} - \${name} (\${email})\`,
    timestamp: new Date().toISOString(),
  });
};`
  );

  fs.writeFileSync(
    path.join(deleteDir, 'users.js'),
    `export default (req, res) => {
  const { id } = req.body;
  res.json({
    message: \`User deleted: \${id}\`,
    timestamp: new Date().toISOString(),
  });
};`
  );

  console.log(chalk.green('✔ Created example mocks for users (GET, POST, PUT, DELETE)'));

  fs.writeFileSync(serverFile, getServerTemplate());
  console.log(chalk.green('✔ Created: server/index.mjs'));

  const packageJson = {
    name: 'mockadin-project',
    description: 'A mock API project created with mockadin',
    version: '1.0.0',
    type: 'module',
    scripts: {
      start: 'node server/index.mjs'
    },
    dependencies: {
      express: '^4.18.2',
      chokidar: '^3.5.3',
      chalk: '^4.1.2',
      '@faker-js/faker': '^9.8.0',
      inquirer: '^12.6.3',
      "swagger-ui-express": "^4.6.3",
      "swagger-jsdoc": "^6.2.8"
    }
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(chalk.green('✔ Created: package.json'));

  console.log(chalk.cyan('\n📦 Installing dependencies...'));
  try {
    execSync('npm install --loglevel=error', { cwd: projectRoot, stdio: 'inherit' });
    console.log(chalk.green('\n✅ Dependencies installed!'));
  } catch (err) {
    console.error(chalk.red('\n❌ Failed to install dependencies.'));
  }

  console.log(chalk.blue('\n✅ Project initialized successfully!'));
  console.log(chalk.cyan('\nNext step:'));
  console.log(chalk.cyan(`  cd ${projectName} && mockadin serve`));
}