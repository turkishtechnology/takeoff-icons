---
'@takeoff-icons/core': minor
'@takeoff-icons/react': minor
'@takeoff-icons/vue': minor
'@takeoff-icons/font': minor
'@takeoff-icons/sprite': minor
'@takeoff-icons/wc': minor
---

Sync icons from Figma: 9 new icons (1119 → 1128), 10 updated drawings and 61
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
