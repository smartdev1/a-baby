/**
 * Role: entrypoint for the perf harness.
 * Owner: frontend
 */
import { runHarness } from './perf-harness.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cameraPath = process.argv[2] ?? path.join(__dirname, 'camera-path.v1.json');

void (async () => {
  const r = await runHarness(cameraPath);
  console.log(JSON.stringify(r, null, 2));
})();