import path from 'node:path';
import {
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  ICONS_REACT_SRC,
  parseSvgFile,
  toPascalCase,
  writeGeneratedFile,
} from './utils';

interface VariantData {
  svg: string;
  viewBox: string;
}

type VariantMap = Record<string, VariantData>;

const grouped = new Map<string, VariantMap>();

for (const filePath of getAllSvgFiles()) {
  const name = getIconName(filePath);
  const { style, type } = getVariantFromPath(filePath);
  const { innerHTML, viewBox } = parseSvgFile(filePath);
  const key = `${style}/${type}`;

  const entry = grouped.get(name) ?? {};
  entry[key] = { svg: innerHTML, viewBox };
  grouped.set(name, entry);
}

const iconNames = [...grouped.keys()].sort();
const barrel: string[] = [];

for (const name of iconNames) {
  const componentName = `${toPascalCase(name)}Icon`;
  const variants = grouped.get(name) ?? {};

  const svgMap: Record<string, string> = {};
  const viewBoxMap: Record<string, string> = {};
  for (const [key, data] of Object.entries(variants)) {
    svgMap[key] = data.svg;
    viewBoxMap[key] = data.viewBox;
  }

  const content = `
import { forwardRef, type SVGProps } from 'react';
import type { IconStyle, IconType } from '@tk-icons/core';

const variants: Record<string, string> = ${JSON.stringify(svgMap, null, 2)};

const viewBoxes: Record<string, string> = ${JSON.stringify(viewBoxMap, null, 2)};

export interface TkIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  iconStyle?: IconStyle;
  iconType?: IconType;
}

export const ${componentName} = forwardRef<SVGSVGElement, TkIconProps>(
  ({ size = 24, color = 'currentColor', iconStyle = 'outlined', iconType = 'rounded', children: _children, ...props }, ref) => {
    const key = iconStyle + '/' + iconType;
    const svg = variants[key];
    if (!svg) {
      return null;
    }

    return (
      <svg
        {...props}
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBoxes[key] ?? '0 0 24 24'}
        width={size}
        height={size}
        style={{ color }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
);

${componentName}.displayName = '${componentName}';
`;

  writeGeneratedFile(
    path.join(ICONS_REACT_SRC, `${componentName}.tsx`),
    content,
  );
  barrel.push(`export { ${componentName} } from './${componentName}';`);
}

writeGeneratedFile(
  path.join(ICONS_REACT_SRC, 'index.ts'),
  `${barrel.join('\n')}\n`,
);
console.log(`Generated ${iconNames.length} React component(s).`);
