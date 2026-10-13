/**
 * Role: debug free-fly camera (physical keys W/A/S/D or Z/Q/S/D, Q/E down/up, Shift = faster, mouse drag = look).
 * Owner: frontend
 */

import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

const WALK_SPEED_M_PER_S = 6;
const FAST_SPEED_M_PER_S = 20;

const axis = (keys: ReadonlySet<string>, positive: string, negative: string): number =>
  (keys.has(positive) ? 1 : 0) - (keys.has(negative) ? 1 : 0);

export const createFlyCamera = (scene: Scene, focus: Vector3): FreeCamera => {
  const canvas = scene.getEngine().getRenderingCanvas();
  const camera = new FreeCamera('debug-fly-camera', new Vector3(focus.x, 35, focus.z - 50), scene);
  camera.setTarget(focus);
  camera.minZ = 0.1;
  camera.maxZ = 2000;
  camera.angularSensibility = 1500;
  camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
  if (canvas) camera.attachControl(canvas, true);

  const keys = new Set<string>();
  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  scene.onBeforeRenderObservable.add(() => {
    const dtS = scene.getEngine().getDeltaTime() / 1000;
    const speed = keys.has('ShiftLeft') ? FAST_SPEED_M_PER_S : WALK_SPEED_M_PER_S;
    const yaw = camera.rotation.y;
    const forward = axis(keys, 'KeyW', 'KeyS');
    const strafe = axis(keys, 'KeyD', 'KeyA');
    const vertical = axis(keys, 'KeyE', 'KeyQ');

    camera.position.x += (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed * dtS;
    camera.position.z += (Math.cos(yaw) * forward - Math.sin(yaw) * strafe) * speed * dtS;
    camera.position.y = Math.max(1, camera.position.y + vertical * speed * dtS);
  });

  return camera;
};
