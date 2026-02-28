# Mythos Vault — Backlog

_Last updated: 2026-02-27_

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

## Implementation Notes

- **Forge reference:** Card styles documented above in P2-1. Source: `RAGSearch.tsx` (Architect).
- **No image logo** — header is text-only. B1-1 from original spec is a layout fix, not an image fix.
- **Bookmarks full removal** = 4 files. Don't do a partial remove.
- **CityView is a first-class feature** — don't replace it with a generic list. Route all location hierarchy through it.
- **EntityList is the right place for P3 grouping** — don't create new pages unless EntityList becomes unmanageable.
- **Items grouping:** implement the UI skeleton now; don't wait for data.

---

## Session Log

### 2026-02-27
- Backlog created from user-provided task batches (Batches 1, 2, 3)
- Full code inspection performed: App.tsx, types.ts, Home.tsx, Header.tsx, EntityList.tsx,
  EntityCard.tsx, EntityList.tsx, Journal.tsx, Bookmarks.tsx, CityView.tsx, vaultService.ts
- Vault data inspected: vault/locations/, vault/factions/, vault/npcs/, vault/cities/
- Architect RAGSearch.tsx inspected for Forge card style specs
- Key findings: CityView already complete; Journal already renamed; Fuse.js search already done;
  cityId hierarchy already in data layer; logo is text-only; bookmarks = full 4-file removal
- Tasks phased into P1 (surgical) → P2 (polish) → P3 (hierarchy) → P4 (data layer)
- Engineering Workflow applied: inspect first, clarify 3 questions, then plan
