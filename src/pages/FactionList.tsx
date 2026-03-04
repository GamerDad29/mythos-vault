import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Lock, Shield } from 'lucide-react';
import Fuse from 'fuse.js';
import { vaultService } from '../vaultService';
import { EntityCard } from '../components/EntityCard';
import { SkeletonCard } from '../components/Skeleton';
import type { VaultEntityStub } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toggleEntityHidden } from '../services/githubService';

// ─── Region Anchor Panel ──────────────────────────────────────────────────────

interface RegionAnchorProps {
  label: string;
  subtitle: string;
  count: number;
  accentColor: string;
  gradient: string;
  delay: number;
  targetRef: React.RefObject<HTMLDivElement>;
  locked?: boolean;
}

function RegionAnchor({ label, subtitle, count, accentColor, gradient, delay, targetRef, locked }: RegionAnchorProps) {
  const [hovered, setHovered] = useState(false);

  function scrollTo() {
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="flex-1"
    >
      <div
        className="relative overflow-hidden cursor-pointer"
        style={{
          height: '180px',
          borderRadius: '6px',
          border: `1px solid ${hovered ? accentColor + '44' : 'hsl(15 8% 13%)'}`,
          transition: 'border-color 0.3s, transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered
            ? `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accentColor}18`
            : '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={scrollTo}
      >
        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: gradient }} />

        {/* Bottom fade */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(4,2,1,0.96) 0%, rgba(4,2,1,0.5) 55%, rgba(4,2,1,0.1) 100%)',
          }}
        />

        {/* Amber sweep line on hover */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: '2px',
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex items-end justify-between">
            <div>
              <p
                className="font-display text-xs uppercase tracking-[0.25em] mb-1"
                style={{ color: accentColor, opacity: 0.85 }}
              >
                {subtitle}
              </p>
              <h3
                className="font-serif font-black uppercase tracking-wide leading-none"
                style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', color: 'hsl(15 4% 92%)' }}
              >
                {label}
              </h3>
            </div>
            <div className="text-right">
              {locked ? (
                <Lock size={20} strokeWidth={1} style={{ color: 'hsl(15 4% 30%)' }} />
              ) : (
                <span
                  className="font-serif font-bold"
                  style={{ fontSize: '1.8rem', color: accentColor, lineHeight: 1 }}
                >
                  {count}
                </span>
              )}
              <p className="font-display text-[10px] uppercase tracking-[0.15em]" style={{ color: 'hsl(15 4% 35%)' }}>
                {locked ? 'concealed' : count === 1 ? 'faction' : 'factions'}
              </p>
            </div>
          </div>
        </div>

        {/* Explore caret */}
        <div
          className="absolute top-4 right-4"
          style={{
            color: accentColor,
            opacity: hovered ? 0.9 : 0,
            transition: 'opacity 0.25s',
          }}
        >
          <span className="font-display text-xs uppercase tracking-widest">Explore →</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count, accentColor }: { label: string; count: number; accentColor: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div style={{ width: '3px', height: '20px', background: accentColor, borderRadius: '2px', flexShrink: 0 }} />
      <p className="font-serif text-xs uppercase tracking-[0.28em] flex-shrink-0" style={{ color: accentColor }}>
        {label}
      </p>
      <div className="flex-1" style={{ height: '1px', background: 'hsl(15 8% 14%)' }} />
      <p className="font-sans text-xs flex-shrink-0" style={{ color: 'hsl(15 4% 32%)', fontSize: '12px' }}>
        {count}
      </p>
    </div>
  );
}

// ─── Sub-section Header ───────────────────────────────────────────────────────

function SubHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="font-display text-[11px] uppercase tracking-[0.2em] flex-shrink-0" style={{ color: 'hsl(15 4% 42%)' }}>
        {label}
      </p>
      <div className="flex-1" style={{ height: '1px', background: 'hsl(15 8% 12%)' }} />
      <span className="font-sans text-[11px] flex-shrink-0" style={{ color: 'hsl(15 4% 28%)' }}>{count}</span>
    </div>
  );
}

// ─── Surface Locked Placeholder ───────────────────────────────────────────────

function SurfaceLockedPlaceholder() {
  return (
    <div
      className="flex flex-col items-center justify-center py-14 px-8 text-center"
      style={{
        background: 'hsl(15 6% 7%)',
        border: '1px dashed hsl(15 8% 14%)',
        borderRadius: '6px',
      }}
    >
      <Lock size={28} strokeWidth={1} style={{ color: 'hsl(15 4% 25%)', marginBottom: '16px' }} />
      <p
        className="font-display text-xs uppercase tracking-[0.25em] mb-2"
        style={{ color: 'hsl(15 4% 30%)' }}
      >
        Not yet revealed
      </p>
      <p className="font-serif italic text-sm" style={{ color: 'hsl(15 4% 22%)' }}>
        The surface factions remain beyond the party's knowledge.
      </p>
    </div>
  );
}

// ─── Locked Entity Card ───────────────────────────────────────────────────────

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
          <div
            className="absolute top-3 left-3 font-serif text-xs uppercase tracking-[0.15em] px-2 py-1"
            style={{
              background: 'rgba(10,8,6,0.85)',
              border: '1px solid hsl(15 8% 18%)',
              color: 'hsl(15 4% 35%)',
              borderRadius: '2px',
            }}
          >
            Faction
          </div>
        </div>
        <div className="p-5">
          <p className="font-display text-xs uppercase tracking-[0.15em] mb-2" style={{ color: 'hsl(15 4% 30%)' }}>
            Not yet revealed
          </p>
          <h3
            className="font-serif font-bold text-lg uppercase tracking-wide mb-2 leading-tight"
            style={{ color: 'hsl(15 4% 40%)', filter: 'blur(4px)', userSelect: 'none' }}
          >
            {entity.name}
          </h3>
          <p className="font-sans text-sm" style={{ color: 'hsl(15 4% 28%)', fontSize: '14px' }}>
            This faction has not yet been uncovered.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Entity grid helper ───────────────────────────────────────────────────────

function FactionGrid({
  entities,
  isDM,
  onToggleHidden,
  startIndex = 0,
}: {
  entities: VaultEntityStub[];
  isDM: boolean;
  onToggleHidden: (entity: VaultEntityStub, hidden: boolean) => void;
  startIndex?: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {entities.map((entity, i) =>
        entity.hidden && !isDM ? (
          <LockedCard key={entity.id} entity={entity} index={startIndex + i} />
        ) : (
          <EntityCard
            key={entity.id}
            entity={entity}
            index={startIndex + i}
            isDM={isDM}
            onToggleHidden={isDM ? (hidden) => onToggleHidden(entity, hidden) : undefined}
          />
        )
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SKIP_TAGS = new Set(['ai-generated', 'faction']);

export function FactionList() {
  const [factions, setFactions] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const { isDM } = useAuth();

  const underdarkRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const neutralRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    vaultService.getIndex()
      .then(index => setFactions(index.entities.filter(e => e.type.toUpperCase() === 'FACTION')))
      .catch(() => setError('Could not load factions from the Vault.'))
      .finally(() => setLoading(false));
  }, []);

  const fuse = useMemo(() => new Fuse(factions, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'summary', weight: 0.3 },
      { name: 'category', weight: 0.15 },
      { name: 'tags', weight: 0.05 },
    ],
    threshold: 0.35,
  }), [factions]);

  const allTags = useMemo(() => [...new Set(
    factions.flatMap(e => e.tags || []).filter(t => !SKIP_TAGS.has(t))
  )].sort(), [factions]);

  // When search/tags active → flat filtered results
  const filtered = useMemo(() => {
    if (!query.trim() && activeTags.size === 0) return null;
    let results = query.trim() ? fuse.search(query.trim()).map(r => r.item) : factions;
    if (activeTags.size > 0) {
      results = results.filter(e => [...activeTags].every(tag => (e.tags || []).includes(tag)));
    }
    return results;
  }, [factions, query, activeTags, fuse]);

  // Region splits (no filter active)
  const underdarkFactions = useMemo(
    () => factions.filter(f => f.region === 'underdark'),
    [factions]
  );
  const surfaceFactions = useMemo(
    () => factions.filter(f => f.region === 'surface'),
    [factions]
  );
  const neutralFactions = useMemo(
    () => factions.filter(f => !f.region || f.region === 'neutral'),
    [factions]
  );

  // Underdark sub-groups: by cityId
  const underdarkCityGroups = useMemo(() => {
    const map: Record<string, VaultEntityStub[]> = {};
    const independent: VaultEntityStub[] = [];
    for (const f of underdarkFactions) {
      if (f.cityId) {
        if (!map[f.cityId]) map[f.cityId] = [];
        map[f.cityId].push(f);
      } else {
        independent.push(f);
      }
    }
    return { cityGroups: Object.entries(map), independent };
  }, [underdarkFactions]);

  // Surface visibility
  const visibleSurfaceFactions = useMemo(
    () => surfaceFactions.filter(f => !f.hidden || isDM),
    [surfaceFactions, isDM]
  );
  const surfaceAllHidden = surfaceFactions.length === 0 || (!isDM && surfaceFactions.every(f => f.hidden));

  // Counts for anchor panels
  const underdarkVisible = isDM ? underdarkFactions.length : underdarkFactions.filter(f => !f.hidden).length;
  const surfaceVisible = isDM ? surfaceFactions.length : visibleSurfaceFactions.length;
  const neutralVisible = isDM ? neutralFactions.length : neutralFactions.filter(f => !f.hidden).length;

  const handleToggleHidden = useCallback((entity: VaultEntityStub, hidden: boolean) => {
    setFactions(prev => prev.map(e => e.id === entity.id ? { ...e, hidden } : e));
    const pat = import.meta.env.VITE_GITHUB_PAT as string;
    toggleEntityHidden(entity, hidden, pat).catch(() => {
      setFactions(prev => prev.map(e => e.id === entity.id ? { ...e, hidden: !hidden } : e));
    });
  }, []);

  function toggleTag(tag: string) {
    setActiveTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  function toTitle(cityId: string) {
    return cityId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
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
          Factions
        </h1>
        <div className="forge-divider w-24 mb-4" />
        <p className="font-display italic" style={{ color: 'hsl(15 4% 50%)' }}>
          Powers that shape the world above and below
        </p>
      </motion.div>

      {/* Region anchor panels */}
      {!loading && !error && (
        <div className="flex flex-col sm:flex-row gap-4 mb-14">
          <RegionAnchor
            label="Underdark"
            subtitle="Depth & Shadow"
            count={underdarkVisible}
            accentColor="hsl(25 100% 38%)"
            gradient="radial-gradient(ellipse at 30% 60%, hsl(20 60% 8%) 0%, hsl(15 6% 5%) 70%)"
            delay={0.05}
            targetRef={underdarkRef}
          />
          <RegionAnchor
            label="Surface"
            subtitle="Above the Dark"
            count={surfaceVisible}
            accentColor="hsl(180 40% 30%)"
            gradient="radial-gradient(ellipse at 70% 40%, hsl(190 30% 8%) 0%, hsl(15 6% 5%) 70%)"
            delay={0.12}
            targetRef={surfaceRef}
            locked={surfaceAllHidden}
          />
          <RegionAnchor
            label="Neutral"
            subtitle="Bound to No Throne"
            count={neutralVisible}
            accentColor="hsl(40 30% 42%)"
            gradient="radial-gradient(ellipse at 50% 70%, hsl(35 15% 8%) 0%, hsl(15 6% 5%) 70%)"
            delay={0.19}
            targetRef={neutralRef}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4 max-w-2xl">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(15 4% 40%)' }} />
        <input
          type="text"
          placeholder="Search factions…"
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
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(15 4% 40%)' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10 items-center">
          {allTags.map(tag => {
            const active = activeTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="font-serif text-xs uppercase tracking-wider px-2.5 py-1 transition-all duration-200"
                style={{
                  background: active ? 'hsl(25 100% 38%)22' : 'hsl(20 6% 10%)',
                  border: `1px solid ${active ? 'hsl(25 100% 38%)66' : 'hsl(15 8% 18%)'}`,
                  borderRadius: '2px',
                  color: active ? 'hsl(25 100% 38%)' : 'hsl(15 4% 45%)',
                  cursor: 'pointer',
                }}
              >
                {tag}
                {active && <X size={10} className="inline ml-1.5 -mt-0.5" />}
              </button>
            );
          })}
          {activeTags.size > 1 && (
            <button
              onClick={() => setActiveTags(new Set())}
              className="font-serif text-xs uppercase tracking-wider px-2.5 py-1"
              style={{ background: 'transparent', border: '1px solid hsl(15 8% 18%)', borderRadius: '2px', color: 'hsl(15 4% 35%)', cursor: 'pointer' }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {error ? (
        <p className="font-display italic text-center py-20" style={{ color: 'hsl(15 4% 40%)' }}>{error}</p>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered ? (
        /* ── Flat search/filter results ── */
        <>
          <p className="font-sans text-sm mb-6" style={{ color: 'hsl(15 4% 40%)', fontSize: '13px' }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            {query && ` matching "${query}"`}
            {activeTags.size > 0 && ` tagged "${[...activeTags].join(' + ')}"`}
          </p>
          {filtered.length === 0 ? (
            <div className="text-center py-24" style={{ border: '1px dashed hsl(15 8% 18%)', borderRadius: '4px' }}>
              <p className="font-display italic text-xl" style={{ color: 'hsl(15 4% 35%)' }}>No factions found.</p>
            </div>
          ) : (
            <FactionGrid entities={filtered} isDM={isDM} onToggleHidden={handleToggleHidden} />
          )}
        </>
      ) : (
        /* ── Region sections ── */
        <div className="space-y-20">

          {/* Underdark */}
          <div ref={underdarkRef} style={{ scrollMarginTop: '90px' }}>
            <SectionHeader label="Underdark" count={underdarkFactions.length} accentColor="hsl(25 100% 38%)" />
            <div className="space-y-10">
              {underdarkCityGroups.cityGroups.map(([cityId, items]) => (
                <div key={cityId}>
                  <SubHeader label={toTitle(cityId)} count={items.length} />
                  <FactionGrid entities={items} isDM={isDM} onToggleHidden={handleToggleHidden} />
                </div>
              ))}
              {underdarkCityGroups.independent.length > 0 && (
                <div>
                  <SubHeader label="Independent" count={underdarkCityGroups.independent.length} />
                  <FactionGrid
                    entities={underdarkCityGroups.independent}
                    isDM={isDM}
                    onToggleHidden={handleToggleHidden}
                    startIndex={underdarkCityGroups.cityGroups.reduce((acc, [, items]) => acc + items.length, 0)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Surface */}
          <div ref={surfaceRef} style={{ scrollMarginTop: '90px' }}>
            <SectionHeader label="Surface" count={surfaceFactions.length} accentColor="hsl(180 40% 30%)" />
            {surfaceAllHidden && !isDM ? (
              <SurfaceLockedPlaceholder />
            ) : (
              <FactionGrid entities={isDM ? surfaceFactions : visibleSurfaceFactions} isDM={isDM} onToggleHidden={handleToggleHidden} />
            )}
          </div>

          {/* Neutral */}
          <div ref={neutralRef} style={{ scrollMarginTop: '90px' }}>
            <SectionHeader label="Neutral" count={neutralFactions.length} accentColor="hsl(40 30% 42%)" />
            <FactionGrid entities={neutralFactions} isDM={isDM} onToggleHidden={handleToggleHidden} />
          </div>

        </div>
      )}
    </div>
  );
}
