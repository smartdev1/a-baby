#!/usr/bin/env npx tsx
/**
 * Test BuildingPlacer from imported world.json
 * Usage: npx tsx packages/world-generator/scripts/test-building-placer.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { placeBuildings } from '../src/importers/GeoJSONImporter';
import type { RawWorldData } from '../src/importers/GeoJSONImporter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

async function main() {
  const worldPath = path.join(PROJECT_ROOT, 'packages/game-config/world.json');

  console.log(`📥 Loading world data from: ${worldPath}`);

  try {
    const worldData: RawWorldDataType = JSON.parse(await fs.readFile(worldPath, 'utf-8'));

    console.log(`✅ Loaded: ${worldData.buildings.length} buildings, ${worldData.roads.length} roads, ${worldData.pois.length} POIs`);

    console.log('\n🏗️ Building placements...');
    const buildings = placeBuildings(worldData.buildings);

    console.log('\n📊 Building Placement Statistics:');
    console.log(`   Total buildings: ${buildings.length}`);

    // Height distribution
    const heightDist: Record<number, number> = {};
    for (const b of buildings) {
      heightDist[b.height] = (heightDist[b.height] || 0) + 1;
    }
    console.log('\n📏 Height Distribution:');
    for (const [height, count] of Object.entries(heightDist).sort((a,b) => Number(a[0]) - Number(b[0]))) {
      const floors = Math.round(height / 3);
      console.log(`   ${height}m (${floors} étages): ${count} bâtiments`);
    }

    // Material distribution
    const materialDist: Record<string, number> = {};
    for (const b of buildings) {
      materialDist[b.materialKey] = (materialDist[b.materialKey] || 0) + 1;
    }
    console.log('\n🎨 Material Distribution:');
    for (const [mat, count] of Object.entries(materialDist).sort((a,b) => b[1] - a[1])) {
      console.log(`   ${mat}: ${count}`);
    }

    // Sample buildings
    console.log('\n🏢 Sample Buildings (first 5):');
    for (let i = 0; i < Math.min(5, buildings.length); i++) {
      const b = buildings[i];
      console.log(`   ${b.id}: ${b.height.toFixed(1)}m, ${b.levels} étages, ${b.materialKey}, center: (${b.center.x.toFixed(1)}, ${b.center.y.toFixed(1)})`);
    }

    // Count by type
    const typeCounts: Record<string, number> = {};
    for (const b of buildings) {
      typeCounts[b.materialKey] = (typeCounts[b.materialKey] || 0) + 1;
    }
    console.log('\n📈 Building Types Summary:');
    for (const [type, count] of Object.entries(typeCounts).sort((a,b) => b[1] - a[1])) {
      console.log(`   ${type}: ${count}`);
    }

    // Save building data
    const outputPath = path.join(PROJECT_ROOT, 'packages/game-config/buildings.json');
    await fs.writeFile(outputPath, JSON.stringify(buildings, null, 2));
    console.log(`\n💾 Buildings saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();