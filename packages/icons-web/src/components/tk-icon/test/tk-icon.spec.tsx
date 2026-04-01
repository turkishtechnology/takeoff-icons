import { newSpecPage } from '@stencil/core/testing';
import { TkIcon } from '../tk-icon';

describe('tk-icon', () => {
  it('renders empty when icon is missing', async () => {
    const page = await newSpecPage({
      components: [TkIcon],
      html: '<tk-icon></tk-icon>',
    });

    expect(page.root).toBeTruthy();
    expect(page.root?.shadowRoot?.querySelector('svg')).toBeNull();
  });

  it('renders when full icon data is passed through the icon prop', async () => {
    const page = await newSpecPage({
      components: [TkIcon],
      html: '<tk-icon></tk-icon>',
    });

    page.root!.icon = {
      name: 'arrow-left',
      style: 'outlined',
      type: 'rounded',
      variant: 'outlined/rounded',
      viewBox: '0 0 24 24',
      svg: '<path d="M0 0h24v24H0z" />',
    };
    await page.waitForChanges();

    const svg = page.root?.shadowRoot?.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.innerHTML).toContain('<path');
  });

  it('applies default size (base = 24px)', async () => {
    const page = await newSpecPage({
      components: [TkIcon],
      html: '<tk-icon></tk-icon>',
    });

    page.root!.icon = {
      name: 'arrow-left',
      style: 'outlined',
      type: 'rounded',
      variant: 'outlined/rounded',
      viewBox: '0 0 24 24',
      svg: '<path d="M0 0h24v24H0z" />',
    };
    await page.waitForChanges();

    const svg = page.root?.shadowRoot?.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('maps size token to pixel value', async () => {
    const page = await newSpecPage({
      components: [TkIcon],
      html: '<tk-icon size="large"></tk-icon>',
    });

    page.root!.icon = {
      name: 'arrow-left',
      style: 'outlined',
      type: 'rounded',
      variant: 'outlined/rounded',
      viewBox: '0 0 24 24',
      svg: '<path d="M0 0h24v24H0z" />',
    };
    await page.waitForChanges();

    const svg = page.root?.shadowRoot?.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('40');
    expect(svg?.getAttribute('height')).toBe('40');
  });

  it('applies variant class to svg', async () => {
    const page = await newSpecPage({
      components: [TkIcon],
      html: '<tk-icon variant="success"></tk-icon>',
    });

    page.root!.icon = {
      name: 'check',
      style: 'outlined',
      type: 'rounded',
      variant: 'outlined/rounded',
      viewBox: '0 0 24 24',
      svg: '<path d="M0 0h24v24H0z" />',
    };
    await page.waitForChanges();

    const svg = page.root?.shadowRoot?.querySelector('svg');
    expect(svg?.classList.contains('tk-icon-success')).toBe(true);
  });

  it('defaults variant to primary', async () => {
    const page = await newSpecPage({
      components: [TkIcon],
      html: '<tk-icon></tk-icon>',
    });

    page.root!.icon = {
      name: 'check',
      style: 'outlined',
      type: 'rounded',
      variant: 'outlined/rounded',
      viewBox: '0 0 24 24',
      svg: '<path d="M0 0h24v24H0z" />',
    };
    await page.waitForChanges();

    const svg = page.root?.shadowRoot?.querySelector('svg');
    expect(svg?.classList.contains('tk-icon-primary')).toBe(true);
  });
});
