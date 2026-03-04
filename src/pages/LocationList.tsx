import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Search, X, ChevronRight, Lock } from 'lucide-react';
import Fuse from 'fuse.js';
import { vaultService } from '../vaultService';
import { EntityCard } from '../components/EntityCard';
import { SkeletonCard } from '../components/Skeleton';
import type { VaultEntityStub } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toggleEntityHidden } from '../services/githubService';

// ─── Region Hero Panel ────────────────────────────────────────────────────────

interface RegionPanelProps {
  label: string;
  subtitle: string;
  desc: string;
  imageUrl?: string;
  gradient: string;
  cityCount: number;
  locationCount: number;
  delay: number;
  targetRef: React.RefObject<HTMLDivElement>;
}

function RegionHeroPanel({ label, subtitle, desc, imageUrl, gradient, cityCount, locationCount, delay, targetRef }: RegionPanelProps) {
  const [hovered, setHovered] = useState(false);
  const total = cityCount + locationCount;

  function scrollToSection() {
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className="flex-1"
    >
      <div
        className="relative overflow-hidden cursor-pointer"
        style={{
          height: '400px',
          borderRadius: '6px',
          border: `1px solid ${hovered ? 'hsl(25 60% 20%)' : 'hsl(15 8% 13%)'}`,
          transition: 'border-color 0.35s, transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.5s',
          transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 28px 80px rgba(0,0,0,0.6), 0 0 50px rgba(180,90,20,0.1)'
            : '0 6px 30px rgba(0,0,0,0.35)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={scrollToSection}
      >
        {/* Background */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: hovered ? 'scale(1.07)' : 'scale(1.0)',
              transition: 'transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.4s',
              opacity: hovered ? 0.55 : 0.32,
            }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }} />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(4,2,1,0.98) 0%, rgba(4,2,1,0.7) 45%, rgba(4,2,1,0.18) 100%)',
          }}
        />

        {/* Top label */}
        <div
          className="absolute top-6 left-6"
          style={{
            opacity: hovered ? 1 : 0.7,
            transition: 'opacity 0.3s',
          }}
        >
          <span
            className="font-serif uppercase tracking-[0.25em]"
            style={{
              fontSize: '10px',
              color: 'hsl(25 100% 50%)',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid hsl(25 80% 25%)',
              borderRadius: '2px',
              padding: '3px 8px',
            }}
          >
            {subtitle}
          </span>
        </div>

        {/* Bottom content */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            padding: '2rem',
            transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
            transition: 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        >
          {total > 0 && (
            <p
              className="font-serif uppercase tracking-[0.22em]"
              style={{
                fontSize: '10px',
                color: hovered ? 'hsl(25 100% 55%)' : 'hsl(25 80% 35%)',
                marginBottom: '0.5rem',
                transition: 'color 0.3s',
              }}
            >
              {cityCount > 0 && `${cityCount} ${cityCount === 1 ? 'City' : 'Cities'}`}
              {cityCount > 0 && locationCount > 0 && ' · '}
              {locationCount > 0 && `${locationCount} ${locationCount === 1 ? 'Location' : 'Locations'}`}
            </p>
          )}

          <h2
            className="font-serif font-black uppercase leading-none"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              letterSpacing: '0.05em',
              color: 'hsl(15 4% 95%)',
              textShadow: hovered
                ? '0 0 50px rgba(201,120,30,0.55), 0 0 100px rgba(201,120,30,0.2)'
                : 'none',
              transition: 'text-shadow 0.4s',
              marginBottom: '0.6rem',
            }}
          >
            {label}
          </h2>

          <p
            className="font-display italic"
            style={{
              fontSize: '14px',
              color: hovered ? 'hsl(15 4% 55%)' : 'hsl(15 4% 38%)',
              transition: 'color 0.35s',
              lineHeight: 1.5,
              marginBottom: '1rem',
              maxWidth: '380px',
            }}
          >
            {desc}
          </p>

          <div
            className="flex items-center gap-1.5"
            style={{
              color: hovered ? 'hsl(25 100% 55%)' : 'hsl(25 80% 38%)',
              transition: 'color 0.3s',
              fontSize: '12px',
            }}
          >
            <span className="font-serif uppercase tracking-[0.15em]">Explore</span>
            <ChevronRight
              size={13}
              style={{
                transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                transition: 'transform 0.3s',
              }}
            />
          </div>
        </div>

        {/* Amber sweep line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(to right, hsl(25 100% 35%), hsl(25 100% 55%), hsl(25 100% 35%))',
            transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left center',
            transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── City Card ────────────────────────────────────────────────────────────────

function CityCard({ city, index }: { city: VaultEntityStub; index: number }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.45 }}
    >
      <Link href={`/city/${city.slug}`}>
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{
            background: 'hsl(20 6% 9%)',
            border: `1px solid ${hovered ? 'hsl(25 60% 20%)' : 'hsl(15 8% 14%)'}`,
            borderRadius: '6px',
            transition: 'border-color 0.3s, transform 0.4s, box-shadow 0.4s',
            transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
            boxShadow: hovered ? '0 18px 50px rgba(0,0,0,0.5), 0 0 28px rgba(180,80,10,0.1)' : 'none',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Image */}
          <div className="relative overflow-hidden" style={{ height: '190px', background: 'hsl(15 6% 6%)' }}>
            {city.imageUrl && !imgError ? (
              <>
                <img
                  src={city.imageUrl}
                  alt={city.name}
                  className="w-full h-full object-cover"
                  style={{
                    transform: hovered ? 'scale(1.06)' : 'scale(1.0)',
                    transition: 'transform 0.7s ease',
                    opacity: hovered ? 0.85 : 0.7,
                  }}
                  onError={() => setImgError(true)}
                />
                <div
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{ height: '90px', background: 'linear-gradient(to bottom, transparent, hsl(20 6% 9%))' }}
                />
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'radial-gradient(ellipse at 50% 60%, hsl(20 18% 9%), hsl(15 8% 5%))' }}
              >
                <span style={{ fontSize: '4.5rem', opacity: 0.05, color: 'hsl(25 100% 45%)', userSelect: 'none' }}>⟁</span>
              </div>
            )}

            {/* Region badge */}
            <div
              className="absolute top-3 left-3 font-serif uppercase tracking-[0.15em]"
              style={{
                fontSize: '9px',
                color: 'hsl(25 80% 45%)',
                background: 'rgba(8,5,3,0.88)',
                border: '1px solid hsl(25 80% 22%)',
                borderRadius: '2px',
                padding: '2px 7px',
              }}
            >
              City
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {city.category && (
              <p
                className="font-display text-xs uppercase tracking-[0.18em] mb-1.5"
                style={{ color: 'hsl(25 80% 38%)', opacity: 0.85, fontSize: '11px' }}
              >
                {city.category}
              </p>
            )}
            <h3
              className="font-serif font-bold text-lg uppercase tracking-wide leading-tight mb-2"
              style={{ color: 'hsl(15 4% 92%)' }}
            >
              {city.name}
            </h3>
            {city.summary && (
              <p
                className="font-sans text-sm leading-relaxed line-clamp-2 mb-4"
                style={{ color: 'hsl(15 4% 52%)', fontSize: '13px' }}
              >
                {city.summary}
              </p>
            )}
            <div
              className="flex items-center gap-1"
              style={{
                color: hovered ? 'hsl(25 100% 55%)' : 'hsl(25 80% 38%)',
                transition: 'color 0.25s',
              }}
            >
              <span className="font-serif text-xs uppercase tracking-wider">Explore</span>
              <ChevronRight
                size={11}
                style={{ transform: hovered ? 'translateX(2px)' : 'translateX(0)', transition: 'transform 0.25s' }}
              />
            </div>
          </div>

          {/* Amber sweep line */}
          <div
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '2px',
              background: 'linear-gradient(to right, hsl(25 100% 35%), hsl(25 100% 55%), hsl(25 100% 35%))',
              transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'left',
              transition: 'transform 0.4s ease',
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Section Divider ─────────────────────────────────────────────────────────

function SectionHeader({ label, count, delay = 0 }: { label: string; count: number; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-4 mb-7"
    >
      <div style={{ width: '3px', height: '24px', background: 'hsl(25 100% 40%)', borderRadius: '2px', flexShrink: 0 }} />
      <h2
        className="font-serif font-bold uppercase tracking-[0.2em] flex-shrink-0"
        style={{ color: 'hsl(15 4% 80%)', fontSize: '14px' }}
      >
        {label}
      </h2>
      <div className="flex-1" style={{ height: '1px', background: 'hsl(15 8% 14%)' }} />
      <span className="font-sans text-xs flex-shrink-0" style={{ color: 'hsl(15 4% 32%)', fontSize: '12px' }}>
        {count}
      </span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LocationList() {
  const [allEntities, setAllEntities] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { isDM } = useAuth();

  const underdarkRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    vaultService.getIndex()
      .then(index => setAllEntities(index.entities))
      .catch(() => setError('Could not load locations from the Vault.'))
      .finally(() => setLoading(false));
  }, []);

  // Split by region + type
  const underdarkCities    = useMemo(() => allEntities.filter(e => e.type === 'CITY'     && e.region !== 'surface'), [allEntities]);
  const surfaceCities      = useMemo(() => allEntities.filter(e => e.type === 'CITY'     && e.region === 'surface'), [allEntities]);
  const underdarkLocations = useMemo(() => allEntities.filter(e => e.type === 'LOCATION' && e.region !== 'surface' && !e.cityId && (isDM || !e.hidden)), [allEntities, isDM]);
  const surfaceLocations   = useMemo(() => allEntities.filter(e => e.type === 'LOCATION' && e.region === 'surface' && !e.cityId && (isDM || !e.hidden)), [allEntities, isDM]);

  // Hero panel images — pick first city in each region that has an image
  const underdarkHeroImage = useMemo(() =>
    underdarkCities.find(c => c.imageUrl && !c.hidden)?.imageUrl, [underdarkCities]);
  const surfaceHeroImage = useMemo(() =>
    surfaceCities.find(c => c.imageUrl && !c.hidden)?.imageUrl, [surfaceCities]);

  // Search fuse — all visible entities
  const allSearchable = useMemo(() => [
    ...underdarkCities, ...surfaceCities, ...underdarkLocations, ...surfaceLocations,
  ], [underdarkCities, surfaceCities, underdarkLocations, surfaceLocations]);

  const fuse = useMemo(() => new Fuse(allSearchable, {
    keys: [{ name: 'name', weight: 0.6 }, { name: 'summary', weight: 0.3 }, { name: 'category', weight: 0.1 }],
    threshold: 0.35,
  }), [allSearchable]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    return fuse.search(query.trim()).map(r => r.item);
  }, [query, fuse]);

  function handleToggleHidden(entity: VaultEntityStub, hidden: boolean) {
    setAllEntities(prev => prev.map(e => e.id === entity.id ? { ...e, hidden } : e));
    const pat = import.meta.env.VITE_GITHUB_PAT as string;
    toggleEntityHidden(entity, hidden, pat).catch(() => {
      setAllEntities(prev => prev.map(e => e.id === entity.id ? { ...e, hidden: !hidden } : e));
    });
  }

  const visibleSurfaceCount = surfaceCities.length + surfaceLocations.length;
  const surfaceHasHidden = allEntities.some(e => e.region === 'surface' && e.hidden);

  return (
    <div className="min-h-screen">

      {/* ── Region Hero Panels ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="font-display text-sm uppercase tracking-[0.3em] mb-2" style={{ color: 'hsl(25 80% 38%)' }}>
            Chronicle
          </p>
          <h1
            className="font-serif font-black uppercase tracking-wide"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'hsl(15 4% 92%)' }}
          >
            Locations
          </h1>
          <div className="forge-divider w-24 mt-3" />
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <RegionHeroPanel
            label="The Underdark"
            subtitle="The Deep World"
            desc="Where the strong survive and the clever thrive. Power here is measured in stone, steel, and shadow."
            imageUrl={underdarkHeroImage}
            gradient="radial-gradient(ellipse at 30% 70%, hsl(210 28% 10%) 0%, hsl(15 6% 4%) 100%)"
            cityCount={underdarkCities.length}
            locationCount={underdarkLocations.length}
            delay={0.05}
            targetRef={underdarkRef}
          />
          <RegionHeroPanel
            label="The Surface"
            subtitle="The World Above"
            desc="Vast, uncharted, and full of those who would prefer you stayed below. What little is known is hard-won."
            imageUrl={surfaceHeroImage}
            gradient="radial-gradient(ellipse at 60% 40%, hsl(35 18% 10%) 0%, hsl(15 6% 4%) 100%)"
            cityCount={surfaceCities.length}
            locationCount={surfaceLocations.length}
            delay={0.14}
            targetRef={surfaceRef}
          />
        </div>

        {/* Search */}
        <div className="relative mb-10 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(15 4% 40%)' }} />
          <input
            type="text"
            placeholder="Search all locations…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full font-sans text-sm pl-9 pr-4 py-2.5 outline-none"
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
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(15 4% 40%)', cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* ── Search results ── */}
        {searchResults && (
          <div>
            <p className="font-sans text-sm mb-6" style={{ color: 'hsl(15 4% 40%)', fontSize: '13px' }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16" style={{ border: '1px dashed hsl(15 8% 18%)', borderRadius: '4px' }}>
                <p className="font-display italic" style={{ color: 'hsl(15 4% 35%)' }}>No locations matched.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {searchResults.map((e, i) =>
                  e.type === 'CITY' ? (
                    <CityCard key={e.id} city={e} index={i} />
                  ) : (
                    <EntityCard key={e.id} entity={e} index={i} isDM={isDM} onToggleHidden={isDM ? (h) => handleToggleHidden(e, h) : undefined} />
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Main content (hidden when searching) ── */}
        {!searchResults && (
          <>
            {error ? (
              <p className="font-display italic text-center py-20" style={{ color: 'hsl(15 4% 40%)' }}>{error}</p>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <>
                {/* ── Underdark ── */}
                <div ref={underdarkRef} style={{ scrollMarginTop: '80px' }}>
                  <SectionHeader label="The Underdark" count={underdarkCities.length + underdarkLocations.length} delay={0.1} />

                  {underdarkCities.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-5">
                      {underdarkCities.map((city, i) => <CityCard key={city.id} city={city} index={i} />)}
                    </div>
                  )}

                  {underdarkLocations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-5">
                      {underdarkLocations.map((loc, i) => (
                        <EntityCard key={loc.id} entity={loc} index={i} isDM={isDM} onToggleHidden={isDM ? (h) => handleToggleHidden(loc, h) : undefined} />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Surface ── */}
                <div ref={surfaceRef} style={{ scrollMarginTop: '80px', marginTop: '3.5rem' }}>
                  <SectionHeader label="The Surface" count={visibleSurfaceCount} delay={0.15} />

                  {surfaceCities.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-5">
                      {surfaceCities.map((city, i) => <CityCard key={city.id} city={city} index={i} />)}
                    </div>
                  )}

                  {surfaceLocations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-5">
                      {surfaceLocations.map((loc, i) => (
                        <EntityCard key={loc.id} entity={loc} index={i} isDM={isDM} onToggleHidden={isDM ? (h) => handleToggleHidden(loc, h) : undefined} />
                      ))}
                    </div>
                  )}

                  {/* Locked surface hint for players */}
                  {!isDM && surfaceHasHidden && visibleSurfaceCount <= surfaceCities.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                      style={{ border: '1px dashed hsl(15 8% 16%)', borderRadius: '6px' }}
                    >
                      <Lock size={24} strokeWidth={1} style={{ color: 'hsl(15 8% 22%)', marginBottom: '1rem' }} />
                      <p className="font-display text-xs uppercase tracking-[0.25em] mb-2" style={{ color: 'hsl(15 4% 30%)' }}>
                        Not Yet Discovered
                      </p>
                      <p className="font-display italic" style={{ color: 'hsl(15 4% 25%)', fontSize: '14px', maxWidth: '320px' }}>
                        These lands remain shrouded. What lies above the stone is yet to be revealed.
                      </p>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
