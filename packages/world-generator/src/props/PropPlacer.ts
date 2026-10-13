/**
 * PropPlacer - Street furniture and decorative props placement
 *
 * KISS approach: Places randomized props along road segments and at POI locations.
 * Props are simple Babylon.js meshes (billboards/small boxes) for MVP.
 *
 * Important: road-network.json edges are stored as [id_string, {properties_object}] arrays.
 * The import pipeline converts them, but raw files need this format handling.
 */

import { Vec2 } from '../projection/TerrainProjection';
import { RawWorldData } from '../importers/GeoJSONImporter';

// --- Prop types and configurations ---

export interface PropInstance {
  id: string;
  type: string;           // 'tree' | 'street_light' | 'bench' | 'signage' | 'trash' | 'car'
  position: Vec2;         // Projected position (meters)
  rotation: number;       // Radians (for directional props)
  scale: number;          // Relative size
  originalRef?: string;   // Reference OSM element if applicable
}

export interface PropPlacerOptions {
  /** Density of trees per road meter (default: 0.05 = 1 tree per 20m) */
  treeDensity?: number;
  /** Density of street lights per road meter (default: 0.1 = 1 light per 10m) */
  streetLightDensity?: number;
  /** Whether to place props at POI locations */
  placeAtPOIs?: boolean;
  /** Maximum number of props total (safety limit) */
  maxProps?: number;
  /** Offset from road center for side-props */
  sideOffset?: number;
}

const DEFAULT_OPTIONS: PropPlacerOptions = {
  treeDensity: 0.05,
  streetLightDensity: 0.1,
  placeAtPOIs: true,
  maxProps: 500,
  sideOffset: 3 // meters from road center
};

// Prop configurations (material keys for Babylon.js)
const PROP_CONFIGS: Record<string, { scale: number; materialKey: string; height?: number }> = {
  'tree': { scale: 1, materialKey: 'foliage_deciduous', height: 8 },
  'palm_tree': { scale: 1, materialKey: 'foliage_palm', height: 10 },
  'street_light': { scale: 0.5, materialKey: 'street_light', height: 4 },
  'bench': { scale: 0.8, materialKey: 'bench', height: 0.5 },
  'signage': { scale: 0.5, materialKey: 'sign_post', height: 2 },
  'trash_can': { scale: 0.7, materialKey: 'trash_can', height: 1 },
  'car': { scale: 1.2, materialKey: 'car_small', height: 1.5 }
};

// --- Main class ---

export class PropPlacer {
  private options: PropPlacerOptions;
  private rawWorldData: RawWorldData;
  private roadNetworkEdges: Array<{ id: string; fromNode: string; toNode: string; roadType: string; name?: string; surface?: string; width: number; lanes: number; direction: 'both' | 'forward' | 'backward'; geometry: Vec2[]; length: number; originalRoadId: string }>;

  /**
   * Create PropPlacer from raw world data and pre-built road network JSON
   *
   * @param rawWorldData The world data (buildings, POIs, etc.)
   * @param roadNetworkJson The road-network.json content (edges as [id, props] arrays)
   * @param options PropPlacer options
   */
  constructor(rawWorldData: RawWorldData, roadNetworkInput: any, options: PropPlacerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.rawWorldData = rawWorldData;

    // Detect and convert road network edges from either format:
    // 1. Raw road-network.json: edges as { [id_string]: [id, {properties}] } arrays
    // 2. Custom roadNetworkData: edges as Map<id, edgeObject>
    this.roadNetworkEdges = this.convertRoadNetworkEdgesFlexible(roadNetworkInput);
  }

  /**
   * Convert road network edges from either format:
   * 1. Raw road-network.json: edges as { [id_string]: [id, {properties}] } arrays
   * 2. Custom roadNetworkData: edges as Map<id, edgeObject> with geometry, fromNode, toNode
   */
  private convertRoadNetworkEdgesFlexible(roadNetworkInput: any): Array<{
    id: string;
    fromNode: string;
    toNode: string;
    roadType: string;
    name?: string;
    surface?: string;
    width: number;
    lanes: number;
    direction: 'both' | 'forward' | 'backward';
    geometry: Vec2[];
    length: number;
    originalRoadId: string;
  }> {
    const edges: Array<{
      id: string;
      fromNode: string;
      toNode: string;
      roadType: string;
      name?: string;
      surface?: string;
      width: number;
      lanes: number;
      direction: 'both' | 'forward' | 'backward';
      geometry: Vec2[];
      length: number;
      originalRoadId: string;
    }> = [];

    const edgesSrc = roadNetworkInput.edges;

    // Determine format: if edges is a Map, use format 2; otherwise format 1
    const isMap = edgesSrc instanceof Map || (edgesSrc && typeof edgesSrc.forEach === 'function');

    if (isMap) {
      // Format 2: Custom roadNetworkData with Map
      for (const [edgeId, edgeObj] of edgesSrc) {
        if (!edgeObj || !edgeObj.geometry) continue;

        const geometry = edgeObj.geometry as Vec2[];
        if (!geometry || geometry.length < 2) continue;

        const propEdge = {
          id: edgeId,
          fromNode: edgeObj.fromNode || `node_${edges.length}`,
          toNode: edgeObj.toNode || `node_${edges.length + 1}`,
          roadType: edgeObj.roadType || 'residential',
          name: edgeObj.name,
          surface: edgeObj.surface,
          width: edgeObj.width || 6,
          lanes: edgeObj.lanes || 1,
          direction: edgeObj.direction || 'both',
          geometry,
          length: edgeObj.length || this.calculatePathLength(geometry),
          originalRoadId: edgeObj.originalRoadId || ''
        };

        edges.push(propEdge);
      }
    } else {
      // Format 1: Raw road-network.json with [id, {properties}] arrays
      for (const [edgeKey, edgeValue] of Object.entries(edgesSrc)) {
        // Edge format: [id_string, {properties_object}]
        const edgeEntries = edgeValue as [string, any];
        const edgeId = edgeEntries[0];
        const edgeProps = edgeEntries[1] || {};

        const geometry = edgeProps.geometry as Vec2[]; // Array of {x, y}
        if (!geometry || geometry.length < 2) continue;

        const propEdge = {
          id: edgeId,
          fromNode: edgeProps.fromNode || `node_${edges.length}`,
          toNode: edgeProps.toNode || `node_${edges.length + 1}`,
          roadType: edgeProps.roadType || 'residential',
          name: edgeProps.name,
          surface: edgeProps.surface,
          width: edgeProps.width || 6,
          lanes: edgeProps.lanes || 1,
          direction: edgeProps.direction || 'both',
          geometry,
          length: edgeProps.length || this.calculatePathLength(geometry),
          originalRoadId: edgeProps.originalRoadId || ''
        };

        edges.push(propEdge);
      }
    }

    return edges;
  }

  /**
   * Calculate approximate length of a polyline
   */
  private calculatePathLength(points: Vec2[]): number {
    if (points.length < 2) return 0;

    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  /**
   * Set the world data
   */
  public setWorldData(rawWorldData: RawWorldData): void {
    this.rawWorldData = rawWorldData;
  }

  /**
   * Place props along all road edges (no POIs by default)
   */
  public placeAlongRoads(): PropInstance[] {
    const props: PropInstance[] = [];
    const { treeDensity, streetLightDensity, placeAtPOIs, maxProps, sideOffset } = this.options;

    if (this.roadNetworkEdges.length === 0) return props;

    // Track placed props to avoid exceeding max
    let placedCount = 0;

    // 1. Place trees along roads
    if (treeDensity > 0) {
      const trees = this.placeTreesAlongRoads(treeDensity);
      props.push(...trees);
      placedCount += trees.length;
      console.log(`   🌳 Trees placed: ${trees.length}`);
    }

    // 2. Place street lights along roads
    if (streetLightDensity > 0) {
      const lights = this.placeStreetLightsAlongRoads(streetLightDensity);
      props.push(...lights);
      placedCount += lights.length;
      console.log(`   💡 Street lights placed: ${lights.length}`);
    }

    // 3. Place props at POIs (if enabled and requested separately)
    if (placeAtPOIs && this.rawWorldData.pois && this.rawWorldData.pois.length > 0) {
      const poiProps = this.placePropsAtPOIs();
      props.push(...poiProps);
      placedCount += poiProps.length;
      console.log(`   📍 POI props placed: ${poiProps.length}`);
    }

    // 4. Misc urban furniture at random spots (optional)
    // const miscProps = this.placeMiscProps(maxProps - placedCount);
    // props.push(...miscProps);
    // placedCount += miscProps.length;

    // Sort by type for consistent rendering
    props.sort((a, b) => a.type.localeCompare(b.type));

    console.log(`   Total road props: ${props.length}`);
    return props;
  }

  /**
   * Place trees along road segments with randomized spacing
   */
  private placeTreesAlongRoads(density: number): PropInstance[] {
    const trees: PropInstance[] = [];

    for (const edge of this.roadNetworkEdges) {
      // Use edge.length (meters) for minimum segment check, not geometry point count
      // Most edges have only 2 geometry points (start/end), but vary in length
      if (edge.length < 10) continue; // Skip very short segments (< 10m)

      // Number of trees based on segment length
      const treeCount = Math.max(1, Math.floor(edge.length * density));

      // Distribute trees evenly with some randomness
      for (let i = 0; i < treeCount; i++) {
        // Position along the segment using linear interpolation
        const t = (i + Math.random() * 0.3) / Math.max(treeCount, 1);
        const pos = this.lerpVec2(edge.geometry[0], edge.geometry[edge.geometry.length - 1], t);

        // Random offset from road (left/right side)
        const side = Math.random() > 0.5 ? 1 : -1;
        const offsetX = (Math.random() * this.options.sideOffset!) * side;
        const offsetY = Math.random() * 2; // small perpendicular offset

        const positionedPos: Vec2 = {
          x: pos.x + offsetX,
          y: pos.y + offsetY
        };

        trees.push({
          id: `prop_tree_${Math.random().toString(36).slice(2, 8)}`,
          type: 'tree',
          position: positionedPos,
          rotation: Math.random() * Math.PI * 2, // random rotation
          scale: 0.8 + Math.random() * 0.3 // variation 0.8-1.1
        });
      }
    }

    return trees;
  }

  /**
   * Place street lights along road segments
   */
  private placeStreetLightsAlongRoads(density: number): PropInstance[] {
    const lights: PropInstance[] = [];

    for (const edge of this.roadNetworkEdges) {
      // Use edge.length (meters) for minimum segment check
      if (edge.length < 20) continue; // Need minimum length for street light spacing

      const lightCount = Math.max(1, Math.floor(edge.length * density));

      for (let i = 0; i < lightCount; i++) {
        // Place light at regular intervals (center of each segment piece)
        const t = (i + 0.5) / Math.max(lightCount, 1);
        const pos = this.lerpVec2(edge.geometry[0], edge.geometry[edge.geometry.length - 1], t);

        lights.push({
          id: `prop_light_${Math.random().toString(36).slice(2, 8)}`,
          type: 'street_light',
          position: pos,
          rotation: 0,
          scale: 1
        });
      }
    }

    return lights;
  }

  /**
   * Place props at POI locations (enhanced with type-specific props)
   */
  private placePropsAtPOIs(): PropInstance[] {
    const props: PropInstance[] = [];
    const { pois } = this.rawWorldData;

    if (!pois || pois.length === 0) return props;

    for (const poi of pois) {
      const position: Vec2 = poi.position;

      // Determine prop type based on POI category
      let propType = 'signage';
      let configKey = 'signage';

      switch (poi.poiType) {
        case 'healthcare':
          propType = 'tree';
          configKey = 'tree';
          break;
        case 'education':
          propType = 'tree';
          configKey = 'tree';
          break;
        case 'commerce':
          propType = 'signage';
          configKey = 'signage';
          break;
        case 'religious':
          propType = 'signage';
          configKey = 'signage';
          break;
        case 'transport':
          propType = 'street_light';
          configKey = 'street_light';
          break;
        case 'food':
          propType = 'bench';
          configKey = 'bench';
          break;
        default:
          propType = 'trash';
          configKey = 'trash_can';
      }

      const config = PROP_CONFIGS[configKey] || PROP_CONFIGS['signage'];

      props.push({
        id: `prop_poi_${poi.id}`,
        type: propType,
        position,
        rotation: Math.random() * Math.PI * 2,
        scale: config.scale,
        originalRef: poi.originalId
      });
    }

    return props;
  }

  /**
   * Place random miscellaneous props in world
   */
  private placeMiscProps(maxCount: number): PropInstance[] {
    const props: PropInstance[] = [];

    if (this.roadNetworkEdges.length === 0) {
      // Place in world bounds if no roads
      const { min, max } = this.rawWorldData.bounds || { min: { x: 0, y: 0 }, max: { x: 300, y: 300 } };
      for (let i = 0; i < Math.min(maxCount, 20); i++) {
        const pos: Vec2 = {
          x: min.x + Math.random() * (max.x - min.x),
          y: min.y + Math.random() * (max.y - min.y)
        };

        const type = ['bench', 'trash_can', 'signage'][Math.floor(Math.random() * 3)];
        props.push({
          id: `prop_misc_${i}`,
          type,
          position: pos,
          rotation: Math.random() * Math.PI * 2,
          scale: 0.8
        });
      }
      return props;
    }

    // Place near roads (sidewalk areas)
    for (let i = 0; i < Math.min(maxCount, 30); i++) {
      // Pick a random road edge
      const edge = this.roadNetworkEdges[Math.floor(Math.random() * this.roadNetworkEdges.length)];
      if (!edge || edge.geometry.length < 5) continue;

      // Position along the edge
      const t = Math.random();
      const pos = this.lerpVec2(edge.geometry[0], edge.geometry[edge.geometry.length - 1], t);

      // Offset from road center
      const side = Math.random() > 0.5 ? 1 : -1;
      const offsetX = (Math.random() * this.options.sideOffset!) * side;
      const offsetY = Math.random() * 3;

      const positionedPos: Vec2 = {
        x: pos.x + offsetX,
        y: pos.y + offsetY
      };

      const type = ['bench', 'trash_can', 'signage'][Math.floor(Math.random() * 3)];
      props.push({
        id: `prop_misc_${i}`,
        type,
        position: positionedPos,
        rotation: Math.random() * Math.PI * 2,
        scale: 0.8
      });
    }

    return props;
  }

  /**
   * Linear interpolation between two points
   */
  private lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  }
}

/**
   * Convenience function - place props from world data and road network
   * Combines road-side props (trees, lights) and POI props
   */
export function placeProps(
  rawWorldData: RawWorldData,
  roadNetworkData: any,
  options?: PropPlacerOptions
): PropInstance[] {
  const placer = new PropPlacer(rawWorldData, roadNetworkData, options);
  return placer.placeAlongRoads();
}

/**
 * Convenience function - create from road-network.json
 */
export function createFromRoadNetworkJson(
  rawWorldData: RawWorldData,
  roadNetworkJson: any,
  options?: PropPlacerOptions
): PropPlacer {
  return new PropPlacer(rawWorldData, roadNetworkJson, options);
}

/**
 * Convenience function to place props along roads
 */
export function placeAlongRoads(
  rawWorldData: RawWorldData,
  roadNetworkJson: any,
  options?: PropPlacerOptions
): PropInstance[] {
  const placer = new PropPlacer(rawWorldData, roadNetworkJson, options);
  return placer.placeAlongRoads();
}