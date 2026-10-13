/**
 * Role: dependency-cruiser rules encoding the allowed-dependencies matrix of ARCHITECTURE §9.3 (no cycles, no deep imports, pure packages stay pure, zone never touches the DB).
 * Owner: shared
 */

const PURE =
  '^packages/(geo|tile-format|protocol|physics|content-schema|sim-[a-z]+|economy-rules|business-rules|i18n)/';

module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'no-unresolvable',
      comment:
        'Every import must resolve (declare workspace packages in package.json). The probe page imports a file served at runtime.',
      severity: 'error',
      from: { pathNot: '^tools/latency-probe/page/' },
      to: { couldNotResolve: true },
    },
    {
      name: 'pure-packages-stay-pure',
      comment: 'Pure packages: no Node builtins, no Babylon, no Preact, no Node-only packages.',
      severity: 'error',
      from: { path: PURE },
      to: { path: '^(node:|@babylonjs|preact|packages/(bus|observability|db)/)', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'pure-packages-no-node-builtins',
      severity: 'error',
      from: { path: PURE },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'only-services-import-db',
      severity: 'error',
      from: { pathNot: '^(apps/services|packages/db)/' },
      // Matches the resolved folder AND the package name (an undeclared, unresolved import must fail too).
      to: { path: '^(packages/db/|@skyline/db$)' },
    },
    {
      name: 'web-is-browser-only',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^packages/(bus|observability|db)/' },
    },
    {
      name: 'gateway-limited-packages',
      severity: 'error',
      from: { path: '^apps/gateway/' },
      to: { path: '^packages/(physics|content-schema|sim-[a-z]+|economy-rules|business-rules|db)/' },
    },
    {
      name: 'apps-do-not-import-apps',
      comment: 'Exception: apps/all-in-one is a pure composition root (rule below limits it to public entries).',
      severity: 'error',
      from: { path: '^apps/([^/]+)/', pathNot: '^apps/all-in-one/' },
      to: { path: '^apps/', pathNot: '^apps/$1/' },
    },
    {
      name: 'all-in-one-uses-public-app-entries-only',
      severity: 'error',
      from: { path: '^apps/all-in-one/' },
      to: { path: '^apps/(gateway|zone|services|web)/', pathNot: '^apps/(gateway|zone|services)/src/index\\.ts$' },
    },
    {
      name: 'no-deep-package-imports',
      comment: 'Import another package through its public src/index.ts only.',
      severity: 'error',
      from: { path: '^(apps|packages|tools)/([^/]+)/' },
      to: { path: '^packages/([^/]+)/src/(?!index\\.ts$)', pathNot: '^packages/$2/' },
    },
    {
      name: 'world-render-and-ui-are-independent',
      severity: 'error',
      from: { path: '^apps/web/src/(world-render|ui)/' },
      to: { path: '^apps/web/src/(world-render|ui)/', pathNot: '^apps/web/src/$1/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(node_modules|dist|docs/archive)' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'default'] },
  },
};
