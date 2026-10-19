/**
 * Role: charge et affiche une tuile GLB réelle produite par le pipeline cartographique.
 * Owner: frontend
 */

import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { MeshoptCompression } from '@babylonjs/core/Meshes/Compression/meshoptCompression';
import type { Scene } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

const TILE_ROOT = '/tiles/L0/296_178/';
const TILE_GLB = 'geom.da325b7e47021407.glb';

export async function loadRealTile(scene: Scene): Promise<void> {
  MeshoptCompression.Configuration = {
    decoder: {
      url: '/meshopt_decoder.js',
    },
  };

  const result = await SceneLoader.ImportMeshAsync('', TILE_ROOT, TILE_GLB, scene);

  console.info('[REAL TILE] GLB chargé', {
    file: `${TILE_ROOT}${TILE_GLB}`,
    meshes: result.meshes.length,
    geometries: result.meshes.filter((mesh) => mesh.getTotalVertices() > 0).length,
  });

  for (const mesh of result.meshes) {
    if (mesh.getTotalVertices() === 0) {
      continue;
    }

    mesh.computeWorldMatrix(true);
    const bounds = mesh.getBoundingInfo().boundingBox;

    console.info('[REAL TILE] Transformations du mesh', {
      name: mesh.name,
      parent: mesh.parent?.name ?? null,
      position: mesh.position.asArray(),
      scaling: mesh.scaling.asArray(),
      rotation: mesh.rotation.asArray(),
      pivot: mesh.getPivotPoint().asArray(),
      worldMatrix: mesh.getWorldMatrix().asArray(),
      minWorld: bounds.minimumWorld.asArray(),
      maxWorld: bounds.maximumWorld.asArray(),
    });
  }

  // Analyse du terrain dans la zone où se trouve le bâtiment.

  const ground = result.meshes.find((mesh) => mesh.name === 'ground');

  if (ground) {
    const positions = ground.getVerticesData('position');

    if (positions) {
      ground.computeWorldMatrix(true);

      const worldMatrix = ground.getWorldMatrix();
      const nearest = Array.from({ length: positions.length / 3 }, (_, i) => {
        const local = new Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);

        const world = Vector3.TransformCoordinates(local, worldMatrix);

        return {
          x: world.x,
          y: world.y,
          z: world.z,
          distance: Math.hypot(world.x - 129, world.z - 223),
        };
      })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10)
        .map((p) => ({
          x: Number(p.x.toFixed(2)),
          y: Number(p.y.toFixed(2)),
          z: Number(p.z.toFixed(2)),
          distance: Number(p.distance.toFixed(2)),
        }));

      console.info('[REAL TILE] Terrain proche du bâtiment (coordonnées monde)', JSON.stringify(nearest));
    }
  }
}
