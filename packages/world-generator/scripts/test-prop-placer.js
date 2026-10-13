#!/usr/bin/env npx tsx
"use strict";
/**
 * Test PropPlacer from imported world.json and road-network
 * Usage: npx tsx packages/world-generator/scripts/test-prop-placer.ts
 *
 * Note: road-network.json edges stored as [id, {properties}] arrays
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs/promises");
var path = require("path");
var url_1 = require("url");
var props_1 = require("../src/props");
var __dirname = path.dirname((0, url_1.fileURLToPath)(import.meta.url));
var PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var worldPath, roadPath, worldData, _a, _b, roadNetworkJson, _c, _d, edgeCount, roadNetworkData, nodePositions, nodeDegree, _i, _e, _f, edgeKey, edgeValue, edgeEntries, edgeId, edgeProps, geometry, roadType, propEdge, startPos, endPos, fromNode, toNode, _g, _h, _j, nodeId, node, props, typeCounts, _k, props_2, p, _l, _m, _o, type, count, poiProps, roadProps, i, p, ref, outputPath, error_1;
        var _p, _q, _r;
        return __generator(this, function (_s) {
            switch (_s.label) {
                case 0:
                    worldPath = path.join(PROJECT_ROOT, 'packages/game-config/world.json');
                    roadPath = path.join(PROJECT_ROOT, 'packages/game-config/road-network.json');
                    console.log("\uD83D\uDCE5 Loading world data from: ".concat(worldPath));
                    console.log("\uD83D\uDCE5 Loading road network from: ".concat(roadPath));
                    _s.label = 1;
                case 1:
                    _s.trys.push([1, 5, , 6]);
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(worldPath, 'utf-8')];
                case 2:
                    worldData = _b.apply(_a, [_s.sent()]);
                    _d = (_c = JSON).parse;
                    return [4 /*yield*/, fs.readFile(roadPath, 'utf-8')];
                case 3:
                    roadNetworkJson = _d.apply(_c, [_s.sent()]);
                    edgeCount = Object.keys(roadNetworkJson.edges).length;
                    console.log("\u2705 Loaded: ".concat(worldData.buildings.length, " buildings, ").concat(worldData.roads.length, " roads, ").concat(worldData.pois.length, " POIs"));
                    console.log("   Road network: ".concat(edgeCount, " edges, ").concat(((_p = roadNetworkJson.intersections) === null || _p === void 0 ? void 0 : _p.length) || 0, " intersections, ").concat((_r = (_q = roadNetworkJson.metadata) === null || _q === void 0 ? void 0 : _q.totalLength) === null || _r === void 0 ? void 0 : _r.toFixed(1), "m total"));
                    roadNetworkData = {
                        nodes: new Map(),
                        edges: new Map(),
                        intersections: roadNetworkJson.intersections || [],
                        metadata: roadNetworkJson.metadata || { totalLength: 0, roadTypeCounts: {}, generatedAt: '' }
                    };
                    nodePositions = new Map();
                    nodeDegree = {};
                    // Process each edge
                    for (_i = 0, _e = Object.entries(roadNetworkJson.edges); _i < _e.length; _i++) {
                        _f = _e[_i], edgeKey = _f[0], edgeValue = _f[1];
                        edgeEntries = edgeValue;
                        edgeId = edgeEntries[0];
                        edgeProps = edgeEntries[1] || {};
                        geometry = edgeProps.geometry;
                        if (!geometry || geometry.length < 2)
                            continue;
                        roadType = edgeProps.roadType || 'residential';
                        propEdge = {
                            id: edgeId,
                            fromNode: edgeProps.fromNode || "node_".concat(roadNetworkData.nodes.size),
                            toNode: edgeProps.toNode || "node_".concat(roadNetworkData.nodes.size + 1),
                            roadType: roadType,
                            name: edgeProps.name,
                            surface: edgeProps.surface,
                            width: edgeProps.width || 6,
                            lanes: edgeProps.lanes || 1,
                            direction: edgeProps.direction || 'both',
                            geometry: geometry, // Already Vec2[]
                            length: edgeProps.length || this.calculatePathLength(geometry),
                            originalRoadId: edgeProps.originalRoadId || ''
                        };
                        startPos = geometry[0];
                        endPos = geometry[geometry.length - 1];
                        // Register nodes
                        if (!roadNetworkData.nodes.has(propEdge.fromNode)) {
                            roadNetworkData.nodes.set(propEdge.fromNode, {
                                id: propEdge.fromNode,
                                position: startPos,
                                connectedEdges: [],
                                isIntersection: false,
                                originalRoadIds: []
                            });
                            nodePositions.set(propEdge.fromNode, startPos);
                        }
                        if (!roadNetworkData.nodes.has(propEdge.toNode)) {
                            roadNetworkData.nodes.set(propEdge.toNode, {
                                id: propEdge.toNode,
                                position: endPos,
                                connectedEdges: [],
                                isIntersection: false,
                                originalRoadIds: []
                            });
                            nodePositions.set(propEdge.toNode, endPos);
                        }
                        // Update node degree count
                        nodeDegree[propEdge.fromNode] = (nodeDegree[propEdge.fromNode] || 0) + 1;
                        nodeDegree[propEdge.toNode] = (nodeDegree[propEdge.toNode] || 0) + 1;
                        fromNode = roadNetworkData.nodes.get(propEdge.fromNode);
                        toNode = roadNetworkData.nodes.get(propEdge.toNode);
                        fromNode.connectedEdges.push(propEdge.id);
                        toNode.connectedEdges.push(propEdge.id);
                        fromNode.originalRoadIds.push(edgeProps.originalRoadId || '');
                        toNode.originalRoadIds.push(edgeProps.originalRoadId || '');
                        // Add edge to network
                        roadNetworkData.edges.set(propEdge.id, propEdge);
                    }
                    // Determine which nodes are intersections (degree >= 3)
                    for (_g = 0, _h = roadNetworkData.nodes; _g < _h.length; _g++) {
                        _j = _h[_g], nodeId = _j[0], node = _j[1];
                        node.isIntersection = (nodeDegree[nodeId] || 0) >= 3;
                        node.connectedEdges = __spreadArray([], new Set(node.connectedEdges), true); // dedup
                    }
                    console.log("\n\uD83C\uDF33 Placing props...");
                    props = (0, props_1.placeProps)(worldData, roadNetworkData);
                    console.log('\n📊 Prop Placement Statistics:');
                    console.log("   Total props: ".concat(props.length));
                    typeCounts = {};
                    for (_k = 0, props_2 = props; _k < props_2.length; _k++) {
                        p = props_2[_k];
                        typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
                    }
                    console.log('\n🌲 Prop Types:');
                    for (_l = 0, _m = Object.entries(typeCounts).sort(function (a, b) { return b[1] - a[1]; }); _l < _m.length; _l++) {
                        _o = _m[_l], type = _o[0], count = _o[1];
                        console.log("   ".concat(type, ": ").concat(count));
                    }
                    poiProps = props.filter(function (p) { return p.originalRef; });
                    console.log("\n\uD83D\uDCCD POI-linked props: ".concat(poiProps.length));
                    roadProps = props.filter(function (p) { return !p.originalRef; });
                    console.log("\n\uD83D\uDEE3\uFE0F Road-side props: ".concat(roadProps.length));
                    // Sample props
                    console.log('\n📍 Sample Props (first 8):');
                    for (i = 0; i < Math.min(8, props.length); i++) {
                        p = props[i];
                        ref = p.originalRef ? "(ref: ".concat(p.originalRef, ")") : '';
                        console.log("   ".concat(p.id, ": ").concat(p.type, " @ (").concat(p.position.x.toFixed(1), ", ").concat(p.position.y.toFixed(1), ") ").concat(ref, " scale:").concat(p.scale.toFixed(1)));
                    }
                    outputPath = path.join(PROJECT_ROOT, 'packages/game-config/props.json');
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(props, null, 2))];
                case 4:
                    _s.sent();
                    console.log("\n\uD83D\uDCBE Props saved to: ".concat(outputPath));
                    // Summary
                    console.log('\n📈 Summary:');
                    console.log("   \u2022 ".concat(props.length, " props total"));
                    console.log("   \u2022 ".concat(roadProps.length, " road-side (trees, lights, benches)"));
                    console.log("   \u2022 ".concat(poiProps.length, " at POIs (healthcare, education, commerce, etc.)"));
                    console.log("   \u2022 ".concat(Object.keys(typeCounts).length, " prop types"));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _s.sent();
                    console.error('❌ Test failed:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
main();
//# sourceMappingURL=test-prop-placer.js.map