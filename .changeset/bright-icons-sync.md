---
'@takeoff-icons/core': minor
'@takeoff-icons/react': minor
'@takeoff-icons/vue': minor
'@takeoff-icons/font': minor
'@takeoff-icons/sprite': minor
'@takeoff-icons/wc': minor
---

Sync icons from Figma: 124 new icons (1128 → 1252) and 299 redrawn icons. No icon or
variant was removed and no existing font codepoint moved, so the icon font stays
backwards compatible.

New icons (each with `-circle` and `-square` shapes where Figma has them, across all
8 style/type variants): `ai`, `ai-brain`, `ai-editing`, `ai-microphone`, `ai-robot`,
`ai-search`, `ai-sparkle`, `ai-text`, `ai-voice-generator`, `artificial-intelligence`,
`token-1`, `token-2`, `arrow-back`, `arrow-left-right`, `arrow-repeat`, `arrow-return`,
`arrow-up-down`, `arrow-up-left`, `chevron-up-down`, `bin`, `link`, `link-off`,
`wifi-off`, `clock-history`, `family`, `handshake`, `heart`, `user`, `user-add`,
`user-baby`, `user-check`, `user-focus`, `user-group`, `user-hold`, `user-multi`,
`user-remove`, `fingerprint`, `lock`, `shield-check`, `shield-cross`, `shield-key`,
`shield-profile`, `here` and `here-off`.

This adds the `ai` category to `CategoryId`. Redrawn icons pick up the new Figma
artwork, which mostly fills more of the 24×24 box than before.

The export now reads the numbered category pages (`01 Arrows` … `21 Flags`); the
`Source` page no longer holds the library components.
