/**
 * GeoJSONImporter - Import OSM/Overpass GeoJSON for SKYLINE world generation
 *
 * Parses FeatureCollection from export.geojson, extracts buildings, roads, and POIs,
 * projects to local metric coordinates, and outputs structured RawWorldData.
 */

import { TerrainProjection, Vec2, BoundingBox, createProjectionFromFeatures } from '../projection/TerrainProjection';

// --- Raw output types ---

export interface RawBuilding {
  id: string;
  footprint: Vec2[][];        // Projected polygon rings [exterior, holes...]
  levels: number;             // Number of floors (from building:levels or default)
  height: number;             // Height in meters (levels * 3m default)
  buildingType: string;       // OSM building=* value
  originalId: string;         // OSM @id (e.g., "way/558265139")
}

export interface RawRoad {
  id: string;
  path: Vec2[];               // Projected LineString
  roadType: string;           // OSM highway=* value
  name?: string;              // OSM name=*
  surface?: string;           // OSM surface=*
  width: number;              // Estimated width in meters
  originalId: string;
}

export interface RawPOI {
  id: string;
  position: Vec2;             // Projected Point
  poiType: string;            // Mapped category (healthcare, education, commerce, etc.)
  osmType: string;            // Original OSM key (amenity, shop, etc.)
  osmValue: string;           // Original OSM value (pharmacy, school, etc.)
  name?: string;              // OSM name=*
  tags: Record<string, string>; // All original tags
  originalId: string;
}

export interface RawWorldData {
  buildings: RawBuilding[];
  roads: RawRoad[];
  pois: RawPOI[];
  bounds: BoundingBox;
  projection: {
    refLon: number;
    refLat: number;
    metersPerDegLat: number;
    metersPerDegLon: number;
    scale: number;
    offset: Vec2;
  };
  sourceFile: string;
  importedAt: string;
}

// --- OSM tag mappings ---

const ROAD_TYPE_WIDTH: Record<string, number> = {
  'motorway': 20,
  'trunk': 16,
  'primary': 12,
  'secondary': 10,
  'tertiary': 8,
  'unclassified': 6,
  'residential': 6,
  'service': 4,
  'living_street': 4,
  'pedestrian': 4,
  'footway': 2,
  'path': 2,
  'cycleway': 2,
  'track': 3,
};

const POI_CATEGORY_MAP: Record<string, Record<string, string>> = {
  // amenity=*
  'amenity': {
    'hospital': 'healthcare',
    'clinic': 'healthcare',
    'doctors': 'healthcare',
    'pharmacy': 'healthcare',
    'dentist': 'healthcare',
    'veterinary': 'healthcare',
    'school': 'education',
    'college': 'education',
    'university': 'education',
    'kindergarten': 'education',
    'language_school': 'education',
    'training': 'education',
    'place_of_worship': 'religious',
    'community_centre': 'social',
    'social_facility': 'social',
    'police': 'government',
    'fire_station': 'government',
    'post_office': 'government',
    'townhall': 'government',
    'courthouse': 'government',
    'bank': 'finance',
    'atm': 'finance',
    'money_transfer': 'finance',
    'bureau_de_change': 'finance',
    'restaurant': 'food',
    'cafe': 'food',
    'bar': 'food',
    'pub': 'food',
    'fast_food': 'food',
    'food_court': 'food',
    'ice_cream': 'food',
    'fuel': 'transport',
    'charging_station': 'transport',
    'parking': 'transport',
    'bus_station': 'transport',
    'taxi': 'transport',
    'car_rental': 'transport',
    'car_wash': 'transport',
    'car_repair': 'transport',
    'vehicle_inspection': 'transport',
    'marketplace': 'commerce',
    'shop': 'commerce', // generic fallback
  },
  // shop=*
  'shop': {
    'supermarket': 'commerce',
    'convenience': 'commerce',
    'bakery': 'food',
    'butcher': 'food',
    'greengrocer': 'food',
    'beverages': 'food',
    'alcohol': 'food',
    'pastry': 'food',
    'kiosk': 'commerce',
    'department_store': 'commerce',
    'mall': 'commerce',
    'beauty': 'service',
    'hairdresser': 'service',
    'laundry': 'service',
    'dry_cleaning': 'service',
    'optician': 'healthcare',
    'hearing_aids': 'healthcare',
    'medical_supply': 'healthcare',
    'pharmacy': 'healthcare',
    'chemist': 'healthcare',
    'copyshop': 'service',
    'printing': 'service',
    'internet_cafe': 'service',
    'mobile_phone': 'commerce',
    'electronics': 'commerce',
    'clothes': 'commerce',
    'shoes': 'commerce',
    'jewelry': 'commerce',
    'gift': 'commerce',
    'florist': 'commerce',
    'books': 'commerce',
    'stationery': 'commerce',
  },
  // building=* (for POIs that are buildings)
  'building': {
    'hospital': 'healthcare',
    'school': 'education',
    'university': 'education',
    'church': 'religious',
    'mosque': 'religious',
    'synagogue': 'religious',
    'temple': 'religious',
    'commercial': 'commerce',
    'retail': 'commerce',
    'office': 'work',
    'industrial': 'industrial',
    'warehouse': 'industrial',
    'garage': 'transport',
    'garages': 'transport',
  }
};

const DEFAULT_BUILDING_LEVELS = 1;
const DEFAULT_FLOOR_HEIGHT = 3; // meters

// --- Main importer class ---

export class GeoJSONImporter {
  private projection: TerrainProjection;
  private sourceFile: string;

  constructor(sourceFile: string = 'data/source/export.geojson') {
    this.sourceFile = sourceFile;
    this.projection = new TerrainProjection(); // Will be recalibrated on import
  }

  /**
   * Import and parse GeoJSON file
   */
  public async import(filePath?: string): Promise<RawWorldData> {
    const path = filePath || this.sourceFile;
    const rawData = await this.readGeoJSON(path);
    return this.process(rawData);
  }

  /**
   * Process already-parsed GeoJSON FeatureCollection
   */
  public process(geojson: GeoJSON.FeatureCollection): RawWorldData {
    // 1. Create projection centered on data
    this.projection = createProjectionFromFeatures(geojson.features);

    // 2. Extract and classify features
    const buildings: RawBuilding[] = [];
    const roads: RawRoad[] = [];
    const pois: RawPOI[] = [];

    for (const feature of geojson.features) {
      if (feature.geometry.type === 'Polygon' && feature.properties.building) {
        buildings.push(this.parseBuilding(feature));
      } else if (feature.geometry.type === 'LineString' && feature.properties.highway) {
        roads.push(this.parseRoad(feature));
      } else if (feature.geometry.type === 'Point' && this.isPOI(feature.properties)) {
        pois.push(this.parsePOI(feature));
      }
      // Note: MultiPolygon buildings handled in parseBuilding
    }

    // 3. Collect all points for normalization
    const allPoints: Vec2[] = [];
    for (const b of buildings) allPoints.push(...b.footprint.flat());
    for (const r of roads) allPoints.push(...r.path);
    for (const p of pois) allPoints.push(p.position);

    // 4. Normalize to 300x300m game world
    const { points: normalizedPoints, transform } = this.projection.normalizeToBounds(allPoints, 300, 10);

    // 5. Apply normalization to all features
    let pointIndex = 0;
    const applyNorm = (points: Vec2[]): Vec2[] => {
      const result = normalizedPoints.slice(pointIndex, pointIndex + points.length);
      pointIndex += points.length;
      return result;
    };

    const normalizedBuildings = buildings.map(b => ({
      ...b,
      footprint: b.footprint.map(ring => applyNorm(ring))
    }));

    const normalizedRoads = roads.map(r => ({
      ...r,
      path: applyNorm(r.path)
    }));

    const normalizedPOIs = pois.map(p => ({
      ...p,
      position: applyNorm([p.position])[0]
    }));

    // 6. Calculate final bounds
    const finalBounds = this.projection.calculateBounds(normalizedPoints);

    return {
      buildings: normalizedBuildings,
      roads: normalizedRoads,
      pois: normalizedPOIs,
      bounds: finalBounds,
      projection: {
        refLon: this.projection.getReferencePoint().x,
        refLat: this.projection.getReferencePoint().y,
        metersPerDegLat: this.projection.getMetersPerDegree().lat,
        metersPerDegLon: this.projection.getMetersPerDegree().lon,
        scale: transform.scale,
        offset: transform.offset
      },
      sourceFile: this.sourceFile,
      importedAt: new Date().toISOString()
    };
  }

  private async readGeoJSON(filePath: string): Promise<GeoJSON.FeatureCollection> {
    // In Node.js environment
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private parseBuilding(feature: GeoJSON.Feature): RawBuilding {
    const props = feature.properties as Record<string, any>;
    const geometry = feature.geometry as GeoJSON.Polygon;

    // Project polygon (handles holes)
    const projectedRings = this.projection.projectPolygon(geometry.coordinates);

    // Determine levels
    const levels = props['building:levels']
      ? parseInt(props['building:levels'], 10)
      : DEFAULT_BUILDING_LEVELS;

    return {
      id: `bldg_${feature.id?.replace(/[^\w]/g, '_') || Math.random().toString(36).slice(2,9)}`,
      footprint: projectedRings,
      levels: Math.max(1, levels),
      height: levels * DEFAULT_FLOOR_HEIGHT,
      buildingType: props.building || 'yes',
      originalId: props['@id'] || feature.id || ''
    };
  }

  private parseRoad(feature: GeoJSON.Feature): RawRoad {
    const props = feature.properties as Record<string, any>;
    const geometry = feature.geometry as GeoJSON.LineString;

    const projectedPath = this.projection.projectLineString(geometry.coordinates);
    const highwayType = props.highway || 'unclassified';

    return {
      id: `road_${feature.id?.replace(/[^\w]/g, '_') || Math.random().toString(36).slice(2,9)}`,
      path: projectedPath,
      roadType: highwayType,
      name: props.name,
      surface: props.surface,
      width: ROAD_TYPE_WIDTH[highwayType] || 5,
      originalId: props['@id'] || feature.id || ''
    };
  }

  private isPOI(props: Record<string, any>): boolean {
    // Check if feature has any POI-relevant tags
    const poiKeys = ['amenity', 'shop', 'tourism', 'leisure', 'office', 'craft', 'healthcare', 'emergency'];
    return poiKeys.some(key => props[key] != null);
  }

  private parsePOI(feature: GeoJSON.Feature): RawPOI {
    const props = feature.properties as Record<string, any>;
    const geometry = feature.geometry as GeoJSON.Point;

    const projectedPos = this.projection.project(geometry.coordinates[0], geometry.coordinates[1]);

    // Determine primary POI type
    let poiType = 'unknown';
    let osmType = '';
    let osmValue = '';

    for (const [key, map] of Object.entries(POI_CATEGORY_MAP)) {
      const value = props[key];
      if (value && map[value]) {
        poiType = map[value];
        osmType = key;
        osmValue = value;
        break;
      }
    }

    // Fallback: check building=* for building POIs
    if (poiType === 'unknown' && props.building && POI_CATEGORY_MAP.building[props.building]) {
      poiType = POI_CATEGORY_MAP.building[props.building];
      osmType = 'building';
      osmValue = props.building;
    }

    // Copy all tags for reference
    const tags: Record<string, string> = {};
    for (const [k, v] of Object.entries(props)) {
      if (typeof v === 'string') tags[k] = v;
    }

    return {
      id: `poi_${feature.id?.replace(/[^\w]/g, '_') || Math.random().toString(36).slice(2,9)}`,
      position: projectedPos,
      poiType,
      osmType,
      osmValue,
      name: props.name,
      tags,
      originalId: props['@id'] || feature.id || ''
    };
  }
}

/**
 * Convenience function for quick import
 */
export async function importGeoJSON(filePath?: string): Promise<RawWorldData> {
  const importer = new GeoJSONImporter(filePath);
  return importer.import();
}
export { placeBuildings } from '../buildings/BuildingPlacer';
