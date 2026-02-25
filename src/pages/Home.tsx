import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { vaultService } from '../vaultService';
import { EntityCard } from '../components/EntityCard';
import { SkeletonCard } from '../components/Skeleton';
import type { VaultEntityStub } from '../types';

const SECTIONS = [
  { label: 'NPCs', href: '/npcs', desc: 'Characters encountered in the Underdark' },
  { label: 'Creatures', href: '/creatures', desc: 'Beasts and beings of the deep' },
  { label: 'Locations', href: '/locations', desc: 'Cities, ruins, and places of power' },
  { label: 'Factions', href: '/factions', desc: 'Powers that shape the Middledark' },
  { label: 'Items', href: '/items', desc: 'Artifacts, weapons, and curiosities' },
  { label: 'Lore', href: '/lore', desc: 'History, legends, and hidden truths' },
];

const TOOLS = [
  { label: 'Timeline', href: '/timeline', desc: 'Chronicle events in order' },
  { label: 'Stats', href: '/stats', desc: 'Vault contents at a glance' },
];

export function Home() {
  const [recent, setRecent] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vaultService.getIndex()
      .then(index => {
        const sorted = [...index.entities].sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        setRecent(sorted.slice(0, 6));
      })
      .catch(() => setError('The Vault is sealed. No entries found.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(130,60,10,0.12) 0%, transparent 70%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <p
            className="font-display text-sm uppercase tracking-[0.4em] mb-6"
            style={{ color: 'hsl(25 80% 40%)' }}
          >
            Campaign Chronicle
          </p>
          <h1
            className="font-serif font-black uppercase mb-6"
            style={{
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              letterSpacing: '0.05em',
              lineHeight: 1,
              color: 'hsl(15 4% 93%)',
            }}
          >
            Pathways<br />Unseen
          </h1>

          <div className="forge-divider w-32 mx-auto mb-8" />

          <p
            className="font-display text-xl italic mb-2"
            style={{ color: 'hsl(15 4% 65%)' }}
          >
            Where Power is Forged, Not Inherited
          </p>
          <p
            className="font-sans text-base max-w-xl mx-auto"
            style={{ color: 'hsl(15 4% 50%)', fontSize: '16px' }}
          >
            A chronicle of the Underdark — its cities, its factions, its secrets.
            What follows is what the party has uncovered.
          </p>
        </motion.div>
      </section>

      {/* Section nav */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        {/* Entity types */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {SECTIONS.map(({ label, href, desc }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Link href={href}>
                <div
                  className="cursor-pointer p-5 text-center transition-all duration-250"
                  style={{
                    background: 'hsl(20 6% 10%)',
                    border: '1px solid hsl(15 8% 16%)',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsl(25 80% 30%)';
                    (e.currentTarget as HTMLElement).style.background = 'hsl(20 8% 12%)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsl(15 8% 16%)';
                    (e.currentTarget as HTMLElement).style.background = 'hsl(20 6% 10%)';
                  }}
                >
                  <p
                    className="font-serif font-bold uppercase tracking-[0.15em] text-sm mb-1"
                    style={{ color: 'hsl(15 4% 88%)' }}
                  >
                    {label}
                  </p>
                  <p
                    className="font-sans text-xs leading-snug"
                    style={{ color: 'hsl(15 4% 45%)', fontSize: '12px' }}
                  >
                    {desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Tools row */}
        <div className="grid grid-cols-2 gap-3 mb-24">
          {TOOLS.map(({ label, href, desc }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 + i * 0.05 }}
            >
              <Link href={href}>
                <div
                  className="cursor-pointer px-5 py-3 text-center transition-all duration-250"
                  style={{
                    background: 'hsl(20 5% 9%)',
                    border: '1px solid hsl(15 8% 14%)',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsl(25 60% 22%)';
                    (e.currentTarget as HTMLElement).style.background = 'hsl(20 6% 11%)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsl(15 8% 14%)';
                    (e.currentTarget as HTMLElement).style.background = 'hsl(20 5% 9%)';
                  }}
                >
                  <p
                    className="font-serif uppercase tracking-[0.15em] text-xs mb-0.5"
                    style={{ color: 'hsl(15 4% 60%)' }}
                  >
                    {label}
                  </p>
                  <p
                    className="font-sans text-xs"
                    style={{ color: 'hsl(15 4% 38%)', fontSize: '11px' }}
                  >
                    {desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent entries */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2
              className="font-serif font-bold uppercase tracking-[0.15em] text-2xl"
              style={{ color: 'hsl(15 4% 88%)' }}
            >
              Recent Entries
            </h2>
            <p className="font-display text-sm italic mt-1" style={{ color: 'hsl(15 4% 45%)' }}>
              Latest discoveries from the Underdark
            </p>
          </div>
          <Link href="/timeline">
            <span
              className="font-serif text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              style={{ color: 'hsl(25 80% 38%)' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'hsl(25 100% 50%)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(25 80% 38%)')}
            >
              Full Timeline <ChevronRight size={14} />
            </span>
          </Link>
        </div>

        {error ? (
          <div
            className="text-center py-20 font-display italic text-lg"
            style={{ color: 'hsl(15 4% 40%)' }}
          >
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : recent.length === 0 ? (
          <div
            className="text-center py-20"
            style={{
              border: '1px dashed hsl(15 8% 20%)',
              borderRadius: '4px',
            }}
          >
            <p className="font-display italic text-lg" style={{ color: 'hsl(15 4% 35%)' }}>
              The Vault awaits its first entries…
            </p>
            <p className="font-sans text-sm mt-2" style={{ color: 'hsl(15 4% 28%)', fontSize: '14px' }}>
              Publish entities from Mythos Architect to populate the chronicle.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent.map((entity, i) => (
              <EntityCard key={entity.id} entity={entity} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
