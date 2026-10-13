#!/usr/bin/env npx tsx
"use strict";
/**
 * Test RoadNetwork build from imported world.json
 * Usage: npx tsx packages/world-generator/scripts/test-road-network.ts
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs/promises");
var path = require("path");
var url_1 = require("url");
var RoadNetwork_1 = require("../src/roads/RoadNetwork");
var __dirname = path.dirname((0, url_1.fileURLToPath)(import.meta.url));
var PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var worldPath, content, worldData, network, typeCounts, _i, _a, inter, _b, _c, _d, type, count, _e, _f, _g, type, count, nodeCount, _h, _j, _k, id, node, edgeCount, _l, _m, _o, id, edge, rn, nodeIds, result, babylonExport, materials, _p, _q, mesh, outputPath, serializable, error_1;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    worldPath = path.join(PROJECT_ROOT, 'packages/game-config/world.json');
                    console.log("\uD83D\uDCE5 Loading world data from: ".concat(worldPath));
                    _r.label = 1;
                case 1:
                    _r.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fs.readFile(worldPath, 'utf-8')];
                case 2:
                    content = _r.sent();
                    worldData = JSON.parse(content);
                    console.log("\u2705 Loaded: ".concat(worldData.buildings.length, " buildings, ").concat(worldData.roads.length, " roads, ").concat(worldData.pois.length, " POIs"));
                    console.log('\n🛣️ Building road network...');
                    network = (0, RoadNetwork_1.buildRoadNetwork)(worldData);
                    console.log('\n📊 Road Network Statistics:');
                    console.log("   Nodes: ".concat(network.nodes.size));
                    console.log("   Edges: ".concat(network.edges.size));
                    console.log("   Intersections: ".concat(network.intersections.length));
                    console.log("   Total length: ".concat(network.metadata.totalLength.toFixed(1), "m"));
                    console.log('\n🔗 Intersection Types:');
                    typeCounts = {};
                    for (_i = 0, _a = network.intersections; _i < _a.length; _i++) {
                        inter = _a[_i];
                        typeCounts[inter.type] = (typeCounts[inter.type] || 0) + 1;
                    }
                    for (_b = 0, _c = Object.entries(typeCounts); _b < _c.length; _b++) {
                        _d = _c[_b], type = _d[0], count = _d[1];
                        console.log("   ".concat(type, ": ").concat(count));
                    }
                    console.log('\n🛣️ Road Types in Network:');
                    for (_e = 0, _f = Object.entries(network.metadata.roadTypeCounts).sort(function (a, b) { return b[1] - a[1]; }); _e < _f.length; _e++) {
                        _g = _f[_e], type = _g[0], count = _g[1];
                        console.log("   ".concat(type, ": ").concat(count, " segments"));
                    }
                    // Show some sample nodes
                    console.log('\n📍 Sample Nodes (first 5):');
                    nodeCount = 0;
                    for (_h = 0, _j = network.nodes; _h < _j.length; _h++) {
                        _k = _j[_h], id = _k[0], node = _k[1];
                        if (nodeCount >= 5)
                            break;
                        console.log("   ".concat(id, ": (").concat(node.position.x.toFixed(1), ", ").concat(node.position.y.toFixed(1), ") - ").concat(node.connectedEdges.length, " edges - intersection: ").concat(node.isIntersection));
                        nodeCount++;
                    }
                    // Show some sample edges
                    console.log('\n🛤️ Sample Edges (first 5):');
                    edgeCount = 0;
                    for (_l = 0, _m = network.edges; _l < _m.length; _l++) {
                        _o = _m[_l], id = _o[0], edge = _o[1];
                        if (edgeCount >= 5)
                            break;
                        console.log("   ".concat(id, ": ").concat(edge.roadType, " - ").concat(edge.length.toFixed(1), "m - ").concat(edge.width, "m wide - ").concat(edge.lanes, " lanes"));
                        edgeCount++;
                    }
                    rn = new RoadNetwork_1.RoadNetwork();
                    rn.build(worldData);
                    // Test pathfinding
                    console.log('\n🧭 Testing pathfinding...');
                    nodeIds = Array.from(rn.getNodes().keys());
                    if (nodeIds.length >= 2) {
                        result = rn.findPath(nodeIds[0], nodeIds[Math.floor(nodeIds.length / 2)]);
                        if (result) {
                            console.log("   Path found: ".concat(result.nodes.length, " nodes, ").concat(result.edges.length, " edges, ").concat(result.distance.toFixed(1), "m"));
                        }
                        else {
                            console.log('   No path between test nodes (disconnected graph)');
                        }
                    }
                    // Export for Babylon.js
                    console.log('\n🎮 Babylon.js Export Preview:');
                    babylonExport = rn.exportForBabylon();
                    console.log("   Road meshes: ".concat(babylonExport.roadMeshes.length));
                    console.log("   Intersection meshes: ".concat(babylonExport.intersectionMeshes.length));
                    materials = new Set();
                    for (_p = 0, _q = babylonExport.roadMeshes; _p < _q.length; _p++) {
                        mesh = _q[_p];
                        materials.add(mesh.materialKey);
                    }
                    console.log("   Materials needed: ".concat(Array.from(materials).join(', ')));
                    outputPath = path.join(PROJECT_ROOT, 'packages/game-config/road-network.json');
                    serializable = {
                        nodes: Array.from(network.nodes.entries()),
                        edges: Array.from(network.edges.entries()),
                        intersections: network.intersections,
                        bounds: network.bounds,
                        metadata: network.metadata
                    };
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(serializable, null, 2))];
                case 3:
                    _r.sent();
                    console.log("\n\uD83D\uDCBE Network saved to: ".concat(outputPath));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _r.sent();
                    console.error('❌ Test failed:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
main();
//# sourceMappingURL=test-road-network.js.map