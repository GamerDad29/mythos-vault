// Vault entity — the clean, player-facing version of a Forge entity
// DM-only fields (secrets, DM notes) are stripped before publishing
export interface VaultEntity {
  id: string;
  slug: string;
  name: string;
  type: string;         // NPC, LOCATION, FACTION, ITEM, etc.
  category?: string;    // e.g. "Human Paladin", "Fortified Criminal Institution"
  summary?: string;
  content: string;      // Markdown body, DM sections removed
  imageUrl?: string;    // Raw GitHub image URL
  tags?: string[];
  factionId?: string;
  locationId?: string;
  publishedAt: string;  // ISO date
  source: string;       // "The Forge" | "Lore Import" | etc.
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
  publishedAt: string;
}

// Faction colors from Replitv2 design system
export const FACTION_COLORS: Record<string, string> = {
  'iron-order': '#ff6600',
  'iron-hammer-clan': '#d4af37',
  'deepstone-miners': '#a9a9a9',
  'brotherhood-of-forge': '#9370DB',
  'brotherhood-of-iron-mine': '#708090',
  'steel-syndicate': '#00CED1',
};

export const TYPE_ICONS: Record<string, string> = {
  NPC: '👤',
  LOCATION: '🗺',
  FACTION: '⚔️',
  ITEM: '⚗️',
  CREATURE: '🐉',
  LORE: '📜',
};
