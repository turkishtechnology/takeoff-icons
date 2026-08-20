# @takeoff-icons/wc

## 0.4.0

### Minor Changes

- [#9](https://github.com/turkishtechnology/takeoff-icons/pull/9) [`9ac9d5a`](https://github.com/turkishtechnology/takeoff-icons/commit/9ac9d5aadc230ace4a8c105921b2cad253698812) Thanks [@pinaryalcinduran](https://github.com/pinaryalcinduran)! - Sync icons from Figma: 9 new icons (1119 → 1128), 10 updated drawings and 61
  recategorized icons. No icon or variant was removed and no existing font codepoint
  moved, so the icon font stays backwards compatible.

  The new icons are `traffic-lights`, `train` and `truck`, each in the plain, `-circle`
  and `-square` shapes across all 8 style/type variants. They come from the Logistic
  page, which the export had been silently skipping: the page name gained a status
  prefix in Figma and no longer matched `FIGMA_PAGE_NAME`. The export now warns when a
  requested page is missing instead of dropping it without a trace.

  `devices-hardware` is populated again, with the 58 icons that Figma has had on that
  page all along. Category was previously written only when an icon was first
  imported, so anything that landed in `uncategorized` before its Figma frame was
  named stayed there permanently. The export now backfills a category from Figma when
  the stored one is `uncategorized`, without touching hand-curated categories. This
  also adds the `pin` category (3 icons) to `CategoryId`. `uncategorized` drops from
  114 icons to 53.

  The redrawn icons are `alert`, `info`, `chevron-bottom` and `tram`, with their
  `-circle` and `-square` shapes. They were snapped to the 1px grid in Figma, so their
  inner shapes shift by a few tenths of a unit. `info` is the most visible: its stem
  and dot each shrink from 2.56 to 2.0 units.

  Fixes two ways the export could hang or die mid-run: Figma requests had no timeout,
  so a connection that was accepted but never answered stalled the export forever, and
  a connection that failed to establish (`UND_ERR_CONNECT_TIMEOUT`) killed a run that
  was minutes from finishing. Requests now time out, retry with a growing budget, and
  report the underlying network error instead of a bare `TypeError: fetch failed`.

### Patch Changes

- Updated dependencies [[`9ac9d5a`](https://github.com/turkishtechnology/takeoff-icons/commit/9ac9d5aadc230ace4a8c105921b2cad253698812)]:
  - @takeoff-icons/core@0.4.0

## 0.3.0

### Minor Changes

- [#7](https://github.com/turkishtechnology/takeoff-icons/pull/7) [`b64c1d5`](https://github.com/turkishtechnology/takeoff-icons/commit/b64c1d5160e014bb802a7dcd2f6d3b0a64595e1a) Thanks [@pinaryalcinduran](https://github.com/pinaryalcinduran)! - Sync icons from Figma: 498 new icons (618 → 1116) and 49 updated drawings. No icon
  or variant was removed, and no existing font codepoint moved, so the icon font stays
  backwards compatible.

  Also fixes the core build, which failed with TS2590 once the library passed ~1000
  icons, and stops the Figma export from wiping hand-written category labels and
  descriptions.

### Patch Changes

- Updated dependencies [[`b64c1d5`](https://github.com/turkishtechnology/takeoff-icons/commit/b64c1d5160e014bb802a7dcd2f6d3b0a64595e1a)]:
  - @takeoff-icons/core@0.3.0

## 0.2.0

### Minor Changes

- [#4](https://github.com/turkishtechnology/takeoff-icons/pull/4) [`549874a`](https://github.com/turkishtechnology/takeoff-icons/commit/549874a01038f703032d64bb0244b3da621f4074) Thanks [@ulasturann](https://github.com/ulasturann)! - Sync icon assets from Figma: add new icons across the filled/bevel (and related) sets, with updated type unions, metadata, categories, and codepoints. Purely additive — no existing icons were removed or renamed.

### Patch Changes

- Updated dependencies [[`549874a`](https://github.com/turkishtechnology/takeoff-icons/commit/549874a01038f703032d64bb0244b3da621f4074)]:
  - @takeoff-icons/core@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`cecfa33`](https://github.com/turkishtechnology/takeoff-icons/commit/cecfa332e1bf89a8fe525bdc44d3f40ebb1982a3)]:
  - @takeoff-icons/core@0.1.1

## 0.1.0

### Minor Changes

- b64890c: First public release of the takeoff-icons packages under the `@takeoff-icons/*` scope.
  - Rebrand from `@tk-icons/*` to `@takeoff-icons/*`; the web component package is `@takeoff-icons/wc` and exposes the `<takeoff-icon>` custom element.
  - `@takeoff-icons/vue` now ships compiled render-function components (`.js` + `.d.ts`) instead of raw, uncompiled `.vue` sources, so it works in plain Node/SSR and any bundler.
  - Release pipeline hardened: a pre-publish artifact check (`verify:publish`) and a fail-loud icon-font generator prevent shipping empty/partial packages; CI guards against build-time mutation of tracked SVG sources.

### Patch Changes

- Updated dependencies [b64890c]
  - @takeoff-icons/core@0.1.0
