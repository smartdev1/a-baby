/**
 * Role: builds the `geom` glTF binary of a tile (one mesh per material: ground, roads, paths, walls, roofs), quantized and meshopt-compressed.
 * Owner: backend
 */

import { Document, Logger, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, quantize, reorder } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import type { MeshBuffer } from '../meshing/mesh-buffer.ts';

/** Placeholder flat colours (sRGB → linear factors) until the semi-realistic kits of J1. */
const MATERIALS: Readonly<Record<string, readonly [number, number, number]>> = {
  ground: [0.26, 0.3, 0.18],
  water: [0.05, 0.16, 0.2],
  road: [0.07, 0.07, 0.075],
  path: [0.48, 0.4, 0.27],
  walls: [0.69, 0.58, 0.43],
  roofs: [0.32, 0.29, 0.27],
};

export type MeshGroups = Readonly<Record<keyof typeof MATERIALS, MeshBuffer>>;

let io: NodeIO | null = null;

const getIo = async (): Promise<NodeIO> => {
  if (!io) {
    await MeshoptEncoder.ready;
    io = new NodeIO()
      .setLogger(new Logger(Logger.Verbosity.WARN))
      .registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  }
  return io;
};

export const buildTileGlb = async (groups: MeshGroups, tileKey: string): Promise<Uint8Array> => {
  const doc = new Document().setLogger(new Logger(Logger.Verbosity.WARN));
  doc.getRoot().getAsset().generator = 'SkyLine map-pipeline';
  const buffer = doc.createBuffer();
  const scene = doc.createScene(tileKey);

  for (const [name, mesh] of Object.entries(groups)) {
    if (mesh.triangleCount === 0) continue;
    const [r, g, b] = MATERIALS[name] ?? [1, 1, 1];
    const material = doc.createMaterial(name).setBaseColorFactor([r, g, b, 1]).setMetallicFactor(0).setRoughnessFactor(0.9).setDoubleSided(true);
    const primitive = doc
      .createPrimitive()
      .setMaterial(material)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(mesh.positions)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(mesh.normals)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(mesh.indices)).setBuffer(buffer));
    scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive)));
  }

  await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  return (await getIo()).writeBinary(doc);
};
