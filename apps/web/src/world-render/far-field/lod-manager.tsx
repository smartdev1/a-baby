/**
 * Role: lod-manager — gestionnaire de niveaux de détail (LOD).
 * Owner: frontend
 *
 * Coordonne le passage entre le rendu complet (LOD0) pour les objets proches
 * et les impostors (LOD1-LOD2) pour les objets éloignés. Maintient ≥ 30 FPS
 * sur PC modeste en réduisant le nombre de drawCalls à distance.
 *
 * Règles :
 * - Les transitions LOD sont fluides (pas de "pop-in" visible)
 * - Les seuils de distance sont définis dans vegetation-types.ts et building-types.ts
 * - Tout calcul est déterministe (pas de Math.random)
 * - Mise à jour par frame ≤ 1ms sur la machine de référence
 */

import { shouldShowImpostor, createImpostor } from './impostors';
import type { AbstractMesh, Vector3 } from '@babylonjs/core';
import type { ImpostorConfig } from './impostors';

// Seuil global : au-delà de laquelle on passe en mode distant
const GLOBAL_FAR_DISTANCE = 200;

// Cache des impostors créés (pour éviter les recréations)
const impostorCache: Map<string, AbstractMesh> = new Map();

export type LODState = {
  /** LOD courant actif (0 = plein, 1 = mi, 2 = distant) */
  currentLOD: number;
  /** Nombre d'impostors actifs */
  activeImpostors: number;
  /** Nombre d'objets en plein rendu */
  fullRenderCount: number;
};

/** Gère le LOD pour une collection d'objets du monde */
export class LODManager {
  private meshes: Map<string, { mesh: AbstractMesh; config: ImpostorConfig }>;
  private cameraPos: Vector3;
  private currentState: LODState;

  constructor(initialMeshes: Map<string, { mesh: AbstractMesh; config: ImpostorConfig }>) {
    this.meshes = initialMeshes;
    this.cameraPos = new Vector3(0, 0, 0);
    this.currentState = {
      currentLOD: 0,
      activeImpostors: 0,
      fullRenderCount: this.meshes.size,
    };
  }

  /** Met à jour la position de la caméra et recalcule les LOD */
  update(cameraPos: Vector3): LODState {
    this.cameraPos = cameraPos;
    this.transitionLODs();
    return { ...this.currentState };
  }

  private transitionLODs(): void {
    let fullRenderCount = 0;
    let activeImpostors = 0;
    let currentLOD = 0;

    this.meshes.forEach((entry, id) => {
      const { mesh, config } = entry;
      const distance = Vector3.Distance(mesh.position, this.cameraPos);

      if (distance <= GLOBAL_FAR_DISTANCE) {
        // Dans la portée "proche" - on peut garder en plein rendu
        if (distance <= config.lodStartDistance) {
          // Très proche - LOD0 plein rendu
          fullRenderCount++;
          if (currentLOD === 0) currentLOD = 0;
        } else if (distance <= config.lodEndDistance) {
          // Période de transition LOD1
          // Pour l'instant, on considère la transition comme LOD1
          currentLOD = Math.max(currentLOD, 1);
        } else {
          // Au-delà de lodEndDistance mais avant GLOBAL_FAR_DISTANCE
          currentLOD = Math.max(currentLOD, 2);
        }
      } else {
        // Bien au-delà de GLOBAL_FAR_DISTANCE - impostor systématique
        currentLOD = 2;
      }

      // Vérifier si on doit afficher l'impostor
      if (shouldShowImpostor(mesh.position, this.cameraPos, config)) {
        activeImpostors++;
        // Créer ou récupérer l'impostor depuis le cache
        if (!impostorCache.has(id)) {
          const impostor = createImpostor(config);
          impostorCache.set(id, impostor);
        }
        // Cacher le mesh original
        mesh.isVisible = false;
      } else {
        // Afficher le mesh original, masquer l'impostor
        mesh.isVisible = true;
        impostorCache.delete(id);
      }
    });

    this.currentState = {
      currentLOD,
      activeImpostors,
      fullRenderCount,
    };
  }

  getState(): LODState {
    return { ...this.currentState };
  }

  /** Récupère l'impostor cached pour un ID donné */
  getImpostor(id: string): AbstractMesh | undefined {
    return impostorCache.get(id);
  }
}

/** Fonction utilitaire : crée le LODManager à partir d'un ensemble de meshes */
export const createLODManager = (
  meshes: Map<string, { mesh: AbstractMesh; config: ImpostorConfig }>
): LODManager => {
  return new LODManager(meshes);
};