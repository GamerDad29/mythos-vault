# Mythos Vault — Backlog

_Last updated: 2026-03-10 (Session 13)_

> Phased by dependency and complexity, not by the original request batches.
> Engineering Workflow applied: inspect → clarify → plan → implement.

---

## Already Done (do not re-implement)

| Item | Status | Notes |
|------|--------|-------|
| Journal renamed "Campaign Journal" | ✅ done | `Journal.tsx:49` |
| Full-text search (Fuse.js) | ✅ done | `EntityList.tsx:119` |
| Tag filter chips | ✅ done | `EntityList.tsx:131` |
| Locked/hidden entity cards | ✅ done | `EntityList.tsx:287` |
| City hierarchical view (Karnuk) | ✅ done | `CityView.tsx` — tabbed: Overview/Districts/Factions/NPCs/Legends |
| `cityId` + `region` on location data | ✅ done | `smelters-row.json`, `vault/locations/*.json` |
| LORE 404 fix | ✅ done | `TYPE_URL_SEGMENT` / `URL_SEGMENT_TO_TYPE` / `TYPE_VAULT_FOLDER` in `types.ts` |
| Hidden entities leaking on Home + Timeline | ✅ done | `.filter(e => !e.hidden)` in both |
| maren-ashveil + durgan-velk missing from index | ✅ done | Stubs added to `vault/index.json` |
| Mobile navigation | ✅ done | Hamburger + slide drawer in `Header.tsx` |
| CityCard image fallback | ✅ done | `imgError` state + `onError` in `LocationList.tsx` |
| Favicon 404 | ✅ done | `public/favicon.svg` created (amber runic diamond) |
| KarnukDemo dead code | ✅ done | Route + import removed from `App.tsx` |
| Duplicate `/pcs` route | ✅ done | Removed from `App.tsx` |
| Header sticky + glassmorphism | ✅ done | `position: sticky`, `backdrop-filter: blur(12px)` |
| Home ambient particles + tile icons | ✅ done | 6 ember sparks, Lucide icons per section, Recent band |
| Skeleton inline @keyframes | ✅ done | Replaced with Tailwind `animate-shimmer` class |
| Journal forge-divider on month groups | ✅ done | `Journal.tsx` |

---

## Phase 1 — Surgical Fixes (no new architecture, all existing files)

**Goal:** Clean up obvious issues fast. No new components. Ship and verify before Phase 2.

### P1-1 — Remove "Continue Reading" ✅
- Removed `recentlyViewed` block from `Home.tsx`
- Removed `useRecentlyViewed` import + hook call
- Deleted `src/hooks/useRecentlyViewed.ts`

### P1-2 — Full Bookmarks Removal ✅
- Removed Saved nav link + mobile bookmark icon from `Header.tsx`
- Removed bookmark button from `EntityCard.tsx`
- Removed bookmark button from `EntityDetail.tsx` sidebar
- Removed `track()` call from `EntityDetail.tsx`
- Removed `/bookmarks` route from `App.tsx`
- Deleted `src/pages/Bookmarks.tsx`
- Deleted `src/hooks/useBookmarks.ts`
- Deleted `src/hooks/useRecentlyViewed.ts`

### P1-3 — Fix Header Logo Layout ✅
- Adjusted icon size (20→22px), added `gap: 3px` between text lines
- Set explicit `lineHeight: 1` on both text elements
- Increased subtitle tracking for breathing room

### P1-4 — Fix Home Tile Uniform Height + Characters Overflow ✅
- Added `minHeight: 72px` + `flex flex-col justify-center` to tile wrapper
- Added `line-clamp-2 overflow-hidden` to description text
- Reduced desc font-size to `11px` for narrow 7-col grid

---

## Phase 2 — Landing Page Polish (Forge-style alignment)

**Goal:** Make the landing page feel like the same design system as the Forge.
Depends on P1 being complete.

### P2-1 — Match Forge Card Style on Home Tiles ✅
- SECTIONS tiles: `borderRadius: 12px`, `background: #0D0A0F`, hover `translateY(-4px)` + dual glow
- TOOLS tiles: same radius + lift, slightly dimmer glow (secondary nav)
- EntityCard: `borderRadius: 8px`, hover `translateY(-4px)` + `0 0 22px ${accent}28, 0 0 44px ${accent}10`
- Image fade gradient updated to match new card background token
- Transition: `all 0.3s ease` on all three

### P2-2 — Create Design Token File ✅
- Created `src/tokens.ts`
- Tokens: `radius` (tile/card/button/badge), `color` (bg variants, border, text, accent), `transition` (card/fast), `shadow` (cardHover/cardHoverStrong functions)
- Applied in `Home.tsx` and `EntityCard.tsx`

---

## Phase 3 — Hierarchical Content Browsing

**Goal:** Replace flat lists with structured group views.
Depends on P1 complete. P2 not required to start.

### P3-1 — Locations: Surface Cities as Entry Points ✅
- Created `src/pages/LocationList.tsx` — replaces EntityList for `/locations` route
- Shows CITY-type entities as featured CityCards (link to `/city/:slug`)
- Shows LOCATION-type entities WITHOUT `cityId` as regular EntityCards ("Other Locations")
- All current LOCATIONs have `cityId: karnuk` (sub-districts); only Karnuk city shows
- Fuse.js search filters both sections simultaneously
- Section headers with entry count

### P3-2 — Factions: Grouped by City ✅
- Extended EntityList with `groupBy?: 'cityId' | 'category'` prop
- `/factions` uses `groupBy="cityId"`:
  - "Karnuk" → 6 factions (Iron Hammer Clan, Deepstone Miners, Brotherhood of the Forge, etc.)
  - "Unaffiliated" → 2 factions (Order of the Cauterized Saint, Ledger Eternal)
- Groups sorted: named first, Unaffiliated/Other last
- Falls back to flat grid when search or tag filter is active

### P3-3 — NPCs: Grouped by City ✅
- `/npcs` uses `groupBy="cityId"`:
  - "Karnuk" → 10 NPCs (Brekka, Don Thorgar, etc.)
  - "Unaffiliated" → 5 NPCs (Sylvara, Duchess Mira, Vorrak, etc.)

### P3-4 — Items: Grouped by Category ✅
- `/items` uses `groupBy="category"`:
  - Currently: "Uncommon Weapon" → The Penitent's Rod
  - Structure ready for more data

---

## Phase 4 — Data Model / Future

### P4-1 — `parentId` Schema for Non-City Hierarchies ✅
- Added `parentId?: string` to both `VaultEntity` and `VaultEntityStub` in `types.ts`
- Supports sub-faction → faction and nested location hierarchies beyond `cityId`
- Field is optional; populated by Forge publish pipeline once Notion sync is wired (P4-2)

### P4-2 — Notion Hierarchy Sync ✅
- Locations database wired: `NOTION_TYPE_PARENT_IDS[location]` filled
- Factions database wired: `NOTION_TYPE_PARENT_IDS[faction]` filled
- `NOTION_CITY_PAGE_IDS` added: 7 cities + Karnuk All Data → vault slug map
- `publishToVault()` now auto-derives `cityId` from Notion `parent.page_id` for LOCATION entities
- `proxyService.getNotionPage()` added — uses existing Worker generic proxy
- NPCs, Items, Creatures, Lore: pending (parent page IDs not yet provided)

---

## Admin: Hero Image Picker

### A1 — Session Hero Image Drag-to-Primary (Admin Only) ✅

**What it does:**
When logged in as DM, session detail pages get an interactive image management mode.
The DM can click any woven (inline) image and promote it to the hero — replacing `imageUrl`
in `vault/sessions/index.json` via a GitHub push, no manual JSON editing required.

**Implemented (2026-03-10 Session 13):**
- `SessionDetail.tsx`: "Set as Hero" star button alongside "Adjust Frame" on each WovenImage in DM mode
- Fixed-bottom `HeroPickerPanel`: thumbnail preview, "Promote to Session Hero" label, 3×3 focal point grid (CSS position presets), Cancel/Confirm buttons with saving/done states
- `githubService.ts`: `updateSessionHeroImage(sessionSlug, imageUrl, imagePosition, pat)` — patches both fields in `vault/sessions/index.json` via `putFileWithRetry`, then calls `vaultService.clearCache()`

---

## Phase 5 — Navigation, Home Overhaul & New Sections

_Source: Mythos Vault Updates.3.3.26.txt_

### P5-0 — Admin Login + DM Hide/Show ✅
- Lock icon in `Header.tsx` top-right — prompts for DM password
- Auth state in `AuthContext.tsx` (React context + sessionStorage)
- When logged in: HIDE/SHOW toggles on entity cards + per-section toggles in EntityDetail
- Password stored as SHA-256 hash in `vault/config.json` (GitHub raw) — fetched at login time
- DM manages password from Architect → Settings → "Vault Configuration" section
- `proxyService.pushToGitHub()` writes `vault/config.json` on password update
- Falls back to `VITE_DM_PASSWORD` env var if config.json absent
- P5-0b fully resolved — no build-time env var required for auth

### P5-0b — DM Login: Env Vars for Build ✅ (superseded by config.json approach)
- Original plan (VITE_* build vars) replaced by runtime `vault/config.json` hash fetch
- No rebuild required to change DM password

### P5-1 — Nav Re-order ✅
- Updated `Header.tsx` ENTITY_NAV + mobile drawer to:
  **Locations → Factions → Lore → Items → NPCs → Creatures → Characters → Sessions**
- Created `src/pages/Sessions.tsx` — placeholder "Coming Soon" page
- Added `/sessions` route to `App.tsx`

### P5-2 — Home Page Overhaul ✅
- **Remove "Recent Entries" band entirely** (user confirmed: nix it)
- **Hero tiles** (the section grid): replace plain icon+text tiles with full-bleed hero cards:
  - Background: faded/dimmed image of the most recently added entity in that section
  - On hover: image sharpens/zooms slightly + title lifts with glow — "magic happens"
  - Needs `vaultService.getIndex()` to find most-recent entity per type for background image
- **Scroll behavior**: top nav row fades out gracefully as user scrolls into the tile grid
  (IntersectionObserver or scroll event; nav still sticky, just more minimal on scroll)
- **Top nav hover drama**: each nav link gets an animated underline, subtle glow, or
  tooltip preview on hover — more theatrical than a plain underline

### P5-3 — Locations: Underdark vs Surface Split ✅
- Complete rewrite of `src/pages/LocationList.tsx`
- `RegionHeroPanel`: 400px full-bleed hero banner per region, amber sweep line, click → scroll to section
- `CityCard`: image zoom hover, amber sweep line, "Explore →" CTA
- `SectionHeader`: amber left bar + label + entry count + divider line
- Entities split by `region === 'surface'` vs everything else
- `underdarkRef` / `surfaceRef`: scroll anchors (scrollMarginTop 80px)
- Surface locked placeholder for players when surface content is hidden
- DM toggle support (Eye/EyeOff per card) + `useAuth()` + `toggleEntityHidden`
- Fixed `vault/cities/hammerhold.json` + `vault/index.json` stub: region underdark → surface

### P5-4 — Factions: Underdark / Surface / Neutral + Sub-grouping ✅
- `src/pages/FactionList.tsx` created — replaces EntityList for `/factions`
- Three region anchor panels (Underdark/Surface/Neutral) → scroll-to-section
- Underdark sub-grouped by cityId: Karnuk (6 factions) + Independent (5)
- Surface: locked placeholder when no visible surface factions
- Neutral: flat grid (Order of Cauterized Saint, Ledger Eternal)
- Search/tag filter collapses to flat view
- **Data note**: all current factions are `region: "underdark"` or no region. Surface bucket is ready when factions with `region: "surface"` are added.

### P5-5 — Lore: Underdark / Surface / Historical + Sub-categories ✅
- `src/pages/LoreList.tsx` created — replaces EntityList for `/lore`
- Three region anchor panels (Underdark/Surface/Historical) → scroll-to-section
- Underdark + Historical both sub-group by existing `category` field (no new fields needed)
- Surface: locked placeholder when hidden/empty
- Historical: "nothing yet" empty state
- Current lore (4 karnuk-* entries) lands in Underdark → "Iron Order Legend" sub-group

### P5-8 — Image Prompt System Overhaul ✅
- **5 art styles** replacing original 4: Photorealistic (DSLR), Comic Book (Cel Shaded), Cel Rotoscope (Telltale), Cinematic Scene (Widescreen), Equipment Hero (Macro) — `src/services/imageService.ts`
- **Style-aware framing**: NPC celshade → forced full body; cinematic → tense decisive moment; equipment → falls back to portrait
- **Construct/cinematic variants**: warforged/golem gets action-stance framing in cinematic style
- **`## Appearance` section extraction**: `extractSectionContent()` handles both `## Heading` and `**Bold:**` formats
- **Race-first subject ordering**: Appearance (containing race) now appears BEFORE category in NPC subject line — fixes FLUX generating humans for non-human NPCs (bugbear, tiefling, etc.)
- **Skill doc installed**: `skills/dnd-image-prompt-updater/SKILL.md` in both Vault and Architect repos — defines the three-file sync rule, golden rules, and prompt template for future updates
- **Architect synced**: `utils/imagePromptBuilder.ts` updated with same 5 styles + `VaultImageStyle` type + style-aware framing helpers (`characterFraming`, `constructFraming`, `itemFraming`)
- **Build fix**: `regenStatus === 'committing'` added to generate button render condition in `EntityDetail.tsx` — was blocking all Cloudflare Pages builds

### P5-6 — Characters Page ✅
- Cinematic bento layout fully built (Sessions 9, 10, 12)
- PCDetail: StatBox hierarchy reversed — highest stat raised (lifted 3px, solid accent bg, elevation shadow, accent top-edge line, larger 2rem numeral, no pulse); other stats recede (dark inset bg, muted text) — done Session 13

### P5-7 — Sessions Page ✅
- `/sessions` → compact grid index; `/sessions/:slug` → individual cinematic session pages
- `SessionDetail.tsx`: full-bleed hero (smart `object-position` per hero image), session number overlay, title at bottom of hero
- Embedded Google Drive audio iframe (no external navigation)
- Images distributed intelligently throughout recap content via section-aware algorithm (max 1 per section break; overflow → thumbnail gallery)
- Per-image `object-position` via `imagePositions?: string[]` parallel array — faces shown, not waists
- Ken Burns motion on all woven images (4 unique variants cycling by index, 10–13% zoom + directional drift)
- Hover zoom on index card thumbnails
- 10 sessions loaded from `vault/sessions/index.json` (sessions 1, 2, 3, 4, 5, 7, 10, 12, 14, 15)
- Audio available for sessions 1 and 2 (Google Drive)
- Hero images + woven images for sessions 1, 2, 3, 4, 5, 12
- Prev/Next navigation on detail page

---

## Implementation Notes

- **Forge reference:** Card styles documented above in P2-1. Source: `RAGSearch.tsx` (Architect).
- **No image logo** — header is text-only. B1-1 from original spec is a layout fix, not an image fix.
- **Bookmarks full removal** = 4 files. Don't do a partial remove.
- **CityView is a first-class feature** — don't replace it with a generic list. Route all location hierarchy through it.
- **EntityList is the right place for P3 grouping** — don't create new pages unless EntityList becomes unmanageable.
- **Items grouping:** implement the UI skeleton now; don't wait for data.

---

## Session Log

### 2026-03-10 (Session 13 — A1 + UI/UX Review + Visual FX Sprint)
**Admin hero image picker, stat box polish, full codebase review, 6 visual features shipped. Multiple commits, deployed.**

**A1 — Session Hero Image Picker (DM):**
- `SessionDetail.tsx`: star "Set as Hero" button grouped with "Adjust Frame" on each WovenImage (DM mode only)
- Fixed-bottom `HeroPickerPanel`: thumbnail preview, "Promote to Session Hero" label, 3×3 focal point preset grid, Cancel/Confirm with saving/done states
- `githubService.ts`: `updateSessionHeroImage()` — patches `imageUrl` + `imagePosition` in `vault/sessions/index.json` via `putFileWithRetry`, clears cache on success

**PCDetail StatBox — visual hierarchy reversed:**
- Best stat raised: `translateY(-3px)`, padding 16px 10px 14px, accent gradient bg, `1px solid ${accent}70` border, elevation + inner glow box-shadow, 2px accent top-edge line, `fontSize: '2rem'` score, text glow, no skillPulse animation
- Other stats recede: dark `hsl(15 6% 6%)` bg, inset shadow, muted text colors

**UI/UX Codebase Review (full audit):**
- 14 code issues documented (C1–C14): unused imports, `as any` casts, prop drilling, missing memoization, etc.
- 10 UI/UX issues documented (U1–U10): type badge truncation, mobile hero overflow, empty states, etc.
- 9 fix items (FIX-1–FIX-9), 5 UX items (UX-1–UX-5) queued
- 12 creative ideas generated and ranked by effort (lowest→highest)

**Visual FX Sprint — Ideas 3, 7, 8, 11 + Home holographic:**
- **Idea 3 — Holographic card tilt** (`Characters.tsx`): `perspective(900px) rotateX/Y` cursor tracking, 0.12s snap on move, specular radial-gradient with `mixBlendMode: screen`
- **Idea 7 — Related entries thumbnails** (`EntityDetail.tsx`): 38px×38px thumbnails with `object-fit: cover` + fallback ⟁ glyph on each related entry in sidebar
- **Idea 8 — Ink drop reveal** (`EntityCard.tsx` + `index.css`): `inkCover`/`inkReveal` `@keyframes` via `clip-path: circle()`, triggered on DM hide/show toggle with 700ms phase reset
- **Idea 11 — WebGL shader background** (`WebGLBackground.tsx` NEW + `Home.tsx`): raw WebGL fragment shader — simplex noise + 4-octave fBm stone wall texture, 2 independently-flickering amber torch lights, slow-breathing arcane indigo glow, secondary blue-violet arcane point, edge vignette. DPR-aware, pauses on `document.hidden`, full cleanup on unmount.
- **Home holographic tilt**: same 3D tilt + specular highlight applied to all `SectionCard` instances on Home page

**Files changed:** `src/pages/SessionDetail.tsx`, `src/services/githubService.ts`, `src/pages/PCDetail.tsx`, `src/pages/Characters.tsx`, `src/pages/EntityDetail.tsx`, `src/components/EntityCard.tsx`, `src/components/WebGLBackground.tsx` (NEW), `src/pages/Home.tsx`, `src/index.css`

---

### 2026-03-10 (Session 12 — P5-6 Cinematic Bento + UI Review Brief)
**Characters page fully rebuilt as cinematic bento layout. UI review brief applied. 4 files changed across 4 commits, pushed to main, deployed.**

**Characters.tsx — Full Cinematic Bento (Option C):**
- **Hero Banner**: Full-width cinematic party banner (~55vh) with 4 overlapping portrait strips blended via CSS `mask-image` gradients. Per-strip Ken Burns (22-34s staggered). Per-character ambient particles in each strip zone. Accent light pillars per character. Atmospheric fog layers (warm→cool). Film grain SVG overlay. Parallax scroll (0.25x) + opacity fade-out on scroll. Runic glyph star SVG separators at column boundaries with `glyphBreath` CSS pulse animation.
- **4 Compact Tiles**: 380px row of 4 equal character-select cards. Per-character particles (10 idle, 16 on hover). Energy sweep FX on hover (amber light line sweeps left→right, re-triggers via React key). Pulsing level badge (16px numeral, `badgePulse` animation). Role pills (Tank/Artificer/Striker/Caster). 13px quotes with 3-line clamp + accent left border. "View Chronicle →" CTA on hover.
- **Per-character animated card outline glow** on hover (radiates from behind card):
  - Cannonball: `glowFlame` — flickering fire, red-orange shadows dancing unevenly (2s)
  - Bpop: `glowForge` — rhythmic forge pulse with smoky amber edges (3s)
  - Iblith: `glowShadow` — dark shadow flame, deep purple, creeping unstably (2.5s)
  - Morrighan: `glowBioluminescent` — bioluminescent cyan-violet light radiating outward (3.5s)
- **Bottom Left — Quote Carousel**: Replaced static Party Stats with rotating quote carousel. 5 quotes (4 character + 1 campaign chronicle), 8s auto-rotate, fade+translateY transitions, clickable dot indicators with character-colored active state, character-colored attribution, member role pills below.
- **Bottom Right — Campaign Progress**: "Pathways Unseen" header, featured latest session card (links to `/sessions/:slug`), 3 previous session mini-blocks row, session count + entity count stats footer.

**UI Review Brief (MythosVault_ClaudeCode_Brief.docx) applied:**
- Party renamed: "The Company" → "Bear Force One" throughout
- Tagline updated: lore-accurate fate/bond version ("Brought together by fate's indifferent hand...")
- Hero banner: removed scan line effect, removed "Pathways Unseen · Karnuk" eyebrow text
- Hero banner vignette: extended with more gradient stops (55/68/80/90%) for seamless fade
- Compact cards: removed class/race badge above names, removed "Played by" attribution
- Compact cards: removed signature ability text on hover
- Character accent colors updated per brief spec: Cannonball `rgb(226,46,18)`, Bpop `rgb(211,161,23)`, Iblith `rgb(116,57,198)`, Morrighan `rgb(92,71,194)` — particle colors also updated to match
- Level badge: glow now uses character accent color on hover
- Header brand lockup: horizontal single line with centered dot separator (was stacked two-line)
- Home page: Characters section description updated to "Bear Force One"

**CSS keyframes added to `src/index.css`:** `charEmberRise`, `eldritchFloat`, `forgeSpark`, `shadowDrift`, `energySweep`, `badgePulse`, `glyphBreath`, `glowFlame`, `glowForge`, `glowShadow`, `glowBioluminescent`. Bento grid classes: `.hero-banner-container`, `.bento-cinematic-row`, `.bento-cinematic-bottom` with responsive breakpoints at 900px and 640px.

**Files changed:** `src/pages/Characters.tsx` (complete rewrite), `src/index.css`, `src/components/Header.tsx`, `src/pages/Home.tsx`

### 2026-03-08 (Session 11)
- **Session 24 "The Tunnel Dock" added:** 7-section recap, 7 woven images (Soren.gif, Scampers, etc.), inline MP4 video (Brindle Nacklewitt), `videoUrl` field added to `SessionEntry` type
- **Sessions page re-ordered:** Most recent session featured full-width at top (`FeaturedSessionCard`), rest in grid newest → oldest
- **SessionDetail.tsx overhaul:** Taller hero (clamp 360–600px), amber section headings (3px bar + fade rule), monologue speech blocks (amber left border), GIF-aware WovenImage, `VideoEmbed` component, diamond divider, video badge in meta
- **Image fix:** Replaced tiny 18KB dwarf worker PNGs with Soren.gif + Scampers.png in session 24 image list
- **Backlog:** Added 🔴 HIGH PRIORITY item A1 — Admin Hero Image Picker (DM clicks woven image → promotes to hero → pushes to GitHub)

### 2026-03-06 (Session 10)
- **Build fix:** `EntityDetail.tsx` — `regenStatus === 'committing'` added to generate button render condition; TS2367 errors were blocking all Cloudflare Pages deployments ("No deployment available")
- **P5-8:** Image prompt system overhaul — 5 art styles, style-aware framing, `## Appearance` section extraction, race-first NPC subject ordering (fixes human-for-bugbear slop). Both Vault `imageService.ts` and Architect `imagePromptBuilder.ts` updated
- **Skill doc:** `skills/dnd-image-prompt-updater/SKILL.md` committed to both repos — golden rules, 5 style IDs, creature type routing table, anti-patterns, and prompt template for future updates
- **Full dumps generated:** `mythos-architect-full-dump.txt` + `mythos-vault-full-dump.txt` in ~/Downloads for Claude web sessions

### 2026-03-04 (Session 9)
- **P5-0 / P5-0b:** DM password management via Architect Settings → vault/config.json SHA-256 hash. No rebuild needed to rotate password. `AuthContext` fully async; Header login updated to match.
- **P5-4:** `FactionList.tsx` — Underdark/Surface/Neutral split with cityId sub-grouping
- **P5-5:** `LoreList.tsx` — Underdark/Surface/Historical split with category sub-grouping
- **Bug fixes:** `types.ts` VaultEntityStub drift fix (Omit pattern), CityView `as any` casts removed
- **P5-7 full implementation:** 10 sessions imported from `Session Recaps.txt`; 28 images committed to `images/sessions/`; `vault/sessions/index.json` built; Sessions.tsx + SessionDetail.tsx + `/sessions/:slug` route
- **Sessions UX iteration:** Expandable cards → individual pages; embedded audio iframe; woven images via section-aware distribution algorithm; Ken Burns motion (4 variants); per-image `object-position` for all portrait images across sessions 1–5 and 12; `imagePositions[]` parallel array in type + data
- Audio sessions 1+2 wired to Google Drive; hero focal points set per-session

### 2026-02-27 (Session 1)
- Backlog created from user-provided task batches (Batches 1, 2, 3)
- Full code inspection performed: App.tsx, types.ts, Home.tsx, Header.tsx, EntityList.tsx,
  EntityCard.tsx, EntityList.tsx, Journal.tsx, Bookmarks.tsx, CityView.tsx, vaultService.ts
- Vault data inspected: vault/locations/, vault/factions/, vault/npcs/, vault/cities/
- Architect RAGSearch.tsx inspected for Forge card style specs
- Key findings: CityView already complete; Journal already renamed; Fuse.js search already done;
  cityId hierarchy already in data layer; logo is text-only; bookmarks = full 4-file removal
- Tasks phased into P1 (surgical) → P2 (polish) → P3 (hierarchy) → P4 (data layer)
- Engineering Workflow applied: inspect first, clarify 3 questions, then plan

### 2026-03-03 (Session 4)
- Full bug audit (Session 3 read-only) + implementation (Session 4)
- **Phase 1 bugs fixed:** LORE 404 (critical), hidden entity leaks (high), missing NPC stubs (high), favicon (medium), CityCard fallback (medium), dead code cleanup (low)
- **Phase 2 UI overhaul:** sticky glassmorphism header, mobile nav drawer, Home ember sparks + Lucide tile icons + Recent full-bleed band, wider EntityList search, Journal forge-divider, Skeleton Tailwind shimmer, TYPE_URL_SEGMENT links across Stats/Timeline/Stats
- Remaining open issues: CityView `meta` type, `as any` cast, VaultEntity/Stub drift risk

### 2026-03-03 (Session 7 — P5-1 + P5-3)
- P5-1: Nav reorder live (Locations→Factions→Lore→Items→NPCs→Creatures→Characters→Sessions)
- P5-1: Sessions placeholder created; `/sessions` route wired
- P5-3: LocationList completely rewritten — Underdark/Surface split with RegionHeroPanel heroes
- P5-3: Hammerhold region corrected to surface in vault data + index stub
- Pushed and deployed to Cloudflare Pages

### 2026-03-03 (Session 6 — P5-2)
- Home page overhauled: full-bleed hero cards, asymmetric 3-row grid, scroll fade, tools strip

### 2026-03-03 (Session 5)
- Fixed UTF-8 double-encoding corruption across 18+ vault entity files (em dashes, curly quotes showing as ÃÂÃÂ...)
- Rebuilt vault/index.json from corrected entity files; all city summaries now clean
- Ingested user feature requests (Mythos Vault Updates.3.3.26.txt) → phased as P5-0 through P5-7

### 2026-02-27 (Session 2)
- Ingested Notion workspace data (Locations DB + Organizations DB) to build out vault content
- **7 cities created** (`vault/cities/`): ulfgar, zarakzul, uttp, vragathul, hammerhold,
  ironbeard-bastion, murkhold — all BLM voice, region: underdark, unique accentColor per city
- **7 locations created** (`vault/locations/`):
  - shadowed-flask — active, cityId: murkhold (Underdark Tavern waypoint)
  - abyssal-spire, daggerport, phoenixs-respite, luminary-haven, eternal-archive, starhaven
    — all `hidden: true`, region: surface (DM-only until revealed)
- **4 factions created** (`vault/factions/`): the-syndicate-shadows, the-crimson-concordat,
  the-verdant-accord, the-spire-covenant — no cityId (group under "Unaffiliated")
- `vault/index.json` updated with 18 new stubs prepended
- All content written in BLM (Brennan Lee Mulligan) voice — tone reference: `forge_voice_prompts`
- **BatchImageGen** built in Architect (new "Vault Images" primary nav tab) — bulk image
  generator for vault-only entities that don't exist in the Forge KB; pre-written FLUX prompts
  per entity; generates via BFL FLUX → patches both entity JSON + index.json on GitHub directly
- P4-2 Notion hierarchy sync wired in Architect: `NOTION_CITY_PAGE_IDS`, `getNotionPage()`,
  cityId auto-derivation from `parent.page_id` in `publishToVault()`
- **Pending:** Run BatchImageGen in Architect to generate + commit images for the 18 new entities
