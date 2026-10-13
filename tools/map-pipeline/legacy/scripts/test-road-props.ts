#!/usr/bin/env npx tsx
/**
 * Test road-side props ONLY (no POI props)
 * Usage: npx tsx packages/world-generator/scripts/test-road-props.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { importGeoJSON, RawWorldData } from '../src';
import { PropPlacer } from '../src/props';
import type { RawWorldData as RawWorldDataType } from '../src/importers/GeoJSONImporter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

async function main() {
  const worldPath = path.join(PROJECT_ROOT, 'packages/game-config/world.json');
  const roadPath = path.join(PROJECT_ROOT, 'packages/game-config/road-network.json');

  console.log(`📥 Loading world data from: ${worldPath}`);
  console.log(`📥 Loading road network from: ${roadPath}`);

  try {
    const worldData: RawWorldDataType = JSON.parse(await fs.readFile(worldPath, 'utf-8'));
    const roadNetworkJson = JSON.parse(await fs.readFile(roadPath, 'utf-8'));
    const edgeCount = Object.keys(roadNetworkJson.edges).length;

    console.log(`✅ Loaded: ${worldData.buildings.length} buildings, ${worldData.roads.length} roads, ${worldData.pois.length} POIs`);
    console.log(`   Road network: ${edgeCount} edges, ${roadNetworkJson.intersections?.length || 0} intersections, ${roadNetworkJson.metadata?.totalLength?.toFixed(1)}m total`);

    // Test 1: Default densities, no POIs
    console.log('\n--- Test 1: Densités par défaut, pas de POIs ---');
    const placer1 = new PropPlacer({
      treeDensity: 0.05,
      streetLightDensity: 0.1,
      placeAtPOIs: false,
      maxProps: 500,
      sideOffset: 3
    }, worldData);
    const roadProps1 = placer1.placeAlongRoads();
    console.log(`   Longueur routes: ${roadNetworkJson.metadata?.totalLength?.toFixed(1)}m`);
    console.log(`   Arbres placés: ${roadProps1.length}`);

    const typeCounts1: Record<string, number> = {};
    for (const p of roadProps1) typeCounts1[p.type] = (typeCounts1[p.type] || 0) + 1;
    console.log(`   Répartition: ${Object.entries(typeCounts1).length > 0 ? Object.entries(typeCounts1).map(([k,v]) => `${k}:${v}`).join(', ') : 'aucune'}`);

    // Test 2: Augmented densities
    console.log('\n--- Test 2: Densités x2 ---');
    const placer2 = new PropPlacer({
      treeDensity: 0.1,
      streetLightDensity: 0.2,
      placeAtPOIs: false,
      maxProps: 500,
      sideOffset: 3
    }, worldData);
    const roadProps2 = placer2.placeAlongRoads();
    console.log(`   Arbres: ${roadProps2.length}`);
    const typeCounts2: Record<string, number> = {};
    for (const p of roadProps2) typeCounts2[p.type] = (typeCounts2[p.type] || 0) + 1;
    console.log(`   Répartition: ${Object.entries(typeCounts2).length > 0 ? Object.entries(typeCounts2).map(([k,v]) => `${k}:${v}`).join(', ') : 'aucune'}`);

    // Test 3: Maximum density
    console.log('\n--- Test 3: Densité maximale ---');
    const placer3 = new PropPlacer({
      treeDensity: 0.25,
      streetLightDensity: 0.5,
      placeAtPOIs: false,
      maxProps: 9999,
      sideOffset: 5
    }, worldData);
    const roadProps3 = placer3.placeAlongRoads();
    console.log(`   Arbres: ${roadProps3.length}`);
    const typeCounts3: Record<string, number> = {};
    for (const p of roadProps3) typeCounts3[p.type] = (typeCounts3[p.type] || 0) + 1;
    console.log(`   Répartition: ${Object.entries(typeCounts3).length > 0 ? Object.entries(typeCounts3).map(([k,v]) => `${k}:${v}`).join(', ') : 'aucune'}`);

    // Summary
    console.log('\n📊 Résumé:');
    console.log(`   Longueur routes: ${roadNetworkJson.metadata?.totalLength?.toFixed(1)}m`);
    console.log(`   Arbres (défaut): ${roadProps1.length}`);
    console.log(`   Arbres (x2): ${roadProps2.length}`);
    console.log(`   Arbres (max): ${roadProps3.length}`);

    // Save config
    const outputPath = path.join(PROJECT_ROOT, 'packages/game-config/road-prop-config.json');
    const config = {
      default: { treeDensity: 0.05, streetLightDensity: 0.1 },
      x2: { treeDensity: 0.1, streetLightDensity: 0.2 },
      max: { treeDensity: 0.25, streetLightDensity: 0.5 }
    };
    await fs.writeFile(outputPath, JSON.stringify(config, null, 2));
    console.log(`\n💾 Config saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();