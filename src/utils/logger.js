import chalk from 'chalk';

export function printWelcome() {
  console.log(
    chalk.bold.cyan('\nWelcome to mockadin!') +
    chalk.gray('\nLet\'s create your new mock API project.\n')
  );
}