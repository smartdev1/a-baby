/**
 * Role: composition root of the web client: creates the engine and scene, wires debug tools and the temporary blockout, starts the frame loop.
 * Owner: frontend
 */

import { createEngine, createScene } from '../engine/create-engine.ts';
import { createFlyCamera } from '../debug/fly-camera.ts';
import { createPerfOverlay } from '../debug/perf-overlay.ts';

const start = async (): Promise<void> => {
  const canvas = document.getElementById('render-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#render-canvas not found');

  const engine = createEngine(canvas);
  const scene = createScene(engine);

  const camera = createFlyCamera(scene);
  const overlay = createPerfOverlay(document.body);

  engine.runRenderLoop(() => {
    scene.render();
    overlay.update(camera.position, engine.getFps());
  });
  window.addEventListener('resize', () => engine.resize());
};

start().catch((error: unknown) => {
  console.error('SkyLine client failed to start', error);
});
