/**
 * TerrainProjection - WGS84 to local metric projection for SKYLINE world generation
 *
 * Converts OSM coordinates (lon/lat) to local meter coordinates centered on the district.
 * Uses equirectangular projection centered on the district centroid for simplicity.
 * For a ~300x300m area, distortion is negligible (<0.1%).
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface BoundingBox {
  min: Vec2;
  max: Vec2;
}

export interface GeoBounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

/**
 * Equirectangular projection centered on a reference point.
 * 1 degree latitude ≈ 111,132 meters (constant)
 * 1 degree longitude ≈ 111,132 * cos(lat) meters (varies with latitude)
 */
export class TerrainProjection {
  private readonly refLon: number;
  private readonly refLat: number;
  private readonly metersPerDegLat: number;
  private readonly metersPerDegLon: number;

  /**
   * Create projection centered on given WGS84 coordinates
   * @param refLon Reference longitude (district center)
   * @param refLat Reference latitude (district center)
   */
  constructor(refLon: number = -4.068, refLat: number = 5.332) {
    this.refLon = refLon;
    this.refLat = refLat;

    // Earth radius approximation at equator
    const EARTH_RADIUS_M = 6371000;
    this.metersPerDegLat = (Math.PI / 180) * EARTH_RADIUS_M; // ~111132 m/deg
    this.metersPerDegLon = this.metersPerDegLat * Math.cos((refLat * Math.PI) / 180); // ~99500 m/deg at 5.33°N
  }

  /**
   * Project a single WGS84 coordinate to local meters
   */
  public project(lon: number, lat: number): Vec2 {
    const dx = (lon - this.refLon) * this.metersPerDegLon;
    const dy = (lat - this.refLat) * this.metersPerDegLat;
    return { x: dx, y: dy };
  }

  /**
   * Project an array of [lon, lat] coordinates
   */
  public projectArray(coords: number[][]): Vec2[] {
    return coords.map(([lon, lat]) => this.project(lon, lat));
  }

  /**
   * Project a polygon (array of rings, each ring is array of [lon, lat])
   * Handles GeoJSON Polygon format: [ [ [lon,lat], ... ], [ [lon,lat], ... ] ]
   * where first ring is exterior, subsequent rings are holes
   */
  public projectPolygon(polygon: number[][][]): Vec2[][] {
    return polygon.map(ring => this.projectArray(ring));
  }

  /**
   * Project a LineString (array of [lon, lat])
   */
  public projectLineString(lineString: number[][]): Vec2[] {
    return this.projectArray(lineString);
  }

  /**
   * Calculate bounding box of all projected coordinates
   */
  public calculateBounds(points: Vec2[]): BoundingBox {
    if (points.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
  }

  /**
   * Normalize coordinates to fit within target size (e.g., 300x300m)
   * Centers the content and scales uniformly
   */
  public normalizeToBounds(
    points: Vec2[],
    targetSize: number = 300,
    padding: number = 10
  ): { points: Vec2[]; transform: { scale: number; offset: Vec2 } } {
    const bounds = this.calculateBounds(points);
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    const maxDim = Math.max(width, height);

    const availableSize = targetSize - 2 * padding;
    const scale = maxDim > 0 ? availableSize / maxDim : 1;

    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerY = (bounds.min.y + bounds.max.y) / 2;
    const targetCenter = targetSize / 2;

    const offset: Vec2 = {
      x: targetCenter - centerX * scale,
      y: targetCenter - centerY * scale
    };

    const normalized = points.map(p => ({
      x: p.x * scale + offset.x,
      y: p.y * scale + offset.y
    }));

    return { points: normalized, transform: { scale, offset } };
  }

  /**
   * Apply a precomputed transform to points
   */
  public applyTransform(points: Vec2[], transform: { scale: number; offset: Vec2 }): Vec2[] {
    return points.map(p => ({
      x: p.x * transform.scale + transform.offset.x,
      y: p.y * transform.scale + transform.offset.y
    }));
  }

  getReferencePoint(): Vec2 {
    return { x: this.refLon, y: this.refLat };
  }

  getMetersPerDegree(): { lat: number; lon: number } {
    return { lat: this.metersPerDegLat, lon: this.metersPerDegLon };
  }
}

/**
 * Create a TerrainProjection from GeoJSON features' bounds
 * Automatically centers on the data centroid
 */
export function createProjectionFromFeatures(features: GeoJSON.Feature[]): TerrainProjection {
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  let hasCoords = false;

  for (const feature of features) {
    const coords = extractAllCoordinates(feature.geometry);
    for (const [lon, lat] of coords) {
      hasCoords = true;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  if (!hasCoords) {
    return new TerrainProjection(); // Default Abidjan center
  }

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  return new TerrainProjection(centerLon, centerLat);
}

/**
 * Recursively extract all [lon, lat] pairs from any GeoJSON geometry
 */
function extractAllCoordinates(geometry: GeoJSON.Geometry | null): number[][] {
  const coords: number[][] = [];

  if (!geometry) return coords;

  switch (geometry.type) {
    case 'Point':
      coords.push(geometry.coordinates as number[]);
      break;
    case 'LineString':
      coords.push(...(geometry.coordinates as number[][]));
      break;
    case 'Polygon':
      for (const ring of geometry.coordinates as number[][][]) {
        coords.push(...ring);
      }
      break;
    case 'MultiPoint':
      coords.push(...(geometry.coordinates as number[][]));
      break;
    case 'MultiLineString':
      for (const line of geometry.coordinates as number[][][]) {
        coords.push(...line);
      }
      break;
    case 'MultiPolygon':
      for (const polygon of geometry.coordinates as number[][][][]) {
        for (const ring of polygon) {
          coords.push(...ring);
        }
      }
      break;
    case 'GeometryCollection':
      for (const geom of geometry.geometries) {
        coords.push(...extractAllCoordinates(geom));
      }
      break;
  }

  return coords;
}