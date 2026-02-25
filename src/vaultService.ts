import type { VaultIndex, VaultEntity } from './types';

// Config — points to the vault folder in the mythos-vault repo
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/GamerDad29/mythos-vault/main/vault';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

async function fetchJson<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data as T;
}

export const vaultService = {
  // Fetch the master index of all published entities
  async getIndex(): Promise<VaultIndex> {
    return fetchJson<VaultIndex>(`${GITHUB_RAW_BASE}/index.json`);
  },

  // Fetch a single entity by slug
  async getEntity(type: string, slug: string): Promise<VaultEntity> {
    return fetchJson<VaultEntity>(`${GITHUB_RAW_BASE}/${type.toLowerCase()}s/${slug}.json`);
  },

  // Fetch a city entity by slug (lives at vault/cities/{slug}.json)
  async getCity(slug: string): Promise<VaultEntity> {
    return fetchJson<VaultEntity>(`${GITHUB_RAW_BASE}/cities/${slug}.json`);
  },

  // Fetch all entities of a type
  async getByType(type: string): Promise<VaultEntity[]> {
    const index = await this.getIndex();
    const stubs = index.entities.filter(e => e.type.toUpperCase() === type.toUpperCase());
    const results = await Promise.allSettled(
      stubs.map(s => this.getEntity(s.type, s.slug))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<VaultEntity> => r.status === 'fulfilled')
      .map(r => r.value);
  },

  // Clear cache (useful for dev)
  clearCache() {
    cache.clear();
  }
};
