// World Generator for SKYLINE - Abidjan District
// This module handles procedural generation of the game world

import { RoadNetwork } from './roads';
import { BuildingPlacer } from './buildings';
import { PropPlacer } from './props';
import { TerrainProjection } from './projection';
import type { RawWorldData, RoadNetworkData } from './importers/GeoJSONImporter';

// --- Sector grid configuration ---

/**
 * Sector grid for a 300x300m world.
 * Each sector is 100x100m.
 * Sectors: A1-A3 (top row), B1-B3 (middle row), C1-C3 (bottom row)
 * Column 1: x 0-100, Column 2: x 100-200, Column 3: x 200-300
 * Row A: y 0-100, Row B: y 100-200, Row C: y 200-300
 */
interface SectorBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const SECTOR_GRID: Record<string, SectorBounds> = {
  // Row A (y 0-100)
  A1: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
  A2: { minX: 100, maxX: 200, minY: 0, maxY: 100 },
  A3: { minX: 200, maxX: 300, minY: 0, maxY: 100 },
  // Row B (y 100-200)
  B1: { minX: 0, maxX: 100, minY: 100, maxY: 200 },
  B2: { minX: 100, maxX: 200, minY: 100, maxY: 200 },
  B3: { minX: 200, maxX: 300, minY: 100, maxY: 200 },
  // Row C (y 200-300)
  C1: { minX: 0, maxX: 100, minY: 200, maxY: 300 },
  C2: { minX: 100, maxX: 200, minY: 200, maxY: 300 },
  C3: { minX: 200, maxX: 300, minY: 200, maxY: 300 },
};

/**
 * Get the bounds for a given sector ID
 */
function getSectorBounds(sectorId: string): SectorBounds | undefined {
  return SECTOR_GRID[sectorId];
}

/**
 * Check if a point (x, y) is within sector bounds
 */
function isInSector(x: number, y: number, bounds: SectorBounds): boolean {
  return x >= bounds.minX && x < bounds.maxX && y >= bounds.minY && y < bounds.maxY;
}

/**
 * Filter an array of Vec2 points to only those within sector bounds
 */
function filterPointsInSector(points: Vec2[], bounds: SectorBounds): Vec2[] {
  return points.filter(p => isInSector(p.x, p.y, bounds));
}

/**
 * Filter road edges to only those within sector bounds
 * A road edge is included if any part of its geometry falls within the sector
 */
function filterEdgesInSector(edges: any[], bounds: SectorBounds): any[] {
  return edges.filter(edge => {
    if (!edge.geometry || edge.geometry.length === 0) return false;
    return edge.geometry.some((pt: Vec2) =>
      isInSector(pt.x, pt.y, bounds)
    );
  });
}

/**
 * Compute centroid of a polygon ring (exterior or hole)
 */
function computePolygonCentroid(ring: Vec2[]): Vec2 {
  if (ring.length === 0) return { x: 0, y: 0 };
  if (ring.length === 1) return ring[0];

  let sumX = 0;
  let sumY = 0;
  for (const p of ring) {
    sumX += p.x;
    sumY += p.y;
  }
  return { x: sumX / ring.length, y: sumY / ring.length };
}

/**
 * Filter buildings to only those within sector bounds
 * Uses the centroid of the building's exterior footprint ring
 */
function filterBuildingsInSector(buildings: any[], bounds: SectorBounds): any[] {
  return buildings.filter(b => {
    // Building footprint is [exterior_ring, hole1_ring, hole2_ring, ...]
    // Use the exterior ring (first ring) centroid
    const exteriorRing = b.footprint && b.footprint.length > 0 ? b.footprint[0] : [];
    const centroid = computePolygonCentroid(exteriorRing);
    return isInSector(centroid.x, centroid.y, bounds);
  });
}

/**
 * Filter POIs to only those within sector bounds
 */
function filterPOIsInSector(pois: any[], bounds: SectorBounds): any[] {
  return pois.filter(p => isInSector(p.position.x, p.position.y, bounds));
}

export class WorldGenerator {
  private terrainProjection: TerrainProjection;
  private roadNetwork: RoadNetwork;
  private buildingPlacer: BuildingPlacer;
  private propPlacer: PropPlacer;
  private rawWorldData: RawWorldData;

  constructor(rawWorldData: RawWorldData) {
    this.terrainProjection = new TerrainProjection();
    this.roadNetwork = new RoadNetwork();
    this.buildingPlacer = new BuildingPlacer();
    this.propPlacer = new PropPlacer();
    this.rawWorldData = rawWorldData;
  }

  /**
   * Generate a complete world sector
   * @param sectorId Sector identifier (A1, A2, A3, B1, B2, B3, C1, C2, C3)
   */
  public generateSector(sectorId: string): void {
    const bounds = getSectorBounds(sectorId);
    if (!bounds) {
      console.warn(`⚠️ Unknown sector ID: ${sectorId}`);
      return;
    }

    console.log(`\n🏗️ Generating sector ${sectorId} (${bounds.maxX - bounds.minX}m × ${bounds.maxY - bounds.minY}m)`);

    // 1. Filter terrain/data to sector bounds
    const sectorRoads = filterEdgesInSector(this.rawWorldData.roads, bounds);
    const sectorBuildings = filterBuildingsInSector(this.rawWorldData.buildings, bounds);
    const sectorPOIs = filterPOIsInSector(this.rawWorldData.pois, bounds);

    // 2. Build road network for this sector
    const roadNetworkData: any = {
      nodes: new Map(),
      edges: new Map(),
      intersections: [],
      metadata: { totalLength: 0, roadTypeCounts: {}, generatedAt: new Date().toISOString() }
    };

    // Rebuild node map from sector roads
    const nodePositions = new Map<string, Vec2>();
    const nodeDegree: Record<string, number> = {};

    for (const road of sectorRoads) {
      const startPos: Vec2 = road.geometry[0];
      const endPos: Vec2 = road.geometry[road.geometry.length - 1];

      // Register start node
      if (!roadNetworkData.nodes.has('node_0')) {
        // Simplified: use actual geometry-based node IDs
        const startKey = `${startPos.x.toFixed(3)},${startPos.y.toFixed(3)}`;
        if (!roadNetworkData.nodes.has(startKey)) {
          roadNetworkData.nodes.set(startKey, {
            id: `node_${roadNetworkData.nodes.size}`,
            position: startPos,
            connectedEdges: [],
            isIntersection: false,
            originalRoadIds: []
          });
        }
      }

      // Register end node
      const endKey = `${endPos.x.toFixed(3)},${endPos.y.toFixed(3)}`;
      if (!roadNetworkData.nodes.has(endKey)) {
        roadNetworkData.nodes.set(endKey, {
          id: `node_${roadNetworkData.nodes.size}`,
          position: endPos,
          connectedEdges: [],
          isIntersection: false,
          originalRoadIds: []
        });
      }
    }

    // 3. Place buildings for this sector
    const buildingInstances = this.buildingPlacer.place(sectorBuildings);

    // 4. Place props and details for this sector
    // Create a sector-specific PropPlacer
    const sectorPropPlacer = new PropPlacer(this.rawWorldData, sectorRoads, {
      treeDensity: this.propPlacer.options.treeDensity,
      streetLightDensity: this.propPlacer.options.streetLightDensity,
      placeAtPOIs: this.propPlacer.options.placeAtPOIs,
      maxProps: this.propPlacer.options.maxProps,
      sideOffset: this.propPlacer.options.sideOffset
    });

    const sectorProps = sectorPropPlacer.placeAlongRoads();

    // 5. Place props at POIs for this sector
    if (this.propPlacer.options.placeAtPOIs && sectorPOIs && sectorPOIs.length > 0) {
      // Create sector-specific prop placer for POIs
      const poiPlacer = new PropPlacer(this.rawWorldData, sectorRoads, {
        treeDensity: this.propPlacer.options.treeDensity,
        streetLightDensity: this.propPlacer.options.streetLightDensity,
        placeAtPOIs: true,
        maxProps: this.propPlacer.options.maxProps,
        sideOffset: this.propPlacer.options.sideOffset
      });
      // The placeAlongRoads already handles POIs via placePropsAtPOIs
      // Additional POI-specific placement can be added here
    }

    // Log generation results
    console.log(`   🛣️ Roads: ${sectorRoads.length} edges`);
    console.log(`   🏢 Buildings: ${buildingInstances.length} instances`);
    console.log(`   🌿 Props: ${sectorProps.length} props`);

    // Store generated data for potential later use
    // (In a full implementation, this would be collected into a world data structure)
  }

  /**
   * Generate the complete world (9 sectors: A1-A3, B1-B3, C1-C3)
   */
  public generateWorld(): void {
    // In MVP, we generate the 9 sectors (A1-A3, B1-B3, C1-C3)
    const sectors = [
      'A1', 'A2', 'A3',
      'B1', 'B2', 'B3',
      'C1', 'C2', 'C3'
    ];

    console.log('🌍 Generating complete world across 9 sectors...');

    sectors.forEach(sector => this.generateSector(sector));

    console.log('\n✅ World generation complete!');
  }
}

