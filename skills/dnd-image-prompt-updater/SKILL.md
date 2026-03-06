---
name: dnd-image-prompt-updater
description: >
  Use this skill whenever Christopher asks to update, fix, improve, or add to the image prompt
  generation logic in Mythos Architect. Triggers include: "update the faction image prompts",
  "the monster images still look wrong", "add a new entity type to the image system", "fix the
  framing for [anything]", "image prompts need to change", "update image styles", or any request
  involving FLUX prompt quality, entity framing, style behavior, or subject line generation.
  ALWAYS use this skill before touching any image-related file — it defines which files to update,
  the rules that prevent AI slop, and the exact patterns that make the system work.
---

# D&D Image Prompt Updater — Mythos Architect

This skill governs all updates to the Mythos Architect image prompt generation system.
Read this before touching any image-related file.

---

## The Three Files (always update all three together)

```
components/RAGSearch.tsx          — The Forge content creator
                                    Functions: buildImagePrompt(), extractSubject()

services/imageService.ts          — Vault image generator (KnowledgeHub)
                                    Functions: buildVaultImagePrompt(), IMAGE_STYLES[]

services/imagePromptBuilder.ts    — Standalone vault builder
                                    Functions: buildVaultImagePrompt(), VAULT_IMAGE_STYLES[],
                                               characterFraming(), constructFraming(), itemFraming()
```

**Never update just one file.** The three systems must stay in sync or prompts will diverge
between The Forge and the Vault.

---

## The Golden Rules

### 1. Subject line: declarative only, no lore

FLUX reads visual descriptors. Narrative paragraphs waste tokens and confuse the model.

```
GOOD: "VAULTSWORN SENTINEL, Medium Construct (Lawful Neutral)"
BAD:  "The Cogmind Collective discovered early on that clients who could afford bodyguards..."
```

Subject extraction priority order (already implemented in `extractSubject()`):
1. `**Appearance:**` field → always wins
2. Stat block type line → `ENTITY NAME, Size Type (Alignment)`
3. `**Type:**` / `**Location Type:**` / `**Purpose:**` fields
4. Entity name alone → always better than a lore dump
5. First 80 chars of cleaned markdown → last resort only

### 2. Framing must be content-aware

One hardcoded template per entity type = AI slop. Every type needs keyword detection
that branches to appropriate visual framing based on what the entity actually IS.

```typescript
// Pattern to follow for every entity type:
const mdLower = md.toLowerCase();
if (mdLower.match(/\b(tavern|inn|alehouse)\b/)) {
  framing = 'interior of a dimly lit fantasy tavern...';
} else if (mdLower.match(/\b(city|town|market)\b/)) {
  framing = 'wide street-level view of a fantasy urban environment...';
} else {
  framing = 'sensible fallback...'; // always required
}
```

### 3. Positive descriptors only

FLUX ignores or inverts negation language.
```
GOOD: "still and watchful stance conveying disciplined readiness"
BAD:  "not aggressive, not charging, without bioluminescence"
```

### 4. Never add lore context to framing

Framing describes composition, lighting, and camera angle only.
It does not describe story, personality, or narrative context.

---

## The 5 Style IDs

| ID | Name | Suffix pattern | Special rules |
|----|------|---------------|---------------|
| `realistic` | Photorealistic DSLR | Hasselblad H6D wide angle, cinematic lighting, photorealistic, 8K | Default |
| `illustrated` | Comic Book | D&D setting, comic book cell shading style, bold outlines | None |
| `celshade` | Cel Rotoscope | Telltale rotoscope cel shading, rim lighting, wide angle full body | **Forces full-body framing on all characters** |
| `cinematic` | Cinematic Scene | Dynamic blur background, gritty desaturated, strategic warm highlights, widescreen | **Pushes action/dynamic composition** |
| `equipment` | Equipment Hero | Canon TS-E 135mm f/4L, black background, macro detail, single dramatic light | **Only valid for items — fall back to realistic framing for all other types** |

Style routing is handled via `style.id` or `styleId` in each builder function.
The suffix is appended last. Framing must match what the style is trying to do.

---

## Creature Type Routing (Monster archetype)

D&D "Monster" covers warforged soldiers AND aboleths. Always detect from the stat block
type line before applying framing. Never default to "chaos demon" for everything.

| Detected type | Framing approach |
|--------------|-----------------|
| `construct` / `warforged` | Armored humanoid, plate and runes, still and watchful. NO spikes, NO hellfire, NO bioluminescence |
| `humanoid` (any race) | Treat like NPC — character portrait with equipment visible |
| `undead` | Cold, pallid, decayed but recognizable. Eerie stillness |
| `beast` / `monstrosity` | Naturalistic predator. Wildlife illustration composition |
| `elemental` / `plant` | Natural forces made manifest. Not malevolent |
| `dragon` | Full epic treatment. Low angle, wingspan, scales catching light |
| `aberration` / `fiend` / `ooze` | NOW use unsettling anatomy, bioluminescent accents, alien textures |

Detection pattern (already in code — preserve this):
```typescript
const cTypeLine = md.match(/\b(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+),/i);
const cType = cTypeLine ? cTypeLine[2].toLowerCase() : '';
```

---

## Entity Type Quick Reference

### NPC / PC
- Subject: name + appearance if present
- Framing: `celshade` → full body forced; `cinematic` → tense decisive moment; others → 3/4 portrait

### Monster (see Creature Type Routing above)

### Location
Keyword branches: tavern/inn | city/town/market | throne/palace/hall | underdark/cavern/cave |
forest/wilderness | ship/harbor/coast | temple/shrine
`cinematic` style adds action/tension to location framing

### Faction
Keyword branches: cogmind/construct/forge (industrial-arcane) | arcane/wizard/mage |
thieves/assassin/shadow (noir) | military/army/knights | merchant/trade/guild | druid/nature/wild
Always: emblem/visual identity composition, NOT a scene with people

### Item
Keyword branches: legendary/artifact/cursed | sword/blade/weapon | potion/vial/flask |
armor/helm/shield | ring/amulet/jewelry | scroll/tome/book | cloak/garment
`equipment` style → black background macro, raking sidelight regardless of item type

### Lore
Keyword branches: war/battle/siege | god/deity/religion | map/geography/region | founding/origin
Default ratio: 3:2 (widescreen)

### Scene / Recap
Prefer Read-Aloud text as subject — it's already written to be visual

---

## How to Make an Update

1. **Read all three files** — find every place the target entity type appears
2. **Understand current keyword detection** before changing anything
3. **Apply changes consistently** across all three files
4. **Test mentally**: paste a sample stat block or entity through the new logic in your head
5. **Deliver complete files** — no snippets, no partial edits

### Commit message format
```
fix(images): [what changed] for [entity type]
fix(images): content-aware framing for construct/warforged monsters
feat(images): add Style 5 equipment hero shot to all three builders
```

---

## Prompt Template for Future Updates

Copy this into Claude Code or a new Claude chat:

```
I need to update the image prompt generation logic for [ENTITY TYPE] in Mythos Architect.

Read skills/dnd-image-prompt-updater/SKILL.md first, then read all three files:
- components/RAGSearch.tsx
- services/imageService.ts
- services/imagePromptBuilder.ts

The change I want:
[DESCRIBE YOUR CHANGE — be specific about what entity type, what's wrong now, what should happen]

Follow all rules in the skill doc. Deliver all three complete files in one batch.
```

---

## Known Anti-Patterns (what caused the AI slop)

- `'full body creature portrait at 3/4 angle, dramatic underlighting and sidelighting with bioluminescent accents'` — this was hardcoded for ALL monsters. Every warforged, every goblin, every merchant with a stat block got this.
- Grabbing the first italic paragraph as subject — that's always the lore flavor text, not visual description
- `'heraldic composition featuring an ornate medieval crest and shield design'` — applied to the Cogmind Collective, a corporate arcane engineering guild
- `'explosive visualization of magical energy'` — applied to Speak with Dead and Modify Memory
