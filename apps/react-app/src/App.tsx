import { useState } from 'react';
import { ArrowLeftIcon } from '@tk-icons/react';
import { iconMetadata, searchIcons, resolveIconName } from '@tk-icons/core';
import type { IconStyle, IconType } from '@tk-icons/core';
import '@tk-icons/font';

const styles: IconStyle[] = ['outlined', 'filled'];
const types: IconType[] = ['rounded', 'sharp', 'bevel', 'tk'];

function App() {
  const [activeStyle, setActiveStyle] = useState<IconStyle>('outlined');
  const [activeType, setActiveType] = useState<IconType>('rounded');
  const [size, setSize] = useState(32);
  const [color, setColor] = useState('#1a1a1a');
  const [search, setSearch] = useState('');

  const icons = [{ name: 'ArrowLeftIcon', Component: ArrowLeftIcon }];

  const searchResults = search ? searchIcons(search) : [];

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 900,
        margin: '0 auto',
        padding: 32,
      }}
    >
      <h1 style={{ marginBottom: 8 }}>tk-icons Playground</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Test alanı — paketleri burada dene
      </p>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 8,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        <label>
          Style:
          <select
            value={activeStyle}
            onChange={(e) => setActiveStyle(e.target.value as IconStyle)}
            style={{ marginLeft: 8 }}
          >
            {styles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type:
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as IconType)}
            style={{ marginLeft: 8 }}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Size:
          <input
            type="range"
            min={16}
            max={96}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            style={{ marginLeft: 8 }}
          />
          <span style={{ marginLeft: 4 }}>{size}px</span>
        </label>
        <label>
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      {/* Icon Grid */}
      <h2>React Components</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 48,
        }}
      >
        {icons.map(({ name, Component }) => (
          <div
            key={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: 16,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
            }}
          >
            <Component
              iconStyle={activeStyle}
              iconType={activeType}
              size={size}
              color={color}
            />
            <span style={{ fontSize: 12, color: '#666' }}>{name}</span>
          </div>
        ))}
      </div>

      {/* Variant Matrix */}
      <h2>Variant Matrix</h2>
      <table
        style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 48 }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: 8,
                borderBottom: '2px solid #e0e0e0',
              }}
            >
              Icon
            </th>
            {styles.flatMap((s) =>
              types.map((t) => (
                <th
                  key={`${s}-${t}`}
                  style={{
                    padding: 8,
                    borderBottom: '2px solid #e0e0e0',
                    fontSize: 11,
                  }}
                >
                  {s}/{t}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {icons.map(({ name, Component }) => (
            <tr key={name}>
              <td
                style={{
                  padding: 8,
                  borderBottom: '1px solid #eee',
                  fontSize: 13,
                }}
              >
                {name}
              </td>
              {styles.flatMap((s) =>
                types.map((t) => (
                  <td
                    key={`${s}-${t}`}
                    style={{
                      padding: 8,
                      borderBottom: '1px solid #eee',
                      textAlign: 'center',
                    }}
                  >
                    <Component
                      iconStyle={s}
                      iconType={t}
                      size={24}
                      color="#333"
                    />
                  </td>
                )),
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Font Icons Demo */}
      <h2>Font Icons</h2>
      <p style={{ color: '#666', fontSize: 13, marginTop: 0 }}>
        CSS font-based icons via <code>@tk-icons/font</code> — class composition
        ile style/type kontrolü
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 48,
        }}
      >
        {styles.flatMap((s) =>
          types.map((t) => {
            const modifiers = [
              s === 'filled' ? 'tk-icon-filled' : '',
              t !== 'rounded' ? `tk-icon-${t}` : '',
            ]
              .filter(Boolean)
              .join(' ');
            const className = `tk-icon-arrow-left ${modifiers}`.trim();
            return (
              <div
                key={`font-${s}-${t}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: 16,
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                }}
              >
                <i className={className} style={{ fontSize: size, color }} />
                <span
                  style={{
                    fontSize: 11,
                    color: '#666',
                    fontFamily: 'monospace',
                  }}
                >
                  {s}/{t}
                </span>
                <code
                  style={{
                    fontSize: 10,
                    color: '#999',
                    wordBreak: 'break-all',
                    textAlign: 'center',
                  }}
                >
                  .{className.replace(/ /g, ' .')}
                </code>
              </div>
            );
          }),
        )}
      </div>

      {/* Core API Test */}
      <h2>Core API</h2>

      <h3>Metadata ({iconMetadata.length} icons)</h3>
      <pre
        style={{
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 12,
        }}
      >
        {JSON.stringify(iconMetadata, null, 2)}
      </pre>

      <h3>Search</h3>
      <input
        type="text"
        placeholder="Search icons... (try: arrow, back, left)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: '8px 12px',
          width: '100%',
          boxSizing: 'border-box',
          fontSize: 14,
          border: '1px solid #ccc',
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      {search && (
        <p style={{ color: '#666', fontSize: 13 }}>
          Results for "{search}":{' '}
          {searchResults.length > 0 ? searchResults.join(', ') : 'no match'}
        </p>
      )}

      <h3>Alias Resolution</h3>
      <p style={{ fontSize: 13, color: '#666' }}>
        "back" → {resolveIconName('back') ?? 'undefined'} | "previous" →{' '}
        {resolveIconName('previous') ?? 'undefined'}
      </p>
    </div>
  );
}

export default App;
