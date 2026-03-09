// Vault entity — the clean, player-facing version of a Forge entity
// DM-only fields (secrets, DM notes) are stripped before publishing
export interface VaultEntity {
  id: string;
  slug: string;
  name: string;
  type: string;         // NPC, LOCATION, FACTION, ITEM, PC, etc.
  category?: string;    // e.g. "Human Paladin", "Fortified Criminal Institution"
  summary?: string;
  content: string;      // Markdown body, DM sections removed
  imageUrl?: string;    // Raw GitHub image URL
  tags?: string[];
  factionId?: string;
  locationId?: string;
  cityId?: string;      // e.g. "karnuk" — links entity to a city view
  region?: string;      // e.g. "underdark", "surface"
  parentId?: string;    // slug of parent entity (sub-faction → faction, nested location, etc.)
  publishedAt: string;  // ISO date
  source: string;       // "The Forge" | "Lore Import" | etc.
  hidden?: boolean;     // DM sets true to show entity as locked/unrevealed
  meta?: Record<string, string>; // arbitrary city/entity metadata (e.g. accentColor)
}

export interface VaultIndex {
  entities: VaultEntityStub[];
  updatedAt: string;
}

// Stub is the full entity minus the heavy fields — single source of truth
export type VaultEntityStub = Omit<VaultEntity, 'content' | 'source'>;

export interface SessionEntry {
  number: number;
  id: string;
  slug: string;
  title: string;
  date: string | null;
  summary: string;
  content: string;
  imageUrl: string | null;
  imagePosition?: string;       // CSS object-position for hero image
  images: string[];
  imagePositions?: string[];    // Per-image object-position, parallel to images[]
  audioUrl: string | null;
  videoUrl?: string | null;     // Direct MP4 URL for inline video player
  tags: string[];
}

export interface SessionsIndex {
  sessions: SessionEntry[];
}

// Faction colors from Replitv2 design system
export const FACTION_COLORS: Record<string, string> = {
  'iron-order': '#ff6600',
  'iron-hammer-clan': '#d4af37',
  'deepstone-miners': '#a9a9a9',
  'brotherhood-of-forge': '#9370DB',
  'brotherhood-of-iron-mine': '#708090',
  'steel-syndicate': '#00CED1',
  'bregan-daerthe': '#7B68EE',
};

export const TYPE_ICONS: Record<string, string> = {
  NPC: '👤',
  LOCATION: '🗺',
  FACTION: '⚔️',
  ITEM: '⚗️',
  CREATURE: '🐉',
  LORE: '📜',
  PC: '🛡️',
  CITY: '🏙',
};

// type → URL path segment (used in link building)
export const TYPE_URL_SEGMENT: Record<string, string> = {
  NPC: 'npcs', CREATURE: 'creatures', LOCATION: 'locations',
  FACTION: 'factions', ITEM: 'items', LORE: 'lore', PC: 'characters', CITY: 'city',
};

// URL segment → entity type (used in EntityDetail to parse the route param)
export const URL_SEGMENT_TO_TYPE: Record<string, string> = {
  npcs: 'NPC', npc: 'NPC', creatures: 'CREATURE', creature: 'CREATURE',
  locations: 'LOCATION', location: 'LOCATION', factions: 'FACTION', faction: 'FACTION',
  items: 'ITEM', item: 'ITEM', lore: 'LORE', lores: 'LORE',
  pcs: 'PC', pc: 'PC', characters: 'PC', character: 'PC',
};

// type → vault folder (used in vaultService.getEntity)
export const TYPE_VAULT_FOLDER: Record<string, string> = {
  NPC: 'npcs', CREATURE: 'creatures', LOCATION: 'locations',
  FACTION: 'factions', ITEM: 'items', LORE: 'lore', PC: 'pcs', CITY: 'cities',
};
