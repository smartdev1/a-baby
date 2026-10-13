/**
 * Role: single source of truth of `highway` classes: carriageway width, who may use them (cars, pedestrians), path or road surface, default sidewalks.
 * Owner: backend
 */

/** Carriageway width in metres (typical Abidjan values; refined with `lanes` / `width` later). */
const WIDTH_M: Readonly<Record<string, number>> = {
  motorway: 14,
  trunk: 12,
  primary: 10,
  secondary: 8,
  tertiary: 7,
  motorway_link: 6,
  trunk_link: 6,
  primary_link: 6,
  secondary_link: 6,
  tertiary_link: 5,
  residential: 6,
  unclassified: 5,
  living_street: 4.5,
  pedestrian: 4,
  service: 3.5,
  track: 3,
  footway: 1.5,
  path: 1.5,
  steps: 1.5,
  cycleway: 1.5,
};

const PATH_CLASSES = new Set(['footway', 'path', 'steps', 'cycleway', 'track', 'pedestrian']);
const NO_CARS = new Set(['footway', 'path', 'steps', 'cycleway', 'pedestrian']);
const NO_PEDESTRIANS = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link']);
/** Streets that get sidewalks when OSM maps none alongside them. */
const SIDEWALK_CLASSES = new Set(['primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street']);

export const roadWidthM = (roadClass: string): number => WIDTH_M[roadClass] ?? 4;
export const isPathClass = (roadClass: string): boolean => PATH_CLASSES.has(roadClass);
export const allowsCars = (roadClass: string): boolean => !NO_CARS.has(roadClass);
export const allowsPedestrians = (roadClass: string): boolean => !NO_PEDESTRIANS.has(roadClass);
export const wantsSidewalks = (roadClass: string): boolean => SIDEWALK_CLASSES.has(roadClass);
