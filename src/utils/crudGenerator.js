import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { faker } from '@faker-js/faker';

// In-memory data store
const dataStore = new Map();

export async function generateCRUDMocks(resource, options = {}) {
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

  // Parse fields from options or prompt user
  let fields = [];
  if (options.fields) {
    fields = options.fields.split(',').map(f => f.trim());
  } else {
    const { fieldCount } = await inquirer.prompt({
      type: 'number',
      name: 'fieldCount',
      message: 'How many fields per object?',
      default: 3,
      validate: n => n > 0 || 'Enter a positive number'
    });

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
          { name: 'Image (URL)', value: 'Image' }
        ]
      });
      
      fields.push({ fieldName, fieldType });
    }
  }

  const count = parseInt(options.count) || 5;

  // Generate initial data
  const initialData = [];
  for (let i = 0; i < count; i++) {
    const obj = { id: i + 1 };
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
      }
    }
    initialData.push(obj);
  }

  // Store initial data in memory
  dataStore.set(resource, initialData);

  // Create CRUD endpoints
  await createCRUDEndpoints(resource, fields);

  console.log(chalk.green(`✅ CRUD endpoints created for "${resource}" with ${count} initial records!`));
  console.log(chalk.cyan(`📝 Available endpoints:`));
  console.log(chalk.cyan(`   GET /${resource} - List all records`));
  console.log(chalk.cyan(`   GET /${resource}/:id - Get specific record`));
  console.log(chalk.cyan(`   POST /${resource} - Create new record`));
  console.log(chalk.cyan(`   PUT /${resource}/:id - Update record`));
  console.log(chalk.cyan(`   DELETE /${resource}/:id - Delete record`));
}

async function createCRUDEndpoints(resource, fields) {
  const cwd = process.cwd();
  const mocksDir = path.join(cwd, 'mocks');

  // GET - List all records
  const getHandler = `export default (req, res) => {
  if (!global.mockadinDataStore) {
    global.mockadinDataStore = new Map();
  }
  const records = global.mockadinDataStore.get('${resource}') || [];
  res.json(records);
};`;

  // GET by ID - Get specific record
  const getByIdHandler = `export default (req, res) => {
  if (!global.mockadinDataStore) {
    global.mockadinDataStore = new Map();
  }
  const records = global.mockadinDataStore.get('${resource}') || [];
  const id = parseInt(req.params.id);
  const record = records.find(r => r.id === id);
  
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  res.json(record);
};`;

  // POST - Create new record
  const postHandler = `export default (req, res) => {
  if (!global.mockadinDataStore) {
    global.mockadinDataStore = new Map();
  }
  const records = global.mockadinDataStore.get('${resource}') || [];
  
  const newRecord = {
    id: records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  records.push(newRecord);
  global.mockadinDataStore.set('${resource}', records);
  
  res.status(201).json(newRecord);
};`;

  // PUT - Update record
  const putHandler = `export default (req, res) => {
  if (!global.mockadinDataStore) {
    global.mockadinDataStore = new Map();
  }
  const records = global.mockadinDataStore.get('${resource}') || [];
  const id = parseInt(req.params.id);
  const recordIndex = records.findIndex(r => r.id === id);
  
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const updatedRecord = {
    ...records[recordIndex],
    ...req.body,
    id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  records[recordIndex] = updatedRecord;
  global.mockadinDataStore.set('${resource}', records);
  
  res.json(updatedRecord);
};`;

  // DELETE - Delete record
  const deleteHandler = `export default (req, res) => {
  if (!global.mockadinDataStore) {
    global.mockadinDataStore = new Map();
  }
  const records = global.mockadinDataStore.get('${resource}') || [];
  const id = parseInt(req.params.id);
  const recordIndex = records.findIndex(r => r.id === id);
  
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const deletedRecord = records.splice(recordIndex, 1)[0];
  global.mockadinDataStore.set('${resource}', records);
  
  res.json({ message: 'Record deleted successfully', deletedRecord });
};`;

  // Create directories and files
  const methods = [
    { method: 'get', handler: getHandler, filename: `${resource}.js` },
    { method: 'post', handler: postHandler, filename: `${resource}.js` },
    { method: 'put', handler: putHandler, filename: `${resource}.js` },
    { method: 'delete', handler: deleteHandler, filename: `${resource}.js` }
  ];

  for (const { method, handler, filename } of methods) {
    const dir = path.join(mocksDir, method);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), handler);
    console.log(chalk.green(`✔ ${method.toUpperCase()} mock created: mocks/${method}/${filename}`));
  }

  // Create GET by ID endpoint (nested route)
  const getByIdDir = path.join(mocksDir, 'get', resource);
  if (!fs.existsSync(getByIdDir)) fs.mkdirSync(getByIdDir, { recursive: true });
  fs.writeFileSync(path.join(getByIdDir, '[id].js'), getByIdHandler);
  console.log(chalk.green(`✔ GET by ID mock created: mocks/get/${resource}/[id].js`));

  // Create PUT by ID endpoint (nested route)
  const putByIdDir = path.join(mocksDir, 'put', resource);
  if (!fs.existsSync(putByIdDir)) fs.mkdirSync(putByIdDir, { recursive: true });
  fs.writeFileSync(path.join(putByIdDir, '[id].js'), putHandler);
  console.log(chalk.green(`✔ PUT by ID mock created: mocks/put/${resource}/[id].js`));

  // Create DELETE by ID endpoint (nested route)
  const deleteByIdDir = path.join(mocksDir, 'delete', resource);
  if (!fs.existsSync(deleteByIdDir)) fs.mkdirSync(deleteByIdDir, { recursive: true });
  fs.writeFileSync(path.join(deleteByIdDir, '[id].js'), deleteHandler);
  console.log(chalk.green(`✔ DELETE by ID mock created: mocks/delete/${resource}/[id].js`));
} 