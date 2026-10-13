#!/usr/bin/env npx tsx
/**
 * Import GeoJSON and output RawWorldData as JSON
 * Usage: npx tsx packages/world-generator/scripts/import-geojson.ts [input.geojson] [output.json]
 */

import { importGeoJSON } from '../src/importers/GeoJSONImporter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

async function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0] || path.join(PROJECT_ROOT, 'data/source/export.geojson');
  const outputPath = args[1] || path.join(PROJECT_ROOT, 'packages/game-config/world.json');

  console.log(`📥 Importing GeoJSON from: ${inputPath}`);

  try {
    const worldData = await importGeoJSON(inputPath);

    console.log(`✅ Import successful!`);
    console.log(`   Buildings: ${worldData.buildings.length}`);
    console.log(`   Roads: ${worldData.roads.length}`);
    console.log(`   POIs: ${worldData.pois.length}`);
    console.log(`   Bounds: [${worldData.bounds.min.x.toFixed(1)}, ${worldData.bounds.min.y.toFixed(1)}] → [${worldData.bounds.max.x.toFixed(1)}, ${worldData.bounds.max.y.toFixed(1)}]`);
    console.log(`   Projection scale: ${worldData.projection.scale.toFixed(4)}`);
    console.log(`   Center: (${worldData.projection.refLon.toFixed(6)}, ${worldData.projection.refLat.toFixed(6)})`);

    // POI breakdown by type
    const poiTypes: Record<string, number> = {};
    for (const poi of worldData.pois) {
      poiTypes[poi.poiType] = (poiTypes[poi.poiType] || 0) + 1;
    }
    console.log('\n📍 POI Categories:');
    for (const [type, count] of Object.entries(poiTypes).sort((a,b) => b[1] - a[1])) {
      console.log(`   ${type}: ${count}`);
    }

    // Road breakdown by type
    const roadTypes: Record<string, number> = {};
    for (const road of worldData.roads) {
      roadTypes[road.roadType] = (roadTypes[road.roadType] || 0) + 1;
    }
    console.log('\n🛣️ Road Types:');
    for (const [type, count] of Object.entries(roadTypes).sort((a,b) => b[1] - a[1])) {
      console.log(`   ${type}: ${count}`);
    }

    // Building height distribution
    const heightDist: Record<number, number> = {};
    for (const b of worldData.buildings) {
      heightDist[b.height] = (heightDist[b.height] || 0) + 1;
    }
    console.log('\n🏢 Building Heights:');
    for (const [height, count] of Object.entries(heightDist).sort((a,b) => Number(a[0]) - Number(b[0]))) {
      console.log(`   ${height}m: ${count}`);
    }

    // Ensure output directory exists
    const outDir = path.dirname(outputPath);
    await fs.mkdir(outDir, { recursive: true });

    // Write output
    await fs.writeFile(outputPath, JSON.stringify(worldData, null, 2));
    console.log(`\n💾 Written to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

main();