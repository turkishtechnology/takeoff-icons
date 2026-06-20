import fs from 'node:fs';
import path from 'node:path';
import {
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  ICONS_VUE_SRC,
  parseSvgFile,
  componentName as makeComponentName,
  singleQuote,
  writeGeneratedFile,
} from './utils';

function generateVueComponents() {
  const svgFiles = getAllSvgFiles();
  const grouped = new Map<string, { componentName: string }[]>();

  if (fs.existsSync(ICONS_VUE_SRC)) {
    fs.rmSync(ICONS_VUE_SRC, { recursive: true, force: true });
  }

  for (const filePath of svgFiles) {
    const rawName = getIconName(filePath);
    const { style, type } = getVariantFromPath(filePath);

    // Naming convention: CalendarIconOutlinedRounded
    const componentName = makeComponentName(rawName, style, type);
    const { innerHTML, viewBox } = parseSvgFile(filePath);

    // Emit a plain .ts render-function component (no SFC). This compiles to
    // real .js with `tsc` — so consumers do NOT need a Vue SFC compiler — and
    // mirrors the React package's compiled-output, tree-shakeable model.
    const vueCode = `
import { defineComponent, h, type PropType } from 'vue';

export const ${componentName} = defineComponent({
  name: ${singleQuote(componentName)},
  inheritAttrs: false,
  props: {
    size: {
      type: [Number, String] as PropType<number | string>,
      default: 24,
    },
    color: {
      type: String,
      default: 'currentColor',
    },
    title: {
      type: String,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    return () =>
      h('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: ${singleQuote(viewBox)},
        width: props.size,
        height: props.size,
        style: { color: props.color },
        role: props.title != null ? 'img' : undefined,
        'aria-label': props.title,
        'aria-hidden': props.title != null ? undefined : 'true',
        ...attrs,
        innerHTML: ${singleQuote(innerHTML)},
      });
  },
});

export default ${componentName};
`;

    writeGeneratedFile(
      path.join(ICONS_VUE_SRC, rawName, `${componentName}.ts`),
      vueCode,
    );

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
    writeGeneratedFile(path.join(ICONS_VUE_SRC, iconName, 'index.ts'), barrel);
  }

  let totalComponents = 0;
  for (const variants of grouped.values()) {
    totalComponents += variants.length;
  }
  console.log(
    `Generated ${totalComponents} Vue component(s) across ${grouped.size} icon libraries.`,
  );
}

generateVueComponents();
