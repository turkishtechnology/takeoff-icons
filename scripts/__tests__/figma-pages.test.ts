import { describe, it, expect } from 'vitest';
import { isCategoryPage } from '../utils';

describe('isCategoryPage', () => {
  it.each([
    '01 Arrows',
    '❌ 07 Files & Documents 📑',
    '❌ 08 Devices & Hardware  🖥️',
    '✅ 15 Lifestyle  😎',
    '18 AI Icons',
  ])('accepts library page %j', (name) => {
    expect(isCategoryPage(name)).toBe(true);
  });

  it.each([
    '00 cover',
    '19 Payment',
    '21 Flags',
    'Source',
    'tk',
    '2024 Archive',
    '01. Arrows',
  ])('rejects %j', (name) => {
    expect(isCategoryPage(name)).toBe(false);
  });
});
