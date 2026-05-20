import { Component, Prop, h } from '@stencil/core';
import type { IconData, IconSemanticVariant, IconSize } from '@tk-icons/core';

const SIZE_MAP: Record<IconSize, number> = {
  xsmall: 12,
  small: 16,
  base: 24,
  medium: 32,
  large: 40,
  xlarge: 48,
  xxlarge: 64,
};

@Component({
  tag: 'tk-icon',
  styleUrl: 'tk-icon.css',
  shadow: true,
})
export class TkIcon {
  /**
   * The icon to render. Obtain icon data from `@tk-icons/core`, e.g.
   * `import addIcon from '@tk-icons/core/icons/outlined/rounded/add'`.
   */
  @Prop() icon?: IconData;
  /**
   * Sets size for the component.
   * @default 'base'
   */
  @Prop() size: IconSize = 'base';
  /**
   * The semantic color variant of the icon.
   * @default 'primary'
   */
  @Prop() variant: IconSemanticVariant = 'primary';
  @Prop() color?: string;
  /**
   * Accessible label. When provided the icon is exposed to assistive
   * technology as an image with this name; otherwise it is treated as
   * decorative and hidden.
   */
  @Prop() label?: string;

  private svgEl?: SVGSVGElement;

  public componentDidRender(): void {
    if (this.svgEl && this.icon) {
      this.svgEl.innerHTML = this.icon.svg;
    }
  }

  public render() {
    const icon = this.icon;
    if (!icon) {
      return null;
    }

    const px = SIZE_MAP[this.size] ?? SIZE_MAP.base;
    const labelled = Boolean(this.label);

    return (
      <svg
        ref={(el) => {
          this.svgEl = el as SVGSVGElement | undefined;
        }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={icon.viewBox}
        width={px}
        height={px}
        role={labelled ? 'img' : undefined}
        aria-label={labelled ? this.label : undefined}
        aria-hidden={labelled ? undefined : 'true'}
        class={`tk-icon-${this.variant}`}
        style={{ color: this.color ?? undefined }}
      />
    );
  }
}
