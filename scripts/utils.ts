import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { camelCase, pascalCase } from 'change-case';
import { globSync } from 'glob';
import { format } from 'prettier';

export type IconStyle = 'outlined' | 'filled';
export type IconType = 'rounded' | 'sharp' | 'bevel' | 'tk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const SVG_ROOT = path.join(ROOT_DIR, 'packages/icons-svg/svg');
export const ICONS_CORE_SRC = path.join(ROOT_DIR, 'packages/icons-core/src');
export const ICONS_REACT_SRC = path.join(ROOT_DIR, 'packages/icons-react/src');
export const ICONS_VUE_SRC = path.join(ROOT_DIR, 'packages/icons-vue/src');
export const ICONS_SPRITE_DIST = path.join(
  ROOT_DIR,
  'packages/icons-sprite/dist',
);
export const ICONS_FONT_DIST = path.join(ROOT_DIR, 'packages/icons-font/dist');

export function getIconName(filePath: string): string {
  return path.basename(filePath, '.svg');
}

export function getVariantFromPath(filePath: string): {
  style: IconStyle;
  type: IconType;
} {
  const relative = path.relative(SVG_ROOT, filePath);
  const [style, type] = relative.split(path.sep);

  if (!isIconStyle(style) || !isIconType(type)) {
    throw new Error(`Invalid variant path: ${relative}`);
  }

  return { style, type };
}

export function toPascalCase(kebab: string): string {
  return pascalCase(kebab);
}

export function toCamelCase(kebab: string): string {
  return camelCase(kebab);
}

/**
 * The component-name convention shared by the React and Vue generators,
 * e.g. componentName('calendar', 'outlined', 'rounded') ->
 * 'CalendarIconOutlinedRounded'. Single-sourced so the two outputs cannot
 * drift apart.
 */
export function componentName(
  rawName: string,
  style: IconStyle,
  type: IconType,
): string {
  return `${toPascalCase(rawName)}Icon${toPascalCase(style)}${toPascalCase(type)}`;
}

export function getAllSvgFiles(): string[] {
  return globSync('**/*.svg', {
    cwd: SVG_ROOT,
    absolute: true,
    nodir: true,
  }).sort();
}

/**
 * The deduplicated, sorted set of icon names across every variant. Derived
 * from getAllSvgFiles so the icon-set definition is single-sourced across the
 * core/react/vue and font generators.
 */
export function getAllIconNames(): string[] {
  const names = new Set(getAllSvgFiles().map(getIconName));
  return [...names].sort();
}

export function parseSvgFile(filePath: string): {
  viewBox: string;
  innerHTML: string;
} {
  const source = fs.readFileSync(filePath, 'utf8').trim();
  const svgMatch = source.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  if (!svgMatch) {
    throw new Error(`Invalid SVG file (missing <svg> root): ${filePath}`);
  }

  const attrs = svgMatch[1];
  const viewBoxMatch = attrs.match(/\bviewBox=(['"])(.*?)\1/i);
  if (!viewBoxMatch) {
    throw new Error(`Missing viewBox in SVG: ${filePath}`);
  }

  return {
    viewBox: viewBoxMatch[2],
    innerHTML: svgMatch[2].trim(),
  };
}

/**
 * A single-quoted JS string literal. SVG markup contains double quotes, so a
 * single-quoted literal needs no escaping of them and is what Prettier emits
 * for plain (non-JSX) source — keeps generated .ts files lint-clean.
 */
export function singleQuote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeGeneratedFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  const header = '// AUTO-GENERATED — DO NOT EDIT';
  const vueHeader = '<!-- // AUTO-GENERATED — DO NOT EDIT -->';
  const body = content.replace(/^\s*\n/, '');
  const normalized =
    body.startsWith(header) || body.startsWith(vueHeader)
      ? body
      : `${header}\n${body}`;
  fs.writeFileSync(filePath, `${normalized.trimEnd()}\n`, 'utf8');
}

export function formatGeneratedTypeScript(content: string): Promise<string> {
  return format(content, {
    parser: 'typescript',
    printWidth: 80,
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
  });
}

function isIconStyle(value: string): value is IconStyle {
  return value === 'outlined' || value === 'filled';
}

function isIconType(value: string): value is IconType {
  return (
    value === 'rounded' ||
    value === 'sharp' ||
    value === 'bevel' ||
    value === 'tk'
  );
}
