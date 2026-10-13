const fs = require("fs");
const road = JSON.parse(fs.readFileSync("C:\\Users\\Aristide Adouko\\Downloads\\a_baby\\packages\\game-config\\road-network.json", "utf-8"));

console.log("Road edges structure check:");
const edgeEntries = Object.entries(road.edges);
console.log("Number of edges:", edgeEntries.length);
console.log("First edge key:", edgeEntries[0][0]);
console.log("First edge value type:", typeof edgeEntries[0][1]);
console.log("First edge value:", JSON.stringify(edgeEntries[0][1]).substring(0, 200));

// Check geometry
const firstEdge = edgeEntries[0][1];
if (firstEdge.geometry) {
  console.log("First edge geometry length:", firstEdge.geometry.length);
  console.log("First 3 geometry points:", firstEdge.geometry.slice(0,3).map(pt => "(" + pt.x.toFixed(1) + "," + pt.y.toFixed(1) + ")"));
} else {
  console.log("First edge has NO geometry property");
  console.log("First edge keys:", Object.keys(firstEdge).slice(0, 10));
}