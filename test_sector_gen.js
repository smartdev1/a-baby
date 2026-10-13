const fs = require("fs");
const world = JSON.parse(fs.readFileSync("C:\\Users\\Aristide Adouko\\Downloads\\a_baby\\packages\\game-config\\world.json", "utf-8"));
const road = JSON.parse(fs.readFileSync("C:\\Users\\Aristide Adouko\\Downloads\\a_baby\\packages\\game-config\\road-network.json", "utf-8"));

console.log("=== Sector Generation Test ===");
console.log("Buildings:", world.buildings.length);
console.log("Roads:", road.edges ? Object.keys(road.edges).length : "N/A");
console.log("POIs:", world.pois ? world.pois.length : "N/A");
console.log("Total road length:", road.metadata?.totalLength?.toFixed(1));
console.log("");

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

for (const sectorId of sectors) {
  const bounds = sectorBounds[sectorId];
  let buildingCount = 0;
  let roadCount = 0;
  let poiCount = 0;

  for (const b of world.buildings) {
    const cx = b.footprint.reduce((sum, p) => sum + p.x, 0) / b.footprint.length;
    const cy = b.footprint.reduce((sum, p) => sum + p.y, 0) / b.footprint.length;
    if (cx >= bounds.minX && cx < bounds.maxX && cy >= bounds.minY && cy < bounds.maxY) {
      buildingCount++;
    }
  }

  for (const [edgeId, edgeObj] of Object.entries(road.edges)) {
    if (!edgeObj.geometry) continue;
    const hasInSector = edgeObj.geometry.some(pt =>
      pt.x >= bounds.minX && pt.x < bounds.maxX && pt.y >= bounds.minY && pt.y < bounds.maxY
    );
    if (hasInSector) roadCount++;
  }

  if (world.pois) {
    for (const p of world.pois) {
      if (p.position.x >= bounds.minX && p.position.x < bounds.maxX && p.position.y >= bounds.minY && p.position.y < bounds.maxY) {
        poiCount++;
      }
    }
  }

  console.log(sectorId + ": buildings=" + buildingCount + ", road-edges=" + roadCount + ", POIs=" + poiCount);
}

console.log("");
console.log("=== Done ===");