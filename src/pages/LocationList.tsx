import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Search, X, ChevronRight } from 'lucide-react';
import Fuse from 'fuse.js';
import { vaultService } from '../vaultService';
import { EntityCard } from '../components/EntityCard';
import { SkeletonCard } from '../components/Skeleton';
import type { VaultEntityStub } from '../types';
import { tokens } from '../tokens';

// ─── City featured card ────────────────────────────────────────────────────────

function CityCard({ city, index }: { city: VaultEntityStub; index: number }) {
  const accent = tokens.color.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Link href={`/city/${city.slug}`}>
        <div
          className="cursor-pointer overflow-hidden"
          style={{
            background: tokens.color.bg.card,
            border: `1px solid ${accent}28`,
            borderRadius: tokens.radius.card,
            transition: tokens.transition.card,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `${accent}55`;
            el.style.transform = 'translateY(-4px)';
            el.style.boxShadow = tokens.shadow.cardHover(accent);
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `${accent}28`;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = 'none';
          }}
        >
          {/* Image / placeholder */}
          {city.imageUrl ? (
            <div className="relative overflow-hidden" style={{ height: '200px' }}>
              <img
                src={city.imageUrl}
                alt={city.name}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{ height: '80px', background: `linear-gradient(to bottom, transparent, ${tokens.color.bg.card})` }}
              />
            </div>
          ) : (
            <div
              className="relative flex items-center justify-center"
              style={{ height: '200px', background: `radial-gradient(ellipse at 50% 60%, hsl(20 20% 10%), hsl(15 8% 6%))` }}
            >
              <span style={{ fontSize: '5rem', opacity: 0.06, color: accent, userSelect: 'none' }}>⟁</span>
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{ height: '80px', background: `linear-gradient(to bottom, transparent, ${tokens.color.bg.card})` }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-5">
            <p
              className="font-display text-xs uppercase tracking-[0.2em] mb-2"
              style={{ color: accent, opacity: 0.85 }}
            >
              City · {city.category}
            </p>
            <h3
              className="font-serif font-bold text-xl uppercase tracking-wide mb-2 leading-tight"
              style={{ color: tokens.color.text.primary }}
            >
              {city.name}
            </h3>
            {city.summary && (
              <p
                className="font-sans text-sm leading-relaxed line-clamp-2 mb-4"
                style={{ color: 'hsl(15 4% 58%)', fontSize: '14px' }}
              >
                {city.summary}
              </p>
            )}
            <div className="flex items-center gap-1" style={{ color: 'hsl(25 80% 38%)' }}>
              <span className="font-serif text-xs uppercase tracking-wider">Explore</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function LocationList() {
  const [cities, setCities] = useState<VaultEntityStub[]>([]);
  const [locations, setLocations] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    vaultService.getIndex()
      .then(index => {
        setCities(index.entities.filter(e => e.type === 'CITY'));
        setLocations(index.entities.filter(e => e.type === 'LOCATION' && !e.cityId));
      })
      .catch(() => setError('Could not load locations from the Vault.'))
      .finally(() => setLoading(false));
  }, []);

  const all = useMemo(() => [...cities, ...locations], [cities, locations]);

  const fuse = useMemo(() => new Fuse(all, {
    keys: [
      { name: 'name',     weight: 0.5 },
      { name: 'summary',  weight: 0.3 },
      { name: 'category', weight: 0.2 },
    ],
    threshold: 0.35,
  }), [all]);

  const filteredCities = useMemo(() => {
    if (!query.trim()) return cities;
    return fuse.search(query.trim()).map(r => r.item).filter(e => e.type === 'CITY');
  }, [query, fuse, cities]);

  const filteredLocations = useMemo(() => {
    if (!query.trim()) return locations;
    return fuse.search(query.trim()).map(r => r.item).filter(e => e.type === 'LOCATION');
  }, [query, fuse, locations]);

  const isEmpty = filteredCities.length === 0 && filteredLocations.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Page header */}
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
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: tokens.color.text.primary }}
        >
          Locations
        </h1>
        <div className="forge-divider w-24 mb-4" />
        <p className="font-display italic" style={{ color: 'hsl(15 4% 50%)' }}>
          Cities, ruins, and places of power
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
          placeholder="Search locations…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full font-sans text-sm pl-9 pr-4 py-2.5 outline-none transition-colors"
          style={{
            background: tokens.color.bg.surface,
            border: '1px solid hsl(15 8% 18%)',
            borderRadius: tokens.radius.button,
            color: tokens.color.text.primary,
            fontSize: '15px',
          }}
          onFocus={e => (e.target.style.borderColor = 'hsl(25 60% 28%)')}
          onBlur={e => (e.target.style.borderColor = 'hsl(15 8% 18%)')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'hsl(15 4% 40%)', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Content */}
      {error ? (
        <p className="font-display italic text-center py-20" style={{ color: 'hsl(15 4% 40%)' }}>
          {error}
        </p>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isEmpty ? (
        <div
          className="text-center py-24"
          style={{ border: '1px dashed hsl(15 8% 18%)', borderRadius: tokens.radius.card }}
        >
          <p className="font-display italic text-xl" style={{ color: 'hsl(15 4% 35%)' }}>
            {query ? `No results for "${query}"` : 'No locations in the Vault yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Cities */}
          {filteredCities.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center gap-4 mb-6">
                <p
                  className="font-serif text-xs uppercase tracking-[0.25em] flex-shrink-0"
                  style={{ color: 'hsl(25 80% 40%)' }}
                >
                  Cities
                </p>
                <div className="flex-1" style={{ height: '1px', background: 'hsl(15 8% 16%)' }} />
                <p className="font-sans text-xs flex-shrink-0" style={{ color: 'hsl(15 4% 35%)', fontSize: '12px' }}>
                  {filteredCities.length}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCities.map((city, i) => (
                  <CityCard key={city.id} city={city} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Standalone locations */}
          {filteredLocations.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <p
                  className="font-serif text-xs uppercase tracking-[0.25em] flex-shrink-0"
                  style={{ color: 'hsl(25 80% 40%)' }}
                >
                  Other Locations
                </p>
                <div className="flex-1" style={{ height: '1px', background: 'hsl(15 8% 16%)' }} />
                <p className="font-sans text-xs flex-shrink-0" style={{ color: 'hsl(15 4% 35%)', fontSize: '12px' }}>
                  {filteredLocations.length}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredLocations.map((loc, i) => (
                  <EntityCard key={loc.id} entity={loc} index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
