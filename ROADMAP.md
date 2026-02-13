# tk-icons Roadmap: Prototype'dan Production'a

> Tasklar dependency sırasına gore dizilmistir. Bir faz tamamlanmadan sonraki faza gecilmez.
> Her task basinda `[ ]`, tamamlaninca `[x]` ile isaretlenir.

---

## Faz 0: Temizlik & Altyapi (Oncelik: Blocker)

Bu fazda hicbir feature eklenmez. Mevcut kirin temizligi yapilir.

### 0.1 — `.gitignore` duzeltmesi: Stencil build artifact'lari

**Sorun:** `packages/icons-web/.stencil/.build/` altindaki log dosyalari git staging'e eklenmis. Bunlar build artifact'i.

- [x] `.gitignore` dosyasina `.stencil/` satirini ekle
- [x] Staging'den `git rm --cached -r packages/icons-web/.stencil/` ile kaldir

**Dosyalar:** `.gitignore`

---

### 0.2 — `.npmrc` temizligi: `shamefully-hoist` kaldirilmasi

**Sorun:** `shamefully-hoist=true` pnpm'in strict dependency isolation'ini devre disi birakiyor. Phantom dependency'leri maskeler.

- [x] `shamefully-hoist=true` satirini kaldir
- [x] `pnpm install` calistir, hata veren paketleri tespit et
- [x] Eksik dependency'leri ilgili paketlerin `package.json`'ina ekle (ornegin Stencil icin `@stencil/core` zaten var mi kontrol et)
- [x] `strict-peer-dependencies=false` kalmasi kabul edilebilir (peer dep uyarilari icin)

**Dosyalar:** `.npmrc`, ilgili `package.json` dosyalari

---

### 0.3 — Turbo task graph'ini duzeltme

**Sorun:** `turbo.json`'daki `generate` task'i hicbir pakette tanimli degil. `build` -> `generate` dependency'si calismiyor. Pipeline dekoratif.

**Cozum:** Root-level turbo task'lari dogru tanimlanmali.

- [x] Root `package.json`'daki `generate` script'ini turbo pipeline'a entegre et. Iki secenek:
  - **Secenek A (Onerilen):** Her alt adimi (`optimize`, `validate`, `generate:metadata`, `generate:core` vb.) turbo task olarak tanimla. Root `package.json`'da her birini ayri script olarak birak, `turbo.json`'da dependency chain olustur.
  - **Secenek B:** `generate` script'ini oldugu gibi birak ama `turbo.json`'dan `generate` task'ini ve build'in generate dependency'sini kaldir. `prepublish`'e guven.
- [x] Secim yapildiktan sonra `turbo run build`'in temiz bir repo'da (generated dosyalar yok) dogru calismasi test edilmeli
- [x] Turbo `inputs` / `outputs` degerlerini dogrula (suan root-level path'ler var ama turbo workspace-relative bekler)

**Dosyalar:** `turbo.json`, `package.json`

---

## Faz 1: Kritik Bug Duzeltmeleri (Oncelik: P0)

Bu fazdaki her sorun, production'da sessiz bozulmaya (silent corruption) yol acar.

### 1.1 — React/Vue generator: Hardcoded `viewBox` duzeltmesi

**Sorun:** `generate-react.ts` ve `generate-vue.ts` her SVG'nin viewBox'ini parse ediyor ama uretilen component'ta `viewBox="0 0 24 24"` olarak hardcode ediyor. Farkli boyutlu bir icon eklenirse sessizce bozulur.

- [ ] `generate-react.ts`: SVG dosyalarindan viewBox'i variant bazinda kaydet
- [ ] Uretilen React component'ta viewBox'i variant map'inden al, hardcoded degeri kaldir
- [ ] `generate-vue.ts`: Ayni degisikligi uygula
- [ ] Her iki generator icin farkli viewBox'lu bir test SVG'si ile dogrula

**Dosyalar:** `scripts/generate-react.ts`, `scripts/generate-vue.ts`

---

### 1.2 — Font codepoint stability: Sabit mapping dosyasi

**Sorun:** Codepoint'ler `allIconNames.sort()` index'ine gore ataniyor. Yeni icon eklenmesi mevcut codepoint'leri kaydiriyor. CSS'teki `\e001` referanslari bozulur.

- [ ] `packages/icons-svg/metadata/codepoints.json` dosyasi olustur (mevcut mapping: `{"arrow-right": 57345, "check-circle": 57346, "home": 57347}`)
- [ ] `generate-font.ts`'de: Once `codepoints.json`'i oku, yeni icon'lara siradaki bos codepoint'i ata, dosyayi guncelle
- [ ] Codepoint silme/degistirme icin uyari mekanizmasi ekle (deprecated icon'un codepoint'i yeniden kullanilmamali)
- [ ] `codepoints.json`'i `.gitignore`'a EKLEME — bu dosya source of truth, commit edilmeli

**Dosyalar:** `scripts/generate-font.ts`, `packages/icons-svg/metadata/codepoints.json` (yeni)

---

### 1.3 — React component: `{...props}` spread sirasi ve `style` prop sorunu

**Sorun 1:** `dangerouslySetInnerHTML` -> `{...props}` sirasi. Kullanici `children` veya `dangerouslySetInnerHTML` gecerse React runtime hatasi verir.
**Sorun 2:** `Omit<SVGProps<SVGSVGElement>, 'style'>` kullanicinin inline `style` gecmesini engelliyor.

- [ ] `{...props}` spread'ini SVG element'inin basina tasi (kullanici prop'lari component'in kendi prop'lariyla override edilsin, tersi degil)
- [ ] `children` prop'unu destructure'dan cikar ve kullanma
- [ ] `style` prop'unu geri ekle: `Omit<SVGProps<SVGSVGElement>, 'style'>` yerine `SVGProps<SVGSVGElement>` kullan, `iconStyle` zaten farkli isimde
- [ ] Ayni kontrolleri Vue generator'da da uygula (`v-bind="$attrs"` sirasi)

**Dosyalar:** `scripts/generate-react.ts`, `scripts/generate-vue.ts`

---

### 1.4 — SVG attribute inheritance stratejisi

**Sorun:** Source SVG'lerdeki root `<svg>` element'inin `fill`, `stroke`, `stroke-width` gibi attribute'leri `parseSvgFile` tarafindan atiliyor. Sonra React/Vue component'lari kendi fill/stroke logic'ini uyguluyor. Bazi SVG'lerde (ozellikle `filled/sharp/check-circle.svg`) inner path'ler `stroke="#fff"` gibi explicit degerler tasiyor. Bu calisiyor ama kirilamaya acik.

**Cozum:** SVG'lerin icindeki presentation attribute'leri normalize edilmeli.

- [ ] SVGO config'ine `removeAttrs` plugin'i ekle: root `<svg>` uzerindeki `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin` attribute'lerini temizle (zaten component tarafindan ekleniyor)
- [ ] Inner element'lerdeki explicit attribute'leri KORUMALI (bunlar kasitli override)
- [ ] Alternatif: Her SVG'yi SVGO ciktisindan sonra `svgson` ile parse edip root vs child attribute'leri ayristiran bir normalize adimi ekle
- [ ] Tum mevcut SVG'leri optimize edip goruntulerinin degismedigini dogrula

**Dosyalar:** `scripts/optimize.ts`, mevcut SVG dosyalari

---

## Faz 2: Mimari Iyilestirmeler (Oncelik: P1)

### 2.1 — React/Vue tree-shaking: Variant'lari ayir

**Sorun:** Her React/Vue component'i TUM variant'lari embed ediyor. 500 icon x 6 variant = dev bir bundle.

**Cozum:** Variant data'sini core'dan dynamic import ile cek, veya variant bazinda ayri component dosyalari uret.

- [ ] **Yaklasim secimi:**
  - **A) Lazy variant:** React component render aninda `@tk-icons/core/icons/{style}/{type}/{name}` path'inden dynamic import yapsin (web component gibi). Asenkron olur ama tree-shake edilir.
  - **B) Per-variant static export:** `HomeIconOutlinedRounded`, `HomeIconFilledSharp` gibi ayri component'lar uret. Her biri tek variant icerir. Barrel export'ta hepsi var ama bundler kullanilmayanlari atar. Senkron kalir.
  - **C) Mevcut hali koruyup sadece barrel export'u split et:** `@tk-icons/react/HomeIcon` ve `@tk-icons/react` seklinde iki entry point. Package exports field'i guncelle.
- [ ] Secilen yaklasimi implement et
- [ ] Bundle size karsilastirmasi yap (oncesi/sonrasi)

**Dosyalar:** `scripts/generate-react.ts`, `scripts/generate-vue.ts`, ilgili `package.json` dosyalari

---

### 2.2 — Accessibility (a11y) desteği

**Sorun:** Web component `aria-hidden="true"` hardcoded. React/Vue'da hicbir ARIA attribute yok. Dekoratif icon'lar icin dogru, anlamli icon'lar icin yetersiz.

- [ ] Tum component'lara (React, Vue, Web) `aria-label` prop'u ekle
- [ ] `aria-label` verilmisse: `role="img"` + `aria-label={label}` kullan, `aria-hidden` kaldir
- [ ] `aria-label` verilmemisse: `aria-hidden="true"` ekle (dekoratif icon varsayimi)
- [ ] `title` prop'u ekle: SVG icine `<title>` elementi render etsin (tooltip + screen reader)

**Dosyalar:** `scripts/generate-react.ts`, `scripts/generate-vue.ts`, `packages/icons-web/src/components/tk-icon/tk-icon.tsx`

---

### 2.3 — Search fonksiyonunu iyilestir

**Sorun:** `searchIcons()` `String.includes()` kullaniyor. `"me"` araması `"home"` döndürür. Scale'de gurultulu sonuclar.

- [ ] Substring yerine token-based match kullan: search text'i boşluklara gore tokenize et, query'nin herhangi bir token'in **basinda** olup olmadigini kontrol et (`token.startsWith(query)`)
- [ ] Relevance scoring ekle: tam eslesme > prefix eslesme > icerik eslesmesi. Sonuclari score'a gore sirala
- [ ] Bos query hala tum icon'lari dondurmeli (mevcut davranis)

**Dosyalar:** `scripts/generate-metadata.ts` (search-index uretimi), `packages/icons-core/src/search-index.ts` (uretilen dosya)

---

### 2.4 — Vue paketi build pipeline'i

**Sorun:** Vue paketi `cp -R src/. dist/` ile kaynaklari kopyaliyor. TypeScript check yok, SFC validasyonu yok.

- [ ] `vue-tsc` veya `vite build` (lib mode) ile derleme adimi ekle
- [ ] Alternatif: Vue SFC'leri `.vue` olarak dagitmak istiyorsan (gecerli bir yaklasim), en azindan `vue-tsc --noEmit` ile type check ekle
- [ ] `package.json`'a `vue-tsc` devDependency olarak ekle
- [ ] Build script'ini guncelle

**Dosyalar:** `packages/icons-vue/package.json`, `packages/icons-vue/tsconfig.json`

---

## Faz 3: Web Component Iyilestirmesi (Oncelik: P1)

### 3.1 — Web component: Upfront import azaltma

**Sorun:** `tk-icon.tsx` `aliasMap` ve `hasVariant`'i top-level import ediyor. Tum alias ve metadata her zaman bundle'a girer.

- [ ] `aliasMap` yerine `resolveIconName` fonksiyonunu import et (ayni dosyadan, zaten var)
- [ ] `hasVariant` check'ini dynamic import'un catch block'una tasi — eger import basarisiz olursa variant yok demektir. Bu sekilde metadata import'u gereksiz olur
- [ ] Alternatif: Variant kontrolunu bir lightweight map'e cevir (sadece `name -> variant[]` mapping'i, tam metadata degil)

**Dosyalar:** `packages/icons-web/src/components/tk-icon/tk-icon.tsx`

---

### 3.2 — Web component test coverage

**Sorun:** Tek bir test var: "renders empty when icon is missing". Component'in ana fonksiyonalitesi test edilmemis.

- [ ] `icon` prop'u ile dogrudan IconData gecme testi
- [ ] `name` prop'u ile lazy loading testi
- [ ] Alias resolution testi (`name="forward"` -> arrow-right render edilmeli)
- [ ] `icon-style` ve `icon-type` degisim testi (@Watch calismali)
- [ ] Gecersiz variant testi (uygun variant yoksa null render)
- [ ] `size` ve `color` prop testi

**Dosyalar:** `packages/icons-web/src/components/tk-icon/test/tk-icon.spec.tsx`

---

## Faz 4: DX (Developer Experience) & Polish (Oncelik: P2)

### 4.1 — Validate script'ine renk kodlu cikti ve summary

- [ ] Hatalari kirmizi, uyarilari sari, basarili mesajlari yesil yap (ANSI renk kodlari)
- [ ] Ciktinin sonuna ozet tablo ekle: `X icon, Y variant, Z hata, W uyari`

**Dosyalar:** `scripts/validate.ts`

---

### 4.2 — `generate` script'ine timing ve progress bilgisi

- [ ] Her adimin ne kadar surdugunu goster: `[1/7] Optimizing SVGs... done (120ms)`
- [ ] Toplam sure: `Pipeline completed in 850ms`

**Dosyalar:** `scripts/generate-*.ts` dosyalari veya root `package.json`'daki generate script'i

---

### 4.3 — Icon preview/catalog araci

- [ ] Basit bir HTML sayfasi uret: tum icon'lari variant'lariyla gosteren bir grid
- [ ] `pnpm catalog` veya `pnpm preview` komutu ile acilsin
- [ ] Arama ve filtreleme (kategori, stil, tip) desteklesin
- [ ] Gelistirme sirasinda icon'larin gorunumunu dogrulamak icin kullanilir

**Dosyalar:** `scripts/generate-catalog.ts` (yeni), `packages/icons-svg/catalog.html` (yeni, uretilen)

---

### 4.4 — CI pipeline (GitHub Actions)

- [ ] `.github/workflows/ci.yml` olustur
- [ ] Adimlar: install -> generate -> build -> test -> lint
- [ ] PR'larda otomatik calissin
- [ ] Bundle size raporlamasi (size-limit veya bundlesize)

**Dosyalar:** `.github/workflows/ci.yml` (yeni)

---

### 4.5 — Changeset / versiyonlama entegrasyonu

- [ ] `@changesets/cli` ekle
- [ ] Her paketi bagimsiz versiyonla (independent mode)
- [ ] `pnpm changeset` ile degisiklik kaydi tutulsun
- [ ] Release workflow'u ekle

**Dosyalar:** `.changeset/config.json` (yeni), `package.json`

---

## Faz 5: Dokumantasyon (Oncelik: P2)

### 5.1 — README.md guncelleme

- [ ] Proje aciklamasi, mimari diagram, kurulum talimatlari
- [ ] Her paketin kullanim ornekleri (React, Vue, Web Component, Sprite, Font)
- [ ] Yeni icon ekleme kilavuzu
- [ ] Gelistirici kilavuzu (generate, build, test akisi)

**Dosyalar:** `README.md`

---

### 5.2 — Contributing guide

- [ ] Icon ekleme kurallari (viewBox standardi, stroke-width, renk kullanimi)
- [ ] SVG hazırlama kurallari (hangi Figma export ayarlari)
- [ ] PR sureci
- [ ] Naming convention'lar

**Dosyalar:** `CONTRIBUTING.md` (yeni)

---

## Ilerleme Ozeti

| Faz                       | Durum          | Task Sayisi |
| ------------------------- | -------------- | ----------- |
| Faz 0: Temizlik & Altyapi | [x] Tamamlandi | 3           |
| Faz 1: Kritik Bug Fix     | [ ] Baslanmadi | 4           |
| Faz 2: Mimari Iyilestirme | [ ] Baslanmadi | 4           |
| Faz 3: Web Component      | [ ] Baslanmadi | 2           |
| Faz 4: DX & Polish        | [ ] Baslanmadi | 5           |
| Faz 5: Dokumantasyon      | [ ] Baslanmadi | 2           |
| **Toplam**                |                | **20**      |
