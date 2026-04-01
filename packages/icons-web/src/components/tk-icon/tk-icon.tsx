import { Component, Prop, State, Watch, h } from '@stencil/core';
import {
  aliasMap,
  hasVariant,
  type IconData,
  type IconSemanticVariant,
  type IconSize,
  type IconStyle,
  type IconType,
} from '@tk-icons/core';

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
   * Icon name or full icon data.
   */
  @Prop() icon?: string | IconData;
  /**
   * @deprecated Use `icon` instead.
   */
  @Prop() name?: string;
  /**
   * Indicates whether the filled variant should be used.
   */
  @Prop() fill = false;
  @Prop({ attribute: 'icon-type' }) iconType: IconType = 'rounded';
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

  @State() private resolvedIcon?: IconData;
  private svgEl?: SVGSVGElement;

  @Watch('name')
  @Watch('icon')
  @Watch('fill')
  @Watch('iconType')
  protected onPropsChange(): Promise<void> {
    return this.loadIcon();
  }

  public async componentWillLoad(): Promise<void> {
    await this.loadIcon();
  }

  public componentDidRender(): void {
    if (this.svgEl && this.resolvedIcon) {
      this.svgEl.innerHTML = this.resolvedIcon.svg;
    }
  }

  private async loadIcon(): Promise<void> {
    if (this.icon && typeof this.icon !== 'string') {
      this.resolvedIcon = this.icon;
      return;
    }

    const iconName =
      typeof this.icon === 'string' && this.icon.trim() ? this.icon : this.name;

    if (!iconName) {
      this.resolvedIcon = undefined;
      return;
    }

    const resolvedName = aliasMap[iconName] ?? iconName;
    const iconStyle: IconStyle = this.fill ? 'filled' : 'outlined';
    const variant = `${iconStyle}/${this.iconType}`;
    if (!hasVariant(resolvedName, variant)) {
      this.resolvedIcon = undefined;
      return;
    }

    try {
      const mod = await import(
        `@tk-icons/core/icons/${iconStyle}/${this.iconType}/${resolvedName}`
      );
      const data = (mod as { default?: IconData }).default;
      this.resolvedIcon = data;
    } catch {
      this.resolvedIcon = undefined;
    }
  }

  public render() {
    const icon = this.resolvedIcon;
    if (!icon) {
      return null;
    }

    const px = SIZE_MAP[this.size] ?? SIZE_MAP.base;

    return (
      <svg
        ref={(el) => {
          this.svgEl = el as SVGSVGElement | undefined;
        }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={icon.viewBox}
        width={px}
        height={px}
        role="img"
        aria-hidden="true"
        class={`tk-icon-${this.variant}`}
        style={{ color: this.color ?? undefined }}
      />
    );
  }
}
