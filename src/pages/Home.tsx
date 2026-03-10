import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, User, Swords, MapPin, Shield, Package, Scroll, Users, Clock, BarChart2, ScrollText, BookOpen } from 'lucide-react';
import { vaultService } from '../vaultService';
import type { VaultEntityStub } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { WebGLBackground } from '../components/WebGLBackground';

// Nav order per P5-1
const SECTIONS = [
  { label: 'Locations',  href: '/locations',  desc: 'Cities, ruins, and places of power',      Icon: MapPin,    type: 'LOCATION' },
  { label: 'Factions',   href: '/factions',   desc: 'Powers that shape the Middledark',        Icon: Shield,    type: 'FACTION'  },
  { label: 'Lore',       href: '/lore',       desc: 'History, legends, and hidden truths',     Icon: Scroll,    type: 'LORE'     },
  { label: 'Items',      href: '/items',      desc: 'Artifacts, weapons, and curiosities',     Icon: Package,   type: 'ITEM'     },
  { label: 'NPCs',       href: '/npcs',       desc: 'Characters encountered in the Underdark', Icon: User,      type: 'NPC'      },
  { label: 'Creatures',  href: '/creatures',  desc: 'Beasts and beings of the deep',           Icon: Swords,    type: 'CREATURE' },
  { label: 'Characters', href: '/characters', desc: 'Bear Force One',                           Icon: Users,     type: 'PC'       },
];

const TOOLS = [
  { label: 'Timeline', href: '/timeline', desc: 'Chronicle events in order',      Icon: Clock      },
  { label: 'Stats',    href: '/stats',    desc: 'Vault contents at a glance',     Icon: BarChart2  },
  { label: 'Journal',  href: '/journal',  desc: 'Recaps and lore chronicles',     Icon: ScrollText },
];

// Atmospheric gradient per type — used when no image available
const TYPE_GRADIENTS: Record<string, string> = {
  LOCATION: 'radial-gradient(ellipse at 30% 70%, hsl(205 25% 10%) 0%, hsl(15 6% 5%) 100%)',
  FACTION:  'radial-gradient(ellipse at 70% 30%, hsl(0 22% 9%) 0%, hsl(15 6% 5%) 100%)',
  LORE:     'radial-gradient(ellipse at 50% 50%, hsl(265 18% 10%) 0%, hsl(15 6% 5%) 100%)',
  ITEM:     'radial-gradient(ellipse at 40% 65%, hsl(38 28% 8%) 0%, hsl(15 6% 5%) 100%)',
  NPC:      'radial-gradient(ellipse at 60% 40%, hsl(175 18% 8%) 0%, hsl(15 6% 5%) 100%)',
  CREATURE: 'radial-gradient(ellipse at 35% 55%, hsl(130 14% 7%) 0%, hsl(15 6% 5%) 100%)',
  PC:       'radial-gradient(ellipse at 55% 45%, hsl(220 22% 9%) 0%, hsl(15 6% 5%) 100%)',
  SESSION:  'radial-gradient(ellipse at 45% 60%, hsl(25 30% 8%) 0%, hsl(15 6% 5%) 100%)',
};

const SPARKS = [
  { left: '8%',   delay: 0,    dur: 4.2, size: 3, drift: '8px',   opacity: 0.35 },
  { left: '22%',  delay: 1.1,  dur: 5.0, size: 2, drift: '-6px',  opacity: 0.25 },
  { left: '43%',  delay: 0.6,  dur: 3.8, size: 4, drift: '12px',  opacity: 0.45 },
  { left: '60%',  delay: 2.0,  dur: 4.6, size: 2, drift: '-9px',  opacity: 0.22 },
  { left: '77%',  delay: 0.3,  dur: 5.2, size: 3, drift: '7px',   opacity: 0.38 },
  { left: '91%',  delay: 1.7,  dur: 4.0, size: 2, drift: '-5px',  opacity: 0.28 },
  { left: '50%',  delay: 2.8,  dur: 4.5, size: 2, drift: '10px',  opacity: 0.2  },
  { left: '33%',  delay: 3.2,  dur: 5.5, size: 3, drift: '-8px',  opacity: 0.3  },
];

// ─── Section Hero Card ───────────────────────────────────────────────────────

interface SectionCardProps {
  section: typeof SECTIONS[number];
  imageUrl?: string;
  count: number;
  delay?: number;
  featured?: boolean;
}

function SectionCard({ section, imageUrl, count, delay = 0, featured = false }: SectionCardProps) {
  const [hovered, setHovered] = useState(false);
  const height = featured ? 340 : 230;
  const gradient = TYPE_GRADIENTS[section.type] || TYPE_GRADIENTS.NPC;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: 'easeOut' }}
    >
      <Link href={section.href}>
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{
            height,
            borderRadius: '6px',
            border: `1px solid ${hovered ? 'hsl(25 60% 20%)' : 'hsl(15 8% 13%)'}`,
            transition: 'border-color 0.35s, transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.45s',
            transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
            boxShadow: hovered
              ? '0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(180,90,20,0.1)'
              : '0 4px 20px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Background */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={section.label}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: hovered ? 'scale(1.08)' : 'scale(1.0)',
                transition: 'transform 0.75s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.4s',
                opacity: hovered ? 0.5 : 0.28,
              }}
            />
          ) : (
            <div className="absolute inset-0" style={{ background: gradient }} />
          )}

          {/* Deep gradient overlay — bottom-heavy for text legibility */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(5,3,2,0.97) 0%, rgba(5,3,2,0.72) 40%, rgba(5,3,2,0.2) 100%)',
            }}
          />

          {/* Decorative large icon — watermark */}
          <div
            className="absolute top-5 right-5"
            style={{
              color: 'hsl(25 100% 45%)',
              opacity: hovered ? 0.18 : 0.07,
              transition: 'opacity 0.45s',
              pointerEvents: 'none',
            }}
          >
            <section.Icon size={featured ? 72 : 52} strokeWidth={0.6} />
          </div>

          {/* Hover chevron — top right */}
          <div
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              color: 'hsl(25 100% 55%)',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translate(0, 0)' : 'translate(-4px, 4px)',
              transition: 'opacity 0.3s, transform 0.3s',
            }}
          >
            <ChevronRight size={15} />
          </div>

          {/* Content — bottom anchored */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              padding: featured ? '1.75rem' : '1.25rem 1.5rem',
              transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
              transition: 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          >
            {/* Entry count */}
            {count > 0 && (
              <p
                className="font-serif uppercase tracking-[0.22em]"
                style={{
                  fontSize: '10px',
                  color: hovered ? 'hsl(25 100% 55%)' : 'hsl(25 80% 35%)',
                  marginBottom: '0.4rem',
                  transition: 'color 0.3s',
                }}
              >
                {count} {count === 1 ? 'Entry' : 'Entries'}
              </p>
            )}

            {/* Section title */}
            <h2
              className="font-serif font-black uppercase leading-none"
              style={{
                fontSize: featured ? 'clamp(1.7rem, 2.8vw, 2.4rem)' : '1.35rem',
                letterSpacing: '0.06em',
                color: 'hsl(15 4% 95%)',
                textShadow: hovered
                  ? '0 0 40px rgba(201,120,30,0.5), 0 0 80px rgba(201,120,30,0.2)'
                  : 'none',
                transition: 'text-shadow 0.4s',
                marginBottom: '0.4rem',
              }}
            >
              {section.label}
            </h2>

            {/* Description */}
            <p
              className="font-display italic"
              style={{
                fontSize: '13px',
                color: hovered ? 'hsl(15 4% 58%)' : 'hsl(15 4% 38%)',
                transition: 'color 0.35s',
                lineHeight: 1.4,
              }}
            >
              {section.desc}
            </p>
          </div>

          {/* Amber sweep line — bottom edge */}
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
              transition: 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Home ───────────────────────────────────────────────────────────────────

export function Home() {
  const [allEntities, setAllEntities] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDM } = useAuth();
  const [heroOpacity, setHeroOpacity] = useState(1);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    vaultService.getIndex()
      .then(index => setAllEntities(index.entities))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Scroll-based hero fade
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHeroOpacity(Math.max(0, 1 - y / 320));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Latest imageUrl per type (most recent non-hidden entity with image)
  const latestImages = useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const s of SECTIONS) {
      const match = [...allEntities]
        .filter(e => e.type.toUpperCase() === s.type && e.imageUrl && (isDM || !e.hidden))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
      // Locations card also picks up CITY images
      if (!match && s.type === 'LOCATION') {
        const cityMatch = [...allEntities]
          .filter(e => e.type === 'CITY' && e.imageUrl && (isDM || !e.hidden))
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
        result[s.type] = cityMatch?.imageUrl;
      } else {
        result[s.type] = match?.imageUrl;
      }
    }
    return result;
  }, [allEntities, isDM]);

  // Entry counts per type
  const typeCounts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const s of SECTIONS) {
      const count = allEntities.filter(e =>
        e.type.toUpperCase() === s.type && (isDM || !e.hidden)
      ).length;
      // Locations count includes cities
      result[s.type] = s.type === 'LOCATION'
        ? count + allEntities.filter(e => e.type === 'CITY' && (isDM || !e.hidden)).length
        : count;
    }
    return result;
  }, [allEntities, isDM]);

  return (
    <div className="min-h-screen">
      <WebGLBackground />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ padding: '7rem 1.5rem 5rem', minHeight: '80vh' }}
      >
        {/* Deep ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 65%, rgba(140,65,10,0.14) 0%, transparent 70%)',
          }}
        />

        {/* Ember sparks */}
        {SPARKS.map((spark, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: spark.left,
              bottom: '8%',
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              borderRadius: '50%',
              background: 'hsl(25 100% 55%)',
              opacity: spark.opacity,
              animation: `floatUp ${spark.dur}s ${spark.delay}s ease-in infinite`,
              ['--drift' as string]: spark.drift,
            }}
          />
        ))}

        {/* Hero text — fades on scroll */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative"
          style={{ opacity: heroOpacity, transition: 'opacity 0.05s linear' }}
        >
          <p
            className="font-display uppercase tracking-[0.45em] mb-7"
            style={{ color: 'hsl(25 80% 38%)', fontSize: '12px', letterSpacing: '0.45em' }}
          >
            Campaign Chronicle
          </p>

          <h1
            className="font-serif font-black uppercase"
            style={{
              fontSize: 'clamp(3.2rem, 9vw, 8rem)',
              letterSpacing: '0.04em',
              lineHeight: 0.95,
              color: 'hsl(15 4% 94%)',
              marginBottom: '2rem',
              textShadow: '0 0 80px rgba(180,80,10,0.2)',
            }}
          >
            Pathways<br />Unseen
          </h1>

          <div className="forge-divider w-40 mx-auto mb-8" />

          <p
            className="font-display text-xl italic mb-3"
            style={{ color: 'hsl(15 4% 62%)' }}
          >
            Where Power is Forged, Not Inherited
          </p>
          <p
            className="font-sans max-w-lg mx-auto"
            style={{ color: 'hsl(15 4% 46%)', fontSize: '15px', lineHeight: 1.65 }}
          >
            A chronicle of the Underdark — its cities, its factions, its secrets.
            What follows is what the party has uncovered.
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: heroOpacity > 0.3 ? 0.45 : 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
          style={{ color: 'hsl(25 80% 35%)' }}
        >
          <ChevronDown size={20} strokeWidth={1.5} />
        </motion.div>
      </section>

      {/* ── Section Grid ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-6">

        {/* Row 1 — Featured: Locations (large) + Factions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-3">
            <SectionCard
              section={SECTIONS[0]}
              imageUrl={latestImages['LOCATION']}
              count={loading ? 0 : typeCounts['LOCATION'] ?? 0}
              delay={0.05}
              featured
            />
          </div>
          <div className="lg:col-span-2">
            <SectionCard
              section={SECTIONS[1]}
              imageUrl={latestImages['FACTION']}
              count={loading ? 0 : typeCounts['FACTION'] ?? 0}
              delay={0.12}
              featured
            />
          </div>
        </div>

        {/* Row 2 — Medium: Lore, Items, NPCs, Creatures */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {SECTIONS.slice(2, 6).map((section, i) => (
            <SectionCard
              key={section.href}
              section={section}
              imageUrl={latestImages[section.type]}
              count={loading ? 0 : typeCounts[section.type] ?? 0}
              delay={0.18 + i * 0.06}
            />
          ))}
        </div>

        {/* Row 3 — Characters + Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          <div className="lg:col-span-2">
            <SectionCard
              section={SECTIONS[6]}
              imageUrl={latestImages['PC']}
              count={loading ? 0 : typeCounts['PC'] ?? 0}
              delay={0.42}
            />
          </div>
          <SectionCard
            section={{ label: 'Sessions', href: '/sessions', desc: 'Chronicle of the Pathways Unseen', Icon: BookOpen, type: 'SESSION' }}
            imageUrl={undefined}
            count={0}
            delay={0.48}
          />
        </div>
      </section>

      {/* ── Tools Strip ───────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid hsl(15 8% 12%)',
          background: 'hsl(15 6% 6%)',
          padding: '0 0 4rem',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {TOOLS.map(({ label, href, desc, Icon }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.06 }}
              >
                <Link href={href}>
                  <div
                    className="group flex items-center gap-5 px-8 py-7 cursor-pointer"
                    style={{
                      borderRight: i < 2 ? '1px solid hsl(15 8% 12%)' : 'none',
                      transition: 'background 0.25s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(20 6% 8%)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.25}
                      style={{ color: 'hsl(25 80% 35%)', flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-serif uppercase tracking-[0.18em]"
                        style={{ color: 'hsl(15 4% 65%)', fontSize: '12px', marginBottom: '2px' }}
                      >
                        {label}
                      </p>
                      <p
                        className="font-display italic truncate"
                        style={{ color: 'hsl(15 4% 35%)', fontSize: '12px' }}
                      >
                        {desc}
                      </p>
                    </div>
                    <ChevronRight
                      size={13}
                      style={{ color: 'hsl(15 4% 28%)', flexShrink: 0 }}
                      className="group-hover:translate-x-1 transition-transform duration-200"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
