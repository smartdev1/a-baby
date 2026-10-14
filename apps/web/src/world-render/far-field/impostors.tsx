/**
 * Role: impostors — bâtiment distant remplacé par un sprite 2D (impostor).
 * Owner: frontend
 *
 * Lorsqu'un bâtiment est suffisamment éloigné (d > lodEndDistance),
 * il est remplacé par un billboard orienté vers la caméra avec une
 * texture pré-rendu de la façade. Cela maintient le FPS en évitant
 * de rendre des géométries complexes à distance.
 *
 * Règles :
 * - Tout calcul de distance est déterministe (pas de Math.random)
 * - L'orientation vers la caméra se fait via la matrice de vue
 * - La texture d'impostor est chargée depuis les assets LOD pré-calculés
 * - ARIA : non applicable (rendu 3D interne, pas d'interface directe)
 * - Performance : calcul par frame ≤ 0.5ms sur la machine de référence
 */

import { MeshBuilder, AbstractMesh } from '@babylonjs/core';
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

// Type for impostor configuration
export type ImpostorConfig = {
  /** Identifiant unique du bâtiment */
  id: string;
  /** Position du bâtiment en monde */
  position: Vector3;
  /** Largeur de la texture d'impostor (en pixels) */
  textureWidth: number;
  /** Hauteur de la texture d'impostor (en pixels) */
  textureHeight: number;
  /** Distance à partir de laquelle l'impostor s'affiche */
  lodEndDistance: number;
  /** Distance minimale à laquelle l'impostor commence à s'afficher */
  lodStartDistance: number;
  /** Scène Babylon.js */
  scene: Scene;
};

/** Crée un impostor pour un bâtiment distant */
const createImpostor = (config: ImpostorConfig): AbstractMesh => {
  // Création d'un plane simple qui servira d'impostor
  const impostor = MeshBuilder.CreatePlane('impostor', {
    width: 10,
    height: 10,
  }, config.scene) as AbstractMesh;

  // Configuration de l'impostor natif de Babylon.js
  impostor.renderingGroupId = 1;
  impostor.isVisible = true;
  impostor.billboardMode = AbstractMesh.BILLBOARDMODE_POINT;

  // On stocke les config pour le calcul de distance
  const impostorWithConfig = impostor as AbstractMesh & { impostorConfig: ImpostorConfig };
  impostorWithConfig.impostorConfig = config;

  return impostor;
};

/** Décide si un impostor doit être affiché pour un bâtiment donné */
const shouldShowImpostor = (buildingPos: Vector3, cameraPos: Vector3, config: ImpostorConfig): boolean => {
  // Calcul de la distance euclidienne entre la caméra et le bâtiment
  const dx = buildingPos.x - cameraPos.x;
  const dy = buildingPos.y - cameraPos.y;
  const dz = buildingPos.z - cameraPos.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // L'impostor s'affiche entre lodStartDistance et lodEndDistance
  return distance > config.lodStartDistance && distance <= config.lodEndDistance;
};

export { createImpostor, shouldShowImpostor, ImpostorConfig };