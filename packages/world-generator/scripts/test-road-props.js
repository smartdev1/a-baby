#!/usr/bin/env npx tsx
"use strict";
/**
 * Test road-side props ONLY (no POI props)
 * Usage: npx tsx packages/world-generator/scripts/test-road-props.ts
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
var props_1 = require("../src/props");
var __dirname = path.dirname((0, url_1.fileURLToPath)(import.meta.url));
var PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var worldPath, roadPath, worldData, _a, _b, roadNetworkJson, _c, _d, edgeCount, placer1, roadProps1, typeCounts1, _i, roadProps1_1, p, placer2, roadProps2, typeCounts2, _e, roadProps2_1, p, placer3, roadProps3, typeCounts3, _f, roadProps3_1, p, outputPath, config, error_1;
        var _g, _h, _j, _k, _l, _m, _o;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    worldPath = path.join(PROJECT_ROOT, 'packages/game-config/world.json');
                    roadPath = path.join(PROJECT_ROOT, 'packages/game-config/road-network.json');
                    console.log("\uD83D\uDCE5 Loading world data from: ".concat(worldPath));
                    console.log("\uD83D\uDCE5 Loading road network from: ".concat(roadPath));
                    _p.label = 1;
                case 1:
                    _p.trys.push([1, 5, , 6]);
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(worldPath, 'utf-8')];
                case 2:
                    worldData = _b.apply(_a, [_p.sent()]);
                    _d = (_c = JSON).parse;
                    return [4 /*yield*/, fs.readFile(roadPath, 'utf-8')];
                case 3:
                    roadNetworkJson = _d.apply(_c, [_p.sent()]);
                    edgeCount = Object.keys(roadNetworkJson.edges).length;
                    console.log("\u2705 Loaded: ".concat(worldData.buildings.length, " buildings, ").concat(worldData.roads.length, " roads, ").concat(worldData.pois.length, " POIs"));
                    console.log("   Road network: ".concat(edgeCount, " edges, ").concat(((_g = roadNetworkJson.intersections) === null || _g === void 0 ? void 0 : _g.length) || 0, " intersections, ").concat((_j = (_h = roadNetworkJson.metadata) === null || _h === void 0 ? void 0 : _h.totalLength) === null || _j === void 0 ? void 0 : _j.toFixed(1), "m total"));
                    // Test 1: Default densities, no POIs
                    console.log('\n--- Test 1: Densités par défaut, pas de POIs ---');
                    placer1 = new props_1.PropPlacer({
                        treeDensity: 0.05,
                        streetLightDensity: 0.1,
                        placeAtPOIs: false,
                        maxProps: 500,
                        sideOffset: 3
                    }, worldData);
                    roadProps1 = placer1.placeAlongRoads();
                    console.log("   Longueur routes: ".concat((_l = (_k = roadNetworkJson.metadata) === null || _k === void 0 ? void 0 : _k.totalLength) === null || _l === void 0 ? void 0 : _l.toFixed(1), "m"));
                    console.log("   Arbres plac\u00E9s: ".concat(roadProps1.length));
                    typeCounts1 = {};
                    for (_i = 0, roadProps1_1 = roadProps1; _i < roadProps1_1.length; _i++) {
                        p = roadProps1_1[_i];
                        typeCounts1[p.type] = (typeCounts1[p.type] || 0) + 1;
                    }
                    console.log("   R\u00E9partition: ".concat(Object.entries(typeCounts1).length > 0 ? Object.entries(typeCounts1).map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return "".concat(k, ":").concat(v);
                    }).join(', ') : 'aucune'));
                    // Test 2: Augmented densities
                    console.log('\n--- Test 2: Densités x2 ---');
                    placer2 = new props_1.PropPlacer({
                        treeDensity: 0.1,
                        streetLightDensity: 0.2,
                        placeAtPOIs: false,
                        maxProps: 500,
                        sideOffset: 3
                    }, worldData);
                    roadProps2 = placer2.placeAlongRoads();
                    console.log("   Arbres: ".concat(roadProps2.length));
                    typeCounts2 = {};
                    for (_e = 0, roadProps2_1 = roadProps2; _e < roadProps2_1.length; _e++) {
                        p = roadProps2_1[_e];
                        typeCounts2[p.type] = (typeCounts2[p.type] || 0) + 1;
                    }
                    console.log("   R\u00E9partition: ".concat(Object.entries(typeCounts2).length > 0 ? Object.entries(typeCounts2).map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return "".concat(k, ":").concat(v);
                    }).join(', ') : 'aucune'));
                    // Test 3: Maximum density
                    console.log('\n--- Test 3: Densité maximale ---');
                    placer3 = new props_1.PropPlacer({
                        treeDensity: 0.25,
                        streetLightDensity: 0.5,
                        placeAtPOIs: false,
                        maxProps: 9999,
                        sideOffset: 5
                    }, worldData);
                    roadProps3 = placer3.placeAlongRoads();
                    console.log("   Arbres: ".concat(roadProps3.length));
                    typeCounts3 = {};
                    for (_f = 0, roadProps3_1 = roadProps3; _f < roadProps3_1.length; _f++) {
                        p = roadProps3_1[_f];
                        typeCounts3[p.type] = (typeCounts3[p.type] || 0) + 1;
                    }
                    console.log("   R\u00E9partition: ".concat(Object.entries(typeCounts3).length > 0 ? Object.entries(typeCounts3).map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return "".concat(k, ":").concat(v);
                    }).join(', ') : 'aucune'));
                    // Summary
                    console.log('\n📊 Résumé:');
                    console.log("   Longueur routes: ".concat((_o = (_m = roadNetworkJson.metadata) === null || _m === void 0 ? void 0 : _m.totalLength) === null || _o === void 0 ? void 0 : _o.toFixed(1), "m"));
                    console.log("   Arbres (d\u00E9faut): ".concat(roadProps1.length));
                    console.log("   Arbres (x2): ".concat(roadProps2.length));
                    console.log("   Arbres (max): ".concat(roadProps3.length));
                    outputPath = path.join(PROJECT_ROOT, 'packages/game-config/road-prop-config.json');
                    config = {
                        default: { treeDensity: 0.05, streetLightDensity: 0.1 },
                        x2: { treeDensity: 0.1, streetLightDensity: 0.2 },
                        max: { treeDensity: 0.25, streetLightDensity: 0.5 }
                    };
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(config, null, 2))];
                case 4:
                    _p.sent();
                    console.log("\n\uD83D\uDCBE Config saved to: ".concat(outputPath));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _p.sent();
                    console.error('❌ Test failed:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
main();
//# sourceMappingURL=test-road-props.js.map