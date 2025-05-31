import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { faker } from '@faker-js/faker';

export async function generateMocks(resource) {
  const cwd = process.cwd();
  const mocksDir = path.join(cwd, 'mocks');
  const serverDir = path.join(cwd, 'server');
  const packageJsonPath = path.join(cwd, 'package.json');
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

  console.log(chalk.gray('Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed.'));
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
    
    const { fieldCount } = await inquirer.prompt({
      type: 'number',
      name: 'fieldCount',
      message: 'How many fields per object?',
      default: 2,
      validate: n => n > 0 || 'Enter a positive number'
    });

    const fields = [];
    for (let i = 0; i < fieldCount; i++) {
      const { fieldName } = await inquirer.prompt({
        type: 'input',
        name: 'fieldName',
        message: `Field #${i + 1} name?`,
        validate: input => input && input.trim() ? true : 'Field name cannot be empty'
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
          { name: 'Name', value: 'Name' },
          { name: 'Image (URL)', value: 'Image' },    
          { name: 'Stream (base64)', value: 'Stream' }
        ]
      });
      fields.push({ fieldName, fieldType });
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
          case 'Image': obj[fieldName] = faker.image.urlPicsumPhotos(); break;
          case 'Stream': obj[fieldName] = faker.string.base64({ length: 20 }); break;
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
}