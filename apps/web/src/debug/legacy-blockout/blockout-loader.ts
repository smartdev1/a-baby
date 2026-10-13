/**
 * Role: fetches the legacy prototype fixtures at runtime (no static import of world data) and renders the blockout.
 * Owner: frontend
 */

import type { Scene } from '@babylonjs/core/scene';
import { type BlockoutResult, renderBlockout } from './blockout-renderer.ts';
import type { PropData, WorldData } from './blockout-types.ts';

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`failed to load ${url}: HTTP ${response.status}`);
  return response.json();
};

const isWorldData = (value: unknown): value is WorldData =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as WorldData).buildings) &&
  Array.isArray((value as WorldData).roads);

export const loadLegacyBlockout = async (scene: Scene): Promise<BlockoutResult> => {
  const [world, props] = await Promise.all([
    fetchJson('/dev-fixtures/legacy-world.json'),
    fetchJson('/dev-fixtures/legacy-props.json'),
  ]);
  if (!isWorldData(world) || !Array.isArray(props)) throw new Error('legacy fixtures have an unexpected shape');
  return renderBlockout(scene, world, props as PropData[]);
};
