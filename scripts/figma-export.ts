/**
 * Figma → Code: Icon Export Script
 *
 * Synchronizes icons from a Figma file into the takeoff-icons pipeline.
 * Inspired by FigLint's Figma-to-Code approach.
 *
 * Pipeline:
 *   1. Authorizing  — validate env config, init API client
 *   2. Fetching     — scan Figma for icon components
 *   3. Normalizing  — clean SVG content (fills → currentColor)
 *   4. Saving       — write SVGs to directory structure
 *   5. Syncing      — update metadata YAML
 *   6. Reporting    — styled terminal summary
 *
 * Usage:
 *   FIGMA_TOKEN=<token> pnpm figma:export
 *   FIGMA_TOKEN=<token> pnpm figma:export --dry-run
 *
 * After export, run `pnpm generate` to optimize and build all packages.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import {
  SVG_ROOT,
  ROOT_DIR,
  ensureDir,
  type IconStyle,
  type IconType,
} from './utils';

// ═══════════════════════════════════════════════════════════════════════════
// .env loader (no external dependency)
// ═══════════════════════════════════════════════════════════════════════════

const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

type EnvConfig = {
  fileId: string;
  accessToken: string;
  nodeId?: string;
  pageNames: string[];
};

const FIGMA_API = 'https://api.figma.com/v1';
const METADATA_PATH = path.join(
  ROOT_DIR,
  'packages/icons-svg/metadata/icons.meta.yaml',
);

const BATCH_SIZE = 100;
const CONCURRENT_DOWNLOADS = 10;
const VALID_TYPES: readonly string[] = ['rounded', 'sharp', 'bevel', 'tk'];

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const METADATA_ONLY = args.includes('--metadata-only');

// ═══════════════════════════════════════════════════════════════════════════
// Terminal colors
// ═══════════════════════════════════════════════════════════════════════════

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
} as const;

function log(msg: string) {
  console.log(msg);
}

function logStep(step: number, title: string) {
  log(`\n${c.bold}${c.cyan}${step}. ${title}${c.reset}`);
}

function logOk(msg: string) {
  log(`  ${c.green}✓${c.reset} ${msg}`);
}

function logWarn(msg: string) {
  log(`  ${c.yellow}⚠${c.reset} ${msg}`);
}

function logErr(msg: string) {
  log(`  ${c.red}✗${c.reset} ${msg}`);
}

function logDim(msg: string) {
  log(`  ${c.dim}${msg}${c.reset}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  characters?: string;
  children?: FigmaNode[];
}

interface FigmaFileResponse {
  document: FigmaNode;
}

interface FigmaImagesResponse {
  images: Record<string, string | null>;
  err: string | null;
}

interface IconEntry {
  nodeId: string;
  iconName: string;
  style: IconStyle;
  type: IconType;
  parentPath: string; // category hint from parent container
  tags?: string[];
  svgContent?: string;
}

interface IconMeta {
  category: string;
  tags: string[];
  aliases: string[];
  added: string;
  deprecated?: boolean;
  variants: string[];
}

interface Report {
  fetched: number;
  downloaded: number;
  normalized: number;
  saved: number;
  failed: string[];
  skipped: string[];
  newIcons: number;
  updatedIcons: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Authorizing
// ═══════════════════════════════════════════════════════════════════════════

function getEnvConfig(): EnvConfig {
  const accessToken = process.env.FIGMA_TOKEN;
  const fileId = process.env.FIGMA_FILE_ID ?? 'LVruHwiRP8gFNRCKYaPhod';
  const nodeId = process.env.FIGMA_NODE_ID; // e.g. "38:184"
  const pageNames = (process.env.FIGMA_PAGE_NAME ?? 'Source')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!accessToken) {
    logErr('FIGMA_TOKEN environment variable is not set.');
    logDim('Get your token from: Figma → Settings → Personal Access Tokens');
    process.exit(1);
  }

  return { fileId, accessToken, nodeId, pageNames };
}

async function figmaFetch<T>(env: EnvConfig, endpoint: string): Promise<T> {
  const url = `${FIGMA_API}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': env.accessToken },
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after') || 30);
    logWarn(`Rate limited. Waiting ${retryAfter}s...`);
    await sleep(retryAfter * 1000);
    return figmaFetch<T>(env, endpoint);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Figma API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Fetching
// ═══════════════════════════════════════════════════════════════════════════

/** Check if a node should be excluded (Figma convention: _ or . prefix). */
function isHidden(name: string): boolean {
  return name.startsWith('_') || name.startsWith('.');
}

/** Check if a frame name is auto-generated (e.g. "Frame 91"). */
function isGenericName(name: string): boolean {
  return /^(Frame|Group|Section|Rectangle|Auto layout|Row|Column)\s*\d*$/i.test(
    name,
  );
}

function toKebabCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/') // normalize path separators
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizePageName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

/**
 * Parses Figma variant component names into the project's style/type system.
 *
 * Handles multiple formats:
 *   "type=rounded, filled=false"           → outlined/rounded
 *   "rounded, filled=false"                → outlined/rounded  (bare type)
 *   "bevel, filled=true"                   → filled/bevel
 *   "type=rounded, filled=false, square=true" → outlined/rounded
 *   "bevel, filled=true, square=true"      → filled/bevel
 */
function parseVariantProps(
  variantName: string,
): { style: IconStyle; type: IconType } | null {
  const props: Record<string, string> = {};
  const bareValues: string[] = [];

  for (const part of variantName.split(',')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      const key = trimmed.slice(0, eq).trim().toLowerCase();
      const val = trimmed
        .slice(eq + 1)
        .trim()
        .toLowerCase();
      props[key] = val;
    } else if (trimmed) {
      bareValues.push(trimmed.toLowerCase());
    }
  }

  // Resolve icon type: explicit `type=X` or bare value matching a known type
  const iconType = (props['type'] ??
    bareValues.find((v) => VALID_TYPES.includes(v))) as IconType | undefined;

  const filled = props['filled'];

  if (!iconType || filled === undefined) return null;
  if (!VALID_TYPES.includes(iconType)) return null;

  const style: IconStyle = filled === 'true' ? 'filled' : 'outlined';

  return { style, type: iconType };
}

/**
 * Extracts tags from a Color-tag INSTANCE sibling of a COMPONENT_SET.
 *
 * Structure: parent FRAME → [ INSTANCE(Color-tag) → [ TEXT(name), TEXT(tags) ], COMPONENT_SET ]
 * The second TEXT node inside the Color-tag contains comma-separated tags.
 */
function extractTagsFromSiblings(siblings: FigmaNode[]): string[] {
  for (const sibling of siblings) {
    if (sibling.type !== 'INSTANCE') continue;
    const textNodes = findAllTextNodes(sibling);
    // The longest text content is typically the tags string
    let tagsText = '';
    for (const tn of textNodes) {
      if (tn.characters && tn.characters.length > tagsText.length) {
        tagsText = tn.characters;
      }
    }
    if (tagsText.includes(',')) {
      return tagsText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }
  }
  return [];
}

/** Recursively finds all TEXT nodes in a subtree. */
function findAllTextNodes(node: FigmaNode): FigmaNode[] {
  const result: FigmaNode[] = [];
  if (node.type === 'TEXT') result.push(node);
  for (const child of node.children ?? []) {
    result.push(...findAllTextNodes(child));
  }
  return result;
}

/**
 * Recursively collects icon component variants from the Figma tree.
 *
 * - Filters out nodes prefixed with `_` or `.`
 * - Tracks nearest meaningful parent container as category hint
 * - Only collects COMPONENT children of COMPONENT_SET nodes
 * - Extracts tags from sibling Color-tag INSTANCE nodes
 */
function collectIcons(
  node: FigmaNode,
  parentPath: string = 'uncategorized',
): IconEntry[] {
  if (isHidden(node.name)) return [];

  const entries: IconEntry[] = [];

  // Update category hint from meaningful container names
  const currentPath =
    (node.type === 'FRAME' || node.type === 'SECTION') &&
    !isGenericName(node.name)
      ? toKebabCase(node.name)
      : parentPath;

  if (node.type === 'COMPONENT_SET' && node.children) {
    const iconName = toKebabCase(node.name);

    for (const child of node.children) {
      if (isHidden(child.name)) continue;

      const parsed = parseVariantProps(child.name);
      if (!parsed) continue;

      entries.push({
        nodeId: child.id,
        iconName,
        style: parsed.style,
        type: parsed.type,
        parentPath: currentPath,
      });
    }
  }

  // Recurse into children (skip plain COMPONENTs — they are variant leaves)
  // When a frame contains COMPONENT_SETs, extract tags from sibling nodes
  if (node.children) {
    const hasComponentSet = node.children.some(
      (c) => c.type === 'COMPONENT_SET',
    );

    // Extract tags once from sibling Color-tag instances (shared across all CS in this frame)
    const frameTags = hasComponentSet
      ? extractTagsFromSiblings(node.children)
      : [];

    for (const child of node.children) {
      if (child.type === 'COMPONENT') continue;

      if (child.type === 'COMPONENT_SET') {
        const iconEntries = collectIcons(child, currentPath);
        if (frameTags.length > 0) {
          for (const entry of iconEntries) {
            entry.tags = frameTags;
          }
        }
        entries.push(...iconEntries);
      } else {
        entries.push(...collectIcons(child, currentPath));
      }
    }
  }

  return entries;
}

interface FigmaComponentSetMeta {
  key: string;
  name: string;
  description: string;
  documentationLinks: { uri: string }[];
}

/**
 * Fetch a specific Figma node by ID and collect icons from it.
 * Also reads componentSets metadata to extract tags from descriptions.
 */
async function fetchByNodeId(
  env: EnvConfig,
  nodeId: string,
): Promise<IconEntry[]> {
  logDim(`Fetching node: ${nodeId}`);

  const nodesResp = await figmaFetch<{
    nodes: Record<
      string,
      {
        document: FigmaNode;
        componentSets?: Record<string, FigmaComponentSetMeta>;
      }
    >;
  }>(env, `/files/${env.fileId}/nodes?ids=${nodeId}`);

  const nodeData = nodesResp.nodes[nodeId];
  if (!nodeData?.document)
    throw new Error(`Node "${nodeId}" not found in file.`);

  const entries = collectIcons(nodeData.document);

  // Enrich entries with tags from componentSets descriptions
  if (nodeData.componentSets) {
    // Build a map: componentSetId → tags from description
    const csDescriptions = new Map<string, string[]>();
    for (const [csId, csMeta] of Object.entries(nodeData.componentSets)) {
      if (csMeta.description) {
        const tags = csMeta.description
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
        if (tags.length > 0) csDescriptions.set(csId, tags);
      }
    }

    // Match entries to their parent COMPONENT_SET by looking up node IDs
    // The entry nodeId is a COMPONENT child; its parent COMPONENT_SET ID
    // can be found via the componentSetId in the components metadata
    // Alternative: match by iconName since COMPONENT_SET.name == iconName
    for (const entry of entries) {
      if (entry.tags && entry.tags.length > 0) continue;

      // Find matching componentSet by name
      for (const [, csMeta] of Object.entries(nodeData.componentSets)) {
        if (toKebabCase(csMeta.name) === entry.iconName && csMeta.description) {
          entry.tags = csMeta.description
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
          break;
        }
      }
    }
  }

  return entries;
}

/**
 * Fetch the Figma file and locate icons.
 *
 * Resolution order:
 *   1. FIGMA_NODE_ID env var    → fetch that specific node
 *   2. FIGMA_PAGE_NAME matches  → fetch matching page subtrees (comma-separated)
 *   3. Fail with available page names
 */
async function fetchIconEntries(env: EnvConfig): Promise<IconEntry[]> {
  logDim(`File: ${env.fileId}`);

  // 1. Direct node ID — most precise, skips page discovery
  if (env.nodeId) {
    logDim(`Using node ID: ${env.nodeId}`);
    return fetchByNodeId(env, env.nodeId);
  }

  // 2. Find pages by name
  logDim(`Looking for pages: ${env.pageNames.map((n) => `"${n}"`).join(', ')}`);

  const file = await figmaFetch<FigmaFileResponse>(
    env,
    `/files/${env.fileId}?depth=1`,
  );

  const allPages = file.document.children ?? [];
  const requestedPages = new Set(env.pageNames.map(normalizePageName));
  const matched = allPages.filter((p) =>
    requestedPages.has(normalizePageName(p.name)),
  );

  if (matched.length === 0) {
    const available = allPages.map((p) => p.name);
    logErr(`No matching pages found.`);
    logDim(`Available pages: ${available.join(', ')}`);
    logDim(`Fix: set FIGMA_PAGE_NAME or FIGMA_NODE_ID in .env`);
    process.exit(1);
  }

  // Fetch all matching pages
  const entries: IconEntry[] = [];
  for (const page of matched) {
    logOk(`Page: "${page.name}" (${page.id})`);
    const pageEntries = await fetchByNodeId(env, page.id);
    entries.push(...pageEntries);
  }

  return entries;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Normalizing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize raw SVG content from Figma.
 * (Colors are now transformed via SVGO AST in optimize.ts)
 */
function normalizeSvg(svgContent: string): string {
  return svgContent.replace(/\s*xmlns="[^"]*"/g, '');
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Saving
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export SVGs via Figma Images API and download them.
 * Returns the icons with `svgContent` populated.
 */
async function exportAndDownload(
  env: EnvConfig,
  icons: IconEntry[],
  report: Report,
): Promise<void> {
  // Batch export via Figma Images API
  const svgUrls: Record<string, string | null> = {};

  for (let i = 0; i < icons.length; i += BATCH_SIZE) {
    const batch = icons.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(icons.length / BATCH_SIZE);
    logDim(
      `Exporting batch ${batchNum}/${totalBatches} (${batch.length} variants)...`,
    );

    const ids = batch.map((ic) => ic.nodeId).join(',');
    const resp = await figmaFetch<FigmaImagesResponse>(
      env,
      `/images/${env.fileId}?ids=${ids}&format=svg`,
    );

    if (resp.err) logWarn(`Figma: ${resp.err}`);
    Object.assign(svgUrls, resp.images);
  }

  // Concurrent download
  const queue = [...icons];

  async function worker() {
    while (queue.length > 0) {
      const icon = queue.shift()!;
      const url = svgUrls[icon.nodeId];

      if (!url) {
        report.failed.push(`${icon.iconName} (${icon.style}/${icon.type})`);
        continue;
      }

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        icon.svgContent = await res.text();
        report.downloaded++;
      } catch {
        report.failed.push(`${icon.iconName} (${icon.style}/${icon.type})`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENT_DOWNLOADS }, () => worker()),
  );
}

function saveIcons(icons: IconEntry[], report: Report): void {
  for (const icon of icons) {
    if (!icon.svgContent) continue;

    const destDir = path.join(SVG_ROOT, icon.style, icon.type);
    ensureDir(destDir);

    const destPath = path.join(destDir, `${icon.iconName}.svg`);
    fs.writeFileSync(destPath, icon.svgContent, 'utf8');
    report.saved++;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Syncing
// ═══════════════════════════════════════════════════════════════════════════

function syncMetadata(icons: IconEntry[], report: Report): void {
  const raw = fs.existsSync(METADATA_PATH)
    ? fs.readFileSync(METADATA_PATH, 'utf8')
    : 'icons: {}';
  const metadata = parse(raw) as { icons: Record<string, IconMeta> };
  if (!metadata.icons) metadata.icons = {};

  // Group variants and tags by icon name
  const grouped = new Map<
    string,
    { variants: Set<string>; category: string; tags: string[] }
  >();

  const svgRoot = path.join(ROOT_DIR, 'packages/icons-svg/svg');

  for (const ic of icons) {
    // In full export mode, only include icons with downloaded SVG content.
    // In metadata-only mode, verify the SVG file exists on disk.
    if (METADATA_ONLY) {
      const svgPath = path.join(
        svgRoot,
        ic.style,
        ic.type,
        `${ic.iconName}.svg`,
      );
      if (!fs.existsSync(svgPath)) continue;
    } else {
      if (!ic.svgContent) continue;
    }

    if (!grouped.has(ic.iconName)) {
      grouped.set(ic.iconName, {
        variants: new Set(),
        category: ic.parentPath,
        tags: ic.tags ?? [],
      });
    }
    const group = grouped.get(ic.iconName)!;
    group.variants.add(`${ic.style}/${ic.type}`);
    // Use tags from the first entry that has them
    if (group.tags.length === 0 && ic.tags && ic.tags.length > 0) {
      group.tags = ic.tags;
    }
  }

  for (const [name, info] of grouped) {
    const sortedVariants = [...info.variants].sort();
    const tags = info.tags.length > 0 ? info.tags : name.split('-');

    if (metadata.icons[name]) {
      // Existing icon — merge variants, update tags if from Figma
      const existing = new Set(metadata.icons[name].variants ?? []);
      for (const v of sortedVariants) existing.add(v);
      metadata.icons[name].variants = [...existing].sort();
      if (info.tags.length > 0) {
        metadata.icons[name].tags = tags;
      }
      report.updatedIcons++;
    } else {
      // New icon — create entry
      metadata.icons[name] = {
        category: info.category,
        tags,
        aliases: [],
        added: '1.0.0',
        variants: sortedVariants,
      };
      report.newIcons++;
    }
  }

  // Sort alphabetically and write
  const sorted: Record<string, IconMeta> = {};
  for (const key of Object.keys(metadata.icons).sort()) {
    sorted[key] = metadata.icons[key];
  }
  metadata.icons = sorted;

  fs.mkdirSync(path.dirname(METADATA_PATH), { recursive: true });
  fs.writeFileSync(METADATA_PATH, buildMetadataYaml(sorted), 'utf8');

  // Generate categories.yaml from unique categories in metadata
  const categories = new Set<string>();
  for (const meta of Object.values(sorted)) {
    categories.add(meta.category);
  }
  const categoriesPath = path.join(
    path.dirname(METADATA_PATH),
    'categories.yaml',
  );
  const catLines: string[] = ['categories:'];
  for (const cat of [...categories].sort()) {
    const label = cat
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    catLines.push(`  - id: ${cat}`);
    catLines.push(`    label: "${label}"`);
    catLines.push(`    description: ""`);
  }
  fs.writeFileSync(categoriesPath, catLines.join('\n') + '\n', 'utf8');
}

function buildMetadataYaml(icons: Record<string, IconMeta>): string {
  const lines: string[] = ['icons:'];
  const quote = (value: string) => JSON.stringify(value);
  const list = (values: string[]) => values.map(quote).join(', ');

  for (const [name, meta] of Object.entries(icons)) {
    lines.push(`  ${name}:`);
    lines.push(`    category: ${quote(meta.category)}`);
    lines.push(`    tags: [${list(meta.tags)}]`);
    lines.push(`    aliases: [${list(meta.aliases ?? [])}]`);
    lines.push(`    added: ${quote(meta.added)}`);
    if (meta.deprecated) lines.push(`    deprecated: true`);
    lines.push(`    variants:`);
    for (const v of meta.variants) {
      lines.push(`      - ${v}`);
    }
  }

  return lines.join('\n') + '\n';
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Reporting
// ═══════════════════════════════════════════════════════════════════════════

function printReport(icons: IconEntry[], report: Report): void {
  log(`\n${c.bold}═══════════════════════════════════════${c.reset}`);
  log(`${c.bold}  Export Summary${c.reset}`);
  log(`${c.bold}═══════════════════════════════════════${c.reset}\n`);

  const iconNames = [...new Set(icons.map((ic) => ic.iconName))].sort();

  // Icons table
  log(
    `  ${c.bold}Icons${c.reset}  ${iconNames.length} icons, ${icons.length} variants\n`,
  );

  for (const name of iconNames) {
    const variants = icons.filter((ic) => ic.iconName === name);
    const styles = [...new Set(variants.map((v) => v.style))];
    const styleStr = styles
      .map((s) => {
        const types = variants
          .filter((v) => v.style === s)
          .map((v) => v.type)
          .join(', ');
        return `${c.dim}${s}${c.reset}(${types})`;
      })
      .join(' ');
    log(`  ${c.green}●${c.reset} ${name}  ${styleStr}`);
  }

  // Stats
  log(`\n  ${c.bold}Pipeline${c.reset}`);
  log(`  Fetched      ${c.cyan}${report.fetched}${c.reset} variants`);
  log(`  Downloaded   ${c.cyan}${report.downloaded}${c.reset} SVGs`);
  log(`  Normalized   ${c.cyan}${report.normalized}${c.reset} SVGs`);
  log(`  Saved        ${c.cyan}${report.saved}${c.reset} files`);

  // Metadata
  log(`\n  ${c.bold}Metadata${c.reset}`);
  if (report.newIcons > 0) {
    log(`  New          ${c.green}+${report.newIcons}${c.reset} icons`);
  }
  if (report.updatedIcons > 0) {
    log(`  Updated      ${c.yellow}~${report.updatedIcons}${c.reset} icons`);
  }

  // Failures
  if (report.failed.length > 0) {
    log(`\n  ${c.bold}${c.red}Failed (${report.failed.length})${c.reset}`);
    for (const f of report.failed) {
      logErr(f);
    }
  }

  // Skipped (show summary, not every entry)
  if (report.skipped.length > 0) {
    log(
      `\n  ${c.bold}${c.yellow}Skipped${c.reset}  ${report.skipped.length} duplicates`,
    );
  }

  log(`\n${c.bold}═══════════════════════════════════════${c.reset}`);

  if (report.saved > 0) {
    log(`\n  ${c.bold}Next steps:${c.reset}`);
    log(`  1. Review categories in ${c.dim}icons.meta.yaml${c.reset}`);
    log(`  2. Run: ${c.cyan}pnpm generate${c.reset}`);
  }

  log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const modeLabel = METADATA_ONLY
    ? `  ${c.cyan}(metadata only)${c.reset}`
    : DRY_RUN
      ? `  ${c.yellow}(dry run)${c.reset}`
      : '';
  log(`\n${c.bold}takeoff-icons · Figma Export${c.reset}${modeLabel}`);

  const report: Report = {
    fetched: 0,
    downloaded: 0,
    normalized: 0,
    saved: 0,
    failed: [],
    skipped: [],
    newIcons: 0,
    updatedIcons: 0,
  };

  // ── 1. Authorizing ──────────────────────────────────────────────────
  logStep(1, 'Authorizing');
  const env = getEnvConfig();
  logOk(`Token: ${env.accessToken.slice(0, 8)}...`);
  logOk(`File:  ${env.fileId}`);

  // ── 2. Fetching ─────────────────────────────────────────────────────
  logStep(2, 'Fetching');
  const allEntries = await fetchIconEntries(env);

  // Deduplicate
  const seen = new Set<string>();
  const icons = allEntries.filter((ic) => {
    const key = `${ic.iconName}::${ic.style}/${ic.type}`;
    if (seen.has(key)) {
      report.skipped.push(`Duplicate: ${key}`);
      return false;
    }
    seen.add(key);
    return true;
  });

  report.fetched = icons.length;
  logOk(
    `Found ${[...new Set(icons.map((ic) => ic.iconName))].length} icons (${icons.length} variants)`,
  );

  if (icons.length === 0) {
    logWarn('No icon components found. Check your Figma file structure.');
    return;
  }

  // ── Dry run stops here ──────────────────────────────────────────────
  if (DRY_RUN) {
    printReport(icons, report);
    log(`  ${c.yellow}Dry run — no files written.${c.reset}\n`);
    return;
  }

  // ── Metadata-only: skip SVG export, only sync metadata ─────────────
  if (METADATA_ONLY) {
    logStep(3, 'Syncing metadata');
    syncMetadata(icons, report);
    logOk(
      `Metadata: ${c.green}+${report.newIcons}${c.reset} new, ${c.yellow}~${report.updatedIcons}${c.reset} updated`,
    );
    printReport(icons, report);
    return;
  }

  // ── 3. Exporting + Normalizing ──────────────────────────────────────
  logStep(3, 'Normalizing');
  await exportAndDownload(env, icons, report);

  for (const icon of icons) {
    if (icon.svgContent) {
      icon.svgContent = normalizeSvg(icon.svgContent);
      report.normalized++;
    }
  }

  logOk(`Normalized ${report.normalized} SVGs`);

  // ── 4. Saving ───────────────────────────────────────────────────────
  logStep(4, 'Saving');
  saveIcons(icons, report);
  logOk(
    `Saved ${report.saved} files to ${c.dim}packages/icons-svg/svg/${c.reset}`,
  );

  // ── 5. Syncing ──────────────────────────────────────────────────────
  logStep(5, 'Syncing');
  syncMetadata(icons, report);
  logOk(
    `Metadata: ${c.green}+${report.newIcons}${c.reset} new, ${c.yellow}~${report.updatedIcons}${c.reset} updated`,
  );

  // ── 6. Reporting ────────────────────────────────────────────────────
  logStep(6, 'Reporting');
  printReport(icons, report);
}

main().catch((err) => {
  logErr(String(err));
  process.exit(1);
});
