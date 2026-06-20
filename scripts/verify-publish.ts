import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { ROOT_DIR } from './utils';

/**
 * Pre-publish sanity gate. Asserts that every published package has its primary
 * build artifact present and non-empty, so a partial/empty build can never be
 * shipped to npm (e.g. an empty @takeoff-icons/font dist or an uncompiled package).
 * Run after `pnpm run build` and before `changeset publish`.
 */

interface Check {
  pkg: string;
  /** Glob (relative to the package dir) that must match at least one non-empty file. */
  glob: string;
}

const checks: Check[] = [
  { pkg: 'packages/icons-core', glob: 'dist/index.js' },
  { pkg: 'packages/icons-core', glob: 'dist/metadata.js' },
  { pkg: 'packages/icons-react', glob: 'dist/*/index.js' },
  { pkg: 'packages/icons-vue', glob: 'dist/*/index.js' },
  { pkg: 'packages/icons-sprite', glob: 'dist/sprite.svg' },
  { pkg: 'packages/icons-font', glob: 'dist/takeoff-icons.css' },
  { pkg: 'packages/icons-font', glob: 'dist/*.woff2' },
  { pkg: 'packages/icons-web', glob: 'dist/index.js' },
];

const errors: string[] = [];

for (const { pkg, glob } of checks) {
  const base = path.join(ROOT_DIR, pkg);
  const matches = globSync(glob, { cwd: base, absolute: true, nodir: true });
  const nonEmpty = matches.filter((f) => fs.statSync(f).size > 0);

  if (nonEmpty.length === 0) {
    errors.push(
      `${pkg}: expected at least one non-empty file matching "${glob}" but found none. Did the build/generate step run?`,
    );
  }
}

if (errors.length > 0) {
  console.error(
    'Pre-publish verification FAILED:\n' +
      errors.map((e) => `  - ${e}`).join('\n'),
  );
  process.exit(1);
}

console.log(
  'Pre-publish verification passed: all published packages have non-empty build artifacts.',
);
