import { describe, it, expect } from 'vitest';
import { optimizeSvg } from '../optimize';

describe('SVG Optimization', () => {
  it('should remove presentation attributes from root svg', () => {
    const raw = `<svg fill="red" stroke="blue" stroke-width="2" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/></svg>`;
    const optimized = optimizeSvg(raw);
    expect(optimized).not.toContain('fill="red"');
    expect(optimized).not.toContain('stroke="blue"');
    expect(optimized).toContain('viewBox="0 0 24 24"');
  });

  it('should convert inner color attributes to currentColor', () => {
    const raw = `<svg viewBox="0 0 24 24"><path fill="#FF0000" stroke="#00FF00" d="M0 0h24v24H0z"/></svg>`;
    const optimized = optimizeSvg(raw);
    expect(optimized).toContain('fill="currentColor"');
    expect(optimized).toContain('stroke="currentColor"');
    expect(optimized).not.toContain('#FF0000');
    expect(optimized).not.toContain('#00FF00');
  });

  it('should preserve fill="none"', () => {
    const raw = `<svg viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/></svg>`;
    const optimized = optimizeSvg(raw);
    expect(optimized).toContain('fill="none"');
    expect(optimized).not.toContain('currentColor');
  });

  it('should remove masks and clip paths', () => {
    const raw = `<svg viewBox="0 0 24 24"><clipPath id="a"><path d="M0 0h24v24H0z"/></clipPath><mask id="b"><path d="M0 0h24v24H0z"/></mask><path clip-path="url(#a)" mask="url(#b)" d="M0 0h24v24H0z"/></svg>`;
    const optimized = optimizeSvg(raw);
    expect(optimized).not.toContain('<clipPath');
    expect(optimized).not.toContain('<mask');
    expect(optimized).not.toContain('clip-path="');
    expect(optimized).not.toContain('mask="');
    expect(optimized).toContain('<path d="M0 0h24v24H0z"');
  });
});
