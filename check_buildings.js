const fs = require("fs");
const world = JSON.parse(fs.readFileSync("C:\\Users\\Aristide Adouko\\Downloads\\a_baby\\packages\\game-config\\world.json", "utf-8"));
const b = world.buildings[0];
console.log("First building footprint length:", b.footprint.length);
console.log("First 3 footprint points:", b.footprint.slice(0,3).map(p => "(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ")"));
console.log("Building id:", b.id);