import path from 'node:path';
import {
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  ICONS_VUE_SRC,
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

  const source = `
<template>
  <svg
    v-if="svg"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
    :viewBox="viewBox"
    :width="size"
    :height="size"
    :style="{ color }"
    v-html="svg"
  />
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue';
import type { IconStyle, IconType } from '@tk-icons/core';

const variants: Record<string, string> = ${JSON.stringify(svgMap, null, 2)};

const viewBoxes: Record<string, string> = ${JSON.stringify(viewBoxMap, null, 2)};

export default defineComponent({
  name: '${componentName}',
  inheritAttrs: false,
  props: {
    size: {
      type: [Number, String] as PropType<number | string>,
      default: 24
    },
    color: {
      type: String,
      default: 'currentColor'
    },
    iconStyle: {
      type: String as PropType<IconStyle>,
      default: 'outlined'
    },
    iconType: {
      type: String as PropType<IconType>,
      default: 'rounded'
    }
  },
  setup(props) {
    const key = computed(() => props.iconStyle + '/' + props.iconType);
    const svg = computed(() => variants[key.value] ?? '');
    const viewBox = computed(() => viewBoxes[key.value] ?? '0 0 24 24');
    return { svg, viewBox };
  }
});
</script>
`;

  const vueHeader = '<!-- // AUTO-GENERATED — DO NOT EDIT -->\n';
  const fileContent = `${vueHeader}${source.trimStart()}\n`;
  writeGeneratedFile(
    path.join(ICONS_VUE_SRC, `${componentName}.vue`),
    fileContent,
  );
  barrel.push(
    `export { default as ${componentName} } from './${componentName}.vue';`,
  );
}

writeGeneratedFile(
  path.join(ICONS_VUE_SRC, 'index.ts'),
  `${barrel.join('\n')}\n`,
);
console.log(`Generated ${iconNames.length} Vue component(s).`);
