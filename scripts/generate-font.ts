import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { globSync } from 'glob';
import {
  ensureDir,
  ICONS_FONT_DIST,
  ROOT_DIR,
  SVG_ROOT,
  type IconStyle,
  type IconType,
} from './utils';

type GenerateFontsFn = (config: Record<string, unknown>) => Promise<unknown>;

const styles: IconStyle[] = ['outlined', 'filled'];
const types: IconType[] = ['rounded', 'sharp', 'bevel', 'tk'];

const CODEPOINTS_PATH = path.join(
  ROOT_DIR,
  'packages/icons-svg/metadata/codepoints.json',
);

const allIconNames = [
  ...new Set(
    globSync('**/*.svg', {
      cwd: SVG_ROOT,
      absolute: false,
      nodir: true,
    }).map((item) => path.basename(item, '.svg')),
  ),
].sort();

function loadCodepoints(): Record<string, number> {
  if (fs.existsSync(CODEPOINTS_PATH)) {
    return JSON.parse(fs.readFileSync(CODEPOINTS_PATH, 'utf8'));
  }
  return {};
}

function resolveCodepoints(
  existing: Record<string, number>,
  currentNames: string[],
): Record<string, number> {
  const result = { ...existing };
  const usedCodes = new Set(Object.values(result));

  // Warn about icons that were removed (their codepoints are preserved but flagged)
  for (const name of Object.keys(result)) {
    if (!currentNames.includes(name)) {
      console.warn(
        `WARN: Icon "${name}" has a reserved codepoint (${result[name].toString(16)}) but no SVG exists. Codepoint preserved to avoid collision.`,
      );
    }
  }

  // Find next available codepoint
  let nextCode = 0xe001;
  while (usedCodes.has(nextCode)) {
    nextCode++;
  }

  // Assign codepoints to new icons
  for (const name of currentNames) {
    if (result[name] == null) {
      while (usedCodes.has(nextCode)) {
        nextCode++;
      }
      result[name] = nextCode;
      usedCodes.add(nextCode);
      console.log(
        `Assigned new codepoint 0x${nextCode.toString(16)} to "${name}".`,
      );
      nextCode++;
    }
  }

  return result;
}

function saveCodepoints(map: Record<string, number>): void {
  const sorted = Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => a.localeCompare(b)),
  );
  fs.writeFileSync(
    CODEPOINTS_PATH,
    JSON.stringify(sorted, null, 2) + '\n',
    'utf8',
  );
}

const existingCodepoints = loadCodepoints();
const codepoints = resolveCodepoints(existingCodepoints, allIconNames);
saveCodepoints(codepoints);

async function loadFantasticon(): Promise<GenerateFontsFn | null> {
  try {
    const mod = await import('fantasticon');
    const fn =
      (mod as { generateFonts?: GenerateFontsFn }).generateFonts ??
      (mod as { default?: { generateFonts?: GenerateFontsFn } }).default
        ?.generateFonts;

    if (!fn) {
      return null;
    }

    return fn;
  } catch {
    return null;
  }
}

function buildCss(iconNames: string[]): string {
  const lines: string[] = [];
  lines.push('/* AUTO-GENERATED — DO NOT EDIT */');

  for (const style of styles) {
    for (const type of types) {
      const fontName = `tk-icons-${style}-${type}`;
      lines.push(`@font-face {`);
      lines.push(`  font-family: '${fontName}';`);
      lines.push(`  src: url('./${fontName}.woff2') format('woff2');`);
      lines.push(`  font-weight: normal;`);
      lines.push(`  font-style: normal;`);
      lines.push('}');
    }
  }

  lines.push('');
  lines.push('[class^="tk-icon-"],');
  lines.push('[class*=" tk-icon-"] {');
  lines.push(`  font-family: 'tk-icons-outlined-rounded';`);
  lines.push('  font-style: normal;');
  lines.push('  font-weight: normal;');
  lines.push('  display: inline-block;');
  lines.push('  line-height: 1;');
  lines.push('  -webkit-font-smoothing: antialiased;');
  lines.push('  -moz-osx-font-smoothing: grayscale;');
  lines.push('}');
  lines.push('');
  lines.push(".tk-icon-filled { font-family: 'tk-icons-filled-rounded'; }");
  lines.push(".tk-icon-sharp { font-family: 'tk-icons-outlined-sharp'; }");
  lines.push(
    ".tk-icon-filled.tk-icon-sharp { font-family: 'tk-icons-filled-sharp'; }",
  );
  lines.push(".tk-icon-bevel { font-family: 'tk-icons-outlined-bevel'; }");
  lines.push(
    ".tk-icon-filled.tk-icon-bevel { font-family: 'tk-icons-filled-bevel'; }",
  );
  lines.push(".tk-icon-tk { font-family: 'tk-icons-outlined-tk'; }");
  lines.push(
    ".tk-icon-filled.tk-icon-tk { font-family: 'tk-icons-filled-tk'; }",
  );
  lines.push('');

  for (const name of iconNames) {
    const codepoint = codepoints[name] ?? 0;
    lines.push(
      `.tk-icon-${name}::before { content: '\\${codepoint.toString(16)}'; }`,
    );
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  fs.rmSync(ICONS_FONT_DIST, { recursive: true, force: true });
  ensureDir(ICONS_FONT_DIST);

  const generateFonts = await loadFantasticon();
  if (!generateFonts) {
    console.warn('fantasticon is not available; skipping font generation.');
    return;
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tk-icons-font-'));

  try {
    for (const style of styles) {
      for (const type of types) {
        const inputDir = path.join(SVG_ROOT, style, type);
        const svgFiles = globSync('*.svg', {
          cwd: inputDir,
          absolute: true,
          nodir: true,
        }).sort();
        if (svgFiles.length === 0) {
          continue;
        }

        const variantTempDir = path.join(tempRoot, `${style}-${type}`);
        ensureDir(variantTempDir);
        for (const svgFile of svgFiles) {
          const fileName = path.basename(svgFile);
          fs.copyFileSync(svgFile, path.join(variantTempDir, fileName));
        }

        const fontName = `tk-icons-${style}-${type}`;
        try {
          await generateFonts({
            inputDir: variantTempDir,
            outputDir: ICONS_FONT_DIST,
            name: fontName,
            fontTypes: ['woff2'],
            assetTypes: ['json'],
            formatOptions: {
              svg: {
                centerHorizontally: true,
                centerVertically: true,
              },
            },
            codepoints,
          });
        } catch (error) {
          console.warn(
            `Skipping font variant ${style}/${type}: ${(error as Error).message}`,
          );
        }
      }
    }

    for (const fileName of fs.readdirSync(ICONS_FONT_DIST)) {
      if (fileName.endsWith('.json')) {
        fs.rmSync(path.join(ICONS_FONT_DIST, fileName), { force: true });
      }
    }

    fs.writeFileSync(
      path.join(ICONS_FONT_DIST, 'tk-icons.css'),
      buildCss(Object.keys(codepoints).sort()),
      'utf8',
    );
    console.log('Generated icon font assets.');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

void main();
