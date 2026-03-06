import type { VaultEntity } from '../types';

export interface ImageStyleConfig {
  id: string;
  label: string;
  subtitle: string;
  accent: string;
  suffix: string;
}

export const IMAGE_STYLES: ImageStyleConfig[] = [
  {
    id: 'realistic',
    label: 'Photorealistic',
    subtitle: 'DSLR · Cinematic',
    accent: '#60a5fa',
    // Style 1 — Cinematic Photorealistic (DSLR)
    // Pattern: [subject], high fantasy Dungeons and Dragons style, [mood], shot with Hasselblad H6D wide angle lens, cinematic lighting, photorealistic, 8K
    suffix: 'high fantasy Dungeons and Dragons style, shot with Hasselblad H6D wide angle lens, cinematic lighting, photorealistic, 8K',
  },
  {
    id: 'illustrated',
    label: 'Comic Book',
    subtitle: 'Comic Book · Cel Shaded',
    accent: '#a78bfa',
    // Style 2 — Comic Book / Cel Shaded
    // Pattern: [subject], high fantasy Dungeons and Dragons setting, comic book cell shading style
    suffix: 'high fantasy Dungeons and Dragons setting, comic book cell shading style, bold confident outlines, flat color fills with painterly shading, warm atmospheric background, D&D character art quality',
  },
  {
    id: 'celshade',
    label: 'Cel Rotoscope',
    subtitle: 'Telltale · Full Body',
    accent: '#34d399',
    // Style 3 — Cel Shaded / Rotoscope Full Body
    // Pattern: wide angle full body shot of [character], [environment], high fantasy Dungeons and Dragons setting, rim lighting, telltale style rotoscope cel shading art style
    suffix: 'high fantasy Dungeons and Dragons setting, rim lighting, telltale style rotoscope cel shading art style, wide angle full body shot, bold graphic illustration, thick confident outlines',
  },
  {
    id: 'cinematic',
    label: 'Cinematic Scene',
    subtitle: 'Widescreen · Battle Drama',
    accent: '#f59e0b',
    // Style 4 — Cinematic Widescreen Battle/Scene
    // Pattern: cinematic widescreen image of [character] [action/moment], [expression], [armor/clothing detail], dynamic blur background, [light source], gritty desaturated color palette with strategic warm highlights
    suffix: 'dynamic blur background, gritty desaturated color palette with strategic warm highlights emphasizing drama, high-stakes fantasy atmosphere, cinematic widescreen composition, photorealistic rendering',
  },
  {
    id: 'equipment',
    label: 'Equipment Hero',
    subtitle: 'Macro · Artifact Detail',
    accent: '#f97316',
    // Style 5 — Equipment/Armor Hero Shot
    // Pattern: [item name] is [description], shot with Canon TS-E 135mm f/4L, black background, macro detail, single dramatic light source
    // NOTE: This style is only meaningful for items/weapons/armor. For other entity types it falls back to realistic.
    suffix: 'shot with Canon TS-E 135mm f/4L, black background, macro detail, single dramatic light source, material texture rendered in extreme clarity, product hero shot composition',
  },
];

// Extract the text content beneath a section header.
// Handles both: "## Appearance\n\ntext" and "**Appearance:** text on same line"
function extractSectionContent(md: string, sectionName: string): string {
  // H2 header style: ## Appearance\n\n[content until next ##]
  const h2Match = md.match(new RegExp(`##\\s+${sectionName}\\s*\\n+([^#]+)`, 'i'));
  if (h2Match) {
    return h2Match[1].replace(/[*#>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
  }
  // Bold label style: **Appearance:** text here (same line)
  const boldMatch = md.match(new RegExp(`\\*\\*${sectionName}:\\*\\*\\s*([^\\n]+)`, 'i'));
  if (boldMatch) {
    return boldMatch[1].replace(/[*]/g, '').trim();
  }
  return '';
}

function extractSubject(md: string): string {
  // Entity name: first line that is a bold name (not a section header like Appearance/Personality)
  // Avoid grabbing ## section headers as the entity name
  const SECTION_HEADERS = /^(appearance|personality|motivation|background|connections|plot hooks|key connections|secret|overview|leadership|special traits|actions|reactions)$/i;
  
  // Try bold all-caps/title names first (e.g. **VAULTSWORN SENTINEL**)
  const boldNameMatch = md.match(/\*\*([A-Z][A-Za-z\s'"'\-]{2,})\*\*/m);
  const boldName = boldNameMatch ? boldNameMatch[1].replace(/[*#]/g, '').trim() : '';
  
  // Try ## header but skip known section names
  const h2Matches = [...md.matchAll(/^##\s+(.+)$/gm)];
  const h2Name = h2Matches
    .map(m => m[1].trim())
    .find(n => !SECTION_HEADERS.test(n)) || '';

  const entityName = boldName || h2Name;

  // Appearance content — works for both ## Appearance and **Appearance:** formats
  const appearance = extractSectionContent(md, 'Appearance');
  if (appearance) {
    return entityName ? `${entityName}. ${appearance}` : appearance;
  }

  const creatureTypeLine = md.match(/\*?(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+),\s*([^*\n]+)\*?/i);
  if (creatureTypeLine) {
    const size = creatureTypeLine[1];
    const type = creatureTypeLine[2];
    const alignment = creatureTypeLine[3].trim();
    return entityName
      ? `${entityName}, ${size} ${type} (${alignment})`
      : `${size} ${type} ${alignment}`;
  }

  const locationTypeMatch = md.match(/\*\*(?:Type|Location Type|Setting):\*\*\s*([^\n]+)/);
  if (locationTypeMatch) {
    return entityName
      ? `${entityName}. ${locationTypeMatch[1].replace(/[*]/g, '').trim()}`
      : locationTypeMatch[1].replace(/[*]/g, '').trim();
  }

  const factionTypeMatch = md.match(/\*\*(?:Type|Purpose|Faction Type):\*\*\s*([^\n]+)/);
  if (factionTypeMatch) {
    return entityName
      ? `${entityName}. ${factionTypeMatch[1].replace(/[*]/g, '').trim()}`
      : factionTypeMatch[1].replace(/[*]/g, '').trim();
  }

  return entityName || md.replace(/[*#>|]/g, '').replace(/\s+/g, ' ').slice(0, 80).trim();
}

export function buildVaultImagePrompt(entity: VaultEntity, style: ImageStyleConfig): string {
  const universal = 'vibrant saturated colors, rich deep tones, dramatic intentional lighting, 8K quality, sharp focus, purely visual composition';
  const md = entity.content;
  const typeId = entity.type.toLowerCase();

  let subject = '';
  let framing = '';

  if (typeId === 'npc' || typeId === 'pc') {
    // Appearance comes BEFORE category — race/physical description must hit FLUX early.
    // "Steel Syndicate War-Mech Commander" before "bugbear" = FLUX renders a human soldier.
    const appearance = extractSectionContent(md, 'Appearance');
    if (appearance) {
      subject = `${entity.name}. ${appearance}`;
    } else {
      subject = entity.name + (entity.category ? `. ${entity.category}` : '');
    }
    // Style-aware framing for characters
    if (style.id === 'celshade') {
      // Style 3 forces full body — that's the whole point of the rotoscope style
      framing = 'wide angle full body shot, dramatic rim lighting, expressive face and confident stance, RPG character art composition';
    } else if (style.id === 'cinematic') {
      // Style 4 — action moment, dynamic
      framing = 'character in a tense decisive moment, dynamic composition, expressive face showing intensity, armor and equipment detail visible, dramatic light source from battle fires or torchlight';
    } else if (style.id === 'equipment') {
      // Style 5 makes no sense for NPCs — fall back to realistic portrait framing
      framing = 'character portrait showing face and upper body at 3/4 angle, dramatic rim lighting with warm torchlight, expressive facial detail clearly visible, RPG character art composition';
    } else {
      framing = 'character portrait showing face and upper body at 3/4 angle, dramatic rim lighting with warm torchlight, expressive facial detail clearly visible, RPG character art composition';
    }
  } else if (typeId === 'creature') {
    subject = extractSubject(md);
    const creatureTypeLine = md.match(/\b(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+),/i);
    const creatureType = creatureTypeLine ? creatureTypeLine[2].toLowerCase() : '';
    if (['construct', 'warforged'].some(t => creatureType.includes(t) || md.toLowerCase().includes(t))) {
      const constructFraming = 'full body portrait of a constructed humanoid warrior at 3/4 angle, heavy plate armor with arcane rune engravings, rigid mechanical joints and alchemical metalwork, still and watchful stance conveying disciplined readiness, dramatic sidelight catching polished metal surfaces';
    framing = (style.id === 'cinematic')
      ? 'constructed humanoid warrior in a combat-ready stance, armor panels catching firelight, watchful and lethal stillness, dynamic widescreen composition'
      : constructFraming;
    } else if (['humanoid', 'human', 'elf', 'dwarf', 'orc', 'tiefling', 'gnome', 'halfling'].some(t => creatureType.includes(t))) {
      framing = 'full body character portrait at 3/4 angle, dramatic rim lighting with torchlight, equipped with visible weapons and armor appropriate to their role, expressive face and confident stance, RPG character art composition';
    } else if (creatureType.includes('undead')) {
      framing = 'full body portrait of an undead figure at 3/4 angle, cold desaturated pallor with deep shadow hollows, decayed or skeletal features with remnants of former life still visible, eerie stillness, pale cold moonlight or necrotic glow';
    } else if (creatureType.includes('dragon')) {
      framing = 'full body dragon portrait at dramatic low angle, massive scaled form with powerful wingspan, chromatic or metallic scales catching the light, ancient and imperious presence, epic fantasy composition';
    } else if (creatureType.includes('beast') || creatureType.includes('monstrosity')) {
      framing = 'full body creature portrait at 3/4 angle, naturalistic anatomy with dangerous predator energy, detailed hide or scales or feathers, environment-appropriate lighting, wildlife illustration composition';
    } else if (creatureType.includes('plant') || creatureType.includes('elemental')) {
      framing = 'full body portrait of an elemental being at 3/4 angle, composed of natural materials in motion, environmental lighting matching their element, sense of ancient primordial power rather than malevolence';
    } else {
      framing = 'full body creature portrait at 3/4 angle, wrong and unsettling anatomy that defies natural order, bioluminescent or infernal accents, hyper-detailed alien textures, overwhelming intimidating presence filling the frame';
    }
  } else if (typeId === 'location') {
    const readAloudMatch = md.match(/Read-Aloud[^"]*"([^"]+)"/);
    subject = readAloudMatch ? readAloudMatch[1].trim() : extractSubject(md);
    const mdLoc = md.toLowerCase();
    if (mdLoc.match(/\b(tavern|inn|alehouse|pub|bar)\b/)) {
      framing = 'interior of a dimly lit fantasy tavern, warm amber candlelight, rough-hewn wooden tables and booths, low ceiling with hanging tankards, intimate and lived-in atmosphere';
    } else if (mdLoc.match(/\b(city|town|market|district|ward|quarter|street|plaza|square)\b/)) {
      framing = 'wide street-level view of a fantasy urban environment, architectural layers showing history and culture, atmospheric lighting from lanterns or open sky, sense of a living city';
    } else if (mdLoc.match(/\b(throne|palace|court|castle|manor|hall|great hall|chamber)\b/)) {
      framing = 'grand interior architectural shot, vaulted ceilings and imposing stonework, formal staging with strong directional light from high windows or torch sconces, power and authority conveyed through scale';
    } else if (mdLoc.match(/\b(underdark|cavern|cave|tunnel|grotto|underground|stalactite)\b/)) {
      framing = 'wide underground establishing shot, cavern ceiling with stalactites overhead, bioluminescent fungi or forge-fire as primary light source, layered rock depth receding into darkness, Underdark atmosphere';
    } else if (mdLoc.match(/\b(forest|wood|grove|glade|jungle|swamp|marsh|wilderness|tree)\b/)) {
      framing = 'wide environmental shot of a fantasy wilderness, natural light filtering through canopy or fog, organic scale and ancient texture, sense of untamed and potentially dangerous nature';
    } else if (mdLoc.match(/\b(ship|dock|harbor|port|vessel|deck|sea|ocean|coast)\b/)) {
      framing = 'dramatic maritime environment, weathered wood and rigging, harbor or open ocean visible, sea light implied by the composition, adventurous nautical atmosphere';
    } else if (mdLoc.match(/\b(temple|shrine|altar|sanctuary|chapel|cathedral|holy)\b/)) {
      framing = 'sacred interior or exterior architectural shot, divine light source from above, stone worn smooth by centuries of worship, reverent scale and atmosphere';
    } else {
      framing = 'wide environmental establishing shot with strong sense of place, dramatic lighting appropriate to the setting, architecture and environment conveying history and character';
    }
  } else if (typeId === 'faction') {
    const clean = md.replace(/[*#>]/g, '').replace(/\s+/g, ' ');
    const symbolMatches = clean.match(/(?:crest|banner|insignia|heraldry|symbol|emblem|sigil|icon|colors?|seal|coat of arms)[^.]+\./gi);
    subject = symbolMatches?.length
      ? `${entity.name} — emblem: ${symbolMatches.slice(0, 2).join(' ').trim().slice(0, 150)}`
      : `${entity.name} — faction emblem and visual identity`;
    const mdFac = md.toLowerCase();
    if (mdFac.match(/\b(cogmind|construct|mechanical|artificer|arcane engineering|forge)\b/)) {
      framing = 'industrial-arcane faction emblem, precise gear and sigil work, cold steel and brass tones with alchemical blue accents, corporate and manufactured precision aesthetic';
    } else if (mdFac.match(/\b(arcane|wizard|mage|magic|spell|academy|college|order|mystical)\b/)) {
      framing = 'arcane faction emblem with mystical iconography, runic symbols and magical sigils, deep jewel tones with arcane energy accents, scholarly and powerful aesthetic';
    } else if (mdFac.match(/\b(thieves|assassin|shadow|rogue|syndicate|crime|criminal|mafia|underground|hidden)\b/)) {
      framing = 'shadowy faction insignia, dark background with minimalist iconography suggesting hidden operations, noir aesthetic with cold silver or violet accent tones, implied secrecy';
    } else if (mdFac.match(/\b(military|army|legion|order|knights|guard|soldier|war|marshal)\b/)) {
      framing = 'martial faction heraldry on shield and banner, bold iconic design readable at distance, strong contrast colors, honorable and disciplined aesthetic';
    } else if (mdFac.match(/\b(merchant|trade|commerce|coin|bank|exchange|guild|money)\b/)) {
      framing = 'mercantile faction seal, balanced scales or trade iconography, gold and deep red tones, prosperity and authority in an ornate but practical design';
    } else if (mdFac.match(/\b(druid|nature|wild|grove|primal|green|forest|earth)\b/)) {
      framing = 'natural faction emblem woven from organic forms, leaves, roots, and living wood as design elements, earthy greens and browns with flashes of gold, primal and ancient aesthetic';
    } else {
      framing = "faction emblem and visual identity, iconic symbol capturing the group's purpose and aesthetic, strong composition against a dark background with appropriate color palette";
    }
  } else if (typeId === 'item') {
    const flavorMatch = md.match(/\*\*[^*\n]+\*\*\n+\*([^*\n]{20,})\*/);
    subject = flavorMatch ? flavorMatch[1].trim() : extractSubject(md);
    const mdItem = md.toLowerCase();
    // Style 5 (equipment) is designed for items — use its macro hero shot framing
    // For other styles, use content-aware framing as normal
    if (style.id === 'equipment') {
      // Style 5 — Canon TS-E 135mm macro, black background, single light source
      // The suffix handles the technical setup; framing just describes the item's presentation
      framing = 'displayed on a black surface, macro detail revealing every scratch and material texture, single dramatic raking light source from the side';
    } else if (mdItem.match(/\b(legendary|artifact|relic|ancient|cursed|sentient|unique)\b/)) {
      framing = 'legendary artifact displayed with reverence, dramatic single-source magical glow with caustic light refraction, isolated hero shot with the object as sole focus, sense of immense and dangerous power';
    } else if (mdItem.match(/\b(sword|blade|axe|weapon|dagger|bow|staff|wand|spear|halberd|mace)\b/)) {
      framing = 'fantasy weapon displayed at a dramatic angle, material and craftsmanship clearly rendered, lighting that reveals edge quality and wear, character implied by the design and condition';
    } else if (mdItem.match(/\b(potion|vial|flask|bottle|brew|elixir|tincture)\b/)) {
      framing = 'alchemical vessel with luminous contents, glass catching candlelight, liquid color saturated and vivid, small-scale intimate composition on a dark surface with soft magical glow';
    } else if (mdItem.match(/\b(armor|helm|gauntlet|breastplate|shield|pauldron)\b/)) {
      framing = 'armor piece displayed with craft and material detail visible, texture of metal or leather clearly rendered, lighting that shows workmanship and potential wear';
    } else if (mdItem.match(/\b(ring|amulet|necklace|bracelet|brooch|pendant|jewel)\b/)) {
      framing = 'ornate jewelry piece in close detail, gemstones and metalwork catching light, intimate scale with the craftsmanship as the clear subject, dark velvet or stone surface beneath';
    } else if (mdItem.match(/\b(scroll|tome|book|grimoire|letter|document|map|codex)\b/)) {
      framing = 'aged parchment or leather-bound tome, warm candlelight illuminating the surface, visible text and markings, worn edges and historical weight implied by material and condition';
    } else {
      framing = 'fantasy object displayed clearly with material and craftsmanship visible, lighting that reveals texture and detail, clean composition with the item as the clear subject';
    }
  } else if (typeId === 'lore') {
    subject = extractSubject(md);
    const mdLore = md.toLowerCase();
    if (mdLore.match(/\b(war|battle|siege|conflict|conquest|fell|destroyed|ancient|rise|fall|invasion)\b/)) {
      framing = 'cinematic historical conflict scene, epic scale implied through environmental destruction or massed forces, dramatic lighting conveying the weight of the event, painterly composition';
    } else if (mdLore.match(/\b(god|deity|divine|faith|religion|temple|prophecy|sacred|holy|pantheon)\b/)) {
      framing = 'mythological or religious scene with divine scale, golden or ethereal lighting, iconographic composition referencing sacred art traditions, awe-inspiring and reverential atmosphere';
    } else {
      framing = 'cinematic scene illustrating the key concept or moment in this lore entry, painterly composition with atmospheric lighting, environmental storytelling through visual detail';
    }
  } else {
    subject = entity.name + (entity.category ? `. ${entity.category}` : '');
    framing = 'dynamic 3/4 view composition with dramatic lighting and a strong focal point, epic fantasy atmosphere';
  }

  return `${subject}. ${framing}. ${style.suffix}. ${universal}`;
}

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string;
const WORKER_SECRET = import.meta.env.VITE_WORKER_SECRET as string;

function workerHeaders() {
  return {
    'Authorization': `Bearer ${WORKER_SECRET}`,
    'Content-Type': 'application/json',
  };
}

// Submit + client-side poll to avoid Cloudflare Worker's 50-subrequest-per-request limit.
// Each /api/bfl/poll call uses only 1-2 subrequests; the polling loop runs in the browser.
export async function generateVaultImage(prompt: string): Promise<{ imageBase64: string; mimeType: string }> {
  // 1. Submit the job
  const submitRes = await fetch(`${WORKER_URL}/api/bfl/generate`, {
    method: 'POST',
    headers: workerHeaders(),
    body: JSON.stringify({ prompt, aspect_ratio: '1:1' }),
  });
  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Image submission failed: ${submitRes.status}`);
  }
  const { pollingUrl } = await submitRes.json() as { pollingUrl: string };

  // 2. Poll from the browser (no subrequest limit here) — max 90s, 2s intervals
  const maxAttempts = 45;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const pollRes = await fetch(`${WORKER_URL}/api/bfl/poll`, {
      method: 'POST',
      headers: workerHeaders(),
      body: JSON.stringify({ pollingUrl }),
    });
    if (!pollRes.ok) continue;

    const data = await pollRes.json() as
      | { status: 'pending' }
      | { status: 'ready'; imageBase64: string; mimeType: string }
      | { status: 'error'; message: string };

    if (data.status === 'ready') return { imageBase64: data.imageBase64, mimeType: data.mimeType };
    if (data.status === 'error') throw new Error(data.message);
    // 'pending' — keep polling
  }

  throw new Error('Image generation timed out after 90s');
}

export async function uploadImageToVaultGitHub(
  entityId: string,
  imageBase64: string,
  mimeType: string,
): Promise<string> {
  const res = await fetch(`${WORKER_URL}/api/github/upload-image`, {
    method: 'POST',
    headers: workerHeaders(),
    body: JSON.stringify({
      owner: 'GamerDad29',
      repo: 'mythos-vault',
      branch: 'main',
      entityId,
      imageBase64,
      mimeType,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Image upload failed: ${res.status}`);
  }
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  return `https://raw.githubusercontent.com/GamerDad29/mythos-vault/main/images/${entityId}.${ext}`;
}

