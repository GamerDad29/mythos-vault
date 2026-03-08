import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Shield, Zap, Wind, Eye, RefreshCw } from 'lucide-react';
import { vaultService } from '../vaultService';
import { SkeletonHero } from '../components/Skeleton';
import { renderContent } from '../utils/renderContent';
import { useAuth } from '../contexts/AuthContext';
import { IMAGE_STYLES, buildVaultImagePrompt, generateVaultImage, uploadImageToVaultGitHub } from '../services/imageService';
import { updateEntityImage } from '../services/githubService';
import { SKILL_TOOLTIPS, FEATURE_TOOLTIPS, GEAR_TOOLTIPS } from '../data/characterTooltips';
import type { VaultEntity, VaultEntityStub } from '../types';
import type { ImageStyleConfig } from '../services/imageService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PCClass { name: string; subclass?: string; level: number }
interface PCSkill { name: string; expertise?: boolean }
interface PCMoment { session: string; title: string; description: string }
interface Resistance { label: string; kind: 'resist' | 'immune' | 'advantage' }

interface PCEntity extends VaultEntity {
  player?: string; race?: string;
  classes?: PCClass[];
  background?: string; alignment?: string;
  accentColor?: string; imagePosition?: string;
  patron?: string; deity?: string;
  stats?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  hp?: number; ac?: number; speed?: string;
  initiative?: number; passivePerception?: number; proficiencyBonus?: number;
  savingThrows?: string[];
  spellcasting?: { ability: string; saveDC: number; attackBonus: number };
  skills?: PCSkill[];
  features?: string[]; spells?: string[]; gear?: string[];
  personality?: { traits: string; ideals: string; bonds: string; flaws: string };
  moments?: PCMoment[];
  resistances?: Resistance[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statMod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}
const STAT_LABELS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

// ─── Atmosphere Particle Data ─────────────────────────────────────────────────

const CANNONBALL_SPARKS = [
  { left: '5%',  delay: 0,    dur: 3.8, size: 3, drift: '10px',  opacity: 0.45 },
  { left: '18%', delay: 0.7,  dur: 4.5, size: 2, drift: '-8px',  opacity: 0.3  },
  { left: '35%', delay: 1.4,  dur: 3.5, size: 4, drift: '12px',  opacity: 0.5  },
  { left: '52%', delay: 2.1,  dur: 4.8, size: 2, drift: '-6px',  opacity: 0.25 },
  { left: '70%', delay: 0.3,  dur: 4.2, size: 3, drift: '8px',   opacity: 0.4  },
  { left: '85%', delay: 1.8,  dur: 5.0, size: 2, drift: '-10px', opacity: 0.3  },
];
const MORRIGHAN_MOTES = [
  { left: '12%', top: '20%', dur: 9,  driftX: 20,  driftY: -30, size: 4, opacity: 0.16 },
  { left: '30%', top: '45%', dur: 12, driftX: -15, driftY: -40, size: 3, opacity: 0.11 },
  { left: '55%', top: '15%', dur: 10, driftX: 10,  driftY: -25, size: 5, opacity: 0.13 },
  { left: '72%', top: '60%', dur: 14, driftX: -20, driftY: -50, size: 3, opacity: 0.09 },
  { left: '88%', top: '35%', dur: 11, driftX: 8,   driftY: -35, size: 4, opacity: 0.14 },
];
const BPOP_SPARKS = [
  { left: '8%',  delay: 0,   dur: 3.2, size: 2, drift: '6px',  opacity: 0.4  },
  { left: '22%', delay: 0.5, dur: 4.0, size: 2, drift: '-4px', opacity: 0.28 },
  { left: '40%', delay: 1.2, dur: 3.6, size: 3, drift: '8px',  opacity: 0.35 },
  { left: '65%', delay: 0.8, dur: 4.4, size: 2, drift: '-6px', opacity: 0.3  },
  { left: '82%', delay: 1.9, dur: 3.8, size: 2, drift: '5px',  opacity: 0.38 },
];

// ─── Character Atmosphere ─────────────────────────────────────────────────────

function CharacterAtmosphere({ entityId, accent }: { entityId: string; accent: string }) {
  if (entityId === 'pc-cannonball-kar-thul') {
    return (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {CANNONBALL_SPARKS.map((s, i) => (
          <motion.div key={i}
            style={{ position: 'absolute', bottom: 0, left: s.left, width: `${s.size}px`, height: `${s.size}px`, borderRadius: '50%', background: 'hsl(15 90% 62%)' }}
            animate={{ y: [0, -200], x: [0, parseFloat(s.drift)], opacity: [0, s.opacity, 0] }}
            transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `radial-gradient(ellipse at 50% 100%, ${accent}07 0%, transparent 65%)` }} />
      </div>
    );
  }

  if (entityId === 'pc-morrighan-bustlewing') {
    return (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {MORRIGHAN_MOTES.map((m, i) => (
          <motion.div key={i}
            style={{ position: 'absolute', left: m.left, top: m.top, width: `${m.size}px`, height: `${m.size}px`, borderRadius: '50%', background: 'hsl(250 55% 72%)', boxShadow: `0 0 ${m.size * 3}px hsl(250 55% 72%)` }}
            animate={{ x: [0, m.driftX, 0], y: [0, m.driftY, 0], opacity: [0, m.opacity, m.opacity * 0.3, m.opacity, 0] }}
            transition={{ duration: m.dur, delay: i * 1.6, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
          />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(155,89,182,0.04) 0%, transparent 55%)' }} />
      </div>
    );
  }

  if (entityId === 'pc-iblith-gorch') {
    return (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,3,2,0.4) 0%, transparent 18%, transparent 82%, rgba(4,3,2,0.4) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,3,2,0.35) 0%, transparent 20%)' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '280px', background: `radial-gradient(ellipse at 50% 0%, ${accent}04 0%, transparent 60%)` }} />
      </div>
    );
  }

  if (entityId === 'pc-bpop') {
    return (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {BPOP_SPARKS.map((s, i) => (
          <motion.div key={i}
            style={{ position: 'absolute', bottom: '8%', left: s.left, width: `${s.size}px`, height: `${s.size + 1}px`, borderRadius: '1px', background: '#D4A017' }}
            animate={{ y: [0, -90], x: [0, parseFloat(s.drift), parseFloat(s.drift) * 1.4], opacity: [0, s.opacity, 0] }}
            transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: `radial-gradient(ellipse at 40% 100%, ${accent}05 0%, transparent 55%)` }} />
      </div>
    );
  }

  // Default
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '1000px', height: '500px', background: `radial-gradient(ellipse at 50% 0%, ${accent}06 0%, transparent 60%)` }} />
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
  children: React.ReactNode;
  definition: string;
  flavor?: string;
  homebrew?: boolean;
  accent: string;
}

function Tooltip({ children, definition, flavor, homebrew, accent }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  function handleEnter() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.left, width: rect.width });
      setVisible(true);
    }
  }

  const isAboveCenter = coords.top < window.innerHeight / 2;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setVisible(false)}
        style={{
          borderBottom: `1px dashed ${accent}50`,
          cursor: 'help',
          transition: 'border-color 0.2s',
        }}
        onMouseOver={e => ((e.currentTarget as HTMLElement).style.borderBottomColor = accent)}
        onMouseOut={e => ((e.currentTarget as HTMLElement).style.borderBottomColor = `${accent}50`)}
      >
        {children}
      </span>
      {visible && createPortal(
        <div style={{
          position: 'fixed',
          top: isAboveCenter ? coords.top + 28 : coords.top - 8,
          left: Math.min(coords.left, window.innerWidth - 340),
          transform: isAboveCenter ? 'none' : 'translateY(-100%)',
          zIndex: 9999,
          maxWidth: '320px',
          minWidth: '200px',
          background: 'hsl(15 6% 7%)',
          border: `1px solid ${accent}35`,
          borderRadius: '6px',
          padding: '12px 16px',
          boxShadow: `0 8px 40px -8px rgba(0,0,0,0.85), 0 0 20px -8px ${accent}25`,
          pointerEvents: 'none',
        }}>
          {homebrew && (
            <span style={{
              display: 'inline-block',
              background: `${accent}18`, border: `1px solid ${accent}45`,
              borderRadius: '3px', padding: '1px 7px', marginBottom: '7px',
              fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase',
              fontFamily: 'serif', color: accent,
            }}>
              Homebrew
            </span>
          )}
          <p style={{ fontSize: '13px', color: 'hsl(15 4% 72%)', lineHeight: 1.6, marginBottom: flavor ? '8px' : 0 }}>
            {definition}
          </p>
          {flavor && (
            <p className="font-display italic" style={{
              fontSize: '12px', color: 'hsl(15 4% 50%)', lineHeight: 1.65,
              borderTop: '1px solid hsl(15 8% 14%)', paddingTop: '8px',
            }}>
              {flavor}
            </p>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({ label, score, accent, isHighest }: { label: string; score: number; accent: string; isHighest: boolean }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '14px 10px 12px',
      borderRadius: '5px',
      flex: 1, minWidth: '54px',
      background: isHighest
        ? `linear-gradient(180deg, ${accent}20 0%, ${accent}0a 100%)`
        : 'linear-gradient(180deg, hsl(20 6% 11%) 0%, hsl(20 6% 9%) 100%)',
      border: `1px solid ${isHighest ? accent + '55' : 'hsl(15 8% 16%)'}`,
      boxShadow: isHighest ? `0 0 20px -6px ${accent}40, inset 0 1px 0 ${accent}20` : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      transition: 'all 0.2s ease',
    }}>
      <div className="font-serif" style={{
        fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
        color: isHighest ? accent : 'hsl(15 4% 35%)', marginBottom: '6px',
      }}>
        {label}
      </div>
      <div className="font-serif font-black" style={{
        fontSize: '1.75rem', lineHeight: 1,
        color: isHighest ? 'hsl(15 4% 96%)' : 'hsl(15 4% 82%)',
        textShadow: isHighest ? `0 0 20px ${accent}60` : 'none',
        animation: isHighest ? `skillPulse 3s ease-in-out infinite` : 'none',
      }}>
        {score}
      </div>
      <div style={{ width: '24px', height: '1px', margin: '6px auto 5px', background: isHighest ? `${accent}60` : 'hsl(15 8% 20%)' }} />
      <div className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: isHighest ? accent : 'hsl(15 4% 50%)' }}>
        {statMod(score)}
      </div>
    </div>
  );
}

// ─── Sidebar Section ──────────────────────────────────────────────────────────

function SidebarSection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: '22px',
      background: 'linear-gradient(135deg, hsl(20 6% 9%) 0%, hsl(15 6% 10%) 100%)',
      border: '1px solid hsl(15 8% 14%)',
      borderRadius: '6px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px',
        background: `linear-gradient(90deg, ${accent}15 0%, transparent 100%)`,
        borderBottom: '1px solid hsl(15 8% 14%)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{ width: '2px', height: '13px', background: accent, borderRadius: '1px', flexShrink: 0 }} />
        <span className="font-serif uppercase" style={{ fontSize: '10px', letterSpacing: '0.25em', color: accent }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

// ─── Personality Inset ────────────────────────────────────────────────────────

function PersonalityInset({ p, accent }: { p: NonNullable<PCEntity['personality']>; accent: string }) {
  return (
    <div>
      {[
        { label: 'Traits', value: p.traits },
        { label: 'Ideals', value: p.ideals },
        { label: 'Bonds', value: p.bonds },
        { label: 'Flaws', value: p.flaws },
      ].map(({ label, value }, i) => (
        <div key={label} style={{
          marginBottom: i < 3 ? '10px' : 0,
          paddingBottom: i < 3 ? '10px' : 0,
          borderBottom: i < 3 ? '1px solid hsl(15 8% 14%)' : 'none',
        }}>
          <span className="font-serif uppercase" style={{
            fontSize: '10px', letterSpacing: '0.18em',
            color: accent, display: 'block', marginBottom: '4px',
          }}>
            {label}
          </span>
          <p className="font-display italic" style={{
            fontSize: '13px', color: 'hsl(15 4% 55%)', lineHeight: 1.65,
          }}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Campaign Chronicles ───────────────────────────────────────────────────────

function CampaignChronicles({ moments, accent }: { moments: PCMoment[]; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{
        marginTop: '32px',
        background: 'linear-gradient(135deg, hsl(20 6% 8%) 0%, hsl(15 6% 9%) 100%)',
        border: '1px solid hsl(15 8% 14%)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '18px 28px',
        borderBottom: '1px solid hsl(15 8% 14%)',
        background: `linear-gradient(90deg, ${accent}10 0%, transparent 60%)`,
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <div style={{ width: '3px', height: '18px', background: accent, borderRadius: '2px' }} />
        <span className="font-serif font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.3em', color: accent }}>
          Tales from the Campaign
        </span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, hsl(15 8% 18%), transparent)' }} />
      </div>

      {/* Timeline */}
      <div style={{ padding: '24px 28px', position: 'relative' }}>
        {/* Vertical connecting line */}
        <div style={{
          position: 'absolute',
          left: '44px',
          top: '28px',
          bottom: '28px',
          width: '1px',
          background: `linear-gradient(to bottom, ${accent}50, ${accent}25, transparent)`,
          pointerEvents: 'none',
        }} />

        {moments.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '72px 1fr',
              gap: '0',
              marginBottom: i < moments.length - 1 ? '28px' : 0,
              alignItems: 'start',
              position: 'relative',
            }}
          >
            {/* Session node column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingRight: '20px', paddingTop: '2px' }}>
              {/* Diamond node */}
              <div style={{
                width: '9px', height: '9px',
                background: accent,
                borderRadius: '2px',
                transform: 'rotate(45deg)',
                boxShadow: `0 0 12px -2px ${accent}80`,
                marginBottom: '7px',
                flexShrink: 0,
              }} />
              <span className="font-serif uppercase" style={{
                fontSize: '10px', letterSpacing: '0.12em', color: accent,
                opacity: 0.7, textAlign: 'center', lineHeight: 1.35,
              }}>
                {m.session}
              </span>
            </div>

            {/* Content */}
            <div style={{
              borderLeft: `1px solid ${accent}22`,
              paddingLeft: '20px',
            }}>
              <p className="font-display italic" style={{
                fontSize: '13px', color: accent, opacity: 0.8,
                marginBottom: '6px', lineHeight: 1.4,
              }}>
                {m.title}
              </p>
              <p className="font-display" style={{
                fontSize: '15px', color: 'hsl(15 4% 60%)', lineHeight: 1.7,
              }}>
                {m.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Resistance Badge ─────────────────────────────────────────────────────────

function ResistanceBadge({ resistance, accent }: { resistance: Resistance; accent: string }) {
  const kindColors: Record<string, string> = {
    resist: accent,
    immune: 'hsl(145 55% 48%)',
    advantage: 'hsl(210 65% 58%)',
  };
  const kindLabels: Record<string, string> = {
    resist: 'Resist',
    immune: 'Immune',
    advantage: '+Adv',
  };
  const color = kindColors[resistance.kind] || accent;
  const prefix = kindLabels[resistance.kind] || '';

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: `${color}12`,
      border: `1px solid ${color}35`,
      borderRadius: '4px', padding: '4px 10px',
    }}>
      <span className="font-serif uppercase" style={{ fontSize: '9px', letterSpacing: '0.12em', color, opacity: 0.75 }}>
        {prefix}:
      </span>
      <span className="font-display" style={{ fontSize: '11px', color: 'hsl(15 4% 65%)' }}>
        {resistance.label}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PCDetail() {
  const [, params] = useRoute('/characters/:slug');
  const slug = params?.slug || '';

  const [entity, setEntity] = useState<PCEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [imgHovered, setImgHovered] = useState(false);
  const [indexStubs, setIndexStubs] = useState<VaultEntityStub[]>([]);

  const [selectedStyle, setSelectedStyle] = useState<ImageStyleConfig>(IMAGE_STYLES[0]);
  const [regenStatus, setRegenStatus] = useState<'idle'|'generating'|'preview'|'committing'|'done'|'error'>('idle');
  const [regenError, setRegenError] = useState('');
  const [pendingImage, setPendingImage] = useState<{base64:string;mime:string;url:string}|null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);

  const { isDM } = useAuth();
  const pat = import.meta.env.VITE_GITHUB_PAT as string;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    vaultService.getEntity('PC', slug)
      .then(e => setEntity(e as PCEntity))
      .catch(() => setError('This chronicle entry has not been revealed.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    vaultService.getIndex().then(idx => setIndexStubs(idx.entities)).catch(() => {});
  }, []);

  async function handleGenerate() {
    if (!entity) return;
    setRegenStatus('generating'); setRegenError(''); setPendingImage(null);
    try {
      const prompt = customPrompt.trim() || buildVaultImagePrompt(entity, selectedStyle);
      if (!customPrompt.trim()) setCustomPrompt(prompt);
      const { imageBase64, mimeType } = await generateVaultImage(prompt);
      setPendingImage({ base64: imageBase64, mime: mimeType, url: `data:${mimeType};base64,${imageBase64}` });
      setRegenStatus('preview');
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Image generation failed');
      setRegenStatus('error');
    }
  }

  async function handleCommitImage() {
    if (!entity || !pendingImage) return;
    setRegenStatus('committing');
    try {
      const rawUrl = await uploadImageToVaultGitHub(entity.id, pendingImage.base64, pendingImage.mime);
      await updateEntityImage(entity, rawUrl, pat);
      setEntity(e => e ? { ...e, imageUrl: rawUrl } : null);
      setImgError(false); setPendingImage(null); setRegenStatus('done');
      setTimeout(() => setRegenStatus('idle'), 3000);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Commit failed');
      setRegenStatus('error');
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div style={{ height: '20px', width: '220px', background: 'hsl(20 6% 14%)', borderRadius: '4px', marginBottom: '32px' }} />
      <SkeletonHero />
    </div>
  );

  if (error || !entity) return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <p className="font-serif text-5xl mb-6" style={{ color: 'hsl(15 8% 20%)' }}>⟁</p>
        <h1 className="font-serif font-bold text-3xl uppercase tracking-wide mb-4" style={{ color: 'hsl(15 4% 70%)' }}>Chronicle Not Found</h1>
        <Link href="/characters"><span className="font-serif text-sm uppercase tracking-wider cursor-pointer" style={{ color: 'hsl(25 100% 38%)' }}>← Back to Characters</span></Link>
      </div>
    </div>
  );

  const accent = entity.accentColor || 'hsl(25 100% 38%)';
  const stats = entity.stats;
  const highestScore = stats ? Math.max(...Object.values(stats)) : 0;
  const totalLevel = (entity.classes || []).reduce((s, c) => s + c.level, 0);
  const skillTooltips = SKILL_TOOLTIPS[entity.id] || {};
  const featureTooltips = FEATURE_TOOLTIPS[entity.id] || {};
  const gearTooltips = GEAR_TOOLTIPS[entity.id] || {};

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      <CharacterAtmosphere entityId={entity.id} accent={accent} />

      <div className="max-w-5xl mx-auto px-6 py-12" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 mb-10 font-serif text-xs uppercase tracking-wider">
          {[['/', 'Chronicle'], ['/characters', 'Characters']].map(([href, label]) => (
            <>
              <Link key={href} href={href}>
                <span className="cursor-pointer transition-colors" style={{ color: 'hsl(15 4% 38%)' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = accent)}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 38%)')}>
                  {label}
                </span>
              </Link>
              <span key={href+'-sep'} style={{ color: 'hsl(15 8% 22%)' }}>›</span>
            </>
          ))}
          <span style={{ color: 'hsl(15 4% 62%)' }}>{entity.name}</span>
        </nav>

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '10px',
            border: `1px solid ${accent}35`,
            boxShadow: `0 0 80px -20px ${accent}35, 0 4px 40px -10px rgba(0,0,0,0.7)`,
            background: `linear-gradient(135deg, hsl(20 6% 8%) 0%, hsl(15 6% 10%) 100%)`,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ minHeight: '400px' }}>

            {/* Portrait */}
            <div
              onMouseEnter={() => setImgHovered(true)}
              onMouseLeave={() => setImgHovered(false)}
              style={{ position: 'relative', minHeight: '340px', background: `radial-gradient(ellipse at 40% 30%, hsl(20 8% 12%) 0%, hsl(15 6% 6%) 100%)`, overflow: 'hidden' }}
            >
              {entity.imageUrl && !imgError ? (
                <>
                  <img
                    src={entity.imageUrl} alt={entity.name}
                    className="w-full h-full object-cover"
                    style={{
                      minHeight: '340px', display: 'block',
                      objectPosition: entity.imagePosition || 'center top',
                      animation: imgHovered ? 'none' : 'kenBurns 30s ease-in-out infinite',
                      transform: imgHovered ? 'scale(1.06)' : undefined,
                      transition: imgHovered ? 'transform 0.6s ease' : undefined,
                      transformOrigin: 'center center',
                    }}
                    onError={() => setImgError(true)}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 90%, ${accent}22 0%, transparent 55%)`, pointerEvents: 'none' }} />
                  <div className="absolute inset-y-0 right-0 pointer-events-none hidden md:block" style={{ width: '90px', background: `linear-gradient(to right, transparent, hsl(20 6% 8%))` }} />
                  <div className="absolute inset-x-0 bottom-0 pointer-events-none md:hidden" style={{ height: '80px', background: `linear-gradient(to bottom, transparent, hsl(20 6% 8%))` }} />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '340px' }}>
                  <span style={{ fontSize: '6rem', opacity: 0.08, color: accent }}>⟁</span>
                </div>
              )}
            </div>

            {/* Identity panel */}
            <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-center" style={{ background: `linear-gradient(135deg, transparent 0%, ${accent}05 100%)` }}>
              {/* Class + Race badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {(entity.classes || []).map(cls => (
                  <span key={cls.name} style={{
                    background: `${accent}18`, border: `1px solid ${accent}44`,
                    borderRadius: '4px', color: accent,
                    fontSize: '10px', letterSpacing: '0.18em',
                    textTransform: 'uppercase', fontFamily: 'serif',
                    padding: '4px 10px', boxShadow: `0 0 12px -4px ${accent}40`,
                  }}>
                    {cls.name} {cls.level}{cls.subclass ? ` — ${cls.subclass}` : ''}
                  </span>
                ))}
                {entity.race && (
                  <span style={{
                    background: 'hsl(20 6% 12%)', border: '1px solid hsl(15 8% 20%)',
                    borderRadius: '4px', color: 'hsl(15 4% 48%)',
                    fontSize: '10px', letterSpacing: '0.18em',
                    textTransform: 'uppercase', fontFamily: 'serif', padding: '4px 10px',
                  }}>
                    {entity.race}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="font-serif font-black uppercase leading-none mb-2" style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                letterSpacing: '0.04em',
                color: 'hsl(15 4% 96%)',
                textShadow: `0 0 40px ${accent}40, 0 2px 8px rgba(0,0,0,0.6)`,
              }}>
                {entity.name}
              </h1>

              {/* Player */}
              {entity.player && (
                <p className="font-display mb-4" style={{ fontSize: '13px', color: 'hsl(15 4% 36%)', letterSpacing: '0.06em' }}>
                  Played by <span style={{ color: 'hsl(15 4% 50%)' }}>{entity.player}</span>
                </p>
              )}

              {/* Accent line */}
              <div style={{
                height: '2px', width: '48px', marginBottom: '16px',
                background: `linear-gradient(to right, ${accent}, ${accent}40)`,
                boxShadow: `0 0 12px ${accent}60`,
              }} />

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                {entity.background && <span className="font-display" style={{ fontSize: '13px', color: 'hsl(15 4% 44%)' }}>{entity.background}</span>}
                {entity.alignment && <span className="font-display" style={{ fontSize: '13px', color: 'hsl(15 4% 44%)' }}>· {entity.alignment}</span>}
              </div>

              <p className="font-serif uppercase" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'hsl(15 4% 30%)' }}>
                Pathways Unseen · Level {totalLevel}
              </p>

              {(entity as any).patron && (
                <p className="font-display italic mt-3" style={{ fontSize: '12px', color: 'hsl(15 4% 36%)' }}>
                  Patron: {(entity as any).patron}
                </p>
              )}

              {/* DM image regen */}
              {isDM && (
                <div style={{ marginTop: '22px', borderRadius: '6px', padding: '14px', background: 'rgba(10,8,6,0.6)', border: '1px solid hsl(15 8% 16%)' }}>
                  <p className="font-serif uppercase" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'hsl(15 4% 36%)', marginBottom: '10px' }}>
                    Regenerate Portrait
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {IMAGE_STYLES.map(s => (
                      <button key={s.id} onClick={() => { setSelectedStyle(s); setCustomPrompt(''); }}
                        style={{ background: selectedStyle.id === s.id ? `${s.accent}22` : 'transparent', border: `1px solid ${selectedStyle.id === s.id ? s.accent : 'hsl(15 8% 22%)'}`, borderRadius: '3px', color: selectedStyle.id === s.id ? s.accent : 'hsl(15 4% 46%)', padding: '3px 9px', fontFamily: 'serif', fontSize: '10px', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="font-mono" style={{ fontSize: '10px', color: 'hsl(15 4% 30%)', marginBottom: '8px' }}>
                    {selectedStyle.subtitle} · BFL FLUX 1.1 Pro · $0.04
                  </p>
                  <div style={{ marginBottom: '10px' }}>
                    <button onClick={() => { if (!promptOpen && !customPrompt.trim() && entity) setCustomPrompt(buildVaultImagePrompt(entity, selectedStyle)); setPromptOpen(o => !o); }}
                      style={{ background: 'transparent', border: 'none', color: customPrompt.trim() ? 'hsl(25 100% 45%)' : 'hsl(15 4% 34%)', fontFamily: 'serif', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '8px' }}>{promptOpen ? '▲' : '▼'}</span>
                      {customPrompt.trim() ? 'Custom Prompt Active' : 'View / Edit Prompt'}
                    </button>
                    {promptOpen && (
                      <div style={{ marginTop: '8px' }}>
                        <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={4}
                          style={{ width: '100%', background: 'hsl(15 6% 8%)', border: `1px solid ${customPrompt.trim() ? 'hsl(25 80% 28%)' : 'hsl(15 8% 20%)'}`, borderRadius: '3px', color: 'hsl(15 4% 60%)', fontFamily: 'monospace', fontSize: '10px', lineHeight: '1.6', padding: '8px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                        {customPrompt.trim() && <button onClick={() => setCustomPrompt('')} style={{ background: 'transparent', border: 'none', color: 'hsl(15 4% 30%)', fontFamily: 'serif', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '4px 0 0' }}>↺ Reset to auto</button>}
                      </div>
                    )}
                  </div>
                  {regenStatus === 'preview' && pendingImage && (
                    <div style={{ marginBottom: '10px' }}>
                      <img src={pendingImage.url} alt="preview" style={{ width: '100%', borderRadius: '3px', border: `1px solid ${selectedStyle.accent}44`, display: 'block' }} />
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleGenerate} disabled={regenStatus === 'generating' || regenStatus === 'committing'}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${selectedStyle.accent}18`, border: `1px solid ${selectedStyle.accent}`, borderRadius: '3px', color: selectedStyle.accent, padding: '5px 14px', fontFamily: 'serif', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: regenStatus === 'generating' || regenStatus === 'committing' ? 'not-allowed' : 'pointer', opacity: regenStatus === 'generating' || regenStatus === 'committing' ? 0.5 : 1 }}>
                      <RefreshCw size={11} style={{ animation: regenStatus === 'generating' ? 'spin 1s linear infinite' : 'none' }} />
                      {regenStatus === 'generating' ? 'Generating…' : regenStatus === 'preview' ? 'Regenerate' : 'Generate Portrait'}
                    </button>
                    {(regenStatus === 'preview' || regenStatus === 'committing') && (
                      <button onClick={handleCommitImage} disabled={regenStatus === 'committing'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.15)', border: '1px solid #34d399', borderRadius: '3px', color: '#34d399', padding: '5px 14px', fontFamily: 'serif', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: regenStatus === 'committing' ? 'not-allowed' : 'pointer', opacity: regenStatus === 'committing' ? 0.5 : 1 }}>
                        <RefreshCw size={11} style={{ animation: regenStatus === 'committing' ? 'spin 1s linear infinite' : 'none' }} />
                        {regenStatus === 'committing' ? 'Saving…' : 'Commit Portrait'}
                      </button>
                    )}
                    {regenStatus === 'done' && <span className="font-serif text-xs uppercase tracking-wider" style={{ color: '#34d399', lineHeight: '28px' }}>✓ Committed</span>}
                  </div>
                  {regenStatus === 'error' && regenError && <p className="font-mono text-xs mt-2" style={{ color: 'hsl(0 70% 55%)' }}>{regenError}</p>}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── STATS RIBBON ── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            style={{
              background: 'linear-gradient(135deg, hsl(20 6% 8%) 0%, hsl(15 6% 9%) 100%)',
              border: '1px solid hsl(15 8% 14%)',
              borderRadius: '8px',
              padding: '18px 20px 16px',
              marginBottom: '10px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
            }}
          >
            {/* 6 stat boxes */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {STAT_KEYS.map((key, i) => (
                <StatBox
                  key={key} label={STAT_LABELS[i]}
                  score={stats[key]}
                  accent={accent}
                  isHighest={stats[key] === highestScore}
                />
              ))}
            </div>

            <div style={{ height: '1px', background: 'hsl(15 8% 14%)', margin: '4px 0 14px' }} />

            {/* Combat badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {([
                { icon: <Shield size={11} />, label: 'HP', value: String(entity.hp) },
                { icon: <Shield size={11} />, label: 'AC', value: String(entity.ac) },
                { icon: <Wind size={11} />, label: 'Speed', value: entity.speed || '' },
                { icon: <Zap size={11} />, label: 'Initiative', value: entity.initiative != null ? (entity.initiative >= 0 ? `+${entity.initiative}` : `${entity.initiative}`) : '' },
                { icon: <Eye size={11} />, label: 'Passive Perc.', value: String(entity.passivePerception) },
                ...(entity.proficiencyBonus ? [{ icon: <Zap size={11} />, label: 'Prof. Bonus', value: `+${entity.proficiencyBonus}` }] : []),
                ...(entity.spellcasting ? [
                  { icon: <Zap size={11} />, label: `${entity.spellcasting.ability} Spell DC`, value: String(entity.spellcasting.saveDC) },
                  { icon: <Zap size={11} />, label: 'Spell Atk', value: `+${entity.spellcasting.attackBonus}` },
                ] : []),
              ] as {icon:React.ReactNode;label:string;value:string}[]).filter(b => b.value).map(({ icon, label, value }) => (
                <div key={label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'hsl(20 6% 11%)',
                  border: '1px solid hsl(15 8% 17%)',
                  borderRadius: '4px', padding: '5px 11px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                }}>
                  <span style={{ color: accent, opacity: 0.65 }}>{icon}</span>
                  <span className="font-serif uppercase" style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'hsl(15 4% 38%)' }}>{label}</span>
                  <span className="font-mono font-bold" style={{ fontSize: '14px', color: 'hsl(15 4% 82%)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Resistance / Immunity badges */}
            {entity.resistances && entity.resistances.length > 0 && (
              <>
                <div style={{ height: '1px', background: 'hsl(15 8% 14%)', margin: '0 0 12px' }} />
                <div className="flex flex-wrap gap-2">
                  {entity.resistances.map((r, i) => (
                    <ResistanceBadge key={i} resistance={r} accent={accent} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── MAIN CONTENT + SIDEBAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"
        >
          {/* Main — narrative write-up + chronicles */}
          <div className="md:col-span-2">
            <div style={{
              background: 'linear-gradient(135deg, hsl(20 6% 9%) 0%, hsl(15 6% 10%) 100%)',
              border: '1px solid hsl(15 8% 14%)',
              borderRadius: '8px',
              padding: '28px 32px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
              fontSize: '18px',
              lineHeight: '1.75',
            }}>
              <style>{`
                .pc-content p { margin-bottom: 0.75rem; line-height: 1.75; }
                .pc-content p:last-child { margin-bottom: 0; }
              `}</style>
              <div className="pc-content">
                {renderContent(entity.content, accent, indexStubs, entity.id)}
              </div>
            </div>

            {/* Campaign Chronicles */}
            {entity.moments && entity.moments.length > 0 && (
              <CampaignChronicles moments={entity.moments} accent={accent} />
            )}
          </div>

          {/* Sidebar */}
          <div>
            {entity.savingThrows && entity.savingThrows.length > 0 && (
              <SidebarSection title="Saving Throws" accent={accent}>
                <div className="flex flex-wrap gap-1">
                  {entity.savingThrows.map(s => (
                    <span key={s} style={{
                      background: `${accent}15`, border: `1px solid ${accent}35`,
                      borderRadius: '3px', color: accent, fontSize: '10px',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      fontFamily: 'serif', padding: '3px 8px',
                    }}>{s}</span>
                  ))}
                </div>
              </SidebarSection>
            )}

            {entity.skills && entity.skills.length > 0 && (
              <SidebarSection title="Skills" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {entity.skills.map(s => {
                    const tipData = skillTooltips[s.name];
                    const nameNode = tipData
                      ? <Tooltip definition={tipData.definition} flavor={tipData.flavor} homebrew={tipData.homebrew} accent={accent}>{s.name}</Tooltip>
                      : s.name;
                    return (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="font-display" style={{ fontSize: '13px', color: 'hsl(15 4% 60%)' }}>{nameNode}</span>
                        {s.expertise ? (
                          <span style={{
                            background: `${accent}22`, border: `1px solid ${accent}55`,
                            borderRadius: '2px', color: accent, fontSize: '9px',
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            fontFamily: 'serif', padding: '1px 6px',
                            boxShadow: `0 0 8px -2px ${accent}40`,
                            animation: 'expertisePulse 3.5s ease-in-out infinite',
                          }}>Expertise</span>
                        ) : (
                          <div style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: accent, opacity: 0.45,
                            animation: 'skillPulse 2.8s ease-in-out infinite',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </SidebarSection>
            )}

            {entity.features && entity.features.length > 0 && (
              <SidebarSection title="Notable Features" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {entity.features.map(f => {
                    const tipData = featureTooltips[f];
                    return (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: accent, opacity: 0.55, flexShrink: 0, marginTop: '9px' }} />
                        <span className="font-display" style={{ fontSize: '13px', color: 'hsl(15 4% 58%)', lineHeight: 1.55 }}>
                          {tipData
                            ? <Tooltip definition={tipData.definition} flavor={tipData.flavor} homebrew={tipData.homebrew} accent={accent}>{f}</Tooltip>
                            : f}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </SidebarSection>
            )}

            {entity.spells && entity.spells.length > 0 && (
              <SidebarSection title="Signature Spells" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {entity.spells.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: accent, opacity: 0.45, flexShrink: 0, marginTop: '9px' }} />
                      <span className="font-display" style={{ fontSize: '13px', color: 'hsl(15 4% 56%)', lineHeight: 1.55 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {entity.gear && entity.gear.length > 0 && (
              <SidebarSection title="Key Gear" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {entity.gear.map(g => {
                    const tipData = gearTooltips[g];
                    return (
                      <div key={g} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: accent, opacity: 0.4, flexShrink: 0, marginTop: '9px' }} />
                        <span className="font-display" style={{ fontSize: '13px', color: 'hsl(15 4% 54%)', lineHeight: 1.55 }}>
                          {tipData
                            ? <Tooltip definition={tipData.definition} flavor={tipData.flavor} homebrew={tipData.homebrew} accent={accent}>{g}</Tooltip>
                            : g}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </SidebarSection>
            )}

            {entity.personality && (
              <SidebarSection title="Personality" accent={accent}>
                <PersonalityInset p={entity.personality} accent={accent} />
              </SidebarSection>
            )}
          </div>
        </motion.div>

        {/* Back link */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid hsl(15 8% 12%)' }}>
          <Link href="/characters">
            <span className="font-serif text-sm uppercase tracking-wider cursor-pointer" style={{ color: 'hsl(15 4% 32%)' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = accent)}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 32%)')}>
              ← Back to Characters
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
}
