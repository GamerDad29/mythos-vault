import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Lock } from 'lucide-react';
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
  PC: { plural: 'Characters', desc: 'The party of adventurers' },
};

function LockedCard({ entity, index }: { entity: VaultEntityStub; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <div
        className="overflow-hidden"
        style={{
          background: 'hsl(15 6% 8%)',
          border: '1px solid hsl(15 8% 14%)',
          borderRadius: '4px',
          opacity: 0.7,
        }}
      >
        {/* Mystery image area */}
        <div
          className="relative flex items-center justify-center"
          style={{ height: '180px', background: 'hsl(15 6% 6%)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(45deg, hsl(15 6% 8%) 0px, hsl(15 6% 8%) 4px, hsl(15 6% 6%) 4px, hsl(15 6% 6%) 8px)',
            }}
          />
          <Lock size={28} strokeWidth={1} style={{ color: 'hsl(15 8% 22%)', position: 'relative' }} />
          {/* Type badge */}
          <div
            className="absolute top-3 left-3 font-serif text-xs uppercase tracking-[0.15em] px-2 py-1"
            style={{
              background: 'rgba(10,8,6,0.85)',
              border: '1px solid hsl(15 8% 18%)',
              color: 'hsl(15 4% 35%)',
              borderRadius: '2px',
            }}
          >
            {entity.type}
          </div>
        </div>
        {/* Content */}
        <div className="p-5">
          <p
            className="font-display text-xs uppercase tracking-[0.15em] mb-2"
            style={{ color: 'hsl(15 4% 30%)' }}
          >
            Not yet revealed
          </p>
          <h3
            className="font-serif font-bold text-lg uppercase tracking-wide mb-2 leading-tight"
            style={{ color: 'hsl(15 4% 40%)', filter: 'blur(4px)', userSelect: 'none' }}
          >
            {entity.name}
          </h3>
          <p
            className="font-sans text-sm"
            style={{ color: 'hsl(15 4% 28%)', fontSize: '14px' }}
          >
            This entry has not yet been uncovered.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Tags that are too generic to be useful for filtering
const SKIP_TAGS = new Set(['ai-generated']);

interface Props {
  type: string;
}

export function EntityList({ type }: Props) {
  const [entities, setEntities] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const meta = TYPE_LABELS[type] || { plural: type + 's', desc: '' };
  const accentColor = 'hsl(25 100% 38%)';

  useEffect(() => {
    setLoading(true);
    setError(null);
    setActiveTag(null);
    vaultService.getIndex()
      .then(index => {
        const filtered = index.entities.filter(e => e.type.toUpperCase() === type.toUpperCase());
        setEntities(filtered);
      })
      .catch(() => setError('Could not load entries from the Vault.'))
      .finally(() => setLoading(false));
  }, [type]);

  // Collect unique meaningful tags — exclude the entity's own type tag and noise
  const allTags = [...new Set(
    entities.flatMap(e => e.tags || []).filter(t => !SKIP_TAGS.has(t) && t !== type.toLowerCase())
  )].sort();

  const filtered = entities.filter(e => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [e.name, e.summary, e.category, ...(e.tags || [])].some(v => v?.toLowerCase().includes(q));
    const matchesTag = !activeTag || (e.tags || []).includes(activeTag);
    return matchesQuery && matchesTag;
  });

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
      <div className="relative mb-4 max-w-md">
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

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map(tag => {
            const active = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(active ? null : tag)}
                className="font-serif text-xs uppercase tracking-wider px-2.5 py-1 transition-all duration-200"
                style={{
                  background: active ? `${accentColor}22` : 'hsl(20 6% 10%)',
                  border: `1px solid ${active ? accentColor + '66' : 'hsl(15 8% 18%)'}`,
                  borderRadius: '2px',
                  color: active ? accentColor : 'hsl(15 4% 45%)',
                  cursor: 'pointer',
                }}
              >
                {tag}
                {active && <X size={10} className="inline ml-1.5 -mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}

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
            {query || activeTag
              ? `No results${query ? ` for "${query}"` : ''}${activeTag ? ` tagged "${activeTag}"` : ''}`
              : `No ${meta.plural.toLowerCase()} in the Vault yet.`}
          </p>
        </div>
      ) : (
        <>
          <p className="font-sans text-sm mb-6" style={{ color: 'hsl(15 4% 40%)', fontSize: '13px' }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            {query && ` matching "${query}"`}
            {activeTag && ` tagged "${activeTag}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((entity, i) =>
              entity.hidden ? (
                <LockedCard key={entity.id} entity={entity} index={i} />
              ) : (
                <EntityCard key={entity.id} entity={entity} index={i} />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
