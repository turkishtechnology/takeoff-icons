import path from 'node:path';
import {
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
import type { IconData } from '../../../types';

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
  writeGeneratedFile(outPath, fileContent);
}

const indexContent = `
export * from './types';
export * from './metadata';
export * from './alias-map';
export * from './search-index';
`;

writeGeneratedFile(path.join(ICONS_CORE_SRC, 'index.ts'), indexContent);
console.log(`Generated ${files.length} icon variant module(s).`);
