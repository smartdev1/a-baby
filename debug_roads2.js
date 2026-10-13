const fs = require("fs");
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

function isInSector(x, y, bounds) {
  return x >= bounds.minX && x < bounds.maxX && y >= bounds.minY && y < bounds.maxY;
}

// Check roads per sector - properly accessing [id, {properties}] format
for (const [sid, bounds] of Object.entries(sectorBounds)) {
  let roadCount = 0;
  let checked = 0;
  for (const [edgeKey, edgeValue] of Object.entries(road.edges)) {
    // Edge format: [id_string, {properties_object}]
    const edgeEntries = edgeValue; // already parsed as [id, props]
    if (!edgeEntries || !edgeEntries[1]) continue;
    const edgeProps = edgeEntries[1];
    if (!edgeProps.geometry) { checked++; continue; }
    checked++;
    const hasInSector = edgeProps.geometry.some(pt =>
      isInSector(pt.x, pt.y, bounds)
    );
    if (hasInSector) roadCount++;
  }
  console.log(sid + ": " + roadCount + " roads (checked " + checked + ")");
}