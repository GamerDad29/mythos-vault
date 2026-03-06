import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Shield, Zap, Wind, Eye, RefreshCw } from 'lucide-react';
import { vaultService } from '../vaultService';
import { SkeletonHero } from '../components/Skeleton';
import { renderContent } from '../utils/renderContent';
import { useAuth } from '../contexts/AuthContext';
import { IMAGE_STYLES, buildVaultImagePrompt, generateVaultImage, uploadImageToVaultGitHub } from '../services/imageService';
import { updateEntityImage } from '../services/githubService';
import type { VaultEntity, VaultEntityStub } from '../types';
import type { ImageStyleConfig } from '../services/imageService';

interface PCClass {
  name: string;
  subclass?: string;
  level: number;
}

interface PCSkill {
  name: string;
  expertise?: boolean;
}

interface PCEntity extends VaultEntity {
  player?: string;
  race?: string;
  classes?: PCClass[];
  background?: string;
  alignment?: string;
  accentColor?: string;
  imagePosition?: string;
  patron?: string;
  deity?: string;
  stats?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  hp?: number;
  ac?: number;
  speed?: string;
  initiative?: number;
  passivePerception?: number;
  proficiencyBonus?: number;
  savingThrows?: string[];
  spellcasting?: { ability: string; saveDC: number; attackBonus: number };
  skills?: PCSkill[];
  features?: string[];
  spells?: string[];
  gear?: string[];
  personality?: { traits: string; ideals: string; bonds: string; flaws: string };
}

function statMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const STAT_LABELS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const STAT_KEYS: (keyof PCEntity['stats'] & string)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function StatBox({ label, score, accent, isHighest }: { label: string; score: number; accent: string; isHighest: boolean }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '10px 8px',
      borderRadius: '4px',
      background: isHighest ? `${accent}18` : 'hsl(20 6% 10%)',
      border: `1px solid ${isHighest ? accent + '55' : 'hsl(15 8% 16%)'}`,
      minWidth: '56px',
      flex: 1,
    }}>
      <div className="font-serif" style={{
        fontSize: '9px', letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: isHighest ? accent : 'hsl(15 4% 38%)',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div className="font-serif font-bold" style={{
        fontSize: '1.5rem', color: 'hsl(15 4% 90%)', lineHeight: 1,
      }}>
        {score}
      </div>
      <div className="font-mono" style={{
        fontSize: '11px',
        color: isHighest ? accent : 'hsl(15 4% 55%)',
        marginTop: '3px',
      }}>
        {statMod(score)}
      </div>
    </div>
  );
}

function SidebarSection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ width: '3px', height: '14px', background: accent, borderRadius: '2px', flexShrink: 0 }} />
        <span className="font-serif uppercase" style={{ fontSize: '9px', letterSpacing: '0.22em', color: accent }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function PersonalityInset({ personality, accent }: { personality: NonNullable<PCEntity['personality']>; accent: string }) {
  return (
    <div style={{
      background: 'rgba(13,11,9,0.7)',
      border: `1px solid ${accent}22`,
      borderRadius: '4px',
      padding: '14px',
    }}>
      {[
        { label: 'Traits', value: personality.traits },
        { label: 'Ideals', value: personality.ideals },
        { label: 'Bonds', value: personality.bonds },
        { label: 'Flaws', value: personality.flaws },
      ].map(({ label, value }) => (
        <div key={label} style={{ marginBottom: '10px' }}>
          <span className="font-serif uppercase" style={{
            fontSize: '8px', letterSpacing: '0.2em',
            color: accent, display: 'block', marginBottom: '3px',
          }}>
            {label}
          </span>
          <p className="font-display italic" style={{
            fontSize: '11px', color: 'hsl(15 4% 58%)', lineHeight: 1.55,
          }}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function PCDetail() {
  const [, params] = useRoute('/characters/:slug');
  const slug = params?.slug || '';

  const [entity, setEntity] = useState<PCEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [indexStubs, setIndexStubs] = useState<VaultEntityStub[]>([]);

  // Image regen state
  const [selectedStyle, setSelectedStyle] = useState<ImageStyleConfig>(IMAGE_STYLES[0]);
  const [regenStatus, setRegenStatus] = useState<'idle' | 'generating' | 'preview' | 'committing' | 'done' | 'error'>('idle');
  const [regenError, setRegenError] = useState('');
  const [pendingImage, setPendingImage] = useState<{ base64: string; mime: string; url: string } | null>(null);
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
    setRegenStatus('generating');
    setRegenError('');
    setPendingImage(null);
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
      setImgError(false);
      setPendingImage(null);
      setRegenStatus('done');
      setTimeout(() => setRegenStatus('idle'), 3000);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Commit failed');
      setRegenStatus('error');
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div style={{ height: '20px', width: '220px', background: 'hsl(20 6% 14%)', borderRadius: '4px', marginBottom: '32px' }} />
        <SkeletonHero />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="font-serif text-5xl mb-6" style={{ color: 'hsl(15 8% 20%)' }}>⟁</p>
          <h1 className="font-serif font-bold text-3xl uppercase tracking-wide mb-4" style={{ color: 'hsl(15 4% 70%)' }}>
            Chronicle Not Found
          </h1>
          <Link href="/characters">
            <span className="font-serif text-sm uppercase tracking-wider cursor-pointer" style={{ color: 'hsl(25 100% 38%)' }}>
              ← Back to Characters
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const accent = entity.accentColor || 'hsl(25 100% 38%)';
  const stats = entity.stats;
  const highestStat = stats ? Math.max(stats.str, stats.dex, stats.con, stats.int, stats.wis, stats.cha) : 0;
  const totalLevel = (entity.classes || []).reduce((sum, c) => sum + c.level, 0);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-10 font-serif text-xs uppercase tracking-wider">
          <Link href="/">
            <span className="cursor-pointer" style={{ color: 'hsl(15 4% 40%)' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = accent)}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 40%)')}>
              Chronicle
            </span>
          </Link>
          <span style={{ color: 'hsl(15 8% 22%)' }}>›</span>
          <Link href="/characters">
            <span className="cursor-pointer" style={{ color: 'hsl(15 4% 40%)' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = accent)}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 40%)')}>
              Characters
            </span>
          </Link>
          <span style={{ color: 'hsl(15 8% 22%)' }}>›</span>
          <span style={{ color: 'hsl(15 4% 65%)' }}>{entity.name}</span>
        </nav>

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden mb-8"
          style={{
            border: `1px solid ${accent}33`,
            borderRadius: '8px',
            background: `linear-gradient(135deg, rgba(18,14,10,1) 0%, hsl(20 6% 10%) 100%)`,
            boxShadow: `0 0 80px -24px ${accent}30`,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ minHeight: '380px' }}>
            {/* Portrait */}
            <div className="relative overflow-hidden" style={{ minHeight: '320px', background: 'hsl(15 6% 7%)' }}>
              {entity.imageUrl && !imgError ? (
                <>
                  <img
                    src={entity.imageUrl}
                    alt={entity.name}
                    className="w-full h-full object-cover"
                    style={{ minHeight: '320px', display: 'block', objectPosition: entity.imagePosition || 'center top' }}
                    onError={() => setImgError(true)}
                  />
                  <div className="absolute inset-y-0 right-0 pointer-events-none hidden md:block" style={{
                    width: '80px',
                    background: `linear-gradient(to right, transparent, rgba(18,14,10,0.98))`,
                  }} />
                  <div className="absolute inset-x-0 bottom-0 pointer-events-none md:hidden" style={{
                    height: '80px',
                    background: `linear-gradient(to bottom, transparent, rgba(18,14,10,0.98))`,
                  }} />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '320px', background: `radial-gradient(ellipse at 40% 40%, hsl(20 8% 11%) 0%, hsl(15 6% 6%) 100%)` }}>
                  <span style={{ fontSize: '5rem', opacity: 0.1, color: accent }}>⟁</span>
                </div>
              )}
            </div>

            {/* Identity panel */}
            <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-center">
              {/* Class badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(entity.classes || []).map(cls => (
                  <span key={cls.name} className="font-serif" style={{
                    background: `${accent}18`,
                    border: `1px solid ${accent}44`,
                    borderRadius: '3px',
                    color: accent,
                    fontSize: '9px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    padding: '3px 9px',
                  }}>
                    {cls.name} {cls.level}{cls.subclass ? ` — ${cls.subclass}` : ''}
                  </span>
                ))}
                {entity.race && (
                  <span className="font-serif" style={{
                    background: 'hsl(20 6% 13%)',
                    border: '1px solid hsl(15 8% 20%)',
                    borderRadius: '3px',
                    color: 'hsl(15 4% 50%)',
                    fontSize: '9px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    padding: '3px 9px',
                  }}>
                    {entity.race}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="font-serif font-black uppercase leading-tight mb-2" style={{
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                letterSpacing: '0.04em',
                color: 'hsl(15 4% 96%)',
              }}>
                {entity.name}
              </h1>

              {/* Player */}
              {entity.player && (
                <p className="font-display mb-4" style={{ fontSize: '12px', color: 'hsl(15 4% 38%)', letterSpacing: '0.06em' }}>
                  Played by <span style={{ color: 'hsl(15 4% 52%)' }}>{entity.player}</span>
                </p>
              )}

              {/* Accent line */}
              <div style={{ height: '2px', width: '48px', background: accent, marginBottom: '16px' }} />

              {/* Background / alignment / campaign */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                {entity.background && (
                  <span className="font-display" style={{ fontSize: '12px', color: 'hsl(15 4% 45%)' }}>
                    {entity.background}
                  </span>
                )}
                {entity.alignment && (
                  <span className="font-display" style={{ fontSize: '12px', color: 'hsl(15 4% 45%)' }}>
                    · {entity.alignment}
                  </span>
                )}
              </div>
              <p className="font-serif uppercase" style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'hsl(15 4% 32%)' }}>
                Pathways Unseen · Level {totalLevel}
              </p>

              {/* Patron / deity if applicable */}
              {(entity as any).patron && (
                <p className="font-display italic mt-3" style={{ fontSize: '11px', color: 'hsl(15 4% 38%)' }}>
                  Patron: {(entity as any).patron}
                </p>
              )}

              {/* DM image regen */}
              {isDM && (
                <div style={{
                  marginTop: '20px',
                  background: 'rgba(13,11,9,0.5)',
                  border: '1px solid hsl(15 8% 18%)',
                  borderRadius: '4px',
                  padding: '12px',
                }}>
                  <p className="font-serif uppercase" style={{ fontSize: '9px', letterSpacing: '0.22em', color: 'hsl(15 4% 38%)', marginBottom: '10px' }}>
                    Regenerate Portrait
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {IMAGE_STYLES.map(s => (
                      <button key={s.id} onClick={() => { setSelectedStyle(s); setCustomPrompt(''); }}
                        style={{
                          background: selectedStyle.id === s.id ? `${s.accent}22` : 'transparent',
                          border: `1px solid ${selectedStyle.id === s.id ? s.accent : 'hsl(15 8% 22%)'}`,
                          borderRadius: '3px',
                          color: selectedStyle.id === s.id ? s.accent : 'hsl(15 4% 48%)',
                          padding: '3px 9px', fontFamily: 'serif', fontSize: '10px',
                          letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="font-mono" style={{ fontSize: '10px', color: 'hsl(15 4% 32%)', marginBottom: '8px' }}>
                    {selectedStyle.subtitle} · BFL FLUX 1.1 Pro · $0.04
                  </p>
                  {/* Prompt toggle */}
                  <div style={{ marginBottom: '10px' }}>
                    <button onClick={() => { if (!promptOpen && !customPrompt.trim() && entity) setCustomPrompt(buildVaultImagePrompt(entity, selectedStyle)); setPromptOpen(o => !o); }}
                      style={{ background: 'transparent', border: 'none', color: customPrompt.trim() ? 'hsl(25 100% 45%)' : 'hsl(15 4% 36%)', fontFamily: 'serif', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', padding: '0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '8px' }}>{promptOpen ? '▲' : '▼'}</span>
                      {customPrompt.trim() ? 'Custom Prompt Active' : 'View / Edit Prompt'}
                    </button>
                    {promptOpen && (
                      <div style={{ marginTop: '8px' }}>
                        <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={4}
                          style={{ width: '100%', background: 'hsl(15 6% 8%)', border: `1px solid ${customPrompt.trim() ? 'hsl(25 80% 28%)' : 'hsl(15 8% 20%)'}`, borderRadius: '3px', color: 'hsl(15 4% 62%)', fontFamily: 'monospace', fontSize: '10px', lineHeight: '1.6', padding: '8px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                        {customPrompt.trim() && <button onClick={() => setCustomPrompt('')} style={{ background: 'transparent', border: 'none', color: 'hsl(15 4% 32%)', fontFamily: 'serif', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '4px 0 0' }}>↺ Reset to auto</button>}
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
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{
              background: 'hsl(20 6% 9%)',
              border: `1px solid hsl(15 8% 14%)`,
              borderRadius: '6px',
              padding: '16px 20px',
              marginBottom: '8px',
            }}
          >
            {/* Six stats */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {STAT_KEYS.map((key, i) => (
                <StatBox
                  key={key}
                  label={STAT_LABELS[i]}
                  score={stats[key as keyof typeof stats]}
                  accent={accent}
                  isHighest={stats[key as keyof typeof stats] === highestStat}
                />
              ))}
            </div>

            {/* Combat badges */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: <Shield size={11} />, label: 'HP', value: `${entity.hp}` },
                { icon: <Shield size={11} />, label: 'AC', value: `${entity.ac}` },
                { icon: <Wind size={11} />, label: 'Speed', value: entity.speed || '' },
                { icon: <Zap size={11} />, label: 'Initiative', value: entity.initiative !== undefined ? (entity.initiative >= 0 ? `+${entity.initiative}` : `${entity.initiative}`) : '' },
                { icon: <Eye size={11} />, label: 'Passive Perception', value: `${entity.passivePerception}` },
                ...(entity.proficiencyBonus ? [{ icon: <Zap size={11} />, label: 'Prof. Bonus', value: `+${entity.proficiencyBonus}` }] : []),
                ...(entity.spellcasting ? [
                  { icon: <Zap size={11} />, label: 'Spell DC', value: `${entity.spellcasting.saveDC}` },
                  { icon: <Zap size={11} />, label: 'Spell Atk', value: `+${entity.spellcasting.attackBonus}` },
                ] : []),
              ].map(({ icon, label, value }) => value ? (
                <div key={label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: 'hsl(20 6% 12%)',
                  border: `1px solid hsl(15 8% 18%)`,
                  borderRadius: '3px',
                  padding: '4px 10px',
                }}>
                  <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>
                  <span className="font-serif uppercase" style={{ fontSize: '8px', letterSpacing: '0.15em', color: 'hsl(15 4% 40%)' }}>{label}</span>
                  <span className="font-mono" style={{ fontSize: '12px', color: 'hsl(15 4% 80%)' }}>{value}</span>
                </div>
              ) : null)}
            </div>
          </motion.div>
        )}

        {/* ── MAIN CONTENT + SIDEBAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8"
        >
          {/* Main — BLM write-up */}
          <div className="md:col-span-2">
            <div className="content-panel" style={{ padding: '28px 32px' }}>
              {renderContent(entity.content, accent, indexStubs, entity.id)}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Saving Throws */}
            {entity.savingThrows && entity.savingThrows.length > 0 && (
              <SidebarSection title="Saving Throws" accent={accent}>
                <div className="flex flex-wrap gap-1">
                  {entity.savingThrows.map(s => (
                    <span key={s} style={{
                      background: `${accent}15`, border: `1px solid ${accent}35`,
                      borderRadius: '3px', color: accent,
                      fontSize: '9px', letterSpacing: '0.1em',
                      textTransform: 'uppercase', fontFamily: 'serif',
                      padding: '2px 7px',
                    }}>{s}</span>
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* Skills */}
            {entity.skills && entity.skills.length > 0 && (
              <SidebarSection title="Skills" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {entity.skills.map(s => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="font-display" style={{ fontSize: '11px', color: 'hsl(15 4% 60%)' }}>
                        {s.name}
                      </span>
                      {s.expertise ? (
                        <span style={{
                          background: `${accent}22`, border: `1px solid ${accent}55`,
                          borderRadius: '2px', color: accent,
                          fontSize: '8px', letterSpacing: '0.12em',
                          textTransform: 'uppercase', fontFamily: 'serif',
                          padding: '1px 5px',
                        }}>Expertise</span>
                      ) : (
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: accent, opacity: 0.5, flexShrink: 0 }} />
                      )}
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* Notable Features */}
            {entity.features && entity.features.length > 0 && (
              <SidebarSection title="Notable Features" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {entity.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: accent, opacity: 0.6, flexShrink: 0, marginTop: '6px' }} />
                      <span className="font-display" style={{ fontSize: '11px', color: 'hsl(15 4% 58%)', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* Signature Spells */}
            {entity.spells && entity.spells.length > 0 && (
              <SidebarSection title="Signature Spells" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {entity.spells.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: accent, opacity: 0.5, flexShrink: 0, marginTop: '6px' }} />
                      <span className="font-display" style={{ fontSize: '11px', color: 'hsl(15 4% 58%)', lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* Key Gear */}
            {entity.gear && entity.gear.length > 0 && (
              <SidebarSection title="Key Gear" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {entity.gear.map(g => (
                    <div key={g} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: accent, opacity: 0.45, flexShrink: 0, marginTop: '6px' }} />
                      <span className="font-display" style={{ fontSize: '11px', color: 'hsl(15 4% 55%)', lineHeight: 1.5 }}>{g}</span>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* Personality */}
            {entity.personality && (
              <SidebarSection title="Personality" accent={accent}>
                <PersonalityInset personality={entity.personality} accent={accent} />
              </SidebarSection>
            )}
          </div>
        </motion.div>

        {/* Back link */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid hsl(15 8% 14%)' }}>
          <Link href="/characters">
            <span className="font-serif text-sm uppercase tracking-wider cursor-pointer" style={{ color: 'hsl(15 4% 35%)' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = accent)}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 35%)')}>
              ← Back to Characters
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
