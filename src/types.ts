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
}

export interface VaultIndex {
  entities: VaultEntityStub[];
  updatedAt: string;
}

export interface VaultEntityStub {
  id: string;
  slug: string;
  name: string;
  type: string;
  category?: string;
  summary?: string;
  imageUrl?: string;
  tags?: string[];
  factionId?: string;
  locationId?: string;
  cityId?: string;
  region?: string;
  parentId?: string;    // slug of parent entity (sub-faction → faction, nested location, etc.)
  publishedAt: string;
  hidden?: boolean;     // DM sets true to show entity as locked/unrevealed
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
