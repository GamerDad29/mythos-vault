import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import type { VaultEntityStub } from '../types';

interface PCStub extends VaultEntityStub {
  accentColor?: string;
  player?: string;
  race?: string;
}

const CHRONICLE_TEASER: Record<string, string> = {
  'pc-cannonball-kar-thul': 'First through every door. Loudest in every hall.',
  'pc-bpop': 'The one who held the mechanism together when everything else was breaking.',
  'pc-iblith-gorch': 'Quietly, precisely, leaving evidence only when he intends to.',
  'pc-morrighan-bustlewing': 'Something the existing categories simply failed to contain.',
};

function PCCard({ pc, index }: { pc: PCStub; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const accent = pc.accentColor || 'hsl(25 100% 38%)';
  const teaser = CHRONICLE_TEASER[pc.id] || pc.summary || '';
  const href = `/characters/${pc.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={href}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            height: '480px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1px solid ${hovered ? accent + '88' : accent + '28'}`,
            boxShadow: hovered ? `0 0 48px -8px ${accent}50, 0 0 80px -24px ${accent}28` : `0 0 24px -12px ${accent}20`,
            cursor: 'pointer',
            transition: 'all 0.35s ease',
            transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
            background: 'hsl(15 6% 7%)',
          }}
        >
          {/* Portrait */}
          {pc.imageUrl && !imgError ? (
            <img
              src={pc.imageUrl}
              alt={pc.name}
              onError={() => setImgError(true)}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.5s ease',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at 40% 30%, hsl(20 8% 14%) 0%, hsl(15 6% 6%) 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '6rem', opacity: 0.08, color: accent }}>⟁</span>
            </div>
          )}

          {/* Bottom gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to top, rgba(10,8,6,0.97) 0%, rgba(10,8,6,0.75) 38%, rgba(10,8,6,0.15) 65%, transparent 100%)`,
            transition: 'opacity 0.35s ease',
          }} />

          {/* Accent sweep line at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }} />

          {/* Race badge — top left */}
          <div style={{
            position: 'absolute', top: '14px', left: '14px',
            background: 'rgba(10,8,6,0.75)',
            border: `1px solid ${accent}44`,
            borderRadius: '3px',
            padding: '3px 8px',
            backdropFilter: 'blur(6px)',
          }}>
            <span className="font-serif" style={{
              fontSize: '9px', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: accent,
            }}>
              {pc.race}
            </span>
          </div>

          {/* Content — bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 22px' }}>
            {/* Class line */}
            <p className="font-serif" style={{
              fontSize: '10px', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: accent,
              opacity: 0.85, marginBottom: '6px',
            }}>
              {pc.category}
            </p>

            {/* Name */}
            <h2 className="font-serif font-black uppercase" style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              letterSpacing: '0.06em',
              color: 'hsl(15 4% 94%)',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}>
              {pc.name}
            </h2>

            {/* Player */}
            <p className="font-display" style={{
              fontSize: '11px', color: 'hsl(15 4% 42%)',
              letterSpacing: '0.08em', marginBottom: '10px',
            }}>
              Played by {pc.player}
            </p>

            {/* Chronicle teaser — fades in on hover */}
            <p className="font-display italic" style={{
              fontSize: '12px',
              color: 'hsl(15 4% 58%)',
              lineHeight: 1.5,
              maxHeight: hovered ? '60px' : '0',
              opacity: hovered ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.35s ease',
            }}>
              "{teaser}"
            </p>
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
      .then(idx => {
        const pcList = idx.entities.filter(e => e.type === 'PC') as PCStub[];
        setPcs(pcList);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="font-serif uppercase tracking-[0.3em] mb-3" style={{
            fontSize: '11px', color: 'hsl(25 100% 38%)',
          }}>
            Pathways Unseen · Karnuk, The Underdark
          </p>
          <h1 className="font-serif font-black uppercase mb-4" style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            letterSpacing: '0.08em',
            color: 'hsl(15 4% 94%)',
            lineHeight: 1,
          }}>
            The Company
          </h1>
          <p className="font-display italic" style={{
            fontSize: '15px', color: 'hsl(15 4% 48%)',
            maxWidth: '440px', margin: '0 auto',
          }}>
            Four souls who fell into the dark and found, to their mutual inconvenience, each other.
          </p>
          <div className="forge-divider mt-8" />
        </motion.div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                height: '480px', borderRadius: '8px',
                background: 'hsl(20 6% 11%)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pcs.map((pc, i) => (
              <PCCard key={pc.id} pc={pc} index={i} />
            ))}
          </div>
        )}

        {/* Footer note */}
        {!loading && pcs.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center font-display italic mt-12"
            style={{ fontSize: '12px', color: 'hsl(15 4% 30%)' }}
          >
            An ongoing chronicle · Campaign level {Math.max(...pcs.map((p: any) => p.classes?.[0]?.level ?? 0))}
          </motion.p>
        )}
      </div>
    </div>
  );
}
