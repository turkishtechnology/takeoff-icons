import fs from 'node:fs';
import path from 'node:path';
import {
  ensureDir,
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  ICONS_SPRITE_DIST,
  parseSvgFile,
} from './utils';

const symbols: string[] = [];

for (const filePath of getAllSvgFiles()) {
  const name = getIconName(filePath);
  const { style, type } = getVariantFromPath(filePath);
  const { viewBox, innerHTML } = parseSvgFile(filePath);
  const symbolId = `${name}--${style}-${type}`;

  symbols.push(
    `<symbol id="${symbolId}" viewBox="${viewBox}">${innerHTML}</symbol>`,
  );
}

const sprite = `<!-- AUTO-GENERATED — DO NOT EDIT -->\n<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`;
ensureDir(ICONS_SPRITE_DIST);
fs.writeFileSync(path.join(ICONS_SPRITE_DIST, 'sprite.svg'), sprite, 'utf8');

console.log(`Generated sprite with ${symbols.length} symbol(s).`);
