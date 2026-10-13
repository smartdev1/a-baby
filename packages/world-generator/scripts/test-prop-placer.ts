#!/usr/bin/env npx tsx
/**
 * Test PropPlacer from imported world.json and road-network
 * Usage: npx tsx packages/world-generator/scripts/test-prop-placer.ts
 *
 * Note: road-network.json edges stored as [id, {properties}] arrays
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { importGeoJSON, buildRoadNetwork, RawWorldData } from '../src';
import { placeProps } from '../src/props';
import type { RawWorldData as RawWorldDataType } from '../src/importers/GeoJSONImporter';
import { Vec2 } from '../src/projection/TerrainProjection';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

async function main() {
  const worldPath = path.join(PROJECT_ROOT, 'packages/game-config/world.json');
  const roadPath = path.join(PROJECT_ROOT, 'packages/game-config/road-network.json');

  console.log(`📥 Loading world data from: ${worldPath}`);
  console.log(`📥 Loading road network from: ${roadPath}`);

  try {
    const worldData: RawWorldDataType = JSON.parse(await fs.readFile(worldPath, 'utf-8'));
    // Road network from file - edges are stored as [id, {properties}] arrays
    const roadNetworkJson = JSON.parse(await fs.readFile(roadPath, 'utf-8'));
    const edgeCount = Object.keys(roadNetworkJson.edges).length;

    console.log(`✅ Loaded: ${worldData.buildings.length} buildings, ${worldData.roads.length} roads, ${worldData.pois.length} POIs`);
    console.log(`   Road network: ${edgeCount} edges, ${roadNetworkJson.intersections?.length || 0} intersections, ${roadNetworkJson.metadata?.totalLength?.toFixed(1)}m total`);

    // Build RoadNetworkData compatible for PropPlacer
    // Edges are stored as [id_string, {properties_object}] arrays
    const roadNetworkData: any = {
      nodes: new Map(),
      edges: new Map(),
      intersections: roadNetworkJson.intersections || [],
      metadata: roadNetworkJson.metadata || { totalLength: 0, roadTypeCounts: {}, generatedAt: '' }
    };

    // Track node positions (keyed by node id)
    const nodePositions = new Map<string, Vec2>();
    const nodeDegree: Record<string, number> = {};

    // Process each edge
    for (const [edgeKey, edgeValue] of Object.entries(roadNetworkJson.edges)) {
      // Edge format: [id_string, {properties_object}]
      const edgeEntries = edgeValue as [string, any];
      const edgeId = edgeEntries[0];
      const edgeProps = edgeEntries[1] || {};

      const geometry = edgeProps.geometry as Vec2[]; // Array of {x, y}
      if (!geometry || geometry.length < 2) continue;

      // Parse road type
      const roadType = edgeProps.roadType || 'residential';

      // Create simplified edge object for PropPlacer
      const propEdge: any = {
        id: edgeId,
        fromNode: edgeProps.fromNode || `node_${roadNetworkData.nodes.size}`,
        toNode: edgeProps.toNode || `node_${roadNetworkData.nodes.size + 1}`,
        roadType: roadType,
        name: edgeProps.name,
        surface: edgeProps.surface,
        width: edgeProps.width || 6,
        lanes: edgeProps.lanes || 1,
        direction: edgeProps.direction || 'both',
        geometry: geometry, // Already Vec2[]
        length: edgeProps.length || this.calculatePathLength(geometry),
        originalRoadId: edgeProps.originalRoadId || ''
      };

      // Determine node positions from geometry endpoints
      const startPos: Vec2 = geometry[0];
      const endPos: Vec2 = geometry[geometry.length - 1];

      // Register nodes
      if (!roadNetworkData.nodes.has(propEdge.fromNode)) {
        roadNetworkData.nodes.set(propEdge.fromNode, {
          id: propEdge.fromNode,
          position: startPos,
          connectedEdges: [],
          isIntersection: false,
          originalRoadIds: []
        });
        nodePositions.set(propEdge.fromNode, startPos);
      }
      if (!roadNetworkData.nodes.has(propEdge.toNode)) {
        roadNetworkData.nodes.set(propEdge.toNode, {
          id: propEdge.toNode,
          position: endPos,
          connectedEdges: [],
          isIntersection: false,
          originalRoadIds: []
        });
        nodePositions.set(propEdge.toNode, endPos);
      }

      // Update node degree count
      nodeDegree[propEdge.fromNode] = (nodeDegree[propEdge.fromNode] || 0) + 1;
      nodeDegree[propEdge.toNode] = (nodeDegree[propEdge.toNode] || 0) + 1;

      // Add connected edges to nodes
      const fromNode = roadNetworkData.nodes.get(propEdge.fromNode)!;
      const toNode = roadNetworkData.nodes.get(propEdge.toNode)!;
      fromNode.connectedEdges.push(propEdge.id);
      toNode.connectedEdges.push(propEdge.id);
      fromNode.originalRoadIds.push(edgeProps.originalRoadId || '');
      toNode.originalRoadIds.push(edgeProps.originalRoadId || '');

      // Add edge to network
      roadNetworkData.edges.set(propEdge.id, propEdge);
    }

    // Determine which nodes are intersections (degree >= 3)
    for (const [nodeId, node] of roadNetworkData.nodes) {
      node.isIntersection = (nodeDegree[nodeId] || 0) >= 3;
      node.connectedEdges = [...new Set(node.connectedEdges)]; // dedup
    }

    console.log(`\n🌳 Placing props...`);
    const props = placeProps(worldData, roadNetworkData);

    console.log('\n📊 Prop Placement Statistics:');
    console.log(`   Total props: ${props.length}`);

    // Count by type
    const typeCounts: Record<string, number> = {};
    for (const p of props) {
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
    }
    console.log('\n🌲 Prop Types:');
    for (const [type, count] of Object.entries(typeCounts).sort((a,b) => b[1] - a[1])) {
      console.log(`   ${type}: ${count}`);
    }

    // POI props
    const poiProps = props.filter((p: any) => p.originalRef);
    console.log(`\n📍 POI-linked props: ${poiProps.length}`);

    // Road props
    const roadProps = props.filter((p: any) => !p.originalRef);
    console.log(`\n🛣️ Road-side props: ${roadProps.length}`);

    // Sample props
    console.log('\n📍 Sample Props (first 8):');
    for (let i = 0; i < Math.min(8, props.length); i++) {
      const p = props[i];
      const ref = p.originalRef ? `(ref: ${p.originalRef})` : '';
      console.log(`   ${p.id}: ${p.type} @ (${p.position.x.toFixed(1)}, ${p.position.y.toFixed(1)}) ${ref} scale:${p.scale.toFixed(1)}`);
    }

    // Save prop data
    const outputPath = path.join(PROJECT_ROOT, 'packages/game-config/props.json');
    await fs.writeFile(outputPath, JSON.stringify(props, null, 2));
    console.log(`\n💾 Props saved to: ${outputPath}`);

    // Summary
    console.log('\n📈 Summary:');
    console.log(`   • ${props.length} props total`);
    console.log(`   • ${roadProps.length} road-side (trees, lights, benches)`);
    console.log(`   • ${poiProps.length} at POIs (healthcare, education, commerce, etc.)`);
    console.log(`   • ${Object.keys(typeCounts).length} prop types`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();