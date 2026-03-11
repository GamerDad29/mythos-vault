import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import { useAuth } from '../contexts/AuthContext';
import type { VaultEntityStub } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const REGION_COLORS: Record<string, string> = {
  underdark: 'hsl(25 100% 38%)',
  surface:   'hsl(195 45% 40%)',
  tribal:    'hsl(120 28% 32%)',
  wastes:    'hsl(45 55% 38%)',
};

const REGION_LABELS: Record<string, string> = {
  underdark: 'Underdark',
  surface:   'Surface',
  tribal:    'The Tribes',
  wastes:    'The Wastes',
};

const REGION_SUBTITLES: Record<string, string> = {
  underdark: 'From the deep · Scratched in stone',
  surface:   'From the sunlit world · Spoken above ground',
  tribal:    'From the clans · Carried in blood and fire',
  wastes:    'From the wastes · Burned into memory',
};

const REGION_BG: Record<string, string> = {
  underdark: 'hsl(20 12% 6%)',
  surface:   'hsl(200 10% 6%)',
  tribal:    'hsl(120 8% 6%)',
  wastes:    'hsl(45 10% 6%)',
};

// ─── Perspective Column Header ─────────────────────────────────────────────────

function ColumnHeader({ region, count }: { region: string; count: number }) {
  const color = REGION_COLORS[region] || 'hsl(15 4% 40%)';
  const label = REGION_LABELS[region] || region.charAt(0).toUpperCase() + region.slice(1);
  const subtitle = REGION_SUBTITLES[region] || '';

  return (
    <div className="mb-8" style={{ paddingBottom: '1.25rem', borderBottom: `1px solid ${color}22` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ width: '3px', height: '1.4rem', background: color, borderRadius: '2px', flexShrink: 0 }} />
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontWeight: 900,
          fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.22em',
          color: color, margin: 0,
        }}>
          {label}
        </h2>
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: '11px',
          color: 'hsl(15 4% 32%)', letterSpacing: '0.1em',
        }}>
          {count} {count === 1 ? 'account' : 'accounts'}
        </span>
      </div>
      <p style={{
        fontFamily: "'EB Garamond', serif", fontStyle: 'italic',
        fontSize: '0.85rem', color: 'hsl(15 4% 35%)',
        paddingLeft: '1.05rem',
      }}>
        {subtitle}
      </p>
    </div>
  );
}

// ─── Story Card ────────────────────────────────────────────────────────────────

type LoreStub = VaultEntityStub & { audioUrl?: string; provenance?: string };

function StoryCard({ entity, accentColor, index }: { entity: LoreStub; accentColor: string; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/lore/${entity.slug}`}>
        <div
          style={{
            background: 'hsl(20 6% 9%)',
            border: `1px solid ${hovered ? accentColor + '44' : 'hsl(15 8% 13%)'}`,
            borderRadius: '6px',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
            transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
            boxShadow: hovered
              ? `0 18px 55px rgba(0,0,0,0.55), 0 0 35px ${accentColor}18`
              : '0 3px 16px rgba(0,0,0,0.35)',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Image strip */}
          {entity.imageUrl && !imgError && (
            <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
              <img
                src={entity.imageUrl}
                onError={() => setImgError(true)}
                alt=""
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.8s ease',
                  transform: hovered ? 'scale(1.06)' : 'scale(1)',
                  objectPosition: entity.imagePosition || 'center 30%',
                }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(4,2,1,0.1) 0%, rgba(4,2,1,0.7) 100%)',
              }} />
            </div>
          )}

          {/* No image — ambient strip */}
          {(!entity.imageUrl || imgError) && (
            <div style={{
              height: '6px',
              background: `linear-gradient(to right, transparent, ${accentColor}55, transparent)`,
            }} />
          )}

          {/* Content */}
          <div style={{ padding: '1.2rem 1.35rem 1.3rem' }}>
            {/* Provenance */}
            {entity.provenance && (
              <p style={{
                fontFamily: "'EB Garamond', serif", fontStyle: 'italic',
                fontSize: '0.78rem', color: 'hsl(15 4% 38%)',
                marginBottom: '0.6rem', letterSpacing: '0.02em',
                lineHeight: 1.4,
              }}>
                {entity.provenance}
              </p>
            )}

            {/* Title */}
            <h3 style={{
              fontFamily: "'Cinzel', serif", fontWeight: 700,
              fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.06em',
              color: hovered ? 'hsl(15 4% 96%)' : 'hsl(15 4% 86%)',
              lineHeight: 1.15, marginBottom: '0.75rem',
              transition: 'color 0.2s',
            }}>
              {entity.name}
            </h3>

            {/* Divider */}
            <div style={{
              height: '1px', marginBottom: '0.85rem',
              background: `linear-gradient(to right, ${accentColor}40, transparent)`,
            }} />

            {/* Summary */}
            {entity.summary && (
              <p style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: '0.95rem', color: 'hsl(15 4% 55%)',
                lineHeight: 1.65, marginBottom: '1.1rem',
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {entity.summary}
              </p>
            )}

            {/* Footer row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {entity.audioUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '11px', color: accentColor, opacity: 0.85 }}>♫</span>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: '9px',
                    textTransform: 'uppercase', letterSpacing: '0.18em',
                    color: accentColor, opacity: 0.7,
                  }}>Audio</span>
                </div>
              ) : <span />}

              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.18em',
                color: hovered ? accentColor : 'hsl(15 4% 35%)',
                transition: 'color 0.2s',
              }}>
                Read →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Conflict Divider ──────────────────────────────────────────────────────────

function ConflictDivider({ colorA, colorB }: { colorA: string; colorB: string }) {
  return (
    <div
      className="hidden lg:flex"
      style={{
        width: '1px', alignSelf: 'stretch', flexShrink: 0,
        background: `linear-gradient(to bottom, ${colorA}55 0%, hsl(15 8% 12%) 30%, hsl(15 8% 12%) 70%, ${colorB}55 100%)`,
        margin: '0 2rem',
        position: 'relative',
      }}
    >
      {/* Center ornament */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '7px', height: '7px',
        background: 'hsl(15 8% 12%)',
        border: '1px solid hsl(15 8% 22%)',
        borderRadius: '50%',
      }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LoreTopicView() {
  const params = useParams<{ topicSlug: string }>();
  const topicSlug = params.topicSlug;

  const [lore, setLore] = useState<LoreStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDM } = useAuth();

  useEffect(() => {
    vaultService.getIndex()
      .then(idx => {
        const all = idx.entities.filter(e => e.type.toUpperCase() === 'LORE') as LoreStub[];
        const filtered = all.filter(e => slugify(e.category || '') === topicSlug);
        setLore(filtered);
      })
      .catch(() => setError('Could not load lore.'))
      .finally(() => setLoading(false));
  }, [topicSlug]);

  const topicName = useMemo(() => {
    if (lore.length === 0) return topicSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return lore[0].category || '';
  }, [lore, topicSlug]);

  // Group by region
  const byRegion = useMemo(() => {
    const map: Record<string, LoreStub[]> = {};
    for (const e of lore) {
      if (e.hidden && !isDM) continue;
      const r = e.region || 'unknown';
      if (!map[r]) map[r] = [];
      map[r].push(e);
    }
    // Sort regions: underdark first, surface second, then alphabetical
    const order = ['underdark', 'surface', 'tribal', 'wastes'];
    return Object.entries(map).sort(([a], [b]) => {
      const ai = order.indexOf(a); const bi = order.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1; if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [lore, isDM]);

  const regions = byRegion.map(([r]) => r);
  const totalVisible = byRegion.reduce((acc, [, items]) => acc + items.length, 0);
  const hasMultiple = byRegion.length > 1;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div style={{ height: '16px', width: '180px', background: 'hsl(20 6% 14%)', borderRadius: '4px', marginBottom: '2rem' }} />
        <div style={{ height: '48px', width: '360px', background: 'hsl(20 6% 12%)', borderRadius: '4px', marginBottom: '3rem' }} />
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '280px', borderRadius: '6px', background: 'hsl(20 6% 10%)', animation: 'shimmer 1.8s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || totalVisible === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '3rem', color: 'hsl(15 8% 18%)', marginBottom: '1.5rem' }}>⟁</p>
          <p style={{ fontFamily: "'EB Garamond', serif", fontStyle: 'italic', color: 'hsl(15 4% 35%)' }}>
            {error || 'No lore found for this topic.'}
          </p>
          <Link href="/lore">
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(25 100% 38%)', cursor: 'pointer', marginTop: '1.5rem', display: 'inline-block' }}>
              ← Back to Lore
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2.5rem' }}
        >
          <Link href="/lore">
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '0.2em',
              color: 'hsl(15 4% 38%)', cursor: 'pointer', transition: 'color 0.2s',
            }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'hsl(25 100% 38%)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 38%)')}
            >
              Chronicle
            </span>
          </Link>
          <span style={{ color: 'hsl(15 8% 22%)', fontSize: '12px' }}>›</span>
          <Link href="/lore">
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '0.2em',
              color: 'hsl(15 4% 38%)', cursor: 'pointer', transition: 'color 0.2s',
            }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'hsl(25 100% 38%)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 38%)')}
            >
              Lore
            </span>
          </Link>
          <span style={{ color: 'hsl(15 8% 22%)', fontSize: '12px' }}>›</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(15 4% 62%)' }}>
            {topicName}
          </span>
        </motion.nav>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ marginBottom: '3.5rem' }}
        >
          <h1 style={{
            fontFamily: "'Cinzel', serif", fontWeight: 900,
            fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'hsl(15 4% 93%)', lineHeight: 1.05, marginBottom: '0.9rem',
          }}>
            {topicName}
          </h1>
          <div className="forge-divider" style={{ width: '60px', marginBottom: '0.9rem' }} />
          <p style={{
            fontFamily: "'EB Garamond', serif", fontStyle: 'italic',
            fontSize: '1.05rem', color: 'hsl(15 4% 42%)',
          }}>
            {hasMultiple
              ? `${totalVisible} account${totalVisible !== 1 ? 's' : ''} · ${byRegion.length} perspectives`
              : `${totalVisible} account${totalVisible !== 1 ? 's' : ''}`
            }
          </p>

          {/* Perspective split bar */}
          {hasMultiple && (
            <div style={{
              display: 'flex', height: '2px', width: '240px',
              borderRadius: '2px', overflow: 'hidden', marginTop: '1.2rem',
            }}>
              {byRegion.map(([region, items]) => {
                const color = REGION_COLORS[region] || 'hsl(15 4% 35%)';
                const pct = (items.length / totalVisible) * 100;
                return (
                  <div key={region} style={{ width: `${pct}%`, background: color }} />
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Columns layout */}
        {hasMultiple ? (
          /* Multi-perspective: side-by-side on large screens */
          <div className="flex flex-col lg:flex-row" style={{ gap: '0', alignItems: 'flex-start' }}>
            {byRegion.map(([region, items], colIdx) => {
              const accentColor = REGION_COLORS[region] || 'hsl(15 4% 40%)';
              const isLast = colIdx === byRegion.length - 1;
              return (
                <div key={region} style={{ display: 'contents' }}>
                  <motion.div
                    initial={{ opacity: 0, x: colIdx === 0 ? -16 : 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + colIdx * 0.1, duration: 0.5, ease: 'easeOut' }}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <ColumnHeader region={region} count={items.length} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {items.map((e, i) => (
                        <StoryCard key={e.id} entity={e} accentColor={accentColor} index={i} />
                      ))}
                    </div>
                  </motion.div>

                  {!isLast && (
                    <ConflictDivider
                      colorA={REGION_COLORS[region] || 'hsl(15 4% 30%)'}
                      colorB={REGION_COLORS[regions[colIdx + 1]] || 'hsl(15 4% 30%)'}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Single perspective: centered grid */
          <div>
            {byRegion.map(([region, items]) => {
              const accentColor = REGION_COLORS[region] || 'hsl(15 4% 40%)';
              return (
                <div key={region}>
                  <ColumnHeader region={region} count={items.length} />
                  <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {items.map((e, i) => (
                      <StoryCard key={e.id} entity={e} accentColor={accentColor} index={i} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
