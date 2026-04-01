import fs from 'node:fs';
import path from 'node:path';
import {
  getAllSvgFiles,
  getIconName,
  getVariantFromPath,
  ICONS_VUE_SRC,
  parseSvgFile,
  toPascalCase,
  writeGeneratedFile,
  ensureDir,
} from './utils';

async function generateVueComponents() {
  const svgFiles = getAllSvgFiles();
  const grouped = new Map<
    string,
    { componentName: string; filePath: string; fileName: string }[]
  >();

  if (fs.existsSync(ICONS_VUE_SRC)) {
    fs.rmSync(ICONS_VUE_SRC, { recursive: true, force: true });
  }

  for (const filePath of svgFiles) {
    const rawName = getIconName(filePath);
    const { style, type } = getVariantFromPath(filePath);

    // Naming convention: CalendarIconOutlinedRounded
    const componentName = `${toPascalCase(rawName)}Icon${toPascalCase(style)}${toPascalCase(type)}`;
    const fileName = `${componentName}.vue`;

    const { innerHTML, viewBox } = parseSvgFile(filePath);

    const vueCode = `
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
    viewBox="${viewBox}"
    :width="size"
    :height="size"
    :style="{ color: color }"
  >
    ${innerHTML}
  </svg>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

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
    }
  }
});
</script>`.trimStart();

    const destDir = path.join(ICONS_VUE_SRC, rawName);
    const destPath = path.join(destDir, fileName);
    writeGeneratedFile(destPath, vueCode);

    const entry = grouped.get(rawName) ?? [];
    entry.push({ componentName, filePath, fileName });
    grouped.set(rawName, entry);
  }

  for (const [iconName, variants] of grouped.entries()) {
    // Generate .js barrel (valid ESM re-exports)
    const barrelJs =
      variants
        .map(
          (v) =>
            `export { default as ${v.componentName} } from './${v.componentName}.vue';`,
        )
        .join('\n') + '\n';
    writeGeneratedFile(
      path.join(ICONS_VUE_SRC, iconName, 'index.js'),
      barrelJs,
    );

    // Generate .d.ts barrel (TypeScript type declarations)
    const dtsLines = [
      `import type { DefineComponent } from 'vue';`,
      `type IconProps = { size?: number | string; color?: string };`,
      ...variants.map(
        (v) =>
          `export declare const ${v.componentName}: DefineComponent<IconProps>;`,
      ),
      '',
    ];
    writeGeneratedFile(
      path.join(ICONS_VUE_SRC, iconName, 'index.d.ts'),
      dtsLines.join('\n'),
    );
  }

  let totalComponents = 0;
  for (const variants of grouped.values()) {
    totalComponents += variants.length;
  }
  console.log(
    `Generated ${totalComponents} Vue component(s) across ${grouped.size} icon libraries.`,
  );
}

generateVueComponents().catch(console.error);
