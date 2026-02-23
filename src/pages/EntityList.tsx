import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { vaultService } from '../vaultService';
import { EntityCard } from '../components/EntityCard';
import { SkeletonCard } from '../components/Skeleton';
import type { VaultEntityStub } from '../types';

const TYPE_LABELS: Record<string, { plural: string; desc: string }> = {
  NPC: { plural: 'NPCs', desc: 'Characters encountered in the Underdark' },
  LOCATION: { plural: 'Locations', desc: 'Cities, ruins, and places of power' },
  FACTION: { plural: 'Factions', desc: 'Powers that shape the Middledark' },
  ITEM: { plural: 'Items', desc: 'Artifacts, weapons, and curiosities' },
  LORE: { plural: 'Lore', desc: 'History, legends, and hidden truths' },
  CREATURE: { plural: 'Creatures', desc: 'Beasts and beings of the deep' },
};

interface Props {
  type: string;
}

export function EntityList({ type }: Props) {
  const [entities, setEntities] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const meta = TYPE_LABELS[type] || { plural: type + 's', desc: '' };

  useEffect(() => {
    setLoading(true);
    setError(null);
    vaultService.getIndex()
      .then(index => {
        const filtered = index.entities.filter(e => e.type.toUpperCase() === type.toUpperCase());
        setEntities(filtered);
      })
      .catch(() => setError('Could not load entries from the Vault.'))
      .finally(() => setLoading(false));
  }, [type]);

  const filtered = query.trim()
    ? entities.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.summary?.toLowerCase().includes(query.toLowerCase()) ||
        e.category?.toLowerCase().includes(query.toLowerCase()) ||
        e.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : entities;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <p
          className="font-display text-sm uppercase tracking-[0.3em] mb-3"
          style={{ color: 'hsl(25 80% 38%)' }}
        >
          Chronicle
        </p>
        <h1
          className="font-serif font-black uppercase tracking-wide mb-3"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'hsl(15 4% 92%)' }}
        >
          {meta.plural}
        </h1>
        <div className="forge-divider w-24 mb-4" />
        <p className="font-display italic" style={{ color: 'hsl(15 4% 50%)' }}>
          {meta.desc}
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-10 max-w-md">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'hsl(15 4% 40%)' }}
        />
        <input
          type="text"
          placeholder={`Search ${meta.plural.toLowerCase()}…`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full font-sans text-sm pl-9 pr-4 py-2.5 outline-none transition-colors"
          style={{
            background: 'hsl(20 6% 10%)',
            border: '1px solid hsl(15 8% 18%)',
            borderRadius: '4px',
            color: 'hsl(15 4% 88%)',
            fontSize: '15px',
          }}
          onFocus={e => (e.target.style.borderColor = 'hsl(25 60% 28%)')}
          onBlur={e => (e.target.style.borderColor = 'hsl(15 8% 18%)')}
        />
      </div>

      {/* Grid */}
      {error ? (
        <p className="font-display italic text-center py-20" style={{ color: 'hsl(15 4% 40%)' }}>
          {error}
        </p>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-24"
          style={{ border: '1px dashed hsl(15 8% 18%)', borderRadius: '4px' }}
        >
          <p className="font-display italic text-xl" style={{ color: 'hsl(15 4% 35%)' }}>
            {query ? `No results for "${query}"` : `No ${meta.plural.toLowerCase()} in the Vault yet.`}
          </p>
        </div>
      ) : (
        <>
          <p className="font-sans text-sm mb-6" style={{ color: 'hsl(15 4% 40%)', fontSize: '13px' }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            {query && ` matching "${query}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((entity, i) => (
              <EntityCard key={entity.id} entity={entity} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
