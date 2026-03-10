import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { vaultService } from '../vaultService';
import type { VaultEntity, SessionEntry } from '../types';

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

// Accent colors per brief spec
const CHARACTER_COLORS: Record<string, string> = {
  'pc-cannonball-kar-thul':  'rgb(226, 46, 18)',
  'pc-bpop':                 'rgb(211, 161, 23)',
  'pc-iblith-gorch':         'rgb(116, 57, 198)',
  'pc-morrighan-bustlewing': 'rgb(92, 71, 194)',
};

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

// Rotating quotes for the carousel (bottom-left panel)
const CAROUSEL_QUOTES = [
  { text: '\u201CYou exploded her?\u201D Drevlyn said. \u201CBrilliant.\u201D', attribution: 'Cannonball Kar-thul', pcId: 'pc-cannonball-kar-thul' },
  { text: 'He looked at every fortress the world had built against creatures of his kind and quietly, methodically, found the door.', attribution: 'Bpop', pcId: 'pc-bpop' },
  { text: 'Not for greed. Not for revenge. For proof. For purpose.', attribution: 'Iblith Gorch', pcId: 'pc-iblith-gorch' },
  { text: '\u201C\u2026to ensure that death claims only what it must \u2014 or perhaps, what it should not.\u201D', attribution: 'Morrighan Bustlewing', pcId: 'pc-morrighan-bustlewing' },
  { text: 'Four souls carried into the dark by forces none of them chose. The remarkable thing was not that they survived. It was that they still had opinions about it.', attribution: 'Campaign Chronicle', pcId: '' },
];

const CARD_QUOTES: Record<string, string> = {
  'pc-cannonball-kar-thul': '\u201CYou exploded her?\u201D Drevlyn said. \u201CBrilliant.\u201D',
  'pc-bpop': 'He looked at every fortress the world had built against creatures of his kind and quietly, methodically, found the door.',
  'pc-iblith-gorch': 'Not for greed. Not for revenge. For proof. For purpose.',
  'pc-morrighan-bustlewing': '\u201C\u2026to ensure that death claims only what it must \u2014 or perhaps, what it should not.\u201D',
};

// Banner strip positioning
const BANNER_POSITIONS = [
  { left: '0%',  width: '32%' },
  { left: '22%', width: '30%' },
  { left: '46%', width: '30%' },
  { left: '70%', width: '32%' },
];

function getAccent(pc: PCFull): string {
  return CHARACTER_COLORS[pc.id] || pc.accentColor || 'hsl(25 100% 38%)';
}

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
          background: ['rgb(226,46,18)', 'rgb(240,100,30)', 'rgb(255,140,20)', 'rgb(200,40,10)'][i % 4],
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
          background: ['rgb(92,71,194)', 'rgb(130,100,220)', 'rgb(110,85,210)', 'rgb(80,60,180)'][i % 4],
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
          background: ['rgb(211,161,23)', 'rgb(230,180,40)', 'rgb(200,150,10)', 'rgb(240,190,50)'][i % 4],
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
          background: ['rgb(116,57,198)', 'rgb(90,40,170)', 'rgb(70,30,150)', 'rgb(60,25,130)'][i % 4],
          filter: `blur(${r(14, 24)}px)`,
          animation: `shadowDrift ${r(5, 10)}s ease-in-out ${r(0, 6)}s infinite`,
          '--start-x': `${r(-25, 25)}px`,
          '--end-x': `${r(-50, 50)}px`,
          pointerEvents: 'none' as const,
          zIndex: 2,
          opacity: 0.4,
        }));

      default:
        return [];
    }
  }, [type, count]);

  return <>{particles.map((s, i) => <div key={i} style={s as React.CSSProperties} />)}</>;
}

// ─── Runic Glyph Separator (Option A from brief) ───────────────────────────────

function RunicGlyph({ x }: { x: string }) {
  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 12,
      pointerEvents: 'none',
    }}>
      <svg width="22" height="22" viewBox="0 0 22 22" style={{
        animation: 'glyphBreath 4s ease-in-out infinite',
      }}>
        <polygon
          points="11,1 14,8 21,8 15.5,13 17.5,20 11,16 4.5,20 6.5,13 1,8 8,8"
          fill="none"
          stroke="rgba(201,168,76,0.4)"
          strokeWidth="1"
          style={{ filter: 'drop-shadow(0 0 4px rgba(201,168,76,0.3))' }}
        />
      </svg>
    </div>
  );
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
  const bannerShift = scrollY * 0.25;

  // Glyph positions at column boundaries
  const glyphPositions = ['27%', '48%', '73%'];

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
          const accent = getAccent(pc);
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

              <CharacterParticles type={meta?.particleType || 'ember'} count={10} />

              {/* Accent light pillar */}
              <div style={{
                position: 'absolute', bottom: 0, left: '30%', right: '30%', height: '100%',
                background: `linear-gradient(to top, ${accent}40 0%, ${accent}10 40%, transparent 70%)`,
                pointerEvents: 'none', zIndex: 3,
              }} />
            </div>
          );
        })}

        {/* ── Runic Glyph Separators (Option A) ── */}
        {glyphPositions.map(x => <RunicGlyph key={x} x={x} />)}

        {/* ── Atmospheric fog ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(226,46,18,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(92,71,194,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.07) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />

        {/* ── Heavy vignette ── */}
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

        {/* ── Film grain ── */}
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}
        >
          <div style={{ height: '1px', width: '80px', background: 'linear-gradient(to right, transparent, hsl(25 100% 32%))' }} />
          <p className="font-serif uppercase" style={{
            fontSize: '10px', letterSpacing: '0.35em', color: 'hsl(25 100% 40%)',
          }}>
            Pathways Unseen &middot; Karnuk, The Underdark
          </p>
          <div style={{ height: '1px', width: '80px', background: 'linear-gradient(to left, transparent, hsl(25 100% 32%))' }} />
        </motion.div>

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
            textShadow: '0 0 120px rgba(201,168,76,0.25), 0 0 60px rgba(201,168,76,0.15), 0 4px 20px rgba(0,0,0,0.8)',
            marginBottom: '14px',
            textAlign: 'center',
          }}
        >
          Bear Force One
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="font-display italic"
          style={{
            fontSize: '15px', color: 'hsl(15 4% 48%)',
            maxWidth: '500px', textAlign: 'center', lineHeight: 1.65,
          }}
        >
          Brought together by fate&rsquo;s indifferent hand. Held together by something none of them would name aloud.
        </motion.p>

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

// ─── Level Badge ────────────────────────────────────────────────────────────────

function LevelBadge({ level, accent, pulse }: { level: number; accent: string; pulse?: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: '10px', right: '10px', zIndex: 8,
      background: 'rgba(8,6,4,0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${accent}`,
      borderRadius: '6px',
      padding: '3px 10px',
      display: 'flex', alignItems: 'center', gap: '4px',
      boxShadow: pulse
        ? `0 0 20px ${accent}, 0 0 40px ${accent}60`
        : `0 0 12px ${accent}40`,
      transition: 'box-shadow 0.4s ease',
      animation: pulse ? 'badgePulse 2s ease-in-out infinite' : 'none',
    }}>
      <span style={{ fontSize: '9px', color: accent, letterSpacing: '0.15em', fontFamily: 'Cinzel, serif', textTransform: 'uppercase' }}>
        Lvl
      </span>
      <span style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(15 4% 94%)', fontFamily: 'Cinzel, serif' }}>
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
      background: `${accent}25`,
      border: `1px solid ${accent}60`,
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
  const accent = getAccent(pc);
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
            border: `1px solid ${hovered ? accent : 'hsl(15 8% 13%)'}`,
            boxShadow: hovered
              ? `0 0 0 1px ${accent}20, 0 20px 60px -10px ${accent}50, 0 40px 100px -25px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)`
              : '0 4px 20px -4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.02)',
            transform: hovered ? 'translateY(-12px) scale(1.015)' : 'translateY(0) scale(1)',
            transition: 'all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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

          {/* Particles */}
          <CharacterParticles type={meta.particleType} count={hovered ? 16 : 10} />

          {/* Accent fog */}
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

          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              linear-gradient(180deg,
                rgba(8,6,4,0.35) 0%, transparent 18%, transparent 38%,
                rgba(8,6,4,0.65) 55%, rgba(8,6,4,0.92) 72%, rgba(8,6,4,1) 100%
              ),
              linear-gradient(90deg, rgba(8,6,4,0.35) 0%, transparent 12%, transparent 88%, rgba(8,6,4,0.35) 100%)
            `,
            pointerEvents: 'none', zIndex: 3,
          }} />

          {/* Top-right accent bleed */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: '70px', height: '70px',
            background: `linear-gradient(225deg, ${accent}30 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 0.35s ease',
            pointerEvents: 'none', zIndex: 4,
          }} />

          {/* Energy sweep on hover */}
          {hovered && (
            <div key={sweepKey} style={{
              position: 'absolute', top: 0, bottom: 0, width: '80px',
              background: `linear-gradient(90deg, transparent, ${accent}40, ${accent}15, transparent)`,
              animation: 'energySweep 0.7s ease-out forwards',
              pointerEvents: 'none', zIndex: 9,
            }} />
          )}

          {/* Level badge */}
          <LevelBadge level={totalLevel} accent={accent} pulse={hovered} />

          {/* Bottom accent sweep */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease', zIndex: 9,
            boxShadow: `0 0 12px ${accent}, 0 0 30px ${accent}60`,
          }} />

          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: `linear-gradient(90deg, transparent 10%, ${accent}60 50%, transparent 90%)`,
            opacity: hovered ? 0.8 : 0,
            transition: 'opacity 0.3s ease', zIndex: 9,
          }} />

          {/* Content — no class/race badge, no "Played by" per brief */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '0 18px 18px', zIndex: 6,
          }}>
            {/* Signature ability on hover */}
            <div style={{
              marginBottom: '8px',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(6px)',
              transition: 'all 0.35s ease',
            }}>
              <span className="font-display italic" style={{
                fontSize: '10px', color: accent, letterSpacing: '0.05em',
                textShadow: `0 0 20px ${accent}50`,
              }}>
                {meta.signature}
              </span>
            </div>

            {/* Role pill */}
            <div style={{ marginBottom: '6px' }}>
              <RolePill role={meta.role} accent={accent} />
            </div>

            {/* Name */}
            <h2 className="font-serif font-black uppercase" style={{
              fontSize: 'clamp(1.3rem, 2.2vw, 1.7rem)',
              letterSpacing: '0.06em',
              lineHeight: 0.95,
              color: 'hsl(15 4% 96%)',
              textShadow: hovered
                ? `0 0 40px ${accent}, 0 0 80px ${accent}60, 0 0 120px ${accent}30, 0 2px 4px rgba(0,0,0,0.9)`
                : `0 0 20px ${accent}40, 0 2px 4px rgba(0,0,0,0.8)`,
              marginBottom: '8px',
              transition: 'text-shadow 0.4s ease',
            }}>
              {pc.name}
            </h2>

            {/* Quote — 13px min, 3-line clamp, accent left border per brief */}
            <div style={{
              borderLeft: `2px solid ${accent}70`,
              paddingLeft: '10px',
              opacity: hovered ? 1 : 0.7,
              transition: 'opacity 0.35s ease',
            }}>
              <p className="font-display italic" style={{
                fontSize: '13px',
                color: 'hsl(15 4% 58%)',
                lineHeight: 1.55,
                display: '-webkit-box',
                WebkitLineClamp: 3,
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

// ─── Quote Carousel (Bottom Left — replaces Party Stats) ────────────────────────

function QuoteCarousel({ pcs }: { pcs: PCFull[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % CAROUSEL_QUOTES.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (idx: number) => {
    setActiveIdx(idx);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % CAROUSEL_QUOTES.length);
    }, 5000);
  };

  const current = CAROUSEL_QUOTES[activeIdx];
  const quoteAccent = current.pcId
    ? CHARACTER_COLORS[current.pcId] || 'hsl(25 100% 38%)'
    : 'hsl(25 100% 38%)';

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
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '150px', height: '150px',
        background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <p className="font-serif uppercase" style={{
          fontSize: '9px', letterSpacing: '0.25em', color: 'hsl(25 100% 38%)',
          marginBottom: '3px',
        }}>
          Words From the Dark
        </p>
        <h3 className="font-serif font-bold" style={{ fontSize: '17px', color: 'hsl(15 4% 90%)' }}>
          Bear Force One
        </h3>
      </div>

      {/* Quote area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-display italic" style={{
              fontSize: '17px',
              color: 'hsl(15 4% 72%)',
              lineHeight: 1.6,
              marginBottom: '12px',
            }}>
              {current.text}
            </p>
            <p style={{
              fontSize: '11px',
              color: quoteAccent,
              letterSpacing: '0.1em',
              fontFamily: 'Cinzel, serif',
            }}>
              &mdash; {current.attribution}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div style={{
        display: 'flex', gap: '8px', justifyContent: 'center',
        marginTop: '16px', marginBottom: '14px',
      }}>
        {CAROUSEL_QUOTES.map((q, i) => {
          const dotColor = q.pcId ? CHARACTER_COLORS[q.pcId] || 'hsl(25 100% 38%)' : 'hsl(25 100% 38%)';
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === activeIdx ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === activeIdx ? dotColor : 'hsl(15 8% 20%)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: i === activeIdx ? `0 0 8px ${dotColor}60` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Member color tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {pcs.map(pc => {
          const a = getAccent(pc);
          const m = CHARACTER_META[pc.id];
          return (
            <div key={pc.id} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: `${a}10`, border: `1px solid ${a}30`,
              borderRadius: '20px', padding: '3px 9px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: a, boxShadow: `0 0 6px ${a}60`,
              }} />
              <span style={{
                fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase',
                color: a, fontFamily: 'Cinzel, serif',
              }}>
                {m?.role}
              </span>
              <span style={{ fontSize: '8px', color: 'hsl(15 4% 40%)' }}>
                {pc.name?.split(' ')[0]}
              </span>
            </div>
          );
        })}
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
  const previous = sorted.slice(1, 4); // 3 previous sessions
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
        display: 'flex', flexDirection: 'column', gap: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Glow */}
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

      {/* Latest session — featured */}
      {latest && (
        <Link href={`/sessions/${latest.slug}`}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '14px',
            cursor: 'pointer',
            transition: 'border-color 0.3s ease, background 0.3s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <p style={{
              fontSize: '9px', color: 'hsl(25 100% 38%)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'Cinzel, serif',
            }}>
              Session {latest.number} &middot; Latest
            </p>
            <p className="font-serif" style={{
              fontSize: '15px', color: 'hsl(15 4% 85%)', lineHeight: 1.3, marginBottom: '4px',
            }}>
              {latest.title}
            </p>
            {latest.date && (
              <p style={{ fontSize: '9px', color: 'hsl(15 4% 38%)' }}>{latest.date}</p>
            )}
          </div>
        </Link>
      )}

      {/* Previous sessions — 3 mini-blocks */}
      {previous.length > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {previous.map(s => (
            <Link key={s.slug} href={`/sessions/${s.slug}`}>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '6px', padding: '10px',
                cursor: 'pointer',
                transition: 'border-color 0.3s ease',
                minWidth: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
              >
                <p style={{
                  fontSize: '9px', color: 'hsl(25 100% 38%)', letterSpacing: '0.12em',
                  textTransform: 'uppercase', marginBottom: '3px', fontFamily: 'Cinzel, serif',
                }}>
                  S{s.number}
                </p>
                <p className="font-serif" style={{
                  fontSize: '11px', color: 'hsl(15 4% 60%)', lineHeight: 1.25,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                }}>
                  {s.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats footer */}
      <div style={{
        display: 'flex', gap: '16px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingTop: '10px', marginTop: 'auto',
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
      {/* Hero Banner */}
      {!loading && pcs.length > 0 ? (
        <HeroBanner pcs={pcs} />
      ) : (
        <div className="hero-banner-container" style={{
          background: 'hsl(15 6% 6%)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-5" style={{ position: 'relative', zIndex: 2, marginTop: '-20px' }}>
        {/* 4 Character Tiles */}
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

        {/* Bottom: Quote Carousel + Campaign */}
        <div className="bento-cinematic-bottom">
          {!loading && (
            <>
              <div style={{ gridArea: 'stats' }}>
                <QuoteCarousel pcs={pcs} />
              </div>
              <div style={{ gridArea: 'campaign' }}>
                <CampaignProgress sessions={sessions} entityCount={entityCount} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
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
