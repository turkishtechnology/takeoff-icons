---
'@takeoff-icons/core': patch
---

Each icon's `added` metadata is now the version that first shipped it. Before,
every icon except `takeoff-rocket` reported `1.0.0`, a version that was never
released. The values come from the published packages: 617 icons were added in
0.1.0, 1 in 0.1.1, 448 in 0.2.0, 53 in 0.3.0, 9 in 0.4.0 and 124 in 0.5.0. New
icons get the version of the release that ships them.
