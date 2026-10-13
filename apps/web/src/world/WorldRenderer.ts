import * as BABYLON from "babylonjs";

// --- Minimal data contracts (mirror of world.json / props.json) ---

export interface Vec2 {
  x: number;
  y: number; // data "y" = north -> Babylon z
}

export interface BuildingData {
  id: string;
  footprint: Vec2[][];
  height: number;
  levels: number;
  buildingType: string;
}

export interface RoadData {
  id: string;
  path: Vec2[];
  roadType: string;
  surface?: string;
  width: number;
}

export interface WorldData {
  buildings: BuildingData[];
  roads: RoadData[];
}

export interface PropData {
  id: string;
  type: string;
  position: Vec2;
  rotation: number;
  scale: number;
}

export interface BuildResult {
  center: BABYLON.Vector3;
  stats: { buildings: number; fallbackBoxes: number; roads: number; props: number };
}

// --- Constants ---

const WORLD_SIZE = 300;
const BUILDING_PALETTE = ["#d9b99b", "#e8d5b0", "#c9a27e", "#e3c4a8", "#b8c5a6", "#d8a48f"];
const EPS = 1e-3;

interface PropPart {
  build: (scene: BABYLON.Scene) => BABYLON.Mesh;
  color: string;
  y: number; // vertical offset of the part (before instance scale)
}

const PROP_PARTS: Record<string, PropPart[]> = {
  tree: [
    { build: (s) => BABYLON.MeshBuilder.CreateCylinder("p_trunk", { height: 3, diameter: 0.4 }, s), color: "#6b4a2f", y: 1.5 },
    { build: (s) => BABYLON.MeshBuilder.CreateSphere("p_canopy", { diameter: 5, segments: 6 }, s), color: "#3f7d3a", y: 5 },
  ],
  street_light: [
    { build: (s) => BABYLON.MeshBuilder.CreateCylinder("p_pole", { height: 4, diameter: 0.15 }, s), color: "#555555", y: 2 },
    { build: (s) => BABYLON.MeshBuilder.CreateBox("p_head", { width: 0.6, height: 0.2, depth: 0.3 }, s), color: "#f2e6a0", y: 4.1 },
  ],
  bench: [
    { build: (s) => BABYLON.MeshBuilder.CreateBox("p_bench", { width: 1.6, height: 0.5, depth: 0.5 }, s), color: "#8a5a2b", y: 0.25 },
  ],
  signage: [
    { build: (s) => BABYLON.MeshBuilder.CreateBox("p_sign", { width: 0.1, height: 2, depth: 0.6 }, s), color: "#c0392b", y: 1 },
  ],
  trash: [
    { build: (s) => BABYLON.MeshBuilder.CreateCylinder("p_trash", { height: 0.8, diameter: 0.5 }, s), color: "#2f4f4f", y: 0.4 },
  ],
};

// --- Helpers ---

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Remove consecutive duplicate points (they break triangulation and normals). */
const dedupe = (points: Vec2[]): Vec2[] => {
  const out: Vec2[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || dist(p, last) > EPS) out.push(p);
  }
  return out;
};

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const pushTo = <K, V>(map: Map<K, V[]>, key: K, value: V): void => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

// --- Renderer ---

export class WorldRenderer {
  private readonly materials = new Map<string, BABYLON.StandardMaterial>();
  private fallbackBoxes = 0;
  private warnedExtrude = false;

  constructor(private readonly scene: BABYLON.Scene) {}

  public build(world: WorldData, props: PropData[]): BuildResult {
    this.buildGround();
    const roads = this.buildRoads(world.roads);
    const buildings = this.buildBuildings(world.buildings);
    const propCount = this.buildProps(props);

    return {
      center: this.computeCenter(world.buildings),
      stats: { buildings, fallbackBoxes: this.fallbackBoxes, roads, props: propCount },
    };
  }

  // Data (x, y) -> Babylon (x, height, z). Single conversion point.

  private material(hex: string): BABYLON.StandardMaterial {
    let m = this.materials.get(hex);
    if (!m) {
      m = new BABYLON.StandardMaterial(`mat_${hex}`, this.scene);
      m.diffuseColor = BABYLON.Color3.FromHexString(hex);
      m.specularColor = BABYLON.Color3.Black(); // no white sheen
      this.materials.set(hex, m);
    }
    return m;
  }

  private buildGround(): void {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: WORLD_SIZE, height: WORLD_SIZE }, this.scene);
    ground.position.set(WORLD_SIZE / 2, 0, WORLD_SIZE / 2); // world spans 0..300, not -150..150
    ground.material = this.material("#7d8a63");
    ground.freezeWorldMatrix();
  }

  // --- Roads ---

  private roadStyle(r: RoadData): { color: string; y: number } {
    if (r.roadType === "footway" || r.roadType === "path") return { color: "#c8bfae", y: 0.06 };
    if (r.roadType === "service") return { color: "#6f6f6f", y: 0.05 };
    if (r.surface === "unpaved") return { color: "#a8855f", y: 0.04 };
    return { color: "#4a4a4d", y: 0.04 };
  }

  private buildRoads(roads: RoadData[]): number {
    const groups = new Map<string, BABYLON.Mesh[]>();
    let count = 0;

    for (const road of roads) {
      const pts = dedupe(road.path);
      if (pts.length < 2) continue;

      const { color, y } = this.roadStyle(road);
      const half = road.width / 2;
      const left: BABYLON.Vector3[] = [];
      const right: BABYLON.Vector3[] = [];

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]!;
        const prev = pts[Math.max(i - 1, 0)]!;
        const next = pts[Math.min(i + 1, pts.length - 1)]!;
        const len = dist(prev, next);
        if (len === 0) continue;
        const nx = -(next.y - prev.y) / len;
        const ny = (next.x - prev.x) / len;
        left.push(new BABYLON.Vector3(p.x + nx * half, y, p.y + ny * half));
        right.push(new BABYLON.Vector3(p.x - nx * half, y, p.y - ny * half));
      }
      if (left.length < 2) continue;

      const ribbon = BABYLON.MeshBuilder.CreateRibbon(
        road.id,
        { pathArray: [left, right], sideOrientation: BABYLON.Mesh.DOUBLESIDE },
        this.scene
      );
      pushTo(groups, color, ribbon);
      count++;
    }

    this.mergeGroups(groups, "roads");
    return count;
  }

  // --- Buildings ---

  private buildBuildings(buildings: BuildingData[]): number {
    const groups = new Map<string, BABYLON.Mesh[]>();
    let count = 0;

    for (const b of buildings) {
      const mesh = this.extrude(b);
      if (!mesh) continue;
      const color = BUILDING_PALETTE[hash(b.id) % BUILDING_PALETTE.length]!;
      pushTo(groups, color, mesh);
      count++;
    }

    this.mergeGroups(groups, "buildings");
    return count;
  }

  private extrude(b: BuildingData): BABYLON.Mesh | null {
    const raw = b.footprint[0];
    if (!raw) return null;

    const ring = dedupe(raw);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first && last && ring.length > 1 && dist(first, last) <= EPS) ring.pop(); // closed ring
    if (ring.length < 3) return null;

    const height = Math.max(b.height, 3);

    try {
      const shape = ring.map((p) => new BABYLON.Vector3(p.x, 0, p.y));
      const mesh = BABYLON.MeshBuilder.ExtrudePolygon(
        b.id,
        { shape, depth: height, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
        this.scene
      );
      // Normalize so the base sits at y = 0, whatever the extrusion direction is.
      const minY = mesh.getBoundingInfo().boundingBox.minimum.y;
      mesh.position.y = -minY;
      return mesh;
    } catch (error) {
      if (!this.warnedExtrude) {
        console.warn("ExtrudePolygon failed, falling back to bounding boxes:", error);
        this.warnedExtrude = true;
      }
      return this.fallbackBox(b.id, ring, height);
    }
  }

  private fallbackBox(id: string, ring: Vec2[], height: number): BABYLON.Mesh {
    const xs = ring.map((p) => p.x);
    const ys = ring.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const box = BABYLON.MeshBuilder.CreateBox(
      id,
      { width: Math.max(maxX - minX, 1), height, depth: Math.max(maxY - minY, 1) },
      this.scene
    );
    box.position.set((minX + maxX) / 2, height / 2, (minY + maxY) / 2);
    this.fallbackBoxes++;
    return box;
  }

  // --- Props (thin instances: one draw call per part) ---

  private buildProps(props: PropData[]): number {
    const byType = new Map<string, PropData[]>();
    for (const p of props) pushTo(byType, p.type, p);

    let count = 0;
    for (const [type, list] of byType) {
      const parts = PROP_PARTS[type];
      if (!parts) continue; // unknown type: ignored

      const buffer = new Float32Array(list.length * 16);
      list.forEach((p, i) => {
        BABYLON.Matrix.Compose(
          new BABYLON.Vector3(p.scale, p.scale, p.scale),
          BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, p.rotation),
          new BABYLON.Vector3(p.position.x, 0, p.position.y)
        ).copyToArray(buffer, i * 16);
      });

      for (const part of parts) {
        const mesh = part.build(this.scene);
        mesh.bakeTransformIntoVertices(BABYLON.Matrix.Translation(0, part.y, 0));
        mesh.material = this.material(part.color);
        mesh.thinInstanceSetBuffer("matrix", buffer, 16, true);
        mesh.alwaysSelectAsActiveMesh = true; // base bounds sit at origin; skip culling
      }
      count += list.length;
    }
    return count;
  }

  // --- Utilities ---

  private mergeGroups(groups: Map<string, BABYLON.Mesh[]>, label: string): void {
    for (const [color, meshes] of groups) {
      const merged = BABYLON.Mesh.MergeMeshes(meshes, true, true);
      if (!merged) continue;
      merged.name = `${label}_${color}`;
      merged.material = this.material(color);
      merged.freezeWorldMatrix();
    }
  }

  private computeCenter(buildings: BuildingData[]): BABYLON.Vector3 {
    let sx = 0, sy = 0, n = 0;
    for (const b of buildings) {
      const p = b.footprint[0]?.[0];
      if (!p) continue;
      sx += p.x;
      sy += p.y;
      n++;
    }
    return n === 0
      ? new BABYLON.Vector3(WORLD_SIZE / 2, 0, WORLD_SIZE / 2)
      : new BABYLON.Vector3(sx / n, 0, sy / n);
  }
}