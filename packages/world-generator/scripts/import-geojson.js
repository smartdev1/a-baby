#!/usr/bin/env npx tsx
"use strict";
/**
 * Import GeoJSON and output RawWorldData as JSON
 * Usage: npx tsx packages/world-generator/scripts/import-geojson.ts [input.geojson] [output.json]
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
var GeoJSONImporter_1 = require("../src/importers/GeoJSONImporter");
var fs = require("fs/promises");
var path = require("path");
var url_1 = require("url");
var __dirname = path.dirname((0, url_1.fileURLToPath)(import.meta.url));
var PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, inputPath, outputPath, worldData, poiTypes, _i, _a, poi, _b, _c, _d, type, count, roadTypes, _e, _f, road, _g, _h, _j, type, count, heightDist, _k, _l, b, _m, _o, _p, height, count, outDir, error_1;
        return __generator(this, function (_q) {
            switch (_q.label) {
                case 0:
                    args = process.argv.slice(2);
                    inputPath = args[0] || path.join(PROJECT_ROOT, 'data/source/export.geojson');
                    outputPath = args[1] || path.join(PROJECT_ROOT, 'packages/game-config/world.json');
                    console.log("\uD83D\uDCE5 Importing GeoJSON from: ".concat(inputPath));
                    _q.label = 1;
                case 1:
                    _q.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, (0, GeoJSONImporter_1.importGeoJSON)(inputPath)];
                case 2:
                    worldData = _q.sent();
                    console.log("\u2705 Import successful!");
                    console.log("   Buildings: ".concat(worldData.buildings.length));
                    console.log("   Roads: ".concat(worldData.roads.length));
                    console.log("   POIs: ".concat(worldData.pois.length));
                    console.log("   Bounds: [".concat(worldData.bounds.min.x.toFixed(1), ", ").concat(worldData.bounds.min.y.toFixed(1), "] \u2192 [").concat(worldData.bounds.max.x.toFixed(1), ", ").concat(worldData.bounds.max.y.toFixed(1), "]"));
                    console.log("   Projection scale: ".concat(worldData.projection.scale.toFixed(4)));
                    console.log("   Center: (".concat(worldData.projection.refLon.toFixed(6), ", ").concat(worldData.projection.refLat.toFixed(6), ")"));
                    poiTypes = {};
                    for (_i = 0, _a = worldData.pois; _i < _a.length; _i++) {
                        poi = _a[_i];
                        poiTypes[poi.poiType] = (poiTypes[poi.poiType] || 0) + 1;
                    }
                    console.log('\n📍 POI Categories:');
                    for (_b = 0, _c = Object.entries(poiTypes).sort(function (a, b) { return b[1] - a[1]; }); _b < _c.length; _b++) {
                        _d = _c[_b], type = _d[0], count = _d[1];
                        console.log("   ".concat(type, ": ").concat(count));
                    }
                    roadTypes = {};
                    for (_e = 0, _f = worldData.roads; _e < _f.length; _e++) {
                        road = _f[_e];
                        roadTypes[road.roadType] = (roadTypes[road.roadType] || 0) + 1;
                    }
                    console.log('\n🛣️ Road Types:');
                    for (_g = 0, _h = Object.entries(roadTypes).sort(function (a, b) { return b[1] - a[1]; }); _g < _h.length; _g++) {
                        _j = _h[_g], type = _j[0], count = _j[1];
                        console.log("   ".concat(type, ": ").concat(count));
                    }
                    heightDist = {};
                    for (_k = 0, _l = worldData.buildings; _k < _l.length; _k++) {
                        b = _l[_k];
                        heightDist[b.height] = (heightDist[b.height] || 0) + 1;
                    }
                    console.log('\n🏢 Building Heights:');
                    for (_m = 0, _o = Object.entries(heightDist).sort(function (a, b) { return Number(a[0]) - Number(b[0]); }); _m < _o.length; _m++) {
                        _p = _o[_m], height = _p[0], count = _p[1];
                        console.log("   ".concat(height, "m: ").concat(count));
                    }
                    outDir = path.dirname(outputPath);
                    return [4 /*yield*/, fs.mkdir(outDir, { recursive: true })];
                case 3:
                    _q.sent();
                    // Write output
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(worldData, null, 2))];
                case 4:
                    // Write output
                    _q.sent();
                    console.log("\n\uD83D\uDCBE Written to: ".concat(outputPath));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _q.sent();
                    console.error('❌ Import failed:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
main();
//# sourceMappingURL=import-geojson.js.map