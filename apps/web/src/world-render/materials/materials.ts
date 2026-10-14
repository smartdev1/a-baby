/**
 * Role: shared PBR materials for world-render: ground, buildings, roads, water.
 * Owner: frontend
 * Note: tous les matériaux utilisent 1 unité = 1 mètre, pivot au sol, LOD géré ailleurs.
 */

import type { Scene } from '@babylonjs/core';
import { Color3 } from '@babylonjs/core';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.ts';

// ============================================================
// Ground material — couleur sol ombré, pivot Y=0
// ============================================================

export const groundMaterial = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial('ground-mat', scene);
  mat.diffuseColor = new Color3(0.26, 0.30, 0.23); // terre argileuse assombrie
  mat.specularColor = new Color3(0, 0, 0);
  mat.emissiveColor = new Color3(0.02, 0.02, 0.02);
  mat.opacity = 1;
  mat.backFaceCulling = false;
  return mat;
};

// ============================================================
// Building material — palette couleur, lumière Directional
// ============================================================

export const buildingMaterial = (scene: Scene, colorHex: string): StandardMaterial => {
  const mat = new StandardMaterial('building-mat', scene);
  const hex = colorHex.replace('#', '');
  mat.diffuseColor = new Color3(
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  );
  mat.specularColor = new Color3(0.1, 0.1, 0.1);
  mat.emissiveColor = new Color3(0.02, 0.02, 0.02);
  mat.shininess = 30;
  mat.backFaceCulling = true;
  return mat;
};

// ============================================================
// Road material — asphalte usé, bandes de séparation
// ============================================================

export const roadMaterial = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial('road-mat', scene);
  mat.diffuseColor = new Color3(0.35, 0.35, 0.35); // asphalte grise
  mat.specularColor = new Color3(0.05, 0.05, 0.05);
  mat.emissiveColor = new Color3(0, 0, 0);
  mat.shininess = 10;
  mat.backFaceCulling = true;
  return mat;
};

// ============================================================
// Water material — reflet dynamique, couleur profonde
// ============================================================

export const waterMaterial = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial('water-mat', scene);
  mat.diffuseColor = new Color3(0.1, 0.2, 0.45); // eau profonde
  mat.specularColor = new Color3(0.2, 0.3, 0.5);
  mat.emissiveColor = new Color3(0.02, 0.03, 0.05);
  mat.refractionRatio = 0.98;
  mat.fresnelExponent = 2;
  mat.fresnelColor = new Color3(0.1, 0.1, 0.1);
  mat.backFaceCulling = false;
  return mat;
};

// ============================================================
// Export helper : create all world-render materials
// ============================================================

export const createWorldRenderMaterials = (scene: Scene) => ({
  ground: groundMaterial(scene),
  building: buildingMaterial(scene, '#cccccc'),
  road: roadMaterial(scene),
  water: waterMaterial(scene),
});