/**
 * Role: Render loop setup helper — wires input, camera updates, tile streaming, and rendering.
 * Owner: frontend
 */
import type { Scene } from '@babylonjs/core/scene';
import type { Engine } from '@babylonjs/core/Engines/engine';
import type { Camera } from '@babylonjs/core/Cameras/camera';
import type { PerfOverlay } from '../../debug/perf-overlay.ts';
import type { TileLoader } from '../../streaming/tile-loader.ts';
import { rawToIntent } from '../../input/keyboard-intent.ts';

interface RenderLoopDeps {
  engine: Engine;
  scene: Scene;
  tileLoader: TileLoader;
  keyState: Set<string>;
  overlay: PerfOverlay;
  camera: Camera;
}

export function startRenderLoop(deps: RenderLoopDeps): () => void {
  const { engine, scene, tileLoader, keyState, overlay, camera } = deps;

  const loop = (): void => {
    rawToIntent(keyState);
    const heading = 0;
    const speed = 0;
    tileLoader.updateCameraState({
      position: { x: camera.position.x, z: camera.position.z },
      heading,
      speed
    });
    scene.render();
    overlay.update(camera.position, engine.getFps());
  };

  void engine.runRenderLoop(loop);
  return loop;
}
