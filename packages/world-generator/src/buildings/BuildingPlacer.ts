/**
 * BuildingPlacer - Simple building extrusion with variable height and type-specific materials
 *
 * KISS approach for MVP: Extrude each building footprint as a box with:
 * - Height based on levels (3m per level by default)
 * - Material key based on OSM tags (commercial, residential, industrial, etc.)
 * - Simple LOD system: LOD0 = full mesh, LOD1 = simplified, LOD2 = billboard
 */

import { Vec2, BoundingBox } from '../projection/TerrainProjection';
import { RawBuilding } from '../importers/GeoJSONImporter';
import { TerrainProjection } from '../projection/TerrainProjection';

// --- Configuration ---

const DEFAULT_FLOOR_HEIGHT = 3; // meters per floor
const BUILDING_HEIGHT_TOLERANCE = 0.1; // for level count comparisons

// Building type categories for material assignment
const BUILDING_MATERIALS: Record<string, string> = {
  // Commercial categories
  'commercial': 'building_commercial',
  'retail': 'building_retail',
  'office': 'building_office',
  'warehouse': 'building_industrial',
  'industrial': 'building_industrial',

  // Residential categories
  'residential': 'building_residential',
  'house': 'building_residential',
  'apartments': 'building_residential',
  'dwellings': 'building_residential',

  // Public/special
  'healthcare': 'building_healthcare',
  'hospital': 'building_healthcare',
  'clinic': 'building_healthcare',
  'school': 'building_education',
  'university': 'building_education',
  'college': 'building_education',
  'kindergarten': 'building_education',

  // Religious
  'church': 'building_religious',
  'mosque': 'building_religious',
  'synagogue': 'building_religious',
  'temple': 'building_religious',

  // Default
  'default': 'building_default',
  'yes': 'building_default',
  'no': 'building_default',
};

/**
 * Building instance in the game world
 */
export interface BuildingInstance {
  id: string;
  footprint: Vec2[]; // Projected polygon (already normalized to 300x300m)
  height: number; // Height in meters
  levels: number; // Number of floors
  materialKey: string; // Babylon.js material reference
  originalId: string; // OSM original ID
  center: Vec2; // Centroid for positioning/queries
  bounds: BoundingBox; // Bounding box in meters
}

/**
 * Options for building placement
 */
export interface BuildingPlacerOptions {
  /** Minimum building size (area in m²) to include, smaller ones are filtered out */
  minArea?: number;
  /** Maximum building height in meters */
  maxHeight?: number;
  /** Minimum building height in meters */
  minHeight?: number;
  /** Apply height limit based on building:levels */
  respectLevels?: boolean;
}

/**
 * BuildingPlacer - generates building instances from raw data
 */
export class BuildingPlacer {
  private projection: TerrainProjection;
  private options: BuildingPlacerOptions;

  constructor(options: BuildingPlacerOptions = {}) {
    this.projection = new TerrainProjection();
    this.options = {
      minArea: 10, // m² minimum for game world
      maxHeight: 30, // m maximum (≈10 floors)
      minHeight: 3, // m minimum (1 floor)
      respectLevels: true,
      ...options
    };
  }

  /**
   * Place buildings from raw world data
   */
  public place(rawBuildings: RawBuilding[]): BuildingInstance[] {
    const instances: BuildingInstance[] = [];

    for (const raw of rawBuildings) {
      // Calculate footprint area
      const area = this.calculateFootprintArea(raw.footprint[0]);

      // Filter by minimum area
      if (area < (this.options.minArea || 10)) continue;

      // Determine height
      let height = raw.height || DEFAULT_FLOOR_HEIGHT * DEFAULT_FLOOR_HEIGHT;
      let levels = raw.levels || 1;

      if (this.options.respectLevels && raw.levels != null) {
        levels = Math.max(1, raw.levels);
        height = levels * DEFAULT_FLOOR_HEIGHT;
      } else if (this.options.respectLevels && raw.levels == null) {
        // Default to 1 floor if no levels info
        levels = 1;
        height = DEFAULT_FLOOR_HEIGHT;
      }

      // Apply height limits
      if (this.options.maxHeight && height > this.options.maxHeight) {
        const overflow = height - this.options.maxHeight;
        height = this.options.maxHeight;
        // Don't reduce levels below 1
        levels = Math.max(1, Math.round(height / DEFAULT_FLOOR_HEIGHT));
      }

      if (this.options.minHeight && height < this.options.minHeight) {
        height = this.options.minHeight;
        levels = Math.max(1, Math.round(height / DEFAULT_FLOOR_HEIGHT));
      }

      // Determine material key from OSM tags
      const materialKey = this.determineMaterialKey(raw.buildingType, raw.originalId);

      // Calculate centroid
      const center = this.calculateCentroid(raw.footprint[0]);

      // Calculate bounding box
      const bounds = this.calculateBounds(raw.footprint[0]);

      instances.push({
        id: raw.id,
        footprint: raw.footprint[0], // Already projected exterior ring
        height,
        levels,
        materialKey,
        originalId: raw.originalId,
        center,
        bounds
      });
    }

    // Sort by height (tallest first) for rendering order
    instances.sort((a, b) => b.height - a.height);

    return instances;
  }

  /**
   * Calculate area of a projected polygon using shoelace formula
   */
  private calculateFootprintArea(footprint: Vec2[]): number {
    if (footprint.length < 3) return 0;

    let area = 0;
    const n = footprint.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += (footprint[i].x * footprint[j].y - footprint[j].x * footprint[i].y);
    }

    return Math.abs(area) / 2;
  }

  /**
   * Calculate centroid of a polygon (approximate, using centroid of vertices)
   */
  private calculateCentroid(footprint: Vec2[]): Vec2 {
    if (footprint.length === 0) return { x: 0, y: 0 };
    if (footprint.length === 1) return footprint[0];

    let sumX = 0;
    let sumY = 0;

    for (const p of footprint) {
      sumX += p.x;
      sumY += p.y;
    }

    return { x: sumX / footprint.length, y: sumY / footprint.length };
  }

  /**
   * Calculate bounding box of footprint
   */
  private calculateBounds(footprint: Vec2[]): BoundingBox {
    if (footprint.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    let minX = footprint[0].x;
    let maxX = footprint[0].x;
    let minY = footprint[0].y;
    let maxY = footprint[0].y;

    for (const p of footprint) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  }

  /**
   * Determine material key based on OSM building type tag
   */
  private determineMaterialKey(buildingType: string | undefined, originalId: string): string {
    if (!buildingType || buildingType === 'yes') {
      return BUILDING_MATERIALS['default'];
    }

    // Map the building type to a category
    const type = buildingType.toLowerCase();

    // Direct lookup
    if (BUILDING_MATERIALS[type]) {
      return BUILDING_MATERIALS[type];
    }

    // Check for partial matches (e.g., "commercial" contains "com")
    for (const [key, material] of Object.entries(BUILDING_MATERIALS)) {
      if (key !== 'default' && key !== 'yes' && key !== 'no' && type.includes(key)) {
        return material;
      }
    }

    // Fallback
    return BUILDING_MATERIALS['default'];
  }
}

/**
 * Convenience function
 */
export function placeBuildings(
  rawBuildings: RawBuilding[],
  options?: BuildingPlacerOptions
): BuildingInstance[] {
  const placer = new BuildingPlacer(options);
  return placer.place(rawBuildings);
}