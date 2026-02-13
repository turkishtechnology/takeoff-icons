import fs from 'node:fs';
import { optimize, type CustomPlugin } from 'svgo';
import { getAllSvgFiles } from './utils';

// Presentation attributes managed by React/Vue/Web components at runtime.
// These must be stripped from the root <svg> element to avoid conflicts.
// Inner element attributes (e.g. stroke="#fff" on a <path>) are intentional overrides and preserved.
const ROOT_PRESENTATION_ATTRS = new Set([
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
]);

const removeRootPresentationAttrs: CustomPlugin = {
  name: 'removeRootPresentationAttrs',
  fn: () => ({
    element: {
      enter: (node, parentNode) => {
        // Only target the root <svg> element (parent is the root node, not an element)
        if (node.name === 'svg' && parentNode.type === 'root') {
          for (const attr of ROOT_PRESENTATION_ATTRS) {
            delete node.attributes[attr];
          }
        }
      },
    },
  }),
};

const files = getAllSvgFiles();
for (const filePath of files) {
  const source = fs.readFileSync(filePath, 'utf8');
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
    ],
  });

  fs.writeFileSync(filePath, result.data, 'utf8');
}

console.log(`Optimized ${files.length} SVG files.`);
