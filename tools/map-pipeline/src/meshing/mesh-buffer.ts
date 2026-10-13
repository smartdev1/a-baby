/**
 * Role: accumulates triangles (positions, normals, indices) of one material group; converts the engine frame (x east, y up, z north) to glTF.
 *
 * Babylon's glTF loader maps glTF (x, y, z) to (−x, y, z) (checked empirically, ADR-free fact noted in docs), so we write x = −east, z = north:
 * once loaded in Babylon, x = east, z = north as everywhere else in SkyLine.
 * Owner: backend
 */

export type Vec3 = readonly [number, number, number];

export const UP: Vec3 = [0, 1, 0];

export class MeshBuffer {
  readonly positions: number[] = [];
  readonly normals: number[] = [];
  readonly indices: number[] = [];

  get vertexCount(): number {
    return this.positions.length / 3;
  }

  get triangleCount(): number {
    return this.indices.length / 3;
  }

  /** Adds a vertex given in the engine frame; returns its index. */
  vertex([x, y, z]: Vec3, [nx, ny, nz]: Vec3): number {
    this.positions.push(-x, y, z);
    this.normals.push(-nx, ny, nz);
    return this.vertexCount - 1;
  }

  triangle(a: number, b: number, c: number): void {
    this.indices.push(a, b, c);
  }
}
