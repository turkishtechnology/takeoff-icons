import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { iconMetadata, searchIcons } from '@tk-icons/core';
import addCoreIcon from '@tk-icons/core/icons/outlined/rounded/add';
import type { IconStyle, IconType } from '@tk-icons/core';
import { AddIconOutlinedRounded } from '@tk-icons/react/add';
import spriteUrl from '@tk-icons/sprite';
import { defineCustomElements } from '@tk-icons/web/dist/loader';
import '@tk-icons/font';
import addSvgSource from '../../../packages/icons-svg/svg/outlined/rounded/add.svg?raw';
import addVueSource from '../../../packages/icons-vue/src/add/AddIconOutlinedRounded.vue?raw';
import './index.css';

const rawIcons = import.meta.glob('../../../packages/icons-react/src/*/*.tsx', {
  eager: true,
});

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

interface GroupedIcon {
  name: string;
  variants: Record<string, IconComponent>;
}

const groupedIcons = new Map<string, Record<string, IconComponent>>();

Object.entries(rawIcons).forEach(([path, moduleExport]: [string, unknown]) => {
  if (path.endsWith('index.ts') || path.endsWith('index.tsx')) return;
  const parts = path.split('/');
  const iconName = parts[parts.length - 2];
  const fileName = parts[parts.length - 1].replace('.tsx', '');

  const mod = moduleExport as Record<string, unknown>;
  const Component = (mod[fileName] || mod.default || Object.values(mod)[0]) as
    | IconComponent
    | undefined;
  if (!Component) return;

  let fStyle = 'outlined';
  let fType = 'rounded';

  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('filled')) fStyle = 'filled';
  if (lowerName.includes('sharp')) fType = 'sharp';
  if (lowerName.includes('bevel')) fType = 'bevel';
  if (lowerName.includes('tk')) fType = 'tk';

  if (!groupedIcons.has(iconName)) {
    groupedIcons.set(iconName, {});
  }
  groupedIcons.get(iconName)![`${fStyle}-${fType}`] = Component;
});

const allIconEntries: GroupedIcon[] = Array.from(groupedIcons.entries())
  .map(([name, variants]) => ({ name, variants }))
  .sort((a, b) => a.name.localeCompare(b.name));

const STYLES: IconStyle[] = ['outlined', 'filled'];
const TYPES: IconType[] = ['rounded', 'sharp', 'bevel', 'tk'];
const PACKAGE_SMOKE_ICON = 'add';
const vueSfcMatch = addVueSource.match(/name:\s*'([^']+)'/);
const vueSfcName = vueSfcMatch?.[1] ?? 'Vue SFC';

let didDefineCustomElements = false;

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function ensureWebComponentsDefined() {
  if (didDefineCustomElements || typeof window === 'undefined') return;
  defineCustomElements(window);
  didDefineCustomElements = true;
}

function getFontClass(
  iconName: string,
  style: IconStyle,
  type: IconType,
): string {
  return `ti ti-${iconName}${style === 'filled' ? '-filled' : ''}${type !== 'rounded' ? ` ti-${type}` : ''}`;
}

function getSpriteSymbolId(
  iconName: string,
  style: IconStyle,
  type: IconType,
): string {
  return style === 'filled'
    ? `ti-${iconName}-filled-${type}`
    : `ti-${iconName}-${type}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      className={`copy-btn ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      title="Copy"
    >
      {copied ? '✓' : '⎘'}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M7.333 12.667A5.333 5.333 0 107.333 2a5.333 5.333 0 000 10.667zM14 14l-2.9-2.9"
        stroke="currentColor"
        strokeWidth="1.333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect
        x="1"
        y="1"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="8"
        y="1"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="1"
        y="8"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="8"
        y="8"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M4 3h9M4 7h9M4 11h9M1 3h.5M1 7h.5M1 11h.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CoreDataIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox={addCoreIcon.viewBox}
      width={36}
      height={36}
      style={{ color }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: addCoreIcon.svg }}
    />
  );
}

interface PackageSmokePanelProps {
  style: IconStyle;
  type: IconType;
  color: string;
}

function PackageSmokePanel({ style, type, color }: PackageSmokePanelProps) {
  const fontClass = getFontClass(PACKAGE_SMOKE_ICON, style, type);
  const spriteSymbolId = getSpriteSymbolId(PACKAGE_SMOKE_ICON, style, type);

  return (
    <section className="package-smoke" aria-label="Package smoke tests">
      <div className="package-smoke-header">
        <div>
          <h2>Package smoke</h2>
          <span>{PACKAGE_SMOKE_ICON}</span>
        </div>
        <span className="package-smoke-mode">
          {style}/{type}
        </span>
      </div>

      <div className="package-smoke-grid">
        <div className="package-smoke-card">
          <div className="package-icon">
            <CoreDataIcon color={color} />
          </div>
          <div>
            <span className="package-name">@tk-icons/core</span>
            <span className="package-detail">{addCoreIcon.variant}</span>
          </div>
        </div>

        <div className="package-smoke-card">
          <div className="package-icon">
            <AddIconOutlinedRounded width={36} height={36} style={{ color }} />
          </div>
          <div>
            <span className="package-name">@tk-icons/react</span>
            <span className="package-detail">component export</span>
          </div>
        </div>

        <div className="package-smoke-card">
          <div className="package-icon font-preview">
            <i className={fontClass} style={{ color }} aria-hidden="true" />
          </div>
          <div>
            <span className="package-name">@tk-icons/font</span>
            <span className="package-detail">{fontClass}</span>
          </div>
        </div>

        <div className="package-smoke-card">
          <div className="package-icon">
            <svg width={36} height={36} style={{ color }} aria-hidden="true">
              <use href={`${spriteUrl}#${spriteSymbolId}`} />
            </svg>
          </div>
          <div>
            <span className="package-name">@tk-icons/sprite</span>
            <span className="package-detail">#{spriteSymbolId}</span>
          </div>
        </div>

        <div className="package-smoke-card">
          <div className="package-icon">
            <tk-icon
              icon={PACKAGE_SMOKE_ICON}
              fill={style === 'filled' ? true : undefined}
              icon-type={type}
              size="large"
              color={color}
            />
          </div>
          <div>
            <span className="package-name">@tk-icons/web</span>
            <span className="package-detail">custom element</span>
          </div>
        </div>

        <div className="package-smoke-card">
          <div
            className="package-icon svg-source-preview"
            style={{ color }}
            dangerouslySetInnerHTML={{ __html: addSvgSource }}
          />
          <div>
            <span className="package-name">@tk-icons/svg</span>
            <span className="package-detail">raw source</span>
          </div>
        </div>

        <div className="package-smoke-card">
          <div className="package-icon source-preview">
            <span>{vueSfcName}</span>
          </div>
          <div>
            <span className="package-name">@tk-icons/vue</span>
            <span className="package-detail">{addVueSource.length} bytes</span>
          </div>
        </div>

        <div className="package-smoke-card">
          <div className="package-icon source-preview">
            <span>ESLint</span>
          </div>
          <div>
            <span className="package-name">@tk-icons/eslint-config</span>
            <span className="package-detail">react config</span>
          </div>
        </div>
      </div>
    </section>
  );
}

interface DetailPanelProps {
  icon: GroupedIcon;
  style: IconStyle;
  type: IconType;
  size: number;
  color: string;
  onClose: () => void;
}

function DetailPanel({
  icon,
  style,
  type,
  size,
  color,
  onClose,
}: DetailPanelProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const ActiveComponent = icon.variants[`${style}-${type}`];
  const pascalName = toPascalCase(icon.name);
  const styleSuffix = style === 'filled' ? 'Filled' : 'Outlined';
  const typeSuffix = toPascalCase(type);
  const componentName = `${pascalName}Icon${styleSuffix}${typeSuffix}`;
  const reactImport = `import { ${componentName} } from '@tk-icons/react/${icon.name}';\n\n<${componentName} width={24} height={24} />`;
  const webComponentSnippet = `<tk-icon icon="${icon.name}"${style === 'filled' ? ' fill' : ''} icon-type="${type}" size="base" variant="primary" />`;
  const fontClass = getFontClass(icon.name, style, type);

  return (
    <div className="detail-overlay" onClick={handleOverlayClick}>
      <div className="detail-panel">
        <div className="detail-header">
          <h2 className="detail-title">{icon.name}</h2>
          <button className="detail-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="detail-body">
          <div className="detail-left">
            <div className="detail-preview">
              {ActiveComponent ? (
                <ActiveComponent
                  width={size * 2.5}
                  height={size * 2.5}
                  style={{ color }}
                />
              ) : (
                <div
                  className="icon-placeholder"
                  style={{ width: size * 2.5, height: size * 2.5 }}
                />
              )}
            </div>

            <div className="detail-variants">
              {STYLES.flatMap((s) =>
                TYPES.map((t) => {
                  const key = `${s}-${t}`;
                  const Comp = icon.variants[key];
                  const isActive = s === style && t === type;
                  return (
                    <div
                      key={key}
                      className={`variant-cell ${isActive ? 'active' : ''}`}
                    >
                      {Comp ? (
                        <Comp
                          width={20}
                          height={20}
                          style={{
                            color: isActive
                              ? color
                              : 'var(--color-text-secondary)',
                          }}
                        />
                      ) : (
                        <div
                          className="icon-placeholder"
                          style={{ width: 20, height: 20 }}
                        />
                      )}
                      <span className="variant-label">
                        {s}/{t}
                      </span>
                    </div>
                  );
                }),
              )}
            </div>
          </div>

          <div className="detail-right">
            <div className="snippet-section">
              <div className="snippet-label">React</div>
              <div className="snippet-code">
                <code>{reactImport}</code>
                <CopyButton text={reactImport} />
              </div>
            </div>
            <div className="snippet-section">
              <div className="snippet-label">Web Component</div>
              <div className="snippet-code">
                <code>{webComponentSnippet}</code>
                <CopyButton text={webComponentSnippet} />
              </div>
            </div>
            <div className="snippet-section">
              <div className="snippet-label">Font</div>
              <div className="snippet-code">
                <code>{`<i class="${fontClass}"></i>`}</code>
                <CopyButton text={`<i class="${fontClass}"></i>`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeStyle, setActiveStyle] = useState<IconStyle>('outlined');
  const [activeType, setActiveType] = useState<IconType>('rounded');
  const [size, setSize] = useState(28);
  const [color, setColor] = useState('#e8e8ed');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIcon, setSelectedIcon] = useState<GroupedIcon | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensureWebComponentsDefined();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return allIconEntries;
    const results = new Set(searchIcons(search));
    return allIconEntries.filter(({ name }) => results.has(name as never));
  }, [search]);

  const variantKey = `${activeStyle}-${activeType}`;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-mark">TK</div>
            <span className="logo-text">Icons</span>
            <span className="logo-version">v0.0.1</span>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{allIconEntries.length}</span> icons
            </div>
            <div className="stat-item">
              <span className="stat-value">{iconMetadata.length}</span> entries
            </div>
          </div>
        </div>
      </header>

      <div className="toolbar">
        <div className="toolbar-inner">
          <div className="search-box">
            <SearchIcon />
            <input
              ref={searchRef}
              type="text"
              className="search-input"
              placeholder="Search icons…  ⌘K"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            {STYLES.map((s) => (
              <button
                key={s}
                className={`filter-btn ${activeStyle === s ? 'active' : ''}`}
                onClick={() => setActiveStyle(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="filter-group">
            {TYPES.map((t) => (
              <button
                key={t}
                className={`filter-btn ${activeType === t ? 'active' : ''}`}
                onClick={() => setActiveType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="size-control">
            <span>{size}px</span>
            <input
              type="range"
              className="size-slider"
              min={16}
              max={64}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>

          <div className="color-picker-wrapper">
            <div className="color-swatch" style={{ backgroundColor: color }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="main-content">
        <PackageSmokePanel
          style={activeStyle}
          type={activeType}
          color={color}
        />

        <div className="results-bar">
          <div className="results-count">
            <span>{filteredIcons.length}</span>{' '}
            {filteredIcons.length === 1 ? 'icon' : 'icons'}
            {search && ` for "${search}"`}
          </div>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <GridIcon />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {filteredIcons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">∅</div>
            <div className="empty-state-title">No icons found</div>
            <div className="empty-state-text">
              Try a different search term or adjust filters
            </div>
          </div>
        ) : (
          <div
            className={`icon-grid ${viewMode === 'list' ? 'list-view' : ''}`}
          >
            {filteredIcons.map(({ name, variants }) => {
              const Component = variants[variantKey];
              const isSelected = selectedIcon?.name === name;
              return (
                <div
                  key={name}
                  className={`icon-card ${!Component ? 'no-variant' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon({ name, variants })}
                  title={name}
                >
                  <div className="icon-display">
                    {Component ? (
                      <Component width={size} height={size} style={{ color }} />
                    ) : (
                      <div
                        className="icon-placeholder"
                        style={{ width: size, height: size }}
                      />
                    )}
                  </div>
                  <span className="icon-name">{name}</span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedIcon && (
        <DetailPanel
          icon={selectedIcon}
          style={activeStyle}
          type={activeType}
          size={size}
          color={color}
          onClose={() => setSelectedIcon(null)}
        />
      )}
    </div>
  );
}

export default App;
