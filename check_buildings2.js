const fs = require("fs");
const world = JSON.parse(fs.readFileSync("C:\\Users\\Aristide Adouko\\Downloads\\a_baby\\packages\\game-config\\world.json", "utf-8"));
const b = world.buildings[0];
console.log("Building id:", b.id);
console.log("Footprint type:", Array.isArray(b.footprint) ? "array" : typeof b.footprint);
console.log("Footprint length (rings):", b.footprint ? b.footprint.length : "null");
if (b.footprint && b.footprint.length > 0) {
  const ring = b.footprint[0];
  console.log("First ring length:", ring.length);
  console.log("First 3 ring points:", ring.slice(0,3).map(p => "(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ")"));
}