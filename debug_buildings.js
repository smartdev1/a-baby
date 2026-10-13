const fs = require("fs");
const world = JSON.parse(fs.readFileSync("C:\\Users\\Aristide Adouko\\Downloads\\a_baby\\packages\\game-config\\world.json", "utf-8"));

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

for (const b of world.buildings) {
  const centroid = computePolygonCentroid(b.footprint[0]);
  const cx = centroid.x.toFixed(1);
  const cy = centroid.y.toFixed(1);

  // Find which sector
  let sector = "?";
  for (const sid of sectors) {
    const sb = sectorBounds[sid];
    if (cx >= sb.minX && cx < sb.maxX && cy >= sb.minY && cy < sb.maxY) {
      sector = sid;
      break;
    }
  }

  if (sector !== "?") {
    console.log(b.id + ": centroid=(" + cx + "," + cy + ") sector=" + sector);
  }
}