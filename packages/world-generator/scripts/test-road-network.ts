#!/usr/bin/env npx tsx
/**
 * Test RoadNetwork build from imported world.json
 * Usage: npx tsx packages/world-generator/scripts/test-road-network.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { buildRoadNetwork, RoadNetwork } from '../src/roads/RoadNetwork';
import type { RawWorldData, RoadNetworkData } from '../src/importers/GeoJSONImporter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

async function main() {
  const worldPath = path.join(PROJECT_ROOT, 'packages/game-config/world.json');

  console.log(`📥 Loading world data from: ${worldPath}`);

  try {
    const content = await fs.readFile(worldPath, 'utf-8');
    const worldData: RawWorldData = JSON.parse(content);

    console.log(`✅ Loaded: ${worldData.buildings.length} buildings, ${worldData.roads.length} roads, ${worldData.pois.length} POIs`);

    console.log('\n🛣️ Building road network...');
    const network = buildRoadNetwork(worldData);

    console.log('\n📊 Road Network Statistics:');
    console.log(`   Nodes: ${network.nodes.size}`);
    console.log(`   Edges: ${network.edges.size}`);
    console.log(`   Intersections: ${network.intersections.length}`);
    console.log(`   Total length: ${network.metadata.totalLength.toFixed(1)}m`);

    console.log('\n🔗 Intersection Types:');
    const typeCounts: Record<string, number> = {};
    for (const inter of network.intersections) {
      typeCounts[inter.type] = (typeCounts[inter.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(typeCounts)) {
      console.log(`   ${type}: ${count}`);
    }

    console.log('\n🛣️ Road Types in Network:');
    for (const [type, count] of Object.entries(network.metadata.roadTypeCounts).sort((a,b) => b[1] - a[1])) {
      console.log(`   ${type}: ${count} segments`);
    }

    // Show some sample nodes
    console.log('\n📍 Sample Nodes (first 5):');
    let nodeCount = 0;
    for (const [id, node] of network.nodes) {
      if (nodeCount >= 5) break;
      console.log(`   ${id}: (${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}) - ${node.connectedEdges.length} edges - intersection: ${node.isIntersection}`);
      nodeCount++;
    }

    // Show some sample edges
    console.log('\n🛤️ Sample Edges (first 5):');
    let edgeCount = 0;
    for (const [id, edge] of network.edges) {
      if (edgeCount >= 5) break;
      console.log(`   ${id}: ${edge.roadType} - ${edge.length.toFixed(1)}m - ${edge.width}m wide - ${edge.lanes} lanes`);
      edgeCount++;
    }

    // Create RoadNetwork instance for pathfinding and Babylon export
    const rn = new RoadNetwork();
    rn.build(worldData);

    // Test pathfinding
    console.log('\n🧭 Testing pathfinding...');
    const nodeIds = Array.from(rn.getNodes().keys());
    if (nodeIds.length >= 2) {
      const result = rn.findPath(nodeIds[0], nodeIds[Math.floor(nodeIds.length / 2)]);
      if (result) {
        console.log(`   Path found: ${result.nodes.length} nodes, ${result.edges.length} edges, ${result.distance.toFixed(1)}m`);
      } else {
        console.log('   No path between test nodes (disconnected graph)');
      }
    }

    // Export for Babylon.js
    console.log('\n🎮 Babylon.js Export Preview:');
    const babylonExport = rn.exportForBabylon();
    console.log(`   Road meshes: ${babylonExport.roadMeshes.length}`);
    console.log(`   Intersection meshes: ${babylonExport.intersectionMeshes.length}`);

    // Material keys
    const materials = new Set<string>();
    for (const mesh of babylonExport.roadMeshes) {
      materials.add(mesh.materialKey);
    }
    console.log(`   Materials needed: ${Array.from(materials).join(', ')}`);

    // Save network data for later use
    const outputPath = path.join(PROJECT_ROOT, 'packages/game-config/road-network.json');
    const serializable = {
      nodes: Array.from(network.nodes.entries()),
      edges: Array.from(network.edges.entries()),
      intersections: network.intersections,
      bounds: network.bounds,
      metadata: network.metadata
    };
    await fs.writeFile(outputPath, JSON.stringify(serializable, null, 2));
    console.log(`\n💾 Network saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();