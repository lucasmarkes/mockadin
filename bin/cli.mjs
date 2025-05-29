#!/usr/bin/env node
import { Command } from 'commander';
import registerCommands from '../src/index.js';

const program = new Command();

registerCommands(program);

program.parse(process.argv);