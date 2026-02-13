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
});
