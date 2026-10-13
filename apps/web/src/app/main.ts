/**
 * Role: composition root of the web client: creates the engine and scene, wires debug tools and the tile loader, starts the frame loop.
 * Owner: frontend
 */

import { createEngine, createScene } from '../engine/create-engine.ts';
import { createFlyCamera } from '../debug/fly-camera.ts';
import { createPerfOverlay } from '../debug/perf-overlay.ts';
import { loadAndRenderTile } from '../debug/tile-loader.ts';

const start = async (): Promise<void> => {
  const canvas = document.getElementById('render-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#render-canvas not found');

  const engine = createEngine(canvas);
  const scene = createScene(engine);

  const camera = createFlyCamera(scene);
  const overlay = createPerfOverlay(document.body);

  // Chargement fixture tile L0 — remplace l'ancien WorldRenderer.ts statique
  // Le manifeste et les tuiles sont produits par le pipeline T-012 (tile-cut/encode/manifest)
  const fixtureTileKey = 'L0_0_0'; // TODO: charger depuis leharness T-020 / config
  try {
    await loadAndRenderTile(fixtureTileKey, scene, new Vector3(0, 0, 0));
  } catch (e) {
    console.error('[TILE LOADER] Failed to load fixture tile:', e);
    // Continuer sans tile — la scène de base s'affichera tout de même
  }

  engine.runRenderLoop(() => {
    scene.render();
    overlay.update(camera.position, engine.getFps());
  });
  window.addEventListener('resize', () => engine.resize());
};

start().catch((error: unknown) => {
  console.error('SkyLine client failed to start', error);
});
