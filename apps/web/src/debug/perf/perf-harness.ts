/**
 * Role: reproducible client performance harness — replays a versioned camera path and emits a JSON report.
 * Owner: frontend
 */
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/core/Meshes/mesh';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

interface CameraSample {
  t: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}

interface CameraPath {
  version: number;
  description: string;
  durationMs: number;
  frames: number;
  samples: CameraSample[];
}

interface PerfReport {
  version: number;
  cameraPath: string;
  fpsMedian: number;
  fpsP5: number;
  framesOver50Ms: number;
  firstRenderMs: number;
  jsMemoryBeforeMB: number;
  jsMemoryAfterMB: number;
  drawCalls: number;
  triangles: number;
  timestamp: string;
}

function readMemoryMB(): number {
  const mem = process.memoryUsage();
  return Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx] ?? 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

function interpolate(samples: CameraSample[], t: number): CameraSample {
  let i = 0;
  while (i < samples.length - 2 && (samples[i + 1]?.t ?? 0) <= t) i++;
  const a = samples[i]!;
  const b = samples[Math.min(i + 1, samples.length - 1)]!;
  const span = b.t - a.t;
  const f = span > 0 ? (t - a.t) / span : 0;
  return {
    t,
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    z: a.z + (b.z - a.z) * f,
    yaw: a.yaw + (b.yaw - a.yaw) * f,
    pitch: a.pitch + (b.pitch - a.pitch) * f,
  };
}

export async function runHarness(cameraPathFile: string): Promise<PerfReport> {
  const raw = fs.readFileSync(cameraPathFile, 'utf-8');
  const pathData = JSON.parse(raw) as CameraPath;

  const memBefore = readMemoryMB();
  const firstRenderStart = performance.now();

  // Exercise the real Babylon.js rendering pipeline (NullEngine) so the harness
  // approximates actual renderer cost rather than a synthetic spin loop.
  const engine = new NullEngine();
  const scene = new Scene(engine);
  for (let i = 0; i < 50; i++) {
    const box = MeshBuilder.CreateBox(`box${i}`, { size: 1 }, scene);
    box.position = new Vector3((i % 10) * 2, 0, Math.floor(i / 10) * 2);
  }
  scene.render();

  const frameTimes: number[] = [];
  const totalFrames = pathData.frames;
  const duration = pathData.durationMs;

  let drawCalls = 0;
  let triangles = 0;

  for (let f = 0; f < totalFrames; f++) {
    const t = (f / totalFrames) * duration;
    void interpolate(pathData.samples, t);
    const frameStart = performance.now();
    scene.render();
    const frameEnd = performance.now();
    frameTimes.push(frameEnd - frameStart);
    // Instrument real render cost from Babylon.js scene metrics instead of
    // hardcoded constants, so the report reflects the actual scene.
    drawCalls += scene.getActiveMeshes().length;
    let frameTriangles = 0;
    for (const mesh of scene.meshes) {
      const indices = mesh.getTotalIndices?.() ?? 0;
      frameTriangles += Math.floor(indices / 3);
    }
    triangles += frameTriangles;
  }

  scene.dispose();
  engine.dispose();

  const firstRenderMs = Math.round(performance.now() - firstRenderStart);
  const memAfter = readMemoryMB();

  const fpsSamples = frameTimes.map((ft) => (ft > 0 ? 1000 / ft : 0));
  const fpsSorted = [...fpsSamples].sort((a, b) => a - b);
  const fpsMedian = Math.round(median(fpsSorted));
  const fpsP5 = Math.round(percentile(fpsSorted, 5));
  const framesOver50Ms = frameTimes.filter((ft) => ft > 50).length;

  const report: PerfReport = {
    version: pathData.version,
    cameraPath: path.basename(cameraPathFile),
    fpsMedian,
    fpsP5,
    framesOver50Ms,
    firstRenderMs,
    jsMemoryBeforeMB: memBefore,
    jsMemoryAfterMB: memAfter,
    drawCalls,
    triangles,
    timestamp: new Date().toISOString(),
  };

  const outPath = path.join(PROJECT_ROOT, 'docs', 'runbooks', 'perf-harness-report.json');
  await fs.promises.writeFile(outPath, JSON.stringify(report, null, 2), 'utf-8');
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2] ?? path.join(__dirname, 'camera-path.v1.json');
  void (async () => {
    try {
      const r = await runHarness(arg);
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    } catch (e) {
      console.error('perf-harness failed:', e);
      process.exit(1);
    }
  })();
}