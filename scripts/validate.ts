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
      category?: string;
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

const categoriesPath = path.join(
  ROOT_DIR,
  'packages/icons-svg/metadata/categories.yaml',
);
const categoryIds = new Set(
  (
    parse(fs.readFileSync(categoriesPath, 'utf8')) as {
      categories: { id: string }[];
    }
  ).categories.map((c) => c.id),
);

const errors: string[] = [];
const warnings: string[] = [];

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Known misspellings that have leaked into icon names before. A new icon whose
// name contains one of these is almost certainly a typo of a real word.
const BAD_TOKENS = [
  'deneme',
  'foward',
  'squre',
  'cirlce',
  'dailpad',
  'liracircle',
];

function checkIconName(name: string, source: string): void {
  if (!KEBAB_CASE.test(name)) {
    errors.push(`Icon name is not kebab-case: "${name}" (${source})`);
  }
  for (const token of BAD_TOKENS) {
    if (name.includes(token)) {
      errors.push(
        `Icon name contains a known bad token "${token}": "${name}" (${source})`,
      );
    }
  }
}

const metadataNames = Object.keys(metadata.icons ?? {});
for (const name of metadataNames) {
  checkIconName(name, 'metadata');
  const category = metadata.icons[name].category;
  if (category && !categoryIds.has(category)) {
    errors.push(`Icon "${name}" references undeclared category "${category}"`);
  }
}

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

  checkIconName(name, path.relative(ROOT_DIR, filePath));

  if (!yamlVariantSet.has(key)) {
    errors.push(
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

const uniqueWarnings = [...new Set(warnings)];
const uniqueErrors = [...new Set(errors)];

for (const warning of uniqueWarnings) {
  console.warn(`WARN: ${warning}`);
}

if (uniqueErrors.length > 0) {
  for (const error of uniqueErrors) {
    console.error(`ERROR: ${error}`);
  }
  console.error(`Validation failed with ${uniqueErrors.length} error(s).`);
  process.exit(1);
}

console.log(`Validation passed with ${uniqueWarnings.length} warning(s).`);
