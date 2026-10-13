#!/usr/bin/env npx tsx
"use strict";
/**
 * Test BuildingPlacer from imported world.json
 * Usage: npx tsx packages/world-generator/scripts/test-building-placer.ts
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
var GeoJSONImporter_1 = require("../src/importers/GeoJSONImporter");
var __dirname = path.dirname((0, url_1.fileURLToPath)(import.meta.url));
var PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var worldPath, worldData, _a, _b, buildings, heightDist, _i, buildings_1, b, _c, _d, _e, height, count, floors, materialDist, _f, buildings_2, b, _g, _h, _j, mat, count, i, b, typeCounts, _k, buildings_3, b, _l, _m, _o, type, count, outputPath, error_1;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    worldPath = path.join(PROJECT_ROOT, 'packages/game-config/world.json');
                    console.log("\uD83D\uDCE5 Loading world data from: ".concat(worldPath));
                    _p.label = 1;
                case 1:
                    _p.trys.push([1, 4, , 5]);
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(worldPath, 'utf-8')];
                case 2:
                    worldData = _b.apply(_a, [_p.sent()]);
                    console.log("\u2705 Loaded: ".concat(worldData.buildings.length, " buildings, ").concat(worldData.roads.length, " roads, ").concat(worldData.pois.length, " POIs"));
                    console.log('\n🏗️ Building placements...');
                    buildings = (0, GeoJSONImporter_1.placeBuildings)(worldData.buildings);
                    console.log('\n📊 Building Placement Statistics:');
                    console.log("   Total buildings: ".concat(buildings.length));
                    heightDist = {};
                    for (_i = 0, buildings_1 = buildings; _i < buildings_1.length; _i++) {
                        b = buildings_1[_i];
                        heightDist[b.height] = (heightDist[b.height] || 0) + 1;
                    }
                    console.log('\n📏 Height Distribution:');
                    for (_c = 0, _d = Object.entries(heightDist).sort(function (a, b) { return Number(a[0]) - Number(b[0]); }); _c < _d.length; _c++) {
                        _e = _d[_c], height = _e[0], count = _e[1];
                        floors = Math.round(height / 3);
                        console.log("   ".concat(height, "m (").concat(floors, " \u00E9tages): ").concat(count, " b\u00E2timents"));
                    }
                    materialDist = {};
                    for (_f = 0, buildings_2 = buildings; _f < buildings_2.length; _f++) {
                        b = buildings_2[_f];
                        materialDist[b.materialKey] = (materialDist[b.materialKey] || 0) + 1;
                    }
                    console.log('\n🎨 Material Distribution:');
                    for (_g = 0, _h = Object.entries(materialDist).sort(function (a, b) { return b[1] - a[1]; }); _g < _h.length; _g++) {
                        _j = _h[_g], mat = _j[0], count = _j[1];
                        console.log("   ".concat(mat, ": ").concat(count));
                    }
                    // Sample buildings
                    console.log('\n🏢 Sample Buildings (first 5):');
                    for (i = 0; i < Math.min(5, buildings.length); i++) {
                        b = buildings[i];
                        console.log("   ".concat(b.id, ": ").concat(b.height.toFixed(1), "m, ").concat(b.levels, " \u00E9tages, ").concat(b.materialKey, ", center: (").concat(b.center.x.toFixed(1), ", ").concat(b.center.y.toFixed(1), ")"));
                    }
                    typeCounts = {};
                    for (_k = 0, buildings_3 = buildings; _k < buildings_3.length; _k++) {
                        b = buildings_3[_k];
                        typeCounts[b.materialKey] = (typeCounts[b.materialKey] || 0) + 1;
                    }
                    console.log('\n📈 Building Types Summary:');
                    for (_l = 0, _m = Object.entries(typeCounts).sort(function (a, b) { return b[1] - a[1]; }); _l < _m.length; _l++) {
                        _o = _m[_l], type = _o[0], count = _o[1];
                        console.log("   ".concat(type, ": ").concat(count));
                    }
                    outputPath = path.join(PROJECT_ROOT, 'packages/game-config/buildings.json');
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(buildings, null, 2))];
                case 3:
                    _p.sent();
                    console.log("\n\uD83D\uDCBE Buildings saved to: ".concat(outputPath));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _p.sent();
                    console.error('❌ Test failed:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
main();
//# sourceMappingURL=test-building-placer.js.map