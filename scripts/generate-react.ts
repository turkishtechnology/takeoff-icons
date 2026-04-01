import fs from 'node:fs';
import path from 'node:path';
import { transform } from '@svgr/core';
import {
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  ICONS_REACT_SRC,
  parseSvgFile,
  toPascalCase,
  writeGeneratedFile,
  ensureDir,
} from './utils';

async function generateReactComponents() {
  const svgFiles = getAllSvgFiles();
  const grouped = new Map<
    string,
    { componentName: string; filePath: string; fileName: string }[]
  >();

  // Clean the target folder first
  if (fs.existsSync(ICONS_REACT_SRC)) {
    fs.rmSync(ICONS_REACT_SRC, { recursive: true, force: true });
  }

  for (const filePath of svgFiles) {
    const rawName = getIconName(filePath);
    const { style, type } = getVariantFromPath(filePath);

    // Naming convention: CalendarIconOutlinedRounded
    const componentName = `${toPascalCase(rawName)}Icon${toPascalCase(style)}${toPascalCase(type)}`;
    const fileName = `${componentName}.tsx`;

    const { innerHTML, viewBox } = parseSvgFile(filePath);
    const svgCode = `<svg viewBox="${viewBox}">${innerHTML}</svg>`;

    const reactCode = await transform(
      svgCode,
      {
        icon: true,
        typescript: true,
        plugins: ['@svgr/plugin-jsx'],
        jsxRuntime: 'automatic',
        exportType: 'named',
        namedExport: componentName,
      },
      { componentName },
    );

    const destDir = path.join(ICONS_REACT_SRC, rawName);
    const destPath = path.join(destDir, fileName);
    writeGeneratedFile(destPath, reactCode);

    const entry = grouped.get(rawName) ?? [];
    entry.push({ componentName, filePath, fileName });
    grouped.set(rawName, entry);
  }

  for (const [iconName, variants] of grouped.entries()) {
    const barrel =
      variants
        .map(
          (v) => `export { ${v.componentName} } from './${v.componentName}';`,
        )
        .join('\n') + '\n';
    writeGeneratedFile(
      path.join(ICONS_REACT_SRC, iconName, 'index.ts'),
      barrel,
    );
  }

  let totalComponents = 0;
  for (const variants of grouped.values()) {
    totalComponents += variants.length;
  }
  console.log(
    `Generated ${totalComponents} React component(s) across ${grouped.size} icon libraries.`,
  );
}

generateReactComponents().catch(console.error);
