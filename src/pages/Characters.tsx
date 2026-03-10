import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import type { VaultEntity } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PCClass { name: string; subclass?: string; level: number }

interface PCFull extends VaultEntity {
  accentColor?: string;
  player?: string;
  race?: string;
  classes?: PCClass[];
  hp?: number;
  ac?: number;
  speed?: string;
  stats?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
}

// ─── Character Config ───────────────────────────────────────────────────────────

const CHARACTER_META: Record<string, { role: string; particleType: 'ember' | 'eldritch' | 'forge' | 'shadow' }> = {
  'pc-cannonball-kar-thul':   { role: 'Tank',      particleType: 'ember' },
  'pc-bpop':                  { role: 'Artificer',  particleType: 'forge' },
  'pc-iblith-gorch':          { role: 'Striker',    particleType: 'shadow' },
  'pc-morrighan-bustlewing':  { role: 'Caster',     particleType: 'eldritch' },
};

const CARD_QUOTES: Record<string, string> = {
  'pc-cannonball-kar-thul': '\u201CYou exploded her?\u201D Drevlyn said. \u201CBrilliant.\u201D',
  'pc-bpop': 'He looked at every fortress the world had built against creatures of his kind and quietly, methodically, found the door.',
  'pc-iblith-gorch': 'Not for greed. Not for revenge. For proof. For purpose.',
  'pc-morrighan-bustlewing': '\u201C\u2026to ensure that death claims only what it must \u2014 or perhaps, what it should not.\u201D',
};

// ─── Particle System ────────────────────────────────────────────────────────────

function CharacterParticles({ type, count = 8 }: { type: string; count?: number }) {
  const particles = useMemo(() => {
    const r = (min: number, max: number) => min + Math.random() * (max - min);

    switch (type) {
      case 'ember':
        return Array.from({ length: count }, (_, i) => ({
          position: 'absolute' as const,
          bottom: `${r(15, 45)}%`,
          left: `${r(5, 95)}%`,
          width: `${r(2, 5)}px`,
          height: `${r(2, 5)}px`,
          borderRadius: '50%',
          background: ['hsl(8 85% 55%)', 'hsl(25 90% 50%)', 'hsl(15 80% 45%)'][i % 3],
          animation: `charEmberRise ${r(2.5, 5)}s ease-out ${r(0, 4)}s infinite`,
          '--drift': `${r(-15, 15)}px`,
          pointerEvents: 'none' as const,
          zIndex: 2,
        }));

      case 'eldritch':
        return Array.from({ length: count }, (_, i) => ({
          position: 'absolute' as const,
          top: `${r(10, 80)}%`,
          left: `${r(10, 90)}%`,
          width: `${r(4, 8)}px`,
          height: `${r(4, 8)}px`,
          borderRadius: '50%',
          background: ['hsl(250 60% 70%)', 'hsl(220 50% 65%)', 'hsl(270 45% 60%)'][i % 3],
          filter: `blur(${r(1, 3)}px)`,
          animation: `eldritchFloat ${r(5, 9)}s ease-in-out ${r(0, 5)}s infinite`,
          '--dx': `${r(-30, 30)}px`,
          '--dy': `${r(-30, 30)}px`,
          pointerEvents: 'none' as const,
          zIndex: 2,
        }));

      case 'forge':
        return Array.from({ length: count }, (_, i) => ({
          position: 'absolute' as const,
          bottom: `${r(10, 35)}%`,
          left: `${r(10, 90)}%`,
          width: `${r(2, 4)}px`,
          height: `${r(3, 6)}px`,
          borderRadius: '1px',
          background: ['hsl(44 90% 55%)', 'hsl(30 85% 50%)', 'hsl(50 80% 50%)'][i % 3],
          animation: `forgeSpark ${r(2, 4)}s ease-out ${r(0, 3.5)}s infinite`,
          pointerEvents: 'none' as const,
          zIndex: 2,
        }));

      case 'shadow':
        return Array.from({ length: count }, (_, i) => ({
          position: 'absolute' as const,
          top: `${r(5, 75)}%`,
          left: `${r(-5, 85)}%`,
          width: `${r(25, 60)}px`,
          height: `${r(15, 35)}px`,
          borderRadius: '50%',
          background: ['hsl(265 30% 18%)', 'hsl(280 25% 14%)', 'hsl(250 20% 16%)'][i % 3],
          filter: `blur(${r(12, 20)}px)`,
          animation: `shadowDrift ${r(6, 12)}s ease-in-out ${r(0, 6)}s infinite`,
          '--start-x': `${r(-20, 20)}px`,
          '--end-x': `${r(-40, 40)}px`,
          pointerEvents: 'none' as const,
          zIndex: 2,
        }));

      default:
        return [];
    }
  }, [type, count]);

  return <>{particles.map((s, i) => <div key={i} style={s as React.CSSProperties} />)}</>;
}

// ─── Level Badge ────────────────────────────────────────────────────────────────

function LevelBadge({ level, accent }: { level: number; accent: string }) {
  return (
    <div style={{
      position: 'absolute', top: '12px', right: '12px', zIndex: 5,
      background: 'rgba(8,6,4,0.75)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${accent}50`,
      borderRadius: '6px',
      padding: '3px 10px',
      display: 'flex', alignItems: 'center', gap: '4px',
      boxShadow: `0 0 12px ${accent}25`,
    }}>
      <span style={{ fontSize: '9px', color: accent, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif', textTransform: 'uppercase' }}>
        Lvl
      </span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(15 4% 92%)', fontFamily: 'Cinzel, serif' }}>
        {level}
      </span>
    </div>
  );
}

// ─── Role Pill ──────────────────────────────────────────────────────────────────

function RolePill({ role, accent, size = 'normal' }: { role: string; accent: string; size?: 'normal' | 'small' }) {
  const sm = size === 'small';
  return (
    <span style={{
      display: 'inline-block',
      background: `${accent}15`,
      border: `1px solid ${accent}40`,
      borderRadius: '20px',
      padding: sm ? '2px 8px' : '3px 12px',
      fontSize: sm ? '8px' : '9px',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: accent,
      fontFamily: 'Cinzel, serif',
      whiteSpace: 'nowrap',
    }}>
      {role}
    </span>
  );
}

// ─── Bento Card ─────────────────────────────────────────────────────────────────

interface BentoCardProps {
  pc: PCFull;
  variant: 'hero' | 'side' | 'small';
  index: number;
}

function BentoCard({ pc, variant, index }: BentoCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const accent = pc.accentColor || 'hsl(25 100% 38%)';
  const quote = CARD_QUOTES[pc.id] || pc.summary || '';
  const meta = CHARACTER_META[pc.id] || { role: 'Adventurer', particleType: 'ember' as const };
  const totalLevel = pc.classes?.reduce((s, c) => s + c.level, 0) ?? 0;

  const isHero = variant === 'hero';
  const isSmall = variant === 'small';
  const particleCount = isHero ? 14 : isSmall ? 5 : 8;
  const imgHeight = isHero ? '75%' : '65%';

  return (
    <motion.div
      initial={{ opacity: 0, y: isHero ? 40 : 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: isHero ? 0.8 : 0.6, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ height: '100%' }}
    >
      <Link href={`/characters/${pc.slug}`}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            height: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'hsl(15 6% 6%)',
            border: `1px solid ${hovered ? accent + '60' : 'hsl(15 8% 14%)'}`,
            boxShadow: hovered
              ? `0 0 0 1px ${accent}12, 0 16px 48px -8px ${accent}40, 0 32px 80px -20px rgba(0,0,0,0.85)`
              : '0 4px 24px -6px rgba(0,0,0,0.6)',
            transform: hovered ? `translateY(-${isHero ? 8 : 5}px) scale(1.008)` : 'translateY(0) scale(1)',
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
                width: '100%', height: imgHeight,
                objectFit: 'cover',
                objectPosition: pc.imagePosition || 'center top',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                animation: isHero ? 'kenBurns 30s ease-in-out infinite' : undefined,
                animationPlayState: hovered ? 'paused' : 'running',
                display: 'block',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: imgHeight,
              background: `radial-gradient(ellipse at 50% 30%, hsl(20 8% 15%) 0%, hsl(15 6% 5%) 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '5rem', opacity: 0.06, color: accent }}>&#x27C1;</span>
            </div>
          )}

          {/* ── Per-character particles ── */}
          <CharacterParticles type={meta.particleType} count={particleCount} />

          {/* ── Accent fog from bottom of portrait ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: imgHeight,
            background: `radial-gradient(ellipse at 50% 110%, ${accent}45 0%, ${accent}15 35%, transparent 60%)`,
            opacity: hovered ? 0.9 : 0.45,
            transition: 'opacity 0.45s ease',
            pointerEvents: 'none', zIndex: 3,
          }} />

          {/* ── Vignette ── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              linear-gradient(180deg,
                rgba(8,6,4,${isHero ? 0.3 : 0.4}) 0%,
                transparent 20%,
                transparent 40%,
                rgba(8,6,4,0.7) 60%,
                rgba(8,6,4,0.95) 78%,
                rgba(8,6,4,1) 100%
              ),
              linear-gradient(90deg, rgba(8,6,4,0.3) 0%, transparent 15%, transparent 85%, rgba(8,6,4,0.3) 100%)
            `,
            pointerEvents: 'none', zIndex: 3,
          }} />

          {/* ── Top-right corner light bleed ── */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '80px', height: '80px',
            background: `linear-gradient(225deg, ${accent}20 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0.5,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none', zIndex: 3,
          }} />

          {/* ── Level badge ── */}
          <LevelBadge level={totalLevel} accent={accent} />

          {/* ── Bottom accent sweep ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
            background: `linear-gradient(90deg, transparent 0%, ${accent}70 30%, ${accent}70 70%, transparent 100%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.35s ease', zIndex: 5,
          }} />

          {/* ── Content panel ── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: isHero ? '0 28px 28px' : isSmall ? '0 16px 16px' : '0 18px 18px',
            zIndex: 4,
          }}>
            {/* Quote */}
            {!isSmall && (
              <div style={{
                borderLeft: `2px solid ${accent}70`,
                paddingLeft: '12px',
                marginBottom: isHero ? '16px' : '10px',
                opacity: hovered ? 1 : 0.7,
                transform: hovered ? 'translateX(0)' : 'translateX(-2px)',
                transition: 'all 0.35s ease',
              }}>
                <p className="font-display italic" style={{
                  fontSize: isHero ? '13px' : '11px',
                  color: 'hsl(15 4% 55%)',
                  lineHeight: 1.6,
                  ...(!isHero ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  } : {}),
                }}>
                  {quote}
                </p>
              </div>
            )}

            {/* Role pill */}
            <div style={{ marginBottom: isHero ? '8px' : '5px' }}>
              <RolePill role={meta.role} accent={accent} size={isSmall ? 'small' : 'normal'} />
            </div>

            {/* Class */}
            <p className="font-serif" style={{
              fontSize: isHero ? '10px' : '9px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: accent, opacity: 0.8,
              marginBottom: '4px',
            }}>
              {pc.category}
            </p>

            {/* Name */}
            <h2 className="font-serif font-black uppercase" style={{
              fontSize: isHero
                ? 'clamp(2.2rem, 4vw, 3.2rem)'
                : isSmall
                  ? 'clamp(1.3rem, 2.5vw, 1.8rem)'
                  : 'clamp(1.5rem, 3vw, 2rem)',
              letterSpacing: '0.05em',
              lineHeight: 0.95,
              color: 'hsl(15 4% 96%)',
              textShadow: hovered
                ? `0 0 30px ${accent}70, 0 0 60px ${accent}35, 0 2px 4px rgba(0,0,0,0.8)`
                : `0 0 20px ${accent}25, 0 2px 4px rgba(0,0,0,0.8)`,
              marginBottom: '6px',
              transition: 'text-shadow 0.4s ease',
            }}>
              {pc.name}
            </h2>

            {/* Player */}
            <p className="font-display" style={{
              fontSize: isHero ? '11px' : '10px',
              color: 'hsl(15 4% 30%)',
              letterSpacing: '0.08em',
            }}>
              Played by {pc.player}
            </p>

            {/* Hover CTA */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginTop: isHero ? '14px' : '10px',
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
              <span style={{ color: accent, fontSize: '11px' }}>&rarr;</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Party Stats (Glassmorphism) ────────────────────────────────────────────────

function PartyStats({ pcs }: { pcs: PCFull[] }) {
  const totalHP = pcs.reduce((s, pc) => s + (pc.hp ?? 0), 0);
  const avgLevel = pcs.length
    ? Math.round(pcs.reduce((s, pc) => s + (pc.classes?.reduce((a, c) => a + c.level, 0) ?? 0), 0) / pcs.length)
    : 0;

  const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
  const statLeaders = STAT_KEYS.map(key => {
    let best: PCFull | undefined;
    let bestVal = 0;
    pcs.forEach(pc => {
      const val = pc.stats?.[key] ?? 0;
      if (val > bestVal) { bestVal = val; best = pc; }
    });
    return { stat: key.toUpperCase(), value: bestVal, pc: best };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      style={{
        height: '100%',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '22px',
        display: 'flex', flexDirection: 'column', gap: '14px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px',
        background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div>
        <p className="font-serif uppercase" style={{
          fontSize: '9px', letterSpacing: '0.25em', color: 'hsl(25 100% 38%)',
          marginBottom: '3px',
        }}>
          Party Composition
        </p>
        <h3 className="font-serif font-bold" style={{ fontSize: '17px', color: 'hsl(15 4% 90%)' }}>
          The Company
        </h3>
      </div>

      {/* Role pills with character names */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {pcs.map(pc => {
          const meta = CHARACTER_META[pc.id];
          const a = pc.accentColor || 'hsl(25 100% 38%)';
          return (
            <div key={pc.id} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: `${a}10`, border: `1px solid ${a}30`,
              borderRadius: '20px', padding: '4px 10px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: a, boxShadow: `0 0 6px ${a}60`,
              }} />
              <span style={{
                fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: a, fontFamily: 'Cinzel, serif',
              }}>
                {meta?.role || 'Adventurer'}
              </span>
              <span style={{ fontSize: '9px', color: 'hsl(15 4% 45%)', fontFamily: 'EB Garamond, serif' }}>
                {pc.name?.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stat leaders — 3x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {statLeaders.map(({ stat, value, pc: leader }) => {
          const a = (leader as PCFull | undefined)?.accentColor || 'hsl(25 100% 38%)';
          const firstName = (leader as PCFull | undefined)?.name?.split(' ')[0] || '';
          return (
            <div key={stat} style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px', padding: '7px 8px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: '9px', color: 'hsl(15 4% 40%)', letterSpacing: '0.1em', marginBottom: '1px' }}>
                {stat}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: a, fontFamily: 'Cinzel, serif' }}>
                {value}
              </div>
              <div style={{ fontSize: '8px', color: 'hsl(15 4% 32%)', marginTop: '1px' }}>
                {firstName}
              </div>
            </div>
          );
        })}
      </div>

      {/* HP composition bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '9px', color: 'hsl(15 4% 40%)', letterSpacing: '0.1em' }}>COMBINED HP</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(15 4% 80%)', fontFamily: 'Cinzel, serif' }}>{totalHP}</span>
        </div>
        <div style={{
          height: '4px', borderRadius: '2px', overflow: 'hidden',
          display: 'flex', background: 'rgba(255,255,255,0.04)',
        }}>
          {pcs.map(pc => {
            const pct = totalHP > 0 ? ((pc.hp ?? 0) / totalHP) * 100 : 25;
            return (
              <div key={pc.id} style={{
                width: `${pct}%`, height: '100%',
                background: pc.accentColor || 'hsl(25 100% 38%)',
                transition: 'width 0.6s ease',
              }} />
            );
          })}
        </div>
      </div>

      {/* Footer stats */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingTop: '10px', marginTop: 'auto',
      }}>
        {[
          { label: 'Members', value: String(pcs.length), color: 'hsl(15 4% 85%)' },
          { label: 'Avg Level', value: String(avgLevel), color: 'hsl(15 4% 85%)' },
          { label: 'Total HP', value: String(totalHP), color: 'hsl(25 100% 38%)' },
        ].map((item, i) => (
          <div key={item.label} style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {i > 0 && <div style={{ display: 'none' }} />}
            <div style={{ fontSize: '17px', fontWeight: 700, color: item.color, fontFamily: 'Cinzel, serif' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '8px', color: 'hsl(15 4% 35%)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export function Characters() {
  const [pcs, setPcs] = useState<PCFull[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vaultService.getByType('PC')
      .then(entities => setPcs(entities as PCFull[]))
      .finally(() => setLoading(false));
  }, []);

  // Spotlight: rotate hero daily
  const heroIndex = useMemo(() => {
    const d = new Date();
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    return dayOfYear % Math.max(pcs.length, 1);
  }, [pcs.length]);

  const arranged = useMemo(() => {
    if (pcs.length === 0) return { hero: null, side1: null, side2: null, small: null };
    const hero = pcs[heroIndex % pcs.length];
    const rest = pcs.filter((_, i) => i !== heroIndex % pcs.length);
    return {
      hero,
      side1: rest[0] || null,
      side2: rest[1] || null,
      small: rest[2] || null,
    };
  }, [pcs, heroIndex]);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      {/* Ambient page glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '900px', height: '400px', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 65%)',
      }} />

      <div className="max-w-6xl mx-auto px-6 py-16" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', marginBottom: '18px',
          }}>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to right, transparent, hsl(25 100% 30%))' }} />
            <p className="font-serif uppercase" style={{
              fontSize: '10px', letterSpacing: '0.32em', color: 'hsl(25 100% 38%)',
            }}>
              Pathways Unseen &middot; Karnuk, The Underdark
            </p>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(to left, transparent, hsl(25 100% 30%))' }} />
          </div>

          <h1 className="font-serif font-black uppercase" style={{
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            letterSpacing: '0.12em',
            lineHeight: 0.9,
            color: 'hsl(15 4% 94%)',
            textShadow: '0 0 80px rgba(201,168,76,0.15), 0 4px 16px rgba(0,0,0,0.6)',
            marginBottom: '20px',
          }}>
            The Company
          </h1>

          <p className="font-display italic" style={{
            fontSize: '15px', color: 'hsl(15 4% 42%)',
            maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.65,
          }}>
            Four souls who fell into the dark and found, to their mutual inconvenience, each other.
          </p>

          <div className="forge-divider" />
        </motion.div>

        {/* ── Bento Grid ── */}
        {loading ? (
          <div className="bento-characters">
            {['hero', 'side1', 'side2', 'small', 'stats'].map(area => (
              <div key={area} style={{
                gridArea: area,
                borderRadius: '12px',
                background: 'hsl(20 6% 10%)',
                border: '1px solid hsl(15 8% 14%)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : (
          <div className="bento-characters">
            {arranged.hero && (
              <div style={{ gridArea: 'hero' }}>
                <BentoCard pc={arranged.hero} variant="hero" index={0} />
              </div>
            )}
            {arranged.side1 && (
              <div style={{ gridArea: 'side1' }}>
                <BentoCard pc={arranged.side1} variant="side" index={1} />
              </div>
            )}
            {arranged.side2 && (
              <div style={{ gridArea: 'side2' }}>
                <BentoCard pc={arranged.side2} variant="side" index={2} />
              </div>
            )}
            {arranged.small && (
              <div style={{ gridArea: 'small' }}>
                <BentoCard pc={arranged.small} variant="small" index={3} />
              </div>
            )}
            <div style={{ gridArea: 'stats' }}>
              <PartyStats pcs={pcs} />
            </div>
          </div>
        )}

        {/* ── Footer ── */}
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
              An ongoing chronicle &middot; Campaign level {Math.max(...pcs.map(p => p.classes?.reduce((s, c) => s + c.level, 0) ?? 0))}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
