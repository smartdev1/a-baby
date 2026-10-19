/**
 * Role: composition root of the web client — creates engine, scene, camera, lights, HUD, tile loader, input, render loop.
 * Owner: frontend
 */
import type { Scene } from '@babylonjs/core/scene';
import type { Engine } from '@babylonjs/core/Engines/engine';
import type { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { createEngine, createScene } from '../engine/create-engine.ts';
import { createFlyCamera } from '../debug/fly-camera.ts';
import { createPerfOverlay } from '../debug/perf-overlay.ts';
import { createHUD } from './composition/hud-setup.ts';
import { createTileLoader } from './composition/tile-loader-setup.ts';
import { startRenderLoop } from './composition/render-loop-setup.ts';

const start = async (): Promise<void> => {
  const canvas = document.getElementById('render-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#render-canvas not found');

  const engine: Engine = createEngine(canvas);
  const scene: Scene = createScene(engine);

  const keyState = new Set<string>();
  window.addEventListener('keydown', e => keyState.add(e.code));
  window.addEventListener('keyup', e => keyState.delete(e.code));

  const tileFocus = new Vector3(125, 0, 125);
  const camera: Camera = createFlyCamera(scene, tileFocus);
  new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  const overlay = createPerfOverlay(document.body);

  const hud = createHUD();
  window.addEventListener('resize', () => hud.onResize());

  const tileLoader = await createTileLoader();

  startRenderLoop({ engine, scene, tileLoader, keyState, overlay, camera });
};

try {
  start().catch(e => console.error('SkyLine client failed to start', e));
} catch (e) {
  console.error('SkyLine client failed to start', e);
}
