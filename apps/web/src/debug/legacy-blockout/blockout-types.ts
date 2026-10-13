/**
 * Role: data shapes of the legacy prototype fixtures (legacy-world.json / legacy-props.json) read by the blockout viewer.
 * Owner: frontend
 */

/** Data "y" is north and maps to Babylon z. */
export interface Vec2 {
  x: number;
  y: number;
}

export interface BuildingData {
  id: string;
  footprint: Vec2[][];
  height: number;
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
