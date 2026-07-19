#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('{{name}}')
  .description('{{description}}')
  .version('1.0.0');

program
  .command('run')
  .description('Execute the main action')
  .argument('[input]', 'Input value')
  .action((input?: string) => {
    console.log('{{name}} executed with input:', input ?? '(none)');
  });

program.parse(process.argv);
