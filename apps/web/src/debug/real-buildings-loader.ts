/**
 * Role: renders real OSM building footprints from a debug JSON fixture.
 * Owner: frontend
 */

import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { ExtrudePolygon } from '@babylonjs/core/Meshes/Builders/polygonBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';
import earcut from 'earcut';

type Point2 = readonly [number, number];
type Ring = readonly Point2[];
type Polygon = readonly Ring[];

interface RealBuilding {
  id: string;
  baseYM: number;
  heightM: number;
  polygons: readonly Polygon[];
  footprintArea: number;
}

interface BuildingFixture {
  tileKey: string;
  tileSizeM: number;
  buildings: RealBuilding[];
}

const FIXTURE_URL = '/debug/real-buildings-L0_315_192.json';

const PALETTE = [
  '#d9b99b',
  '#e8d5b0',
  '#c9a27e',
  '#e3c4a8',
  '#b8c5a6',
  '#d8a48f',
];

function colorFor(id: string): Color3 {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }

  const hex = PALETTE[Math.abs(hash) % PALETTE.length] ?? '#cccccc';

  return Color3.FromHexString(hex);
}

function openRing(ring: Ring): Point2[] {
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (
    first &&
    last &&
    first[0] === last[0] &&
    first[1] === last[1]
  ) {
    return ring.slice(0, -1);
  }

  return [...ring];
}

function createBuildingMeshes(building: RealBuilding, scene: Scene, fixtureTileKey: string): number {
  if (
    !Number.isFinite(building.baseYM) ||
    !Number.isFinite(building.heightM) ||
    building.heightM <= 0
  ) {
    console.warn('[REAL BUILDINGS] Hauteur invalide', building.id);
    return 0;
  }

  const material = new StandardMaterial(`${building.id}-debug-material`, scene);
  material.diffuseColor = colorFor(building.id);
  material.specularColor = new Color3(0.08, 0.08, 0.08);

  let polygonIndex = 0;
  let buildingMeshCount = 0;

  for (const polygon of building.polygons) {
    const outer = polygon[0];

    if (!outer || outer.length < 4) {
      continue;
    }

    const points = openRing(outer);

    if (points.length < 3) {
      continue;
    }

    const shape = points.map(
      ([x, z]) => new Vector3(x, 0, z),
    );

    try {
      const mesh = ExtrudePolygon(
        `${building.id}-part-${polygonIndex}`,
        {
          shape,
          depth: building.heightM,
          sideOrientation: Mesh.DOUBLESIDE,
        },
        scene,
        earcut,
      );

      // Align the bottom of the extruded mesh to the source ground altitude.
      mesh.computeWorldMatrix(true);
      const localMinY = mesh.getBoundingInfo().boundingBox.minimum.y;
      mesh.position.y = building.baseYM - localMinY;
      mesh.material = material;
      mesh.metadata = {
        source: 'OpenStreetMap',
        osmId: building.id,
        tileKey: fixtureTileKey,
        baseYM: building.baseYM,
        heightM: building.heightM,
        footprintAreaM2: building.footprintArea,
      };

      mesh.computeWorldMatrix(true);
      polygonIndex++;
      buildingMeshCount++;
    } catch (error) {
      console.error(
        '[REAL BUILDINGS] Échec de création du mesh',
        building.id,
        error,
      );
    }
  }

  if (polygonIndex === 0) {
    material.dispose();
    console.warn('[REAL BUILDINGS] Aucune empreinte exploitable', building.id);
  }

  return buildingMeshCount;
}

export async function loadRealBuildings(scene: Scene): Promise<number> {
  const response = await fetch(FIXTURE_URL);

  if (!response.ok) {
    throw new Error(
      `Impossible de charger les empreintes réelles : ${response.status} ${response.statusText}`,
    );
  }

  const fixture = (await response.json()) as BuildingFixture;

  if (fixture.tileKey !== 'L0_315_192' || !Array.isArray(fixture.buildings)) {
    throw new Error('Fixture invalide pour la tuile L0_315_192.');
  }

  let meshCount = 0;

  for (const building of fixture.buildings) {
    meshCount += createBuildingMeshes(building, scene, fixture.tileKey);
  }

  console.info('[REAL BUILDINGS] Fixture rendue', {
    tileKey: fixture.tileKey,
    buildingsInFixture: fixture.buildings.length,
    meshesCreated: meshCount,
    scale: 1,
  });

  return meshCount;
}
