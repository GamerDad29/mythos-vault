import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { vaultService } from '../vaultService';
import { useAuth } from '../contexts/AuthContext';
import { toggleEntityHidden } from '../services/githubService';
import type { VaultEntity } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type LoreEntity = VaultEntity & { audioUrl?: string; provenance?: string };

function formatTime(sec: number): string {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Deterministic waveform heights from entity slug
function buildBarHeights(slug: string, count: number): number[] {
  const seed = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: count }, (_, i) => {
    const pos = i / count;
    const envelope = Math.sin(pos * Math.PI);
    const s1 = Math.abs(Math.sin(seed * 0.003 + i * 0.71));
    const s2 = Math.abs(Math.sin(seed * 0.007 + i * 1.33));
    const s3 = Math.abs(Math.sin(seed * 0.013 + i * 2.07));
    return 8 + (envelope * 0.48 + s1 * 0.27 + s2 * 0.15 + s3 * 0.10) * 90;
  });
}

// ─── Inline Markdown (prose-only) ─────────────────────────────────────────────

function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*[^*]+?\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('***') && p.endsWith('***')) return <strong key={i}><em>{p.slice(3, -3)}</em></strong>;
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
    return p;
  });
}

// ─── Whisper Audio Player ─────────────────────────────────────────────────────

const BAR_COUNT = 80;

function WhisperPlayer({ audioUrl, entitySlug }: { audioUrl: string; entitySlug: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const barHeights = useMemo(() => buildBarHeights(entitySlug, BAR_COUNT), [entitySlug]);
  const progress = duration > 0 ? currentTime / duration : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => { setIsPlaying(false); setCurrentTime(0); };
    const onWait = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('waiting', onWait);
    audio.addEventListener('canplay', onCanPlay);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('waiting', onWait);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = ratio * duration;
      setCurrentTime(ratio * duration);
    }
  }, [duration]);

  return (
    <div style={{
      background: 'hsl(20 8% 8%)',
      border: '1px solid hsl(15 8% 16%)',
      borderRadius: '8px',
      padding: '1.5rem 1.75rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Ambient glow behind player */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '40px',
        background: 'radial-gradient(ellipse, hsl(25 100% 38%)18 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top row: play button + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.1rem' }}>

        {/* Play / pause button */}
        <button
          onClick={togglePlay}
          style={{
            position: 'relative',
            width: '44px', height: '44px', flexShrink: 0,
            borderRadius: '50%',
            background: isPlaying ? 'hsl(25 100% 38%)' : 'hsl(20 8% 14%)',
            border: `1.5px solid ${isPlaying ? 'hsl(25 100% 42%)' : 'hsl(25 60% 28%)'}`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s ease',
            boxShadow: isPlaying ? '0 0 18px hsl(25 100% 38%)55' : '0 2px 8px rgba(0,0,0,0.5)',
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {/* Pulse ring */}
          {isPlaying && (
            <>
              <div style={{
                position: 'absolute', inset: '-4px',
                borderRadius: '50%',
                border: '1px solid hsl(25 100% 38%)',
                animation: 'lorePlayPulse 1.4s ease-out infinite',
              }} />
              <div style={{
                position: 'absolute', inset: '-10px',
                borderRadius: '50%',
                border: '1px solid hsl(25 100% 38%)',
                animation: 'lorePlayPulse 1.4s ease-out 0.4s infinite',
              }} />
            </>
          )}

          {/* Icon */}
          {isLoading ? (
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'hsl(25 100% 38%)',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : isPlaying ? (
            // Pause icon
            <div style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '3px', height: '14px', background: 'hsl(20 6% 8%)', borderRadius: '2px' }} />
              <div style={{ width: '3px', height: '14px', background: 'hsl(20 6% 8%)', borderRadius: '2px' }} />
            </div>
          ) : (
            // Play icon
            <div style={{
              width: 0, height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderLeft: '12px solid hsl(25 80% 60%)',
              marginLeft: '2px',
            }} />
          )}
        </button>

        {/* Times */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'monospace', fontSize: '13px',
            color: isPlaying ? 'hsl(25 90% 60%)' : 'hsl(15 4% 55%)',
            transition: 'color 0.3s', letterSpacing: '0.05em',
          }}>
            {formatTime(currentTime)}
          </span>
          {duration > 0 && (
            <>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'hsl(15 4% 30%)' }}>/</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'hsl(15 4% 35%)' }}>
                {formatTime(duration)}
              </span>
            </>
          )}
        </div>

        {/* ♫ label */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '12px', color: 'hsl(25 80% 35%)' }}>♫</span>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: '9px',
            textTransform: 'uppercase', letterSpacing: '0.22em',
            color: 'hsl(15 4% 32%)',
          }}>Narration</span>
        </div>
      </div>

      {/* Waveform */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', gap: '2px',
          height: '48px', cursor: 'pointer', userSelect: 'none',
        }}
        onClick={handleWaveformClick}
        title="Click to seek"
      >
        {barHeights.map((h, i) => {
          const filled = i / BAR_COUNT < progress;
          const nearProgress = Math.abs(i / BAR_COUNT - progress) < 0.015;
          const barGroupDelay = `${(i % 12) * 0.055}s`;
          const barDuration = `${0.38 + (i % 7) * 0.04}s`;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                minHeight: '2px',
                borderRadius: '1px 1px 0 0',
                background: nearProgress
                  ? 'hsl(25 100% 65%)'
                  : filled
                  ? `hsl(25 ${70 + (h / 100) * 25}% ${28 + (h / 100) * 20}%)`
                  : 'hsl(15 6% 18%)',
                transition: 'background 0.15s',
                transformOrigin: 'bottom',
                animation: isPlaying
                  ? `waveBar ${barDuration} ease-in-out ${barGroupDelay} infinite alternate`
                  : 'none',
                opacity: isPlaying ? 0.85 + (h / 100) * 0.15 : filled ? 0.75 : 0.5,
              }}
            />
          );
        })}
      </div>

      {/* Progress track line below bars */}
      <div style={{ marginTop: '0.6rem', height: '1px', position: 'relative', background: 'hsl(15 6% 14%)', borderRadius: '1px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${progress * 100}%`,
          background: 'linear-gradient(to right, hsl(25 100% 28%), hsl(25 100% 42%))',
          borderRadius: '1px',
          transition: 'width 0.1s linear',
        }} />
      </div>
    </div>
  );
}

// ─── Provenance Badge ─────────────────────────────────────────────────────────

function ProvenanceBadge({ text }: { text: string }) {
  const [told, via] = text.split('·').map(s => s.trim());
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0',
      borderRadius: '3px', overflow: 'hidden',
      border: '1px solid hsl(15 8% 18%)',
    }}>
      <div style={{
        padding: '0.45rem 0.85rem',
        background: 'hsl(20 8% 10%)',
        borderRight: '1px solid hsl(15 8% 18%)',
      }}>
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: '10px',
          textTransform: 'uppercase', letterSpacing: '0.2em',
          color: 'hsl(25 100% 38%)', whiteSpace: 'nowrap',
        }}>
          {told}
        </span>
      </div>
      {via && (
        <div style={{ padding: '0.45rem 0.85rem', background: 'hsl(20 8% 9%)' }}>
          <span style={{
            fontFamily: "'EB Garamond', serif", fontStyle: 'italic',
            fontSize: '0.8rem', color: 'hsl(15 4% 42%)', whiteSpace: 'nowrap',
          }}>
            {via}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Prose Renderer ───────────────────────────────────────────────────────────

function LoreProse({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

  return (
    <div>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();

        // Section divider
        if (trimmed === '---') {
          return (
            <div key={i} className="forge-divider" style={{ margin: '2.5rem auto', width: '120px' }} />
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={i} style={{
              margin: '2rem 0',
              paddingLeft: '1.4rem',
              borderLeft: '2px solid hsl(25 60% 22%)',
              color: 'hsl(15 4% 52%)',
              fontStyle: 'italic',
              fontSize: '1.15rem',
              lineHeight: 1.75,
            }}>
              {parseInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Regular paragraph
        return (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
            style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: '1.2rem',
              lineHeight: 1.9,
              color: 'hsl(15 4% 78%)',
              marginBottom: '1.4rem',
              letterSpacing: '0.01em',
            }}
          >
            {parseInline(trimmed)}
          </motion.p>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LoreDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [entity, setEntity] = useState<LoreEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const { isDM } = useAuth();

  const pat = import.meta.env.VITE_GITHUB_PAT as string;

  useEffect(() => {
    vaultService.getEntity('LORE', slug)
      .then(e => setEntity(e as LoreEntity))
      .catch(() => setError('This entry could not be found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const topicSlug = useMemo(() =>
    entity?.category ? slugify(entity.category) : null,
    [entity]
  );

  async function handleToggleHidden() {
    if (!entity) return;
    const next = !entity.hidden;
    setEntity(e => e ? { ...e, hidden: next } : null);
    try {
      await toggleEntityHidden(entity, next, pat);
    } catch {
      setEntity(e => e ? { ...e, hidden: !next } : null);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ height: '14px', width: '200px', background: 'hsl(20 6% 14%)', borderRadius: '4px', marginBottom: '3rem', animation: 'shimmer 1.8s ease-in-out infinite' }} />
        <div style={{ height: '320px', borderRadius: '6px', background: 'hsl(20 6% 12%)', marginBottom: '2rem', animation: 'shimmer 1.8s ease-in-out infinite' }} />
        <div style={{ height: '80px', borderRadius: '6px', background: 'hsl(20 6% 10%)', animation: 'shimmer 1.8s ease-in-out infinite' }} />
      </div>
    );
  }

  // ── Error ──
  if (error || !entity) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1.5rem' }}>
        <div>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '3rem', color: 'hsl(15 8% 18%)', marginBottom: '1.5rem' }}>⟁</p>
          <p style={{ fontFamily: "'EB Garamond', serif", fontStyle: 'italic', color: 'hsl(15 4% 38%)' }}>{error || 'Entry not found.'}</p>
          <Link href="/lore">
            <span style={{ display: 'inline-block', marginTop: '1.5rem', fontFamily: "'Cinzel', serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(25 100% 38%)', cursor: 'pointer' }}>
              ← Back to Lore
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Locked (non-DM) ──
  if (entity.hidden && !isDM) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1.5rem' }}>
        <div>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '3rem', color: 'hsl(15 8% 18%)', marginBottom: '1.5rem' }}>⟁</p>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'hsl(15 4% 30%)', marginBottom: '0.75rem' }}>Not yet revealed</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(15 4% 42%)', filter: 'blur(6px)', userSelect: 'none', marginBottom: '1.5rem' }}>
            {entity.name}
          </h1>
          <Link href="/lore">
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(25 100% 38%)', cursor: 'pointer' }}>
              ← Back to Lore
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>

      {/* ── Hero Image ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          position: 'relative',
          height: 'clamp(220px, 35vh, 400px)',
          overflow: 'hidden',
        }}
      >
        {entity.imageUrl && !imgError ? (
          <img
            src={entity.imageUrl}
            onError={() => setImgError(true)}
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: entity.imagePosition || 'center 35%',
              animation: 'loreKenBurns 30s ease-in-out infinite alternate',
            }}
          />
        ) : (
          /* Gradient fallback */
          <div style={{
            position: 'absolute', inset: 0,
            background: entity.region === 'surface'
              ? 'radial-gradient(ellipse at 60% 40%, hsl(195 30% 9%) 0%, hsl(15 6% 5%) 70%)'
              : 'radial-gradient(ellipse at 40% 60%, hsl(20 45% 8%) 0%, hsl(15 6% 5%) 70%)',
          }} />
        )}

        {/* Gradient overlays */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(4,2,1,0.25) 0%, rgba(4,2,1,0.55) 60%, rgba(4,2,1,0.95) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(4,2,1,0.4) 0%, transparent 35%, transparent 65%, rgba(4,2,1,0.4) 100%)',
        }} />

        {/* DM badge */}
        {isDM && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            <button
              onClick={handleToggleHidden}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                background: 'rgba(4,2,1,0.82)', backdropFilter: 'blur(8px)',
                border: `1px solid ${entity.hidden ? 'hsl(25 80% 30%)' : 'hsl(15 8% 22%)'}`,
                borderRadius: '3px', cursor: 'pointer',
                color: entity.hidden ? 'hsl(25 100% 50%)' : 'hsl(15 4% 50%)',
              }}
            >
              {entity.hidden
                ? <EyeOff size={13} />
                : <Eye size={13} />
              }
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                {entity.hidden ? 'Hidden' : 'Visible'}
              </span>
            </button>
          </div>
        )}

        {/* Title at bottom of hero */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 'clamp(1rem, 4vw, 2rem) clamp(1.5rem, 8vw, 5rem)',
          maxWidth: '900px', margin: '0 auto',
        }}>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            style={{
              fontFamily: "'Cinzel', serif", fontWeight: 900,
              fontSize: 'clamp(1.6rem, 5vw, 3rem)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'hsl(15 4% 95%)', lineHeight: 1.05,
              textShadow: '0 4px 24px rgba(0,0,0,0.8)',
              margin: 0,
            }}
          >
            {entity.name}
          </motion.h1>
        </div>
      </motion.div>

      {/* ── Body ── */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 2rem)' }}>

        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2.5rem' }}
        >
          <Link href="/lore">
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(15 4% 35%)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'hsl(25 100% 38%)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 35%)')}
            >
              Lore
            </span>
          </Link>
          {topicSlug && entity.category && (
            <>
              <span style={{ color: 'hsl(15 8% 22%)', fontSize: '11px' }}>›</span>
              <Link href={`/lore/topic/${topicSlug}`}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(15 4% 35%)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = 'hsl(25 100% 38%)')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 35%)')}
                >
                  {entity.category}
                </span>
              </Link>
            </>
          )}
          <span style={{ color: 'hsl(15 8% 22%)', fontSize: '11px' }}>›</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(15 4% 58%)' }}>
            {entity.name}
          </span>
        </motion.nav>

        {/* Provenance badge */}
        {entity.provenance && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
            style={{ marginBottom: '2rem' }}
          >
            <ProvenanceBadge text={entity.provenance} />
          </motion.div>
        )}

        {/* Audio player */}
        <AnimatePresence>
          {entity.audioUrl && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              style={{ marginBottom: '3rem' }}
            >
              <WhisperPlayer audioUrl={entity.audioUrl} entitySlug={entity.slug} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider before prose */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          style={{ transformOrigin: 'left' }}
        >
          <div className="forge-divider" style={{ marginBottom: '2.5rem' }} />
        </motion.div>

        {/* Prose */}
        <LoreProse content={entity.content} />

        {/* Colophon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{ marginTop: '4rem', paddingTop: '2rem', textAlign: 'center' }}
        >
          <div className="forge-divider" style={{ marginBottom: '1.75rem' }} />
          <p style={{
            fontFamily: "'Cinzel', serif", fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '0.3em',
            color: 'hsl(15 4% 30%)',
          }}>
            Pathways Unseen · {entity.name}
          </p>
        </motion.div>

        {/* Back link */}
        {topicSlug && entity.category && (
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href={`/lore/topic/${topicSlug}`}>
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.2em',
                color: 'hsl(15 4% 35%)', cursor: 'pointer', transition: 'color 0.2s',
              }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'hsl(25 100% 38%)')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 35%)')}
              >
                ← Back to {entity.category}
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
