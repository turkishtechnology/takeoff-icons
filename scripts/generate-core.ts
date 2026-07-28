import path from 'node:path';
import {
  formatGeneratedTypeScript,
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  ICONS_CORE_SRC,
  parseSvgFile,
  toCamelCase,
  writeGeneratedFile,
} from './utils';

const files = getAllSvgFiles();

for (const filePath of files) {
  const name = getIconName(filePath);
  const { style, type } = getVariantFromPath(filePath);
  const { viewBox, innerHTML } = parseSvgFile(filePath);
  const exportName = `${toCamelCase(name)}_${style}_${type}`;

  const fileContent = `
import type { IconData } from '../../../types.js';

export const ${exportName}: IconData = {
  name: ${JSON.stringify(name)},
  style: ${JSON.stringify(style)},
  type: ${JSON.stringify(type)},
  variant: ${JSON.stringify(`${style}/${type}`)},
  viewBox: ${JSON.stringify(viewBox)},
  svg: ${JSON.stringify(innerHTML)}
};

export default ${exportName};
`;

  const outPath = path.join(ICONS_CORE_SRC, 'icons', style, type, `${name}.ts`);
  const formattedFileContent = await formatGeneratedTypeScript(fileContent);
  writeGeneratedFile(outPath, formattedFileContent);
}

// The root barrel intentionally re-exports types only (erased at build time),
// so importing '@takeoff-icons/core' never pulls the heavy metadata, search-index or
// alias-map data into a consumer's bundle. Those are available as subpaths:
//   '@takeoff-icons/core/metadata', '@takeoff-icons/core/search-index', '@takeoff-icons/core/alias-map'
const indexContent = `
export * from './types.js';
`;

writeGeneratedFile(
  path.join(ICONS_CORE_SRC, 'index.ts'),
  await formatGeneratedTypeScript(indexContent),
);
console.log(`Generated ${files.length} icon variant module(s).`);
