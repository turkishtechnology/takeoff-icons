---
'@takeoff-icons/core': minor
'@takeoff-icons/react': minor
'@takeoff-icons/vue': minor
'@takeoff-icons/font': minor
'@takeoff-icons/sprite': minor
'@takeoff-icons/wc': minor
---

Sync icons from Figma: 498 new icons (618 → 1116) and 49 updated drawings. No icon
or variant was removed, and no existing font codepoint moved, so the icon font stays
backwards compatible.

Also fixes the core build, which failed with TS2590 once the library passed ~1000
icons, and stops the Figma export from wiping hand-written category labels and
descriptions.
