/**
 * Role: draws the building-density map per 250 m tile as a static SVG (sequential blue bins, hatched empty tiles inside the boundary, boundary outline, legend).
 * Owner: backend
 */

import { tileBounds, tileKeyOf, toUtm30n, type UtmBounds } from '@skyline/geo';
import { containsPoint, type Geometry } from '../../geometry/geojson-geometry.ts';

/** Sequential single-hue ramp (light → dark) from the dataviz reference palette. */
const BINS = [
  { min: 1, label: '1–9', fill: '#b7d3f6' },
  { min: 10, label: '10–49', fill: '#6da7ec' },
  { min: 50, label: '50–149', fill: '#2a78d6' },
  { min: 150, label: '150–299', fill: '#1c5cab' },
  { min: 300, label: '300+', fill: '#0d366b' },
] as const;
const INK = '#2b2b29';
const MUTED = '#6b6a66';
const EMPTY_STROKE = '#9a9893';
const PX_PER_TILE = 10;

export interface DensityMapInput {
  readonly buildingsPerTile: Readonly<Record<string, number>>;
  readonly boundary: Geometry | null;
  readonly title: string;
}

const fillFor = (count: number): string => [...BINS].reverse().find((b) => count >= b.min)?.fill ?? 'none';

const tileCenterInside = (key: string, boundary: Geometry | null, toLonLat: (e: number, n: number) => [number, number]): boolean => {
  if (!boundary) return false;
  const b = tileBounds(key);
  return containsPoint(boundary, toLonLat((b.minEastingM + b.maxEastingM) / 2, (b.minNorthingM + b.maxNorthingM) / 2));
};

/** Every L0 tile of the area: tiles with buildings + tiles of the boundary bbox. */
const tileRange = (keys: string[], boundaryBounds: UtmBounds | null) => {
  const coords = keys.map((k) => k.split('_').map(Number) as [number, number, number]);
  const is = coords.map((c) => c[1]);
  const js = coords.map((c) => c[2]);
  if (boundaryBounds) {
    const sw = tileKeyOf({ eastingM: boundaryBounds.minEastingM, northingM: boundaryBounds.minNorthingM }, 0).split('_').map(Number);
    const ne = tileKeyOf({ eastingM: boundaryBounds.maxEastingM - 1, northingM: boundaryBounds.maxNorthingM - 1 }, 0).split('_').map(Number);
    is.push(sw[1] ?? 0, ne[1] ?? 0);
    js.push(sw[2] ?? 0, ne[2] ?? 0);
  }
  return { iMin: Math.min(...is), iMax: Math.max(...is), jMin: Math.min(...js), jMax: Math.max(...js) };
};

export const renderDensitySvg = (
  input: DensityMapInput,
  boundaryBounds: UtmBounds | null,
  toLonLat: (eastingM: number, northingM: number) => [number, number],
): string => {
  const { iMin, iMax, jMin, jMax } = tileRange(Object.keys(input.buildingsPerTile), boundaryBounds);
  const cols = iMax - iMin + 1;
  const rows = jMax - jMin + 1;
  const mapW = cols * PX_PER_TILE;
  const mapH = rows * PX_PER_TILE;
  const top = 48;
  const cells: string[] = [];
  let emptyInside = 0;

  for (let j = jMin; j <= jMax; j++) {
    for (let i = iMin; i <= iMax; i++) {
      const key = `L0_${i}_${j}`;
      const count = input.buildingsPerTile[key] ?? 0;
      const x = (i - iMin) * PX_PER_TILE;
      const y = top + (jMax - j) * PX_PER_TILE; // north up
      if (count > 0) {
        cells.push(`<rect x="${x}" y="${y}" width="${PX_PER_TILE - 1}" height="${PX_PER_TILE - 1}" rx="1" fill="${fillFor(count)}"><title>${key}: ${count} buildings</title></rect>`);
      } else if (tileCenterInside(key, input.boundary, toLonLat)) {
        emptyInside++;
        cells.push(`<rect x="${x}" y="${y}" width="${PX_PER_TILE - 1}" height="${PX_PER_TILE - 1}" fill="url(#hatch)" stroke="${EMPTY_STROKE}" stroke-width="0.5"><title>${key}: no building (inside the commune)</title></rect>`);
      }
    }
  }

  const legendY = top + mapH + 20;
  const legend = [
    ...BINS.map((b, k) => `<rect x="${k * 90}" y="${legendY}" width="12" height="12" rx="2" fill="${b.fill}"/><text x="${k * 90 + 18}" y="${legendY + 10}">${b.label}</text>`),
    `<rect x="${BINS.length * 90}" y="${legendY}" width="12" height="12" fill="url(#hatch)" stroke="${EMPTY_STROKE}"/><text x="${BINS.length * 90 + 18}" y="${legendY + 10}">0 (gap)</text>`,
  ];
  const width = Math.max(mapW, (BINS.length + 1) * 90 + 40);
  const height = legendY + 30;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, sans-serif" font-size="11" fill="${INK}">`,
    `<defs><pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="4" stroke="${EMPTY_STROKE}" stroke-width="1"/></pattern></defs>`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `<text x="0" y="16" font-size="14" font-weight="600">${input.title}</text>`,
    `<text x="0" y="34" fill="${MUTED}">Buildings per 250 m tile (L0). Hatched: tiles inside the commune with no building (${emptyInside}). North up. © OpenStreetMap contributors.</text>`,
    ...cells,
    ...legend,
    `</svg>`,
    '',
  ].join('\n');
};

export const utmToLonLatFactory =
  (fromUtm: (p: { eastingM: number; northingM: number }) => { lonDeg: number; latDeg: number }) =>
  (eastingM: number, northingM: number): [number, number] => {
    const { lonDeg, latDeg } = fromUtm({ eastingM, northingM });
    return [lonDeg, latDeg];
  };

export const boundaryUtmBounds = (bbox: readonly [number, number, number, number]): UtmBounds => {
  const sw = toUtm30n({ lonDeg: bbox[0], latDeg: bbox[1] });
  const ne = toUtm30n({ lonDeg: bbox[2], latDeg: bbox[3] });
  return { minEastingM: sw.eastingM, minNorthingM: sw.northingM, maxEastingM: ne.eastingM, maxNorthingM: ne.northingM };
};
