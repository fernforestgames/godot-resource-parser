#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { parse } from './parser.js';

function printUsage() {
  console.error('Usage: godot-resource-parser <file>');
  console.error('       godot-resource-parser < file');
  console.error('');
  console.error('Parses a Godot .tscn or .tres file and outputs JSON');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);

  let content: string;

  if (args.length === 1) {
    // Read from file
    const filePath = path.resolve(args[0]!);
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading file: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  } else if (args.length === 0) {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    content = Buffer.concat(chunks).toString('utf8');
  } else {
    printUsage();
    return;
  }

  try {
    const result = parse(content);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Parse error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
