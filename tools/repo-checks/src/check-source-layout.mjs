/**
 * Role: enforces source layout rules: max 12 source files per folder and no catch-all file names (utils, helpers, common, misc, stuff, core, *Manager).
 * Owner: shared
 */

const SOURCE = /\.(ts|tsx)$/;
const TEST = /\.test\.tsx?$/;
const MAX_SOURCE_FILES_PER_DIR = 12;
const FORBIDDEN_NAME = /(^|\/)(utils|helpers|common|misc|stuff|core)\.(ts|tsx)$|Manager\.(ts|tsx)$/i;
const EXEMPT = /^(tools\/map-pipeline\/legacy|docs\/archive)\//;

export const checkSourceLayout = (files) => {
  const sources = files.filter((f) => SOURCE.test(f) && !TEST.test(f) && !f.endsWith('.d.ts') && !EXEMPT.test(f));
  const perDir = new Map();
  for (const f of sources) {
    const dir = f.slice(0, f.lastIndexOf('/'));
    perDir.set(dir, (perDir.get(dir) ?? 0) + 1);
  }
  const crowded = [...perDir].filter(([, n]) => n > MAX_SOURCE_FILES_PER_DIR).map(([d, n]) => `${d}/: ${n} source files (max ${MAX_SOURCE_FILES_PER_DIR}), split by concept`);
  const badNames = sources.filter((f) => FORBIDDEN_NAME.test(f)).map((f) => `${f}: catch-all file name, name it after what it does`);
  return [...crowded, ...badNames];
};
