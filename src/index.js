import initCommand from './commands/init.js';
import generateCommand from './commands/generate.js';
import serveCommand from './commands/serve.js';
import crudCommand from './commands/crud.js';

export default function registerCommands(program) {
  initCommand(program);
  generateCommand(program);
  serveCommand(program);
  crudCommand(program);
}