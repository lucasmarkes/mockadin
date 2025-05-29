import { printWelcome } from '../utils/logger.js';
import { createProjectStructure } from '../utils/file.js';

export default function initCommand(program) {
  program
    .command('init [projectName]')
    .description('Initialize a mockadin project')
    .action(async (projectName) => {
      printWelcome();
      await createProjectStructure(projectName);
    });
}