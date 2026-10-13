#!/usr/bin/env node
/**
 * Role: checks for prohibited generic file/module names
 * Prohibited: utils, helpers, common, misc, stuff, core
 * Used by: pnpm lint
 * Owner: fullstack-devops
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/** Repository root, resolved from this script (works on every machine). */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PROHIBITED_NAMES = /utils|helpers|common|misc|stuff|core/;
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);
let violations = 0;

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile()) {
      callback(fullPath, entry.name);
    }
  }
}

// Check source files (.ts, .js) for prohibited names in their path or filename
walkDir(ROOT, (filePath) => {
  const relPath = path.relative(ROOT, filePath);

  // Skip non-source files
  if (!/.(ts|js|mjs|cjs)$/.test(relPath)) return;

  // Check if the filename (without extension) matches a prohibited name
  const fileBase = path.parse(relPath).name;
  if (PROHIBITED_NAMES.test(fileBase)) {
    console.log(`PROHIBITED: ${relPath} - filename "${fileBase}" matches prohibited pattern`);
    violations++;
  }

  // Check if any path segment matches a prohibited name
  const pathSegments = relPath.split(path.sep);
  for (const segment of pathSegments) {
    if (PROHIBITED_NAMES.test(segment)) {
      console.log(`PROHIBITED: ${relPath} - path segment "${segment}" matches prohibited pattern`);
      violations++;
      break; // Only report once per file
    }
  }
});

if (violations > 0) {
  console.log(`\nFound ${violations} violations of prohibited file naming rules.`);
  process.exit(1);
} else {
  console.log('No prohibited file names found (utils, helpers, common, misc, stuff, core).');
  process.exit(0);
}
