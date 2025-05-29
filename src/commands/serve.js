import { startServer } from '../utils/server.js';

export default function serveCommand(program) {
  program
    .command('serve')
    .description('Start the Mockadin server')
    .action(() => {
      startServer();
    });
}