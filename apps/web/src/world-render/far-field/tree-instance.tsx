/**
 * Role: tree-instance — instance d'arbre distant avec billboard.
 * Owner: frontend
 *
 * Représente un arbre ou un arbuste à distance (LOD2).
 * Utilise un billboard orienté vers la caméra avec une texture
 * simplifiée de l'espèce correspondante.
 *
 * Règles :
 * - Position déterministe basée sur les coordonnées du monde
 * - Texture simplifiée selon l'espèce (via vegetation-types)
 * - Pas de Math.random — tout est configuré
 * - ARIA : non applicable (rendu 3D interne)
 */

import type { Scene, AbstractMesh } from '@babylonjs/core';
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core';
import { TREE_SPECIES, SHRUB_SPECIES } from '../vegetation/vegetation-types';
import type { TreeSpecies } from '../vegetation/vegetation-types';

/** Crée un billboard d'arbre distant pour une espèce donnée */
const createTreeBillboard = (
  scene: Scene,
  species: TreeSpecies  ,
  position: Vector3,
  sceneRotation: number = 0
): AbstractMesh => {
  // Créer un billboard simple
  const tree = MeshBuilder.CreateBillboard('tree-billboard', {
    size: species.maxWidth,
    image: '', // Texture à charger depuis assets LOD
  }, scene) as AbstractMesh;

  // Positionner l'arbre
  tree.position.copyFrom(position);

  // Orienter selon la rotation de la scène + rotation aléatoire déterministe
  tree.rotation.y = sceneRotation;

  // Stocker l'espèce pour référence
  (tree as unknown as { speciesKey: string }).speciesKey = species.key;

  return tree;
};

/** Crée des instances d'arbres distants pour un secteur donné */
const createDistantTrees = (
  scene: Scene,
  treesData: Array<{ position: Vector3; speciesKey: string }>,
  sceneRotation: number
): AbstractMesh[] => {
  const instances: AbstractMesh[] = [];

  treesData.forEach((treeData) => {
    // Trouver l'espèce correspondante
    const species = speciesKeyToSpecies(treeData.speciesKey);
    if (!species) return;

    const tree = createTreeBillboard(scene, species, treeData.position, sceneRotation);
    instances.push(tree);
  });

  return instances;
};

/** Convertit une clé d'espèce en objet TreeSpecies */
const speciesKeyToSpecies = (key: string): TreeSpecies   | undefined => {
  // Recherche dans TREE_SPECIES
  const treeMatch = TREE_SPECIES.find((s) => s.key === key);
  if (treeMatch) return treeMatch;

  // Recherche dans SHRUB_SPECIES
  const shrubMatch = SHRUB_SPECIES.find((s) => s.key === key);
  return shrubMatch;
};

// Export des fonctions utilitaires
export { createTreeBillboard, createDistantTrees, speciesKeyToSpecies };

/** Liste de toutes les espèces (arbres + arbustes) */
export const ALL_VEGETATION_SPECIES = [
  ...TREE_SPECIES,
  ...SHRUB_SPECIES,
];