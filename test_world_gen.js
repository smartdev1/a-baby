// Test WorldGenerator sector generation - using world.json data directly
const fs = require("fs");
const world = JSON.parse(fs.readFileSync("C:\\Users\\Aristide Adouko\\Downloads\\a_baby\\packages\\game-config\\world.json", "utf-8"));
const road = JSON.parse(fs.readFileSync("C:\\Users\\Aristide Adouko\\Downloads\\a_baby\\packages\\game-config\\road-network.json", "utf-8"));

const sectors = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
const sectorBounds = {
  A1: {minX:0, maxX:100, minY:0, maxY:100},
  A2: {minX:100, maxX:200, minY:0, maxY:100},
  A3: {minX:200, maxX:300, minY:0, maxY:100},
  B1: {minX:0, maxX:100, minY:100, maxY:200},
  B2: {minX:100, maxX:200, minY:100, maxY:200},
  B3: {minX:200, maxX:300, minY:100, maxY:200},
  C1: {minX:0, maxX:100, minY:200, maxY:300},
  C2: {minX:100, maxX:200, minY:200, maxY:300},
  C3: {minX:200, maxX:300, minY:200, maxY:300},
};

function computePolygonCentroid(ring) {
  if (ring.length === 0) return { x: 0, y: 0 };
  if (ring.length === 1) return ring[0];
  let sumX = 0, sumY = 0;
  for (const p of ring) { sumX += p.x; sumY += p.y; }
  return { x: sumX / ring.length, y: sumY / ring.length };
}

function isInSector(x, y, bounds) {
  return x >= bounds.minX && x < bounds.maxX && y >= bounds.minY && y < bounds.maxY;
}

const sectorCounts = { A1: 0, A2: 0, A3: 0, B1: 0, B2: 0, B3: 0, C1: 0, C2: 0, C3: 0 };

for (const b of world.buildings) {
  const centroid = computePolygonCentroid(b.footprint[0]);
  for (const [sid, bounds] of Object.entries(sectorBounds)) {
    if (isInSector(centroid.x, centroid.y, bounds)) {
      sectorCounts[sid]++;
      break;
    }
  }
}

console.log("Building distribution per sector:");
let total = 0;
for (const [sid, count] of Object.entries(sectorCounts)) {
  console.log("  " + sid + ": " + count);
  total += count;
}
console.log("  Total: " + total);

console.log("\nRoad edges per sector:");
for (const [sid, bounds] of Object.entries(sectorBounds)) {
  let roadCount = 0;
  for (const [edgeId, edgeObj] of Object.entries(road.edges)) {
    if (!edgeObj.geometry) continue;
    if (edgeObj.geometry.some(pt => isInSector(pt.x, pt.y, bounds))) {
      roadCount++;
    }
  }
  console.log("  " + sid + ": " + roadCount + " edges");
}

console.log("\nPOI distribution per sector:");
const sectorPOICounts = { A1: 0, A2: 0, A3: 0, B1: 0, B2: 0, B3: 0, C1: 0, C2: 0, C3: 0 };
for (const p of world.pois) {
  for (const [sid, bounds] of Object.entries(sectorBounds)) {
    if (isInSector(p.position.x, p.position.y, bounds)) {
      sectorPOICounts[sid]++;
      break;
    }
  }
}
for (const [sid, count] of Object.entries(sectorPOICounts)) {
  console.log("  " + sid + ": " + count);
}