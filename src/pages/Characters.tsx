import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import type { VaultEntity, VaultEntityStub, SessionEntry } from '../types';

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

const CHARACTER_META: Record<string, {
  role: string;
  particleType: 'ember' | 'eldritch' | 'forge' | 'shadow';
  signature: string;
}> = {
  'pc-cannonball-kar-thul':   { role: 'Tank',      particleType: 'ember',    signature: 'Elemental Cleaver' },
  'pc-bpop':                  { role: 'Artificer',  particleType: 'forge',    signature: 'Steel Defender' },
  'pc-iblith-gorch':          { role: 'Striker',    particleType: 'shadow',   signature: 'Shadow Step' },
  'pc-morrighan-bustlewing':  { role: 'Caster',     particleType: 'eldritch', signature: 'Form of Dread' },
};

const CARD_QUOTES: Record<string, string> = {
  'pc-cannonball-kar-thul': '\u201CYou exploded her?\u201D Drevlyn said. \u201CBrilliant.\u201D',
  'pc-bpop': 'He looked at every fortress the world had built against creatures of his kind and quietly, methodically, found the door.',
  'pc-iblith-gorch': 'Not for greed. Not for revenge. For proof. For purpose.',
  'pc-morrighan-bustlewing': '\u201C\u2026to ensure that death claims only what it must \u2014 or perhaps, what it should not.\u201D',
};

// Banner strip positioning — warm to cool gradient across the banner
const BANNER_POSITIONS = [
  { left: '0%',  width: '32%' },
  { left: '22%', width: '30%' },
  { left: '46%', width: '30%' },
  { left: '70%', width: '32%' },
];

// ─── Particle System ────────────────────────────────────────────────────────────

function CharacterParticles({ type, count = 8 }: { type: string; count?: number }) {
  const particles = useMemo(() => {
    const r = (min: number, max: number) => min + Math.random() * (max - min);

    switch (type) {
      case 'ember':
        return Array.from({ length: count }, (_, i) => ({
          position: 'absolute' as const,
          bottom: `${r(10, 50)}%`,
          left: `${r(5, 95)}%`,
          width: `${r(2, 6)}px`,
          height: `${r(2, 6)}px`,
          borderRadius: '50%',
          background: ['hsl(8 90% 58%)', 'hsl(25 95% 55%)', 'hsl(40 85% 50%)', 'hsl(15 80% 45%)'][i % 4],
          animation: `charEmberRise ${r(2, 4.5)}s ease-out ${r(0, 4)}s infinite`,
          '--drift': `${r(-18, 18)}px`,
          pointerEvents: 'none' as const,
          zIndex: 2,
        }));

      case 'eldritch':
        return Array.from({ length: count }, (_, i) => ({
          position: 'absolute' as const,
          top: `${r(5, 85)}%`,
          left: `${r(5, 95)}%`,
          width: `${r(3, 9)}px`,
          height: `${r(3, 9)}px`,
          borderRadius: '50%',
          background: ['hsl(250 65% 72%)', 'hsl(220 55% 68%)', 'hsl(270 50% 62%)', 'hsl(290 40% 55%)'][i % 4],
          filter: `blur(${r(1, 4)}px)`,
          animation: `eldritchFloat ${r(4, 8)}s ease-in-out ${r(0, 5)}s infinite`,
          '--dx': `${r(-35, 35)}px`,
          '--dy': `${r(-35, 35)}px`,
          pointerEvents: 'none' as const,
          zIndex: 2,
        }));

      case 'forge':
        return Array.from({ length: count }, (_, i) => ({
          position: 'absolute' as const,
          bottom: `${r(8, 40)}%`,
          left: `${r(8, 92)}%`,
          width: `${r(2, 5)}px`,
          height: `${r(3, 7)}px`,
          borderRadius: '1px',
          background: ['hsl(44 95% 58%)', 'hsl(30 90% 52%)', 'hsl(50 85% 52%)', 'hsl(38 100% 48%)'][i % 4],
          animation: `forgeSpark ${r(1.8, 3.5)}s ease-out ${r(0, 3)}s infinite`,
          pointerEvents: 'none' as const,
          zIndex: 2,
        }));

      case 'shadow':
        return Array.from({ length: count }, (_, i) => ({
          position: 'absolute' as const,
          top: `${r(0, 80)}%`,
          left: `${r(-10, 90)}%`,
          width: `${r(30, 70)}px`,
          height: `${r(18, 40)}px`,
          borderRadius: '50%',
          background: ['hsl(265 35% 18%)', 'hsl(280 30% 14%)', 'hsl(250 25% 16%)', 'hsl(300 20% 12%)'][i % 4],
          filter: `blur(${r(14, 24)}px)`,
          animation: `shadowDrift ${r(5, 10)}s ease-in-out ${r(0, 6)}s infinite`,
          '--start-x': `${r(-25, 25)}px`,
          '--end-x': `${r(-50, 50)}px`,
          pointerEvents: 'none' as const,
          zIndex: 2,
        }));

      default:
        return [];
    }
  }, [type, count]);

  return <>{particles.map((s, i) => <div key={i} style={s as React.CSSProperties} />)}</>;
}

// ─── Cinematic Hero Banner ──────────────────────────────────────────────────────

function HeroBanner({ pcs }: { pcs: PCFull[] }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const bannerOpacity = Math.max(0, 1 - scrollY / 600);
  const bannerShift = scrollY * 0.25; // parallax

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="hero-banner-container"
      style={{ opacity: bannerOpacity }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translateY(${bannerShift}px)`,
        willChange: 'transform',
      }}>
        {/* ── Portrait Strips ── */}
        {pcs.slice(0, 4).map((pc, i) => {
          const pos = BANNER_POSITIONS[i] || BANNER_POSITIONS[0];
          const accent = pc.accentColor || 'hsl(25 100% 38%)';
          const meta = CHARACTER_META[pc.id];
          const isFirst = i === 0;
          const isLast = i === pcs.length - 1 || i === 3;

          const maskGrad = `linear-gradient(to right, ${isFirst ? 'black' : 'transparent'} 0%, black ${isFirst ? '0%' : '22%'}, black ${isLast ? '100%' : '78%'}, ${isLast ? 'black' : 'transparent'} 100%)`;

          return (
            <div
              key={pc.id}
              style={{
                position: 'absolute',
                left: pos.left,
                width: pos.width,
                top: 0,
                bottom: 0,
                overflow: 'hidden',
                maskImage: maskGrad,
                WebkitMaskImage: maskGrad,
                zIndex: i + 1,
              }}
            >
              {/* Portrait image with per-strip Ken Burns */}
              {pc.imageUrl && (
                <img
                  src={pc.imageUrl}
                  alt={pc.name}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: pc.imagePosition || 'center 20%',
                    animation: `kenBurns ${22 + i * 4}s ease-in-out ${i * 2}s infinite`,
                    filter: 'brightness(0.6) contrast(1.1)',
                  }}
                />
              )}

              {/* Per-character particles in their strip */}
              <CharacterParticles type={meta?.particleType || 'ember'} count={10} />

              {/* Accent light pillar rising from bottom */}
              <div style={{
                position: 'absolute', bottom: 0, left: '30%', right: '30%', height: '100%',
                background: `linear-gradient(to top, ${accent}30 0%, ${accent}08 40%, transparent 70%)`,
                pointerEvents: 'none', zIndex: 3,
              }} />
            </div>
          );
        })}

        {/* ── Atmospheric fog layers ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(180,60,20,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(120,80,200,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.08) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />

        {/* ── Heavy bottom vignette ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 6,
          background: `
            linear-gradient(180deg,
              rgba(12,10,8,0.5) 0%,
              rgba(12,10,8,0.1) 15%,
              transparent 30%,
              transparent 45%,
              rgba(12,10,8,0.4) 65%,
              rgba(12,10,8,0.85) 82%,
              hsl(15 6% 8%) 100%
            ),
            linear-gradient(90deg, rgba(12,10,8,0.6) 0%, transparent 12%, transparent 88%, rgba(12,10,8,0.6) 100%)
          `,
          pointerEvents: 'none',
        }} />

        {/* ── Scan line ── */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          height: '2px', zIndex: 7,
          background: 'linear-gradient(90deg, transparent 5%, rgba(201,168,76,0.15) 30%, rgba(201,168,76,0.25) 50%, rgba(201,168,76,0.15) 70%, transparent 95%)',
          animation: 'scanLine 8s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* ── Film grain overlay ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 8,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          opacity: 0.5,
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Title Overlay ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 10, padding: '0 0 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px',
          }}
        >
          <div style={{ height: '1px', width: '80px', background: 'linear-gradient(to right, transparent, hsl(25 100% 32%))' }} />
          <p className="font-serif uppercase" style={{
            fontSize: '10px', letterSpacing: '0.35em', color: 'hsl(25 100% 40%)',
          }}>
            Pathways Unseen &middot; Karnuk, The Underdark
          </p>
          <div style={{ height: '1px', width: '80px', background: 'linear-gradient(to left, transparent, hsl(25 100% 32%))' }} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.7, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-serif font-black uppercase"
          style={{
            fontSize: 'clamp(3.5rem, 8vw, 7rem)',
            letterSpacing: '0.14em',
            lineHeight: 0.85,
            color: 'hsl(15 4% 96%)',
            textShadow: `
              0 0 120px rgba(201,168,76,0.25),
              0 0 60px rgba(201,168,76,0.15),
              0 4px 20px rgba(0,0,0,0.8)
            `,
            marginBottom: '14px',
            textAlign: 'center',
          }}
        >
          The Company
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="font-display italic"
          style={{
            fontSize: '15px', color: 'hsl(15 4% 48%)',
            maxWidth: '460px', textAlign: 'center', lineHeight: 1.65,
          }}
        >
          Four souls who fell into the dark and found, to their mutual inconvenience, each other.
        </motion.p>

        {/* Animated divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.4, duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '1px', width: '200px', marginTop: '20px',
            background: 'linear-gradient(90deg, transparent, hsl(25 100% 34%), transparent)',
            transformOrigin: 'center',
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── Level Badge (pulsing on hover) ─────────────────────────────────────────────

function LevelBadge({ level, accent, pulse }: { level: number; accent: string; pulse?: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: '10px', right: '10px', zIndex: 8,
      background: 'rgba(8,6,4,0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${accent}60`,
      borderRadius: '6px',
      padding: '3px 10px',
      display: 'flex', alignItems: 'center', gap: '4px',
      boxShadow: pulse
        ? `0 0 18px ${accent}50, 0 0 40px ${accent}20`
        : `0 0 12px ${accent}20`,
      transition: 'box-shadow 0.4s ease',
      animation: pulse ? 'badgePulse 2s ease-in-out infinite' : 'none',
    }}>
      <span style={{ fontSize: '9px', color: accent, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif', textTransform: 'uppercase' }}>
        Lvl
      </span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(15 4% 94%)', fontFamily: 'Cinzel, serif' }}>
        {level}
      </span>
    </div>
  );
}

// ─── Role Pill ──────────────────────────────────────────────────────────────────

function RolePill({ role, accent }: { role: string; accent: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: `${accent}18`,
      border: `1px solid ${accent}45`,
      borderRadius: '20px',
      padding: '3px 12px',
      fontSize: '9px',
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

// ─── Compact Character Tile ─────────────────────────────────────────────────────

function CompactCard({ pc, index }: { pc: PCFull; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [sweepKey, setSweepKey] = useState(0);
  const accent = pc.accentColor || 'hsl(25 100% 38%)';
  const quote = CARD_QUOTES[pc.id] || pc.summary || '';
  const meta = CHARACTER_META[pc.id] || { role: 'Adventurer', particleType: 'ember' as const, signature: '' };
  const totalLevel = pc.classes?.reduce((s, c) => s + c.level, 0) ?? 0;

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    setSweepKey(k => k + 1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3 + index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ height: '100%' }}
    >
      <Link href={`/characters/${pc.slug}`}>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            height: '100%',
            borderRadius: '10px',
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'hsl(15 6% 5%)',
            border: `1px solid ${hovered ? accent + '70' : 'hsl(15 8% 13%)'}`,
            boxShadow: hovered
              ? `0 0 0 1px ${accent}15, 0 20px 60px -10px ${accent}50, 0 40px 100px -25px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)`
              : '0 4px 20px -4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.02)',
            transform: hovered ? 'translateY(-12px) scale(1.015)' : 'translateY(0) scale(1)',
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
                width: '100%', height: '70%',
                objectFit: 'cover',
                objectPosition: pc.imagePosition || 'center top',
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                display: 'block',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '70%',
              background: `radial-gradient(ellipse at 50% 30%, hsl(20 8% 14%) 0%, hsl(15 6% 4%) 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '4rem', opacity: 0.05, color: accent }}>&#x27C1;</span>
            </div>
          )}

          {/* ── Particles (more on hover via larger base count) ── */}
          <CharacterParticles type={meta.particleType} count={hovered ? 16 : 10} />

          {/* ── Accent fog ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '70%',
            background: `
              radial-gradient(ellipse at 50% 110%, ${accent}50 0%, ${accent}18 30%, transparent 55%),
              radial-gradient(ellipse at 50% 0%, ${accent}12 0%, transparent 40%)
            `,
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none', zIndex: 3,
          }} />

          {/* ── Vignette ── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              linear-gradient(180deg,
                rgba(8,6,4,0.35) 0%,
                transparent 18%,
                transparent 38%,
                rgba(8,6,4,0.65) 55%,
                rgba(8,6,4,0.92) 72%,
                rgba(8,6,4,1) 100%
              ),
              linear-gradient(90deg, rgba(8,6,4,0.35) 0%, transparent 12%, transparent 88%, rgba(8,6,4,0.35) 100%)
            `,
            pointerEvents: 'none', zIndex: 3,
          }} />

          {/* ── Top-right accent bleed ── */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '70px', height: '70px',
            background: `linear-gradient(225deg, ${accent}25 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 0.35s ease',
            pointerEvents: 'none', zIndex: 4,
          }} />

          {/* ── Energy sweep on hover ── */}
          {hovered && (
            <div
              key={sweepKey}
              style={{
                position: 'absolute', top: 0, bottom: 0, width: '80px',
                background: `linear-gradient(90deg, transparent, ${accent}35, ${accent}15, transparent)`,
                animation: 'energySweep 0.7s ease-out forwards',
                pointerEvents: 'none', zIndex: 9,
              }}
            />
          )}

          {/* ── Level badge ── */}
          <LevelBadge level={totalLevel} accent={accent} pulse={hovered} />

          {/* ── Bottom accent sweep ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent 0%, ${accent}80 20%, ${accent} 50%, ${accent}80 80%, transparent 100%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease', zIndex: 9,
            boxShadow: `0 0 12px ${accent}60, 0 0 30px ${accent}25`,
          }} />

          {/* ── Top accent line ── */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: `linear-gradient(90deg, transparent 10%, ${accent}50 50%, transparent 90%)`,
            opacity: hovered ? 0.8 : 0,
            transition: 'opacity 0.3s ease', zIndex: 9,
          }} />

          {/* ── Content ── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: '0 18px 18px',
            zIndex: 6,
          }}>
            {/* Signature ability — appears on hover */}
            <div style={{
              marginBottom: '8px',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(6px)',
              transition: 'all 0.35s ease',
            }}>
              <span className="font-display italic" style={{
                fontSize: '10px',
                color: accent,
                letterSpacing: '0.05em',
                textShadow: `0 0 20px ${accent}40`,
              }}>
                {meta.signature}
              </span>
            </div>

            {/* Role pill */}
            <div style={{ marginBottom: '6px' }}>
              <RolePill role={meta.role} accent={accent} />
            </div>

            {/* Class */}
            <p className="font-serif" style={{
              fontSize: '9px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: accent, opacity: 0.85,
              marginBottom: '4px',
            }}>
              {pc.category}
            </p>

            {/* Name */}
            <h2 className="font-serif font-black uppercase" style={{
              fontSize: 'clamp(1.3rem, 2.2vw, 1.7rem)',
              letterSpacing: '0.06em',
              lineHeight: 0.95,
              color: 'hsl(15 4% 96%)',
              textShadow: hovered
                ? `0 0 40px ${accent}80, 0 0 80px ${accent}40, 0 0 120px ${accent}20, 0 2px 4px rgba(0,0,0,0.9)`
                : `0 0 20px ${accent}25, 0 2px 4px rgba(0,0,0,0.8)`,
              marginBottom: '5px',
              transition: 'text-shadow 0.4s ease',
            }}>
              {pc.name}
            </h2>

            {/* Player */}
            <p className="font-display" style={{
              fontSize: '10px', color: 'hsl(15 4% 32%)',
              letterSpacing: '0.08em', marginBottom: '6px',
            }}>
              Played by {pc.player}
            </p>

            {/* Quote — clamped */}
            <div style={{
              borderLeft: `2px solid ${accent}50`,
              paddingLeft: '10px',
              opacity: hovered ? 0.9 : 0.5,
              transition: 'opacity 0.35s ease',
            }}>
              <p className="font-display italic" style={{
                fontSize: '10px',
                color: 'hsl(15 4% 50%)',
                lineHeight: 1.55,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}>
                {quote}
              </p>
            </div>

            {/* Hover CTA */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginTop: '10px',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                height: '1px', flex: 1,
                background: `linear-gradient(90deg, ${accent}60, transparent)`,
              }} />
              <span className="font-serif uppercase" style={{
                fontSize: '8px', letterSpacing: '0.25em', color: accent,
              }}>
                View Chronicle
              </span>
              <span style={{ color: accent, fontSize: '10px' }}>&rarr;</span>
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
      transition={{ duration: 0.6, delay: 0.6 }}
      style={{
        height: '100%',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '22px',
        display: 'flex', flexDirection: 'column', gap: '14px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Corner glows */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '150px', height: '150px',
        background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30px', left: '-30px',
        width: '120px', height: '120px',
        background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 65%)',
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

      {/* Role pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {pcs.map(pc => {
          const m = CHARACTER_META[pc.id];
          const a = pc.accentColor || 'hsl(25 100% 38%)';
          return (
            <div key={pc.id} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: `${a}10`, border: `1px solid ${a}30`,
              borderRadius: '20px', padding: '4px 10px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: a, boxShadow: `0 0 8px ${a}70`,
                animation: 'badgePulse 3s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: a, fontFamily: 'Cinzel, serif',
              }}>
                {m?.role || 'Adventurer'}
              </span>
              <span style={{ fontSize: '9px', color: 'hsl(15 4% 45%)', fontFamily: 'EB Garamond, serif' }}>
                {pc.name?.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stat leaders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {statLeaders.map(({ stat, value, pc: leader }) => {
          const a = leader?.accentColor || 'hsl(25 100% 38%)';
          const firstName = leader?.name?.split(' ')[0] || '';
          return (
            <div key={stat} style={{
              background: 'rgba(255,255,255,0.025)',
              borderRadius: '8px', padding: '7px 8px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: '9px', color: 'hsl(15 4% 40%)', letterSpacing: '0.1em', marginBottom: '1px' }}>
                {stat}
              </div>
              <div style={{
                fontSize: '15px', fontWeight: 700, color: a, fontFamily: 'Cinzel, serif',
                textShadow: `0 0 10px ${a}30`,
              }}>
                {value}
              </div>
              <div style={{ fontSize: '8px', color: 'hsl(15 4% 32%)', marginTop: '1px' }}>
                {firstName}
              </div>
            </div>
          );
        })}
      </div>

      {/* HP bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '9px', color: 'hsl(15 4% 40%)', letterSpacing: '0.1em' }}>COMBINED HP</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(15 4% 80%)', fontFamily: 'Cinzel, serif' }}>{totalHP}</span>
        </div>
        <div style={{
          height: '5px', borderRadius: '3px', overflow: 'hidden',
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
        }}>
          {pcs.map(pc => {
            const pct = totalHP > 0 ? ((pc.hp ?? 0) / totalHP) * 100 : 25;
            const a = pc.accentColor || 'hsl(25 100% 38%)';
            return (
              <div key={pc.id} style={{
                width: `${pct}%`, height: '100%', background: a,
                boxShadow: `0 0 8px ${a}40`,
                transition: 'width 0.6s ease',
              }} />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingTop: '10px', marginTop: 'auto',
      }}>
        {[
          { label: 'Members', value: String(pcs.length), color: 'hsl(15 4% 85%)' },
          { label: 'Avg Level', value: String(avgLevel), color: 'hsl(15 4% 85%)' },
          { label: 'Total HP', value: String(totalHP), color: 'hsl(25 100% 38%)' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              fontSize: '17px', fontWeight: 700, color: item.color, fontFamily: 'Cinzel, serif',
              textShadow: item.color.includes('25 100%') ? '0 0 10px rgba(201,168,76,0.3)' : 'none',
            }}>
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

// ─── Campaign Progress ──────────────────────────────────────────────────────────

function CampaignProgress({ sessions, entityCount }: { sessions: SessionEntry[]; entityCount: number }) {
  const sorted = useMemo(() =>
    [...sessions].sort((a, b) => b.number - a.number),
    [sessions]
  );
  const latest = sorted[0];
  const sessionCount = sessions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      style={{
        height: '100%',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '22px',
        display: 'flex', flexDirection: 'column', gap: '14px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Atmospheric glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div>
        <p className="font-serif uppercase" style={{
          fontSize: '9px', letterSpacing: '0.25em', color: 'hsl(25 100% 38%)',
          marginBottom: '3px',
        }}>
          Campaign Chronicle
        </p>
        <h3 className="font-serif font-bold" style={{ fontSize: '17px', color: 'hsl(15 4% 90%)' }}>
          Pathways Unseen
        </h3>
      </div>

      {/* Session timeline dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        {sorted.slice().reverse().map((s, i) => {
          const isLatest = s.number === latest?.number;
          return (
            <div key={s.number} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: isLatest ? '10px' : '6px',
                height: isLatest ? '10px' : '6px',
                borderRadius: '2px',
                transform: 'rotate(45deg)',
                background: isLatest ? 'hsl(25 100% 38%)' : 'hsl(15 8% 20%)',
                boxShadow: isLatest ? '0 0 10px rgba(201,168,76,0.5)' : 'none',
                animation: isLatest ? 'badgePulse 2.5s ease-in-out infinite' : 'none',
                transition: 'all 0.3s ease',
              }} />
              {i < sorted.length - 1 && (
                <div style={{
                  width: '8px', height: '1px',
                  background: 'hsl(15 8% 16%)',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Latest session */}
      {latest && (
        <Link href={`/sessions/${latest.slug}`}>
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px', padding: '12px',
            cursor: 'pointer',
            transition: 'border-color 0.3s ease',
          }}>
            <p style={{
              fontSize: '9px', color: 'hsl(25 100% 38%)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'Cinzel, serif',
            }}>
              Session {latest.number}
            </p>
            <p className="font-serif" style={{
              fontSize: '14px', color: 'hsl(15 4% 82%)', lineHeight: 1.3,
              marginBottom: '4px',
            }}>
              {latest.title}
            </p>
            {latest.date && (
              <p style={{ fontSize: '9px', color: 'hsl(15 4% 35%)' }}>
                {latest.date}
              </p>
            )}
          </div>
        </Link>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex', gap: '16px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingTop: '12px', marginTop: 'auto',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '22px', fontWeight: 700,
            color: 'hsl(25 100% 38%)', fontFamily: 'Cinzel, serif',
            textShadow: '0 0 12px rgba(201,168,76,0.25)',
          }}>
            {sessionCount}
          </div>
          <div style={{ fontSize: '8px', color: 'hsl(15 4% 35%)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Sessions
          </div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '22px', fontWeight: 700,
            color: 'hsl(15 4% 80%)', fontFamily: 'Cinzel, serif',
          }}>
            {entityCount}
          </div>
          <div style={{ fontSize: '8px', color: 'hsl(15 4% 35%)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Entities
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export function Characters() {
  const [pcs, setPcs] = useState<PCFull[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [entityCount, setEntityCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      vaultService.getByType('PC'),
      vaultService.getSessions().catch(() => []),
      vaultService.getIndex().then(idx => idx.entities.length).catch(() => 0),
    ]).then(([pcEntities, sessData, count]) => {
      setPcs(pcEntities as PCFull[]);
      setSessions(sessData);
      setEntityCount(count);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      {/* ── Cinematic Hero Banner ── */}
      {!loading && pcs.length > 0 ? (
        <HeroBanner pcs={pcs} />
      ) : (
        <div className="hero-banner-container" style={{
          background: 'hsl(15 6% 6%)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
      )}

      {/* ── Content Below Banner ── */}
      <div className="max-w-6xl mx-auto px-5" style={{ position: 'relative', zIndex: 2, marginTop: '-20px' }}>

        {/* ── 4 Compact Character Tiles ── */}
        {loading ? (
          <div className="bento-cinematic-row">
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                height: '100%', borderRadius: '10px',
                background: 'hsl(20 6% 9%)',
                border: '1px solid hsl(15 8% 13%)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : (
          <div className="bento-cinematic-row">
            {pcs.map((pc, i) => (
              <CompactCard key={pc.id} pc={pc} index={i} />
            ))}
          </div>
        )}

        {/* ── Bottom Row: Stats + Campaign ── */}
        <div className="bento-cinematic-bottom">
          {!loading && (
            <>
              <div style={{ gridArea: 'stats' }}>
                <PartyStats pcs={pcs} />
              </div>
              <div style={{ gridArea: 'campaign' }}>
                <CampaignProgress sessions={sessions} entityCount={entityCount} />
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && pcs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-12 mb-16"
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
