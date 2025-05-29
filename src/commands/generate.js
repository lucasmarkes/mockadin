import { generateMocks } from '../utils/mockGenerator.js';

export default function generateCommand(program) {
  program
    .command('generate [resource]')
    .description('Generate mock endpoints for a resource')
    .action(async (resource) => {
      await generateMocks(resource);
    });
}