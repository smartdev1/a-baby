/**
 * Role: debug overlay showing the camera position and FPS (developer tool, not player-facing).
 * Owner: frontend
 */

import type { Vector3 } from '@babylonjs/core/Maths/math.vector';

export interface PerfOverlay {
  update: (position: Vector3, fps: number) => void;
}

export const createPerfOverlay = (parent: HTMLElement): PerfOverlay => {
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed',
    left: '12px',
    bottom: '12px',
    padding: '8px 10px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    font: '13px monospace',
    borderRadius: '4px',
  });
  parent.appendChild(box);

  return {
    update: (position, fps) => {
      box.textContent = `x ${position.x.toFixed(1)}  z ${position.z.toFixed(1)}  |  ${fps.toFixed(0)} FPS`;
    },
  };
};
