# @takeoff-icons/react-app

Internal demo / smoke-test playground that exercises every `@takeoff-icons/*`
delivery format (core data, React, Vue, web component, SVG sprite, and icon
font) in one screen. Private — never published.

## Prerequisites: generate the packages first

This app consumes the workspace packages through their build outputs (`dist/`)
and reads a couple of generated sources directly (e.g. the Vue component under
`packages/icons-vue/src`). Those are **generated, git-ignored** artifacts — on a
fresh clone they do not exist yet, so the app cannot resolve its imports until
you generate and build the workspace.

From the **repo root**:

```bash
pnpm install
pnpm generate   # writes the generated sources (core/react/vue/sprite/font)
pnpm build      # compiles each package's dist/
```

Then run the app:

```bash
cd apps/react-app
pnpm dev
```

### How dependency ordering is handled

- **Repo root** (`pnpm dev` / `pnpm build`, i.e. `turbo run …`): turbo builds
  every workspace dependency first via the `^build` dependency, which
  transitively runs the `generate:*` tasks. Nothing extra to do.
- **From this directory** (`pnpm dev`, plain `vite`): turbo is not involved, so
  the generated sources / `dist` must already exist. Run `pnpm run build-deps`
  once first (it builds only this app's dependencies via
  `turbo run build --filter=@takeoff-icons/react-app^...`), or just use the
  repo-root commands above.
