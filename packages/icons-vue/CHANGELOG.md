# @takeoff-icons/vue

## 0.2.0

### Minor Changes

- [#4](https://github.com/turkishtechnology/takeoff-icons/pull/4) [`549874a`](https://github.com/turkishtechnology/takeoff-icons/commit/549874a01038f703032d64bb0244b3da621f4074) Thanks [@ulasturann](https://github.com/ulasturann)! - Sync icon assets from Figma: add new icons across the filled/bevel (and related) sets, with updated type unions, metadata, categories, and codepoints. Purely additive — no existing icons were removed or renamed.

## 0.1.1

## 0.1.0

### Minor Changes

- b64890c: First public release of the takeoff-icons packages under the `@takeoff-icons/*` scope.
  - Rebrand from `@tk-icons/*` to `@takeoff-icons/*`; the web component package is `@takeoff-icons/wc` and exposes the `<takeoff-icon>` custom element.
  - `@takeoff-icons/vue` now ships compiled render-function components (`.js` + `.d.ts`) instead of raw, uncompiled `.vue` sources, so it works in plain Node/SSR and any bundler.
  - Release pipeline hardened: a pre-publish artifact check (`verify:publish`) and a fail-loud icon-font generator prevent shipping empty/partial packages; CI guards against build-time mutation of tracked SVG sources.
