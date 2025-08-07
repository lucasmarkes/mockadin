import { generateCRUDMocks } from '../utils/crudGenerator.js';

export default function crudCommand(program) {
  program
    .command('crud [resource]')
    .description('Generate CRUD endpoints with in-memory data persistence')
    .option('-f, --fields <fields>', 'Comma-separated list of fields (e.g., "name,email,age")')
    .option('-c, --count <count>', 'Number of initial records to generate', '5')
    .action(async (resource, options) => {
      await generateCRUDMocks(resource, options);
    });
} 