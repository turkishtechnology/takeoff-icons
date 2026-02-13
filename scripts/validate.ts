import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import {
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  parseSvgFile,
  ROOT_DIR,
  SVG_ROOT,
  type IconStyle,
  type IconType,
} from './utils';

interface IconMetaYaml {
  icons: Record<
    string,
    {
      variants?: string[];
    }
  >;
}

const metaPath = path.join(
  ROOT_DIR,
  'packages/icons-svg/metadata/icons.meta.yaml',
);
const raw = fs.readFileSync(metaPath, 'utf8');
const metadata = parse(raw) as IconMetaYaml;

const errors: string[] = [];
const warnings: string[] = [];

const yamlVariantSet = new Set<string>();
for (const [name, config] of Object.entries(metadata.icons ?? {})) {
  for (const variant of config.variants ?? []) {
    const [style, type] = variant.split('/') as [IconStyle, IconType];
    const expectedPath = path.join(SVG_ROOT, style, type, `${name}.svg`);
    yamlVariantSet.add(`${name}::${variant}`);
    if (!fs.existsSync(expectedPath)) {
      errors.push(`Missing SVG for metadata variant: ${name} (${variant})`);
    }
  }
}

const actualSvgFiles = getAllSvgFiles();
for (const filePath of actualSvgFiles) {
  const name = getIconName(filePath);
  const { style, type } = getVariantFromPath(filePath);
  const variant = `${style}/${type}`;
  const key = `${name}::${variant}`;

  if (!yamlVariantSet.has(key)) {
    warnings.push(
      `SVG exists but metadata does not declare it: ${name} (${variant})`,
    );
  }

  const source = fs.readFileSync(filePath, 'utf8');
  if (!/\bviewBox=(['"])[^'"]+\1/i.test(source)) {
    errors.push(`SVG is missing viewBox: ${path.relative(ROOT_DIR, filePath)}`);
  }

  if (
    /(?:^|\s)width=(['"])[^'"]+\1/i.test(source) ||
    /(?:^|\s)height=(['"])[^'"]+\1/i.test(source)
  ) {
    warnings.push(
      `SVG has hard-coded width/height: ${path.relative(ROOT_DIR, filePath)}`,
    );
  }

  try {
    parseSvgFile(filePath);
  } catch (error) {
    errors.push((error as Error).message);
  }
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  console.error(`Validation failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(`Validation passed with ${warnings.length} warning(s).`);
