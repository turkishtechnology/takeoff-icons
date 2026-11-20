/**
 * Replaces `added: 'unreleased'` in icons.meta.yaml with the version being
 * released. `figma:export` cannot know which version a new icon will ship in,
 * so it writes the placeholder; this runs right after `changeset version`
 * (see `version-packages`), when @takeoff-icons/core already has its new
 * version, so the "chore: version packages" PR carries the real one.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './utils';

export const UNRELEASED = 'unreleased';

/** Returns the YAML with every `added: 'unreleased'` set to `version`, and how many were set. */
export function stampAdded(
  yaml: string,
  version: string,
): { yaml: string; stamped: number } {
  let stamped = 0;
  const out = yaml.replace(
    /^(\s+added: )'unreleased'$/gm,
    (_match, prefix: string) => {
      stamped++;
      return `${prefix}'${version}'`;
    },
  );
  return { yaml: out, stamped };
}

function main(): void {
  const metaPath = path.join(
    ROOT_DIR,
    'packages/icons-svg/metadata/icons.meta.yaml',
  );
  const corePackage = JSON.parse(
    fs.readFileSync(
      path.join(ROOT_DIR, 'packages/icons-core/package.json'),
      'utf8',
    ),
  ) as { version: string };

  const { yaml, stamped } = stampAdded(
    fs.readFileSync(metaPath, 'utf8'),
    corePackage.version,
  );
  if (stamped > 0) {
    fs.writeFileSync(metaPath, yaml);
  }
  console.log(
    `stamp-added: ${stamped} icon(s) marked as added in ${corePackage.version}`,
  );
}

if (process.argv[1]?.endsWith('stamp-added.ts')) {
  main();
}
