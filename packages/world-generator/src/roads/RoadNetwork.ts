/**
 * RoadNetwork - Build navigable road graph from OSM LineStrings
 *
 * Takes raw road data (LineStrings), computes intersections, splits segments,
 * and produces a directed graph suitable for:
 * - Babylon.js mesh generation (road surfaces, markings)
 * - Navigation mesh / pathfinding (A*, Dijkstra)
 * - Traffic simulation, vehicle AI
 */

import { Vec2 } from '../projection/TerrainProjection';
import { RawRoad, RawWorldData } from '../importers/GeoJSONImporter';

// --- Types ---

export interface RoadNode {
  id: string;
  position: Vec2;
  connectedEdges: string[];  // Edge IDs
  isIntersection: boolean;
  originalRoadIds: string[]; // Which raw roads meet here
}

export interface RoadEdge {
  id: string;
  fromNode: string;
  toNode: string;
  roadType: string;
  name?: string;
  surface?: string;
  width: number;
  lanes: number;
  direction: 'both' | 'forward' | 'backward'; // OSM oneway handling
  geometry: Vec2[]; // Polyline (start + intermediate + end)
  length: number;
  originalRoadId: string;
}

export interface RoadIntersection {
  position: Vec2;
  nodeId: string;
  incomingEdges: string[];
  type: 'cross' | 't_junction' | 'dead_end' | 'roundabout';
}

export interface RoadNetworkData {
  nodes: Map<string, RoadNode>;
  edges: Map<string, RoadEdge>;
  intersections: RoadIntersection[];
  bounds: { min: Vec2; max: Vec2 };
  metadata: {
    totalLength: number;
    roadTypeCounts: Record<string, number>;
    generatedAt: string;
  };
}

// --- Configuration ---

const ROAD_TYPE_CONFIG: Record<string, { defaultWidth: number; defaultLanes: number; priority: number }> = {
  'motorway': { defaultWidth: 20, defaultLanes: 4, priority: 10 },
  'trunk': { defaultWidth: 16, defaultLanes: 4, priority: 9 },
  'primary': { defaultWidth: 12, defaultLanes: 2, priority: 8 },
  'secondary': { defaultWidth: 10, defaultLanes: 2, priority: 7 },
  'tertiary': { defaultWidth: 8, defaultLanes: 1, priority: 6 },
  'unclassified': { defaultWidth: 6, defaultLanes: 1, priority: 5 },
  'residential': { defaultWidth: 6, defaultLanes: 1, priority: 4 },
  'service': { defaultWidth: 4, defaultLanes: 1, priority: 3 },
  'living_street': { defaultWidth: 4, defaultLanes: 1, priority: 2 },
  'pedestrian': { defaultWidth: 4, defaultLanes: 0, priority: 2 },
  'footway': { defaultWidth: 2, defaultLanes: 0, priority: 1 },
  'path': { defaultWidth: 2, defaultLanes: 0, priority: 1 },
  'cycleway': { defaultWidth: 2, defaultLanes: 0, priority: 1 },
  'track': { defaultWidth: 3, defaultLanes: 0, priority: 1 },
};

const INTERSECTION_TOLERANCE = 0.5; // meters - snap distance for intersection detection
const MIN_SEGMENT_LENGTH = 1.0; // meters - ignore tiny segments
const SIMPLIFICATION_TOLERANCE = 0.3; // meters - Douglas-Peucker simplification

// --- Geometry utilities ---

function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function distanceToSegment(point: Vec2, segStart: Vec2, segEnd: Vec2): { dist: number; t: number; closest: Vec2 } {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return { dist: distance(point, segStart), t: 0, closest: segStart };
  }

  const t = Math.max(0, Math.min(1, ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq));
  const closest = { x: segStart.x + t * dx, y: segStart.y + t * dy };
  return { dist: distance(point, closest), t, closest };
}

function lineIntersection(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): Vec2 | null {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null; // Parallel

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }
  return null;
}

function simplifyPolyline(points: Vec2[], tolerance: number): Vec2[] {
  if (points.length <= 2) return points;

  // Douglas-Peucker algorithm
  function simplifyRecursive(start: number, end: number): Vec2[] {
    let maxDist = 0;
    let maxIndex = 0;

    const startPt = points[start];
    const endPt = points[end];

    for (let i = start + 1; i < end; i++) {
      const { dist } = distanceToSegment(points[i], startPt, endPt);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    if (maxDist > tolerance && maxIndex !== 0) {
      const left = simplifyRecursive(start, maxIndex);
      const right = simplifyRecursive(maxIndex, end);
      return [...left.slice(0, -1), ...right];
    }
    return [startPt, endPt];
  }

  return simplifyRecursive(0, points.length - 1);
}

// --- Main class ---

export class RoadNetwork {
  private nodes: Map<string, RoadNode> = new Map();
  private edges: Map<string, RoadEdge> = new Map();
  private intersections: RoadIntersection[] = [];
  private nodeCounter = 0;
  private edgeCounter = 0;
  private rawRoads: RawRoad[] = [];

  /**
   * Build road network from raw world data
   */
  public build(rawWorldData: RawWorldData): RoadNetworkData {
    this.rawRoads = rawWorldData.roads;
    this.nodes.clear();
    this.edges.clear();
    this.intersections = [];
    this.nodeCounter = 0;
    this.edgeCounter = 0;

    // 1. Extract all segment endpoints and find intersections
    const allSegments = this.extractSegments();
    const intersectionPoints = this.findIntersections(allSegments);

    // 2. Split segments at intersections
    const splitSegments = this.splitSegmentsAtIntersections(allSegments, intersectionPoints);

    // 3. Create nodes at all segment endpoints
    this.createNodesFromSegments(splitSegments);

    // 4. Create edges between nodes
    this.createEdgesFromSegments(splitSegments);

    // 5. Classify intersections
    this.classifyIntersections();

    // 6. Simplify geometry (remove unnecessary intermediate points)
    this.simplifyEdgeGeometry();

    // 7. Calculate metadata
    const metadata = this.calculateMetadata();

    return {
      nodes: this.nodes,
      edges: this.edges,
      intersections: this.intersections,
      bounds: rawWorldData.bounds,
      metadata
    };
  }

  /**
   * Extract line segments from raw roads
   */
  private extractSegments(): Array<{
    road: RawRoad;
    start: Vec2;
    end: Vec2;
    geometry: Vec2[];
    segmentIndex: number;
  }> {
    const segments: Array<{
      road: RawRoad;
      start: Vec2;
      end: Vec2;
      geometry: Vec2[];
      segmentIndex: number;
    }> = [];

    for (const road of this.rawRoads) {
      const path = road.path;
      if (path.length < 2) continue;

      for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i + 1];
        const segLen = distance(start, end);

        if (segLen >= MIN_SEGMENT_LENGTH) {
          segments.push({
            road,
            start,
            end,
            geometry: [start, end],
            segmentIndex: i
          });
        }
      }
    }

    return segments;
  }

  /**
   * Find all intersection points between road segments
   */
  private findIntersections(segments: Array<{ road: RawRoad; start: Vec2; end: Vec2; geometry: Vec2[]; segmentIndex: number }>): Map<string, Vec2> {
    const intersectionMap = new Map<string, Vec2>(); // key: "x,y" rounded
    const pointToSegments = new Map<string, number[]>(); // intersection point -> segment indices

    // Check all segment pairs for intersections
    for (let i = 0; i < segments.length; i++) {
      const seg1 = segments[i];

      // Add segment endpoints as potential intersections
      this.addIntersectionPoint(intersectionMap, pointToSegments, seg1.start, i);
      this.addIntersectionPoint(intersectionMap, pointToSegments, seg1.end, i);

      for (let j = i + 1; j < segments.length; j++) {
        const seg2 = segments[j];

        // Skip if same road (consecutive segments connect naturally)
        if (seg1.road.id === seg2.road.id && Math.abs(seg1.segmentIndex - seg2.segmentIndex) <= 1) {
          continue;
        }

        const intersection = lineIntersection(seg1.start, seg1.end, seg2.start, seg2.end);
        if (intersection) {
          this.addIntersectionPoint(intersectionMap, pointToSegments, intersection, i);
          this.addIntersectionPoint(intersectionMap, pointToSegments, intersection, j);
        }
      }
    }

    // Also check: segment endpoint near another segment's interior
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      for (let j = 0; j < segments.length; j++) {
        if (i === j) continue;
        if (seg.road.id === segments[j].road.id) continue;

        // Check seg.start near seg2 interior
        const { dist: d1, t: t1, closest: c1 } = distanceToSegment(seg.start, segments[j].start, segments[j].end);
        if (d1 < INTERSECTION_TOLERANCE && t1 > 0.01 && t1 < 0.99) {
          this.addIntersectionPoint(intersectionMap, pointToSegments, c1, i);
          this.addIntersectionPoint(intersectionMap, pointToSegments, c1, j);
        }

        // Check seg.end near seg2 interior
        const { dist: d2, t: t2, closest: c2 } = distanceToSegment(seg.end, segments[j].start, segments[j].end);
        if (d2 < INTERSECTION_TOLERANCE && t2 > 0.01 && t2 < 0.99) {
          this.addIntersectionPoint(intersectionMap, pointToSegments, c2, i);
          this.addIntersectionPoint(intersectionMap, pointToSegments, c2, j);
        }
      }
    }

    return intersectionMap;
  }

  private addIntersectionPoint(
    intersectionMap: Map<string, Vec2>,
    pointToSegments: Map<string, number[]>,
    point: Vec2,
    segmentIndex: number
  ): void {
    const key = `${point.x.toFixed(3)},${point.y.toFixed(3)}`;

    if (!intersectionMap.has(key)) {
      intersectionMap.set(key, point);
      pointToSegments.set(key, []);
    }

    const list = pointToSegments.get(key)!;
    if (!list.includes(segmentIndex)) {
      list.push(segmentIndex);
    }
  }

  /**
   * Split segments at intersection points
   */
  private splitSegmentsAtIntersections(
    segments: Array<{ road: RawRoad; start: Vec2; end: Vec2; geometry: Vec2[]; segmentIndex: number }>,
    intersectionPoints: Map<string, Vec2>
  ): Array<{
    road: RawRoad;
    start: Vec2;
    end: Vec2;
    geometry: Vec2[];
    originalSegmentIndex: number;
  }> {
    const splitSegments: Array<{
      road: RawRoad;
      start: Vec2;
      end: Vec2;
      geometry: Vec2[];
      originalSegmentIndex: number;
    }> = [];

    for (const seg of segments) {
      // Collect all intersection points on this segment
      const pointsOnSegment: Array<{ t: number; point: Vec2 }> = [
        { t: 0, point: seg.start },
        { t: 1, point: seg.end }
      ];

      for (const [, ipoint] of intersectionPoints) {
        const { dist, t, closest } = distanceToSegment(ipoint, seg.start, seg.end);
        if (dist < INTERSECTION_TOLERANCE && t > 0.001 && t < 0.999) {
          pointsOnSegment.push({ t, point: closest });
        }
      }

      // Sort by t parameter
      pointsOnSegment.sort((a, b) => a.t - b.t);

      // Create sub-segments
      for (let i = 0; i < pointsOnSegment.length - 1; i++) {
        const p1 = pointsOnSegment[i];
        const p2 = pointsOnSegment[i + 1];
        const len = distance(p1.point, p2.point);

        if (len >= MIN_SEGMENT_LENGTH) {
          splitSegments.push({
            road: seg.road,
            start: p1.point,
            end: p2.point,
            geometry: [p1.point, p2.point],
            originalSegmentIndex: seg.segmentIndex
          });
        }
      }
    }

    return splitSegments;
  }

  /**
   * Create nodes at all unique segment endpoints
   */
  private createNodesFromSegments(segments: Array<{ road: RawRoad; start: Vec2; end: Vec2; geometry: Vec2[] }>): void {
    const pointToNodeId = new Map<string, string>();

    for (const seg of segments) {
      for (const point of [seg.start, seg.end]) {
        const key = `${point.x.toFixed(3)},${point.y.toFixed(3)}`;

        if (!pointToNodeId.has(key)) {
          const nodeId = `node_${this.nodeCounter++}`;
          pointToNodeId.set(key, nodeId);

          this.nodes.set(nodeId, {
            id: nodeId,
            position: point,
            connectedEdges: [],
            isIntersection: false, // Will be updated later
            originalRoadIds: []
          });
        }
      }
    }
  }

  /**
   * Create edges connecting nodes
   */
  private createEdgesFromSegments(segments: Array<{ road: RawRoad; start: Vec2; end: Vec2; geometry: Vec2[] }>): void {
    const pointToNodeId = new Map<string, string>();

    // Rebuild point->node mapping
    for (const [nodeId, node] of this.nodes) {
      const key = `${node.position.x.toFixed(3)},${node.position.y.toFixed(3)}`;
      pointToNodeId.set(key, nodeId);
    }

    for (const seg of segments) {
      const startKey = `${seg.start.x.toFixed(3)},${seg.start.y.toFixed(3)}`;
      const endKey = `${seg.end.x.toFixed(3)},${seg.end.y.toFixed(3)}`;

      const fromNodeId = pointToNodeId.get(startKey);
      const toNodeId = pointToNodeId.get(endKey);

      if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) continue;

      const config = ROAD_TYPE_CONFIG[seg.road.roadType] || { defaultWidth: seg.road.width, defaultLanes: 1, priority: 1 };

      const edgeId = `edge_${this.edgeCounter++}`;
      const edge: RoadEdge = {
        id: edgeId,
        fromNode: fromNodeId,
        toNode: toNodeId,
        roadType: seg.road.roadType,
        name: seg.road.name,
        surface: seg.road.surface,
        width: seg.road.width || config.defaultWidth,
        lanes: config.defaultLanes,
        direction: 'both', // TODO: parse oneway tag
        geometry: seg.geometry,
        length: distance(seg.start, seg.end),
        originalRoadId: seg.road.id
      };

      this.edges.set(edgeId, edge);

      // Update node connections
      const fromNode = this.nodes.get(fromNodeId)!;
      const toNode = this.nodes.get(toNodeId)!;
      fromNode.connectedEdges.push(edgeId);
      toNode.connectedEdges.push(edgeId);
      fromNode.originalRoadIds.push(seg.road.id);
      toNode.originalRoadIds.push(seg.road.id);
    }

    // Deduplicate road IDs on nodes
    for (const node of this.nodes.values()) {
      node.originalRoadIds = [...new Set(node.originalRoadIds)];
    }
  }

  /**
   * Classify intersection types based on node degree
   */
  private classifyIntersections(): void {
    for (const [nodeId, node] of this.nodes) {
      const degree = node.connectedEdges.length;

      if (degree >= 3) {
        node.isIntersection = true;

        let type: RoadIntersection['type'] = 'cross';
        if (degree === 3) type = 't_junction';
        else if (degree === 1) type = 'dead_end';

        this.intersections.push({
          position: node.position,
          nodeId,
          incomingEdges: [...node.connectedEdges],
          type
        });
      } else if (degree === 1) {
        node.isIntersection = true;
        this.intersections.push({
          position: node.position,
          nodeId,
          incomingEdges: [...node.connectedEdges],
          type: 'dead_end'
        });
      }
    }
  }

  /**
   * Simplify edge geometry (remove collinear intermediate points)
   */
  private simplifyEdgeGeometry(): void {
    for (const edge of this.edges.values()) {
      if (edge.geometry.length > 2) {
        edge.geometry = simplifyPolyline(edge.geometry, SIMPLIFICATION_TOLERANCE);
      }
    }
  }

  /**
   * Calculate network metadata
   */
  private calculateMetadata(): RoadNetworkData['metadata'] {
    let totalLength = 0;
    const roadTypeCounts: Record<string, number> = {};

    for (const edge of this.edges.values()) {
      totalLength += edge.length;
      roadTypeCounts[edge.roadType] = (roadTypeCounts[edge.roadType] || 0) + 1;
    }

    return {
      totalLength,
      roadTypeCounts,
      generatedAt: new Date().toISOString()
    };
  }

  // --- Public query methods ---

  /**
   * Get node by ID
   */
  public getNode(nodeId: string): RoadNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get edge by ID
   */
  public getEdge(edgeId: string): RoadEdge | undefined {
    return this.edges.get(edgeId);
  }

  /**
   * Get all edges connected to a node
   */
  public getConnectedEdges(nodeId: string): RoadEdge[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.connectedEdges.map(eid => this.edges.get(eid)!).filter(Boolean);
  }

  /**
   * Find nearest node to a position
   */
  public findNearestNode(position: Vec2, maxDistance: number = 50): RoadNode | null {
    let nearest: RoadNode | null = null;
    let minDist = maxDistance;

    for (const node of this.nodes.values()) {
      const d = distance(position, node.position);
      if (d < minDist) {
        minDist = d;
        nearest = node;
      }
    }

    return nearest;
  }

  /**
   * Find path between two nodes (Dijkstra)
   */
  public findPath(fromNodeId: string, toNodeId: string): { nodes: string[]; edges: string[]; distance: number } | null {
    if (!this.nodes.has(fromNodeId) || !this.nodes.has(toNodeId)) return null;

    const distances = new Map<string, number>();
    const previous = new Map<string, { node: string; edge: string } | null>();
    const visited = new Set<string>();
    const queue = new Set<string>([fromNodeId]);

    distances.set(fromNodeId, 0);

    while (queue.size > 0) {
      // Find unvisited node with smallest distance
      let current: string | null = null;
      let minDist = Infinity;
      for (const nodeId of queue) {
        const d = distances.get(nodeId) ?? Infinity;
        if (d < minDist) {
          minDist = d;
          current = nodeId;
        }
      }

      if (!current || current === toNodeId) break;
      queue.delete(current);
      visited.add(current);

      const currentEdges = this.getConnectedEdges(current);
      for (const edge of currentEdges) {
        const neighborId = edge.fromNode === current ? edge.toNode : edge.fromNode;
        if (visited.has(neighborId)) continue;

        const altDist = minDist + edge.length;
        if (altDist < (distances.get(neighborId) ?? Infinity)) {
          distances.set(neighborId, altDist);
          previous.set(neighborId, { node: current, edge: edge.id });
          queue.add(neighborId);
        }
      }
    }

    if (!distances.has(toNodeId)) return null;

    // Reconstruct path
    const nodes: string[] = [toNodeId];
    const edges: string[] = [];
    let current = toNodeId;
    while (current !== fromNodeId) {
      const prev = previous.get(current);
      if (!prev) return null;
      nodes.unshift(prev.node);
      edges.unshift(prev.edge);
      current = prev.node;
    }

    return { nodes, edges, distance: distances.get(toNodeId)! };
  }

  /**
   * Export for Babylon.js mesh generation
   */
  public exportForBabylon(): {
    roadMeshes: Array<{ path: Vec2[]; width: number; roadType: string; materialKey: string }>;
    intersectionMeshes: Array<{ position: Vec2; radius: number; type: string }>;
  } {
    const roadMeshes: Array<{ path: Vec2[]; width: number; roadType: string; materialKey: string }> = [];
    const intersectionMeshes: Array<{ position: Vec2; radius: number; type: string }> = [];

    // Roads
    for (const edge of this.edges.values()) {
      roadMeshes.push({
        path: edge.geometry,
        width: edge.width,
        roadType: edge.roadType,
        materialKey: this.getMaterialKey(edge.roadType, edge.surface)
      });
    }

    // Intersections (roundabouts, crossings)
    for (const intersection of this.intersections) {
      const radius = this.calculateIntersectionRadius(intersection);
      intersectionMeshes.push({
        position: intersection.position,
        radius,
        type: intersection.type
      });
    }

    return { roadMeshes, intersectionMeshes };
  }

  private getMaterialKey(roadType: string, surface?: string): string {
    const surf = surface || 'asphalt';
    if (roadType === 'footway' || roadType === 'path' || roadType === 'cycleway') {
      return `road_${surf}_pedestrian`;
    }
    if (roadType === 'service' || roadType === 'track') {
      return `road_${surf}_service`;
    }
    return `road_${surf}_standard`;
  }

  private calculateIntersectionRadius(intersection: RoadIntersection): number {
    // Base radius on connected road widths
    let maxWidth = 3;
    for (const edgeId of intersection.incomingEdges) {
      const edge = this.edges.get(edgeId);
      if (edge && edge.width > maxWidth) maxWidth = edge.width;
    }
    return maxWidth * 1.5;
  }

  getNodes(): Map<string, RoadNode> { return this.nodes; }
  getEdges(): Map<string, RoadEdge> { return this.edges; }
  getIntersections(): RoadIntersection[] { return this.intersections; }
}

/**
 * Convenience function to build network from RawWorldData
 */
export function buildRoadNetwork(rawWorldData: RawWorldData): RoadNetworkData {
  const network = new RoadNetwork();
  return network.build(rawWorldData);
}