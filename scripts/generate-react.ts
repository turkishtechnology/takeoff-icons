import fs from 'node:fs';
import path from 'node:path';
import {
  formatGeneratedTypeScript,
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  ICONS_REACT_SRC,
  parseSvgFile,
  componentName as makeComponentName,
  writeGeneratedFile,
} from './utils';

async function generateReactComponents() {
  const svgFiles = getAllSvgFiles();
  const grouped = new Map<string, { componentName: string }[]>();

  // Clean the target folder first
  if (fs.existsSync(ICONS_REACT_SRC)) {
    fs.rmSync(ICONS_REACT_SRC, { recursive: true, force: true });
  }

  for (const filePath of svgFiles) {
    const rawName = getIconName(filePath);
    const { style, type } = getVariantFromPath(filePath);

    // Naming convention: CalendarIconOutlinedRounded
    const componentName = makeComponentName(rawName, style, type);
    const { innerHTML, viewBox } = parseSvgFile(filePath);

    const reactCode = `
import { forwardRef } from 'react';
import type { Ref, SVGProps } from 'react';

export interface ${componentName}Props extends SVGProps<SVGSVGElement> {
  /** Accessible label. When set, the icon is exposed to assistive technology as an image with this name. */
  title?: string;
}

export const ${componentName} = forwardRef<SVGSVGElement, ${componentName}Props>(
  ({ title, ...props }: ${componentName}Props, ref: Ref<SVGSVGElement>) => {
    const label = title ?? props['aria-label'];
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox=${JSON.stringify(viewBox)}
        width="1em"
        height="1em"
        {...props}
        role={label != null ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label != null ? undefined : true}
        dangerouslySetInnerHTML={{ __html: ${JSON.stringify(innerHTML)} }}
      />
    );
  },
);

${componentName}.displayName = ${JSON.stringify(componentName)};
`;

    const destinationPath = path.join(
      ICONS_REACT_SRC,
      rawName,
      `${componentName}.tsx`,
    );
    const formattedReactCode = await formatGeneratedTypeScript(reactCode);
    writeGeneratedFile(destinationPath, formattedReactCode);

    const entry = grouped.get(rawName) ?? [];
    entry.push({ componentName });
    grouped.set(rawName, entry);
  }

  for (const [iconName, variants] of grouped.entries()) {
    const barrel =
      variants
        .map(
          (v) =>
            `export { ${v.componentName} } from './${v.componentName}.js';`,
        )
        .join('\n') + '\n';
    const formattedBarrel = await formatGeneratedTypeScript(barrel);
    writeGeneratedFile(
      path.join(ICONS_REACT_SRC, iconName, 'index.ts'),
      formattedBarrel,
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

await generateReactComponents();
