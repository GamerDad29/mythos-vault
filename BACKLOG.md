# Mythos Vault — Backlog

_Last updated: 2026-03-03 (Session 7)_

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

## Phase 5 — Navigation, Home Overhaul & New Sections

_Source: Mythos Vault Updates.3.3.26.txt_

### P5-0 — Admin Login + DM Hide/Show (PRIORITY)
- Add a lock icon / "DM" button at top-right of `Header.tsx`
- On click: prompt for credentials (hard-coded for now, e.g. env var or constant)
- Auth state stored in React context or localStorage session flag
- When logged in as DM:
  - Each entity card/detail gets a HIDE/SHOW toggle (flips `hidden` field)
  - Each section within `EntityDetail` gets a per-section hide/show toggle
  - Toggled state persists (localStorage or pushes to GitHub vault JSON via Architect)
- Logged-out players never see hidden entities or hidden sections

### P5-0b — DM Login: Env Vars for Build (BLOCKED)
- `VITE_DM_PASSWORD` and `VITE_GITHUB_PAT` are Vite build-time vars — must be set before `npm run build`
- `wrangler pages secret put` sets runtime secrets only — does NOT work for Vite VITE_* vars
- Cloudflare dashboard blocked on current network
- **Fix when ready:** In PowerShell from mythos-vault dir:
  ```
  $env:VITE_DM_PASSWORD = Read-Host "DM Password"
  $env:VITE_GITHUB_PAT = Read-Host "GitHub PAT"
  npm run build
  npx wrangler pages deploy dist --project-name=mythos-vault
  ```
- Alternatively: set via Cloudflare dashboard Settings → Environment variables (build vars, not secrets)

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

### P5-4 — Factions: Underdark / Surface / Neutral + Sub-grouping
- Top-level split: **Underdark | Surface | Neutral**
- Within each: sub-groups **City | Trade | Unaffiliated**
- Requires `region` + new `alignment` or `affiliation` field on faction data
- Karnuk factions already done (cityId populated); wire them to the right bucket
- Neutral = factions like Order of the Cauterized Saint, Ledger Eternal

### P5-5 — Lore: Underdark / Surface / Historical + Sub-categories
- Top-level split: **Underdark | Surface | Historical**
- Sub-categories: City Lore, Religion, Historical Lore (others TBD)
- Requires `region` and `loreCategory` field on lore entity data
- Current lore entries (karnuk-*) are City Lore, Underdark

### P5-6 — Characters Page (New)
- New route `/characters` with full player character showcase
- Import full player sheet data (TBD format — user to provide)
- "Super cool presentation" — think hero card with portrait, stats, backstory panels
- Design TBD until sheet data is available; build data schema first

### P5-7 — Sessions Page (New)
- New route `/sessions` — session recap feed
- User has existing recaps for early sessions
- Display as a story-driven timeline: session number, title, date, recap text
- Import recaps as vault entities of type SESSION (new type) or as LORE with category "Recap"
- Data format TBD; build the page shell first, wire content after

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
