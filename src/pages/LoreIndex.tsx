import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import type { VaultEntityStub } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Region → accent color
const REGION_COLORS: Record<string, string> = {
  underdark: 'hsl(25 100% 38%)',
  surface:   'hsl(195 45% 40%)',
  tribal:    'hsl(120 28% 32%)',
  wastes:    'hsl(45 55% 38%)',
};

// Region → background gradient (no image fallback)
const REGION_GRADIENTS: Record<string, string> = {
  underdark: 'radial-gradient(ellipse at 30% 70%, hsl(20 50% 7%) 0%, hsl(15 6% 4%) 65%)',
  surface:   'radial-gradient(ellipse at 70% 30%, hsl(195 25% 7%) 0%, hsl(15 6% 4%) 65%)',
  tribal:    'radial-gradient(ellipse at 50% 40%, hsl(120 18% 6%) 0%, hsl(15 6% 4%) 65%)',
  wastes:    'radial-gradient(ellipse at 60% 60%, hsl(45 25% 6%) 0%, hsl(15 6% 4%) 65%)',
  mixed:     'radial-gradient(ellipse at 50% 55%, hsl(270 14% 7%) 0%, hsl(15 6% 4%) 65%)',
};

// ─── Topic Data Model ─────────────────────────────────────────────────────────

interface Topic {
  category: string;
  slug: string;
  entries: VaultEntityStub[];
  count: number;
  perspectives: Array<{ region: string; count: number }>;
  hasAudio: boolean;
  imageUrl?: string;
}

function buildTopics(lore: VaultEntityStub[]): Topic[] {
  const map: Record<string, VaultEntityStub[]> = {};
  for (const e of lore) {
    const key = e.category || 'Uncategorized';
    if (!map[key]) map[key] = [];
    map[key].push(e);
  }

  return Object.entries(map)
    .map(([category, entries]) => {
      const regionCounts: Record<string, number> = {};
      for (const e of entries) {
        const r = e.region || 'unknown';
        regionCounts[r] = (regionCounts[r] || 0) + 1;
      }
      const perspectives = Object.entries(regionCounts)
        .map(([region, count]) => ({ region, count }))
        .sort((a, b) => b.count - a.count);

      return {
        category,
        slug: slugify(category),
        entries,
        count: entries.length,
        perspectives,
        hasAudio: entries.some(e => (e as VaultEntityStub & { audioUrl?: string }).audioUrl),
        imageUrl: entries.find(e => e.imageUrl)?.imageUrl,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ─── Decorative rune glyph ────────────────────────────────────────────────────

function RuneGlyph({ color, size = 48 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ opacity: 0.18 }}>
      <polygon points="24,4 44,36 4,36" stroke={color} strokeWidth="1.5" fill="none" />
      <polygon points="24,14 38,38 10,38" stroke={color} strokeWidth="0.8" fill="none" />
      <line x1="24" y1="4" x2="24" y2="44" stroke={color} strokeWidth="0.6" />
      <line x1="4" y1="36" x2="44" y2="36" stroke={color} strokeWidth="0.6" />
    </svg>
  );
}

// ─── Topic Tile ───────────────────────────────────────────────────────────────

function TopicTile({ topic, index }: { topic: Topic; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [, navigate] = useLocation();

  const primaryRegion = topic.perspectives[0]?.region || 'underdark';
  const accentColor = REGION_COLORS[primaryRegion] || REGION_COLORS.underdark;
  const isMixed = topic.perspectives.length > 1;
  const bgGradient = isMixed
    ? REGION_GRADIENTS.mixed
    : (REGION_GRADIENTS[primaryRegion] || REGION_GRADIENTS.mixed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.09, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        style={{
          position: 'relative',
          height: '360px',
          borderRadius: '6px',
          overflow: 'hidden',
          border: `1px solid ${hovered ? accentColor + '55' : 'hsl(15 8% 13%)'}`,
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
          transform: hovered ? 'translateY(-7px) scale(1.005)' : 'translateY(0) scale(1)',
          boxShadow: hovered
            ? `0 28px 90px rgba(0,0,0,0.65), 0 0 70px ${accentColor}20, inset 0 1px 0 ${accentColor}18`
            : '0 4px 24px rgba(0,0,0,0.45)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(`/lore/topic/${topic.slug}`)}
      >
        {/* Background image */}
        {topic.imageUrl && !imgError && (
          <img
            src={topic.imageUrl}
            onError={() => setImgError(true)}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.9s cubic-bezier(0.25,0.46,0.45,0.94)',
              transform: hovered ? 'scale(1.07)' : 'scale(1)',
            }}
          />
        )}

        {/* Base gradient (or fallback) */}
        <div style={{ position: 'absolute', inset: 0, background: bgGradient }} />

        {/* Dark vignette — stronger at bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(4,2,1,0.98) 0%, rgba(4,2,1,0.72) 40%, rgba(4,2,1,0.2) 75%, rgba(4,2,1,0.05) 100%)',
        }} />

        {/* Side vignettes */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(4,2,1,0.3) 0%, transparent 25%, transparent 75%, rgba(4,2,1,0.3) 100%)',
        }} />

        {/* Decorative rune — top center */}
        <div style={{ position: 'absolute', top: '1.25rem', left: '50%', transform: 'translateX(-50%)' }}>
          <RuneGlyph color={accentColor} size={44} />
        </div>

        {/* Audio badge — top right */}
        {topic.hasAudio && (
          <div style={{
            position: 'absolute', top: '1rem', right: '1rem',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.28rem 0.6rem',
            background: 'rgba(4,2,1,0.82)',
            border: `1px solid ${accentColor}44`,
            borderRadius: '2px',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: '10px', color: accentColor }}>♫</span>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: '8px',
              textTransform: 'uppercase', letterSpacing: '0.18em',
              color: accentColor, opacity: 0.9,
            }}>Audio</span>
          </div>
        )}

        {/* "Open →" — appears on hover, top left */}
        <div style={{
          position: 'absolute', top: '1.1rem', left: '1.2rem',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.22s',
          fontFamily: "'Cinzel', serif", fontSize: '10px',
          textTransform: 'uppercase', letterSpacing: '0.22em',
          color: accentColor,
        }}>
          Open →
        </div>

        {/* Bottom content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 1.4rem 0 1.4rem',
        }}>
          {/* Count */}
          <p style={{
            fontFamily: "'Cinzel', serif", fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '0.22em',
            color: 'hsl(15 4% 38%)', marginBottom: '0.5rem',
          }}>
            {topic.count} {topic.count === 1 ? 'account' : 'accounts'}
          </p>

          {/* Title */}
          <h2 style={{
            fontFamily: "'Cinzel', serif", fontWeight: 900,
            fontSize: 'clamp(1.05rem, 2.2vw, 1.45rem)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            color: 'hsl(15 4% 94%)', lineHeight: 1.1,
            marginBottom: '1.1rem',
            textShadow: '0 2px 16px rgba(0,0,0,0.9)',
          }}>
            {topic.category}
          </h2>

          {/* Perspective bar — expands on hover */}
          <div style={{
            height: hovered ? '22px' : '3px',
            transition: 'height 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
            borderRadius: '2px 2px 0 0',
            overflow: 'hidden',
            display: 'flex',
            marginBottom: '0',
          }}>
            {topic.perspectives.map(({ region, count }) => {
              const color = REGION_COLORS[region] || 'hsl(15 4% 35%)';
              const pct = (count / topic.count) * 100;
              return (
                <div
                  key={region}
                  style={{
                    width: `${pct}%`,
                    background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', transition: 'background 0.3s',
                  }}
                >
                  {hovered && (
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: '8px',
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      color: 'rgba(4,2,1,0.9)', fontWeight: 700,
                      whiteSpace: 'nowrap', padding: '0 6px',
                    }}>
                      {region}: {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover accent top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
          opacity: hovered ? 0.8 : 0,
          transition: 'opacity 0.3s',
        }} />
      </div>
    </motion.div>
  );
}

// ─── Skeleton Tile ────────────────────────────────────────────────────────────

function SkeletonTile() {
  return (
    <div style={{
      height: '360px', borderRadius: '6px',
      background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 13%)',
      animation: 'shimmer 1.8s ease-in-out infinite',
    }} />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LoreIndex() {
  const [lore, setLore] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vaultService.getIndex()
      .then(idx => setLore(idx.entities.filter(e => e.type.toUpperCase() === 'LORE')))
      .catch(() => setError('Could not load lore from the Vault.'))
      .finally(() => setLoading(false));
  }, []);

  const topics = useMemo(() => buildTopics(lore), [lore]);
  const totalAccounts = lore.length;

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mb-16"
        >
          <p style={{
            fontFamily: "'Cinzel', serif", fontSize: '11px',
            textTransform: 'uppercase', letterSpacing: '0.35em',
            color: 'hsl(25 80% 38%)', marginBottom: '0.75rem',
          }}>
            Chronicle
          </p>
          <h1 style={{
            fontFamily: "'Cinzel', serif", fontWeight: 900,
            fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'hsl(15 4% 93%)', lineHeight: 1, marginBottom: '1rem',
          }}>
            Lore
          </h1>
          <div className="forge-divider" style={{ width: '80px', marginBottom: '1rem' }} />
          <p style={{
            fontFamily: "'EB Garamond', serif", fontStyle: 'italic',
            fontSize: '1.1rem', color: 'hsl(15 4% 48%)',
          }}>
            {totalAccounts} account{totalAccounts !== 1 ? 's' : ''} · {topics.length} subject{topics.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: "'EB Garamond', serif", fontStyle: 'italic',
            textAlign: 'center', padding: '6rem 0', color: 'hsl(15 4% 40%)',
          }}>
            {error}
          </p>
        )}

        {/* Tiles grid */}
        {!error && (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonTile key={i} />)
              : topics.map((topic, i) => (
                  <TopicTile key={topic.slug} topic={topic} index={i} />
                ))
            }
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && topics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '8rem 0' }}>
            <p style={{
              fontFamily: "'Cinzel', serif", fontSize: '3rem',
              color: 'hsl(15 8% 18%)', marginBottom: '1.5rem',
            }}>⟁</p>
            <p style={{
              fontFamily: "'EB Garamond', serif", fontStyle: 'italic',
              color: 'hsl(15 4% 35%)',
            }}>
              No lore has been committed to the Vault yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
