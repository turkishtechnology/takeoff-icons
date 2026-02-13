import { Component, Prop, State, Watch, h } from '@stencil/core';
import {
  aliasMap,
  hasVariant,
  type IconData,
  type IconStyle,
  type IconType,
} from '@tk-icons/core';

@Component({
  tag: 'tk-icon',
  styleUrl: 'tk-icon.css',
  shadow: true,
})
export class TkIcon {
  @Prop() name?: string;
  @Prop() icon?: IconData;
  @Prop({ attribute: 'icon-style' }) iconStyle: IconStyle = 'outlined';
  @Prop({ attribute: 'icon-type' }) iconType: IconType = 'rounded';
  @Prop() size: number | string = 24;
  @Prop() color?: string;

  @State() private resolvedIcon?: IconData;
  private svgEl?: SVGSVGElement;

  @Watch('name')
  @Watch('icon')
  @Watch('iconStyle')
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
    if (this.icon) {
      this.resolvedIcon = this.icon;
      return;
    }

    if (!this.name) {
      this.resolvedIcon = undefined;
      return;
    }

    const resolvedName = aliasMap[this.name] ?? this.name;
    const variant = `${this.iconStyle}/${this.iconType}`;
    if (!hasVariant(resolvedName, variant)) {
      this.resolvedIcon = undefined;
      return;
    }

    try {
      const mod = await import(
        `@tk-icons/core/icons/${this.iconStyle}/${this.iconType}/${resolvedName}`
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

    return (
      <svg
        ref={(el) => {
          this.svgEl = el as SVGSVGElement | undefined;
        }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={icon.viewBox}
        width={this.size}
        height={this.size}
        role="img"
        aria-hidden="true"
        style={{ color: this.color ?? 'currentColor' }}
      />
    );
  }
}
