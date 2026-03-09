import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import type { VaultEntityStub } from '../types';

interface PCStub extends VaultEntityStub {
  accentColor?: string;
  player?: string;
  race?: string;
  imagePosition?: string;
}

// Per-character session quotes for the cards — pulled from actual session recaps
const CARD_QUOTES: Record<string, string> = {
  'pc-cannonball-kar-thul': '"You exploded her?" Drevlyn said. "Brilliant."',
  'pc-bpop': 'He looked at every fortress the world had built against creatures of his kind and quietly, methodically, found the door.',
  'pc-iblith-gorch': 'Not for greed. Not for revenge. For proof. For purpose.',
  'pc-morrighan-bustlewing': '"…to ensure that death claims only what it must — or perhaps, what it should not."',
};

function PCCard({ pc, index }: { pc: PCStub; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const accent = pc.accentColor || 'hsl(25 100% 38%)';
  const quote = CARD_QUOTES[pc.id] || pc.summary || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/characters/${pc.slug}`}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            height: '520px',
            borderRadius: '10px',
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'hsl(15 6% 6%)',
            border: `1px solid ${hovered ? accent + '90' : accent + '20'}`,
            boxShadow: hovered
              ? `0 0 0 1px ${accent}18, 0 12px 40px -8px ${accent}55, 0 32px 80px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)`
              : `0 4px 24px -6px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.02) inset`,
            transform: hovered ? 'translateY(-10px) scale(1.012)' : 'translateY(0) scale(1)',
            transition: 'all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {/* ── Portrait ── */}
          {pc.imageUrl && !imgError ? (
            <img
              src={pc.imageUrl}
              alt={pc.name}
              onError={() => setImgError(true)}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '68%',
                objectFit: 'cover',
                objectPosition: pc.imagePosition || 'center top',
                transform: hovered ? 'scale(1.07)' : 'scale(1)',
                transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                display: 'block',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '68%',
              background: `radial-gradient(ellipse at 50% 30%, hsl(20 8% 15%) 0%, hsl(15 6% 5%) 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '7rem', opacity: 0.06, color: accent }}>⟁</span>
            </div>
          )}

          {/* ── Atmospheric accent fog rising from bottom of portrait ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '68%',
            background: `radial-gradient(ellipse at 50% 110%, ${accent}50 0%, ${accent}18 35%, transparent 60%)`,
            opacity: hovered ? 1 : 0.55,
            transition: 'opacity 0.45s ease',
            pointerEvents: 'none',
          }} />

          {/* ── Multi-layer vignette ── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              linear-gradient(180deg,
                rgba(8,6,4,0.45) 0%,
                transparent 22%,
                transparent 42%,
                rgba(8,6,4,0.72) 62%,
                rgba(8,6,4,0.97) 78%,
                rgba(8,6,4,1) 100%
              ),
              linear-gradient(90deg, rgba(8,6,4,0.35) 0%, transparent 18%, transparent 82%, rgba(8,6,4,0.35) 100%)
            `,
            pointerEvents: 'none',
          }} />

          {/* ── Top-right corner light bleed ── */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '80px', height: '80px',
            background: `linear-gradient(225deg, ${accent}20 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0.5,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
          }} />

          {/* ── Bottom accent sweep ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
            background: `linear-gradient(90deg, transparent 0%, ${accent}70 30%, ${accent}70 70%, transparent 100%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }} />

          {/* ── Content panel ── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: '0 22px 22px',
          }}>

            {/* Session quote — always visible */}
            <div style={{
              borderLeft: `2px solid ${accent}80`,
              paddingLeft: '12px',
              marginBottom: '14px',
              opacity: hovered ? 1 : 0.75,
              transform: hovered ? 'translateX(0)' : 'translateX(-2px)',
              transition: 'all 0.35s ease',
            }}>
              <p className="font-display italic" style={{
                fontSize: '11px',
                color: `hsl(15 4% 58%)`,
                lineHeight: 1.55,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {quote}
              </p>
            </div>

            {/* Class line */}
            <p className="font-serif" style={{
              fontSize: '9px', letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: accent, opacity: 0.8,
              marginBottom: '5px',
            }}>
              {pc.category}
            </p>

            {/* NAME — huge with glow */}
            <h2
              className="font-serif font-black uppercase"
              style={{
                fontSize: 'clamp(1.7rem, 3.2vw, 2.25rem)',
                letterSpacing: '0.05em',
                lineHeight: 0.95,
                color: 'hsl(15 4% 96%)',
                textShadow: hovered
                  ? `0 0 30px ${accent}80, 0 0 60px ${accent}40, 0 2px 4px rgba(0,0,0,0.8)`
                  : `0 0 20px ${accent}30, 0 2px 4px rgba(0,0,0,0.8)`,
                marginBottom: '7px',
                transition: 'text-shadow 0.4s ease',
              }}
            >
              {pc.name}
            </h2>

            {/* Player */}
            <p className="font-display" style={{
              fontSize: '10px',
              color: 'hsl(15 4% 32%)',
              letterSpacing: '0.08em',
            }}>
              Played by {pc.player}
            </p>

            {/* Hover CTA */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginTop: '12px',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.35s ease',
            }}>
              <div style={{
                height: '1px', flex: 1,
                background: `linear-gradient(90deg, ${accent}60, transparent)`,
              }} />
              <span className="font-serif uppercase" style={{
                fontSize: '9px', letterSpacing: '0.22em', color: accent,
              }}>
                View Chronicle
              </span>
              <span style={{ color: accent, fontSize: '11px' }}>→</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function Characters() {
  const [pcs, setPcs] = useState<PCStub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vaultService.getIndex()
      .then(idx => setPcs(idx.entities.filter(e => e.type === 'PC') as PCStub[]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      {/* Ambient page glow — subtle radial behind the header */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '900px', height: '400px', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 65%)',
      }} />

      <div className="max-w-5xl mx-auto px-6 py-16" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Eyebrow */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', marginBottom: '18px',
          }}>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to right, transparent, hsl(25 100% 30%))' }} />
            <p className="font-serif uppercase" style={{
              fontSize: '10px', letterSpacing: '0.32em',
              color: 'hsl(25 100% 38%)',
            }}>
              Pathways Unseen · Karnuk, The Underdark
            </p>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to left, transparent, hsl(25 100% 30%))' }} />
          </div>

          {/* Title */}
          <h1
            className="font-serif font-black uppercase"
            style={{
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              letterSpacing: '0.12em',
              lineHeight: 0.9,
              color: 'hsl(15 4% 94%)',
              textShadow: '0 0 80px rgba(201,168,76,0.15), 0 4px 16px rgba(0,0,0,0.6)',
              marginBottom: '20px',
            }}
          >
            The Company
          </h1>

          {/* Subtitle */}
          <p className="font-display italic" style={{
            fontSize: '15px',
            color: 'hsl(15 4% 42%)',
            maxWidth: '420px',
            margin: '0 auto 24px',
            lineHeight: 1.65,
          }}>
            Four souls who fell into the dark and found, to their mutual inconvenience, each other.
          </p>

          <div className="forge-divider" />
        </motion.div>

        {/* ── Character Cards Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                height: '520px', borderRadius: '10px',
                background: 'hsl(20 6% 10%)',
                border: '1px solid hsl(15 8% 14%)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {pcs.map((pc, i) => <PCCard key={pc.id} pc={pc} index={i} />)}
          </div>
        )}

        {/* ── Footer note ── */}
        {!loading && pcs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-14"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
          >
            <div style={{ height: '1px', width: '120px', background: 'linear-gradient(to right, transparent, hsl(15 8% 18%), transparent)' }} />
            <p className="font-display italic" style={{ fontSize: '11px', color: 'hsl(15 4% 28%)' }}>
              An ongoing chronicle · Campaign level {Math.max(...pcs.map((p: any) => (p as any).classes?.[0]?.level ?? 0))}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
