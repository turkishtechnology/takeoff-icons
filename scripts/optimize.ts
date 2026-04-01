import fs from 'node:fs';
import { optimize, type CustomPlugin } from 'svgo';
import { getAllSvgFiles } from './utils';

const ROOT_PRESENTATION_ATTRS = new Set([
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
]);

export const removeRootPresentationAttrs: CustomPlugin = {
  name: 'removeRootPresentationAttrs',
  fn: () => ({
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          for (const attr of ROOT_PRESENTATION_ATTRS) {
            delete node.attributes[attr];
          }
        }
      },
    },
  }),
};

export const applyCurrentColor: CustomPlugin = {
  name: 'applyCurrentColor',
  fn: () => ({
    element: {
      enter: (node) => {
        if (node.attributes.fill && node.attributes.fill !== 'none') {
          node.attributes.fill = 'currentColor';
        }
        if (node.attributes.stroke && node.attributes.stroke !== 'none') {
          node.attributes.stroke = 'currentColor';
        }
      },
    },
  }),
};

export const removeMasksAndClipPaths: CustomPlugin = {
  name: 'removeMasksAndClipPaths',
  fn: () => ({
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'clipPath' || node.name === 'mask') {
          parentNode.children = parentNode.children.filter(
            (child) => child !== node,
          );
        }
        delete node.attributes['clip-path'];
        delete node.attributes.mask;
      },
    },
  }),
};

export function optimizeSvg(source: string, filePath?: string): string {
  const result = optimize(source, {
    path: filePath,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
          },
        },
      },
      'removeDimensions',
      'removeXMLNS',
      removeRootPresentationAttrs,
      applyCurrentColor,
      removeMasksAndClipPaths,
    ],
  });
  return result.data;
}

if (process.argv[1]?.endsWith('optimize.ts')) {
  const files = getAllSvgFiles();
  let optimizedCount = 0;
  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    const optimized = optimizeSvg(source, filePath);
    fs.writeFileSync(filePath, optimized, 'utf8');
    optimizedCount++;
  }
}
