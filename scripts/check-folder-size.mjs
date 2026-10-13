#!/usr/bin/env node
/**
 * Role: checks if any folder contains more than 12 source files
 * Used by: pnpm check:folder-size
 * Owner: fullstack-devops
 */

import fs from 'fs';
import path from 'path';

const MAX_FILES = 12;
let foldersExceeded = 0;

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      countSourceFiles(fullPath, callback);
      walkDir(fullPath, callback);
    }
  }
}

function countSourceFiles(dir, callback) {
  let sourceCount = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      countSourceFiles(fullPath, callback);
    } else if (entry.isFile()) {
      if (/\.(ts|js|mjs|cjs)$/.test(entry.name)) {
        sourceCount++;
      }
    }
  }
  if (sourceCount > MAX_FILES) {
    callback(dir, sourceCount);
  }
}

// Walk the project and check folders
const projectRoot = 'C:\\Users\\Aristide Adouko\\Downloads\\a_baby';

walkDir(projectRoot, (folderPath, count) => {
  foldersExceeded++;
  console.log(`EXCEEDS LIMIT: ${folderPath} - ${count} source files (max ${MAX_FILES})`);
});

if (foldersExceeded > 0) {
  console.log(`\n${foldersExceeded} folder(s) exceed the ${MAX_FILES} source file limit.`);
  process.exit(1);
} else {
  console.log(`All folders have ${MAX_FILES} or fewer source files.`);
  process.exit(0);
}
