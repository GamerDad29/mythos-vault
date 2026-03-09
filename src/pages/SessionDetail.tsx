import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Video } from 'lucide-react';
import { vaultService } from '../vaultService';
import { useAuth } from '../contexts/AuthContext';
import { updateSessionImagePosition, updateSessionInlineImagePosition } from '../services/githubService';
import type { SessionEntry } from '../types';

// ─── Inline markdown ──────────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('***') && part.endsWith('***')) return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: 'hsl(15 4% 90%)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function renderLines(lines: string[], keyOffset = 0): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let key = keyOffset;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      // ── Section heading with amber bar + rule ──
      nodes.push(
        <div key={key++} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '3rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '3px', height: '1.1rem', background: 'hsl(25 90% 42%)', borderRadius: '2px', flexShrink: 0 }} />
          <h3
            className="font-serif font-bold uppercase"
            style={{ fontSize: '0.88rem', color: 'hsl(25 100% 48%)', letterSpacing: '0.22em', lineHeight: 1, margin: 0 }}
          >
            {trimmed.slice(3)}
          </h3>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, hsl(25 50% 18%), transparent)' }} />
        </div>
      );

    } else if (trimmed.startsWith('> ')) {
      // ── Blockquote ──
      nodes.push(
        <blockquote key={key++} style={{ margin: '1.2rem 0', paddingLeft: '1.1rem', borderLeft: '2px solid hsl(25 70% 24%)', color: 'hsl(15 4% 56%)', fontStyle: 'italic' }}>
          {parseInline(trimmed.slice(2))}
        </blockquote>
      );

    } else if (trimmed.startsWith('- ')) {
      // ── List item ──
      nodes.push(
        <div key={key++} className="flex gap-2 my-1" style={{ color: 'hsl(15 4% 68%)' }}>
          <span style={{ color: 'hsl(25 80% 38%)', flexShrink: 0 }}>·</span>
          <span>{parseInline(trimmed.slice(2))}</span>
        </div>
      );

    } else if (trimmed.startsWith('---')) {
      nodes.push(<div key={key++} className="forge-divider my-6" />);

    } else if (trimmed === '') {
      nodes.push(<div key={key++} style={{ height: '0.55rem' }} />);

    } else if (/^\*[^*].+\*$/.test(trimmed) || /^\*[^*]\*$/.test(trimmed)) {
      // ── Entirely italic line: speech / monologue ──
      const inner = trimmed.slice(1, -1);
      const isLong = inner.length > 45;
      nodes.push(
        <div
          key={key++}
          style={{
            margin: isLong ? '1.4rem 0' : '0.5rem 0 0.5rem 1rem',
            padding: isLong ? '0.85rem 1.25rem' : '0.15rem 0 0.15rem 1rem',
            borderLeft: `2px solid hsl(25 70% ${isLong ? '28' : '22'}%)`,
            background: isLong ? 'hsl(25 20% 5%)' : 'transparent',
            borderRadius: isLong ? '0 4px 4px 0' : '0',
          }}
        >
          <em style={{ color: `hsl(15 4% ${isLong ? '64' : '52'}%)`, fontSize: isLong ? '1.03rem' : '0.95rem', lineHeight: 1.75 }}>
            {parseInline(inner)}
          </em>
        </div>
      );

    } else {
      // ── Normal paragraph ──
      nodes.push(
        <p key={key++} style={{ color: 'hsl(15 4% 73%)', marginBottom: '0.2rem', lineHeight: 1.9 }}>
          {parseInline(trimmed)}
        </p>
      );
    }
  }
  return nodes;
}

// ─── Ken Burns variants ───────────────────────────────────────────────────────

const KB_VARIANTS: Array<{ scale: number[]; x: number[]; y: number[]; duration: number }> = [
  { scale: [1, 1.11], x: [0, -22], y: [0, -8],  duration: 10 },
  { scale: [1, 1.10], x: [0,  20], y: [0, 10],  duration: 12 },
  { scale: [1, 1.13], x: [0, -18], y: [0,  9],  duration:  9 },
  { scale: [1, 1.10], x: [0,  20], y: [0, -10], duration: 11 },
];

// ─── Woven image (full-width inline figure) ───────────────────────────────────

function WovenImage({ url, index, position, isDM, onSavePosition }: {
  url: string; index: number; position?: string;
  isDM?: boolean; onSavePosition?: (pos: string) => Promise<void>;
}) {
  const [lightbox, setLightbox] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isFraming, setIsFraming] = useState(false);
  const [framingPos, setFramingPos] = useState({ x: 50, y: 50 });
  const [frameSaveStatus, setFrameSaveStatus] = useState<'idle'|'saving'|'done'|'error'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const kb = KB_VARIANTS[index % KB_VARIANTS.length];
  const isGif = url.toLowerCase().endsWith('.gif');
  const accent = 'hsl(25 100% 38%)';

  function startFraming() {
    const cur = position || 'center center';
    const parts = cur.split(' ');
    const pv = (v: string, fb: number) => {
      if (v === 'center') return 50; if (v === 'left') return 0; if (v === 'right') return 100;
      if (v === 'top') return 0; if (v === 'bottom') return 100;
      return parseFloat(v) || fb;
    };
    setFramingPos({ x: pv(parts[0], 50), y: pv(parts[1] || parts[0], 50) });
    setIsFraming(true); setFrameSaveStatus('idle');
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isFraming || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setFramingPos({
      x: Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))),
      y: Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))),
    });
  }

  async function acceptFrame() {
    if (!onSavePosition) return;
    const posStr = `${framingPos.x}% ${framingPos.y}%`;
    setFrameSaveStatus('saving');
    try {
      await onSavePosition(posStr);
      setFrameSaveStatus('done');
      setTimeout(() => { setIsFraming(false); setFrameSaveStatus('idle'); }, 1200);
    } catch {
      setFrameSaveStatus('error');
    }
  }

  useEffect(() => {
    if (!isFraming) return;
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Enter') acceptFrame(); }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFraming, framingPos]); // eslint-disable-line react-hooks/exhaustive-deps

  const livePos = isFraming ? `${framingPos.x}% ${framingPos.y}%` : (position || 'center center');

  return (
    <>
      <div
        ref={containerRef}
        className="my-10"
        style={{
          position: 'relative',
          borderRadius: '5px',
          border: isFraming ? `2px solid ${accent}80` : '1px solid hsl(15 8% 14%)',
          overflow: 'hidden',
          cursor: isFraming ? 'crosshair' : 'pointer',
          transition: 'border-color 0.25s, box-shadow 0.25s',
        }}
        onClick={() => { if (!isFraming) setLightbox(true); }}
        onMouseEnter={e => {
          setHovered(true);
          if (!isFraming) {
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(25 60% 28%)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px hsl(25 60% 10%)';
          }
        }}
        onMouseLeave={e => {
          setHovered(false);
          if (!isFraming) {
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(15 8% 14%)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }
        }}
        onMouseMove={handleMouseMove}
      >
        {isGif ? (
          <img
            src={url} alt=""
            className="w-full object-cover"
            style={{ maxHeight: '380px', opacity: 0.9, display: 'block', objectPosition: livePos, transition: isFraming ? 'object-position 0.05s linear' : undefined }}
          />
        ) : (
          <motion.img
            src={url} alt=""
            className="w-full object-cover"
            style={{ maxHeight: '360px', opacity: 0.88, display: 'block', objectPosition: livePos, transition: isFraming ? 'object-position 0.05s linear' : undefined }}
            animate={isFraming ? {} : { scale: kb.scale, x: kb.x, y: kb.y }}
            transition={{ duration: kb.duration, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        )}

        {/* ── Framing overlay ── */}
        {isFraming && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: `${framingPos.x}%`, top: `${framingPos.y}%`, transform: 'translate(-50%,-50%)', width: '36px', height: '36px' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: `${accent}cc`, transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: `${accent}cc`, transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '7px', height: '7px', borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }} />
            </div>
            <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,6,4,0.88)', border: `1px solid ${accent}50`, borderRadius: '4px', padding: '4px 10px' }}>
              <span className="font-serif uppercase" style={{ fontSize: '9px', letterSpacing: '0.2em', color: accent }}>
                Drag to Frame · {framingPos.x}% {framingPos.y}%
              </span>
            </div>
          </div>
        )}

        {/* ── DM Adjust Frame button ── */}
        {isDM && !isGif && !isFraming && (
          <button
            onClick={e => { e.stopPropagation(); startFraming(); }}
            style={{
              position: 'absolute', bottom: '10px', right: '10px',
              background: 'rgba(8,6,4,0.82)', border: `1px solid ${accent}40`,
              borderRadius: '4px', padding: '5px 10px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              opacity: hovered ? 1 : 0, transition: 'opacity 0.2s ease',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            <span className="font-serif uppercase" style={{ fontSize: '9px', letterSpacing: '0.18em', color: accent }}>Adjust Frame</span>
          </button>
        )}

        {/* ── Accept/Cancel bar ── */}
        {isDM && isFraming && (
          <div style={{
            position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '8px', alignItems: 'center',
            background: 'rgba(8,6,4,0.9)', border: `1px solid ${accent}35`,
            borderRadius: '6px', padding: '7px 12px',
          }}>
            <span className="font-display" style={{ fontSize: '11px', color: 'hsl(15 4% 40%)', marginRight: '4px' }}>
              {framingPos.x}% {framingPos.y}%
            </span>
            <button
              onClick={e => { e.stopPropagation(); setIsFraming(false); setFrameSaveStatus('idle'); }}
              style={{ background: 'transparent', border: '1px solid hsl(15 8% 22%)', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', color: 'hsl(15 4% 42%)', fontSize: '11px', fontFamily: 'serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >Cancel</button>
            <button
              onClick={e => { e.stopPropagation(); acceptFrame(); }}
              disabled={frameSaveStatus === 'saving'}
              style={{ background: frameSaveStatus === 'done' ? 'hsl(120 40% 20%)' : `${accent}22`, border: `1px solid ${frameSaveStatus === 'done' ? 'hsl(120 50% 30%)' : accent + '60'}`, borderRadius: '4px', padding: '4px 14px', cursor: frameSaveStatus === 'saving' ? 'wait' : 'pointer', color: frameSaveStatus === 'done' ? 'hsl(120 60% 55%)' : accent, fontSize: '11px', fontFamily: 'serif', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: frameSaveStatus === 'saving' ? 0.6 : 1 }}
            >
              {frameSaveStatus === 'saving' ? 'Saving…' : frameSaveStatus === 'done' ? 'Saved' : 'Accept'}
            </button>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8 cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.94)' }}
          onClick={() => setLightbox(false)}
        >
          <img src={url} alt="" className="max-w-full max-h-full object-contain" style={{ borderRadius: '6px' }} />
        </div>
      )}
    </>
  );
}

// ─── Small gallery for overflow images ───────────────────────────────────────

function OverflowGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (images.length === 0) return null;
  return (
    <>
      <div className="flex gap-3 flex-wrap mt-8 mb-2">
        {images.map((url, i) => (
          <div
            key={i}
            className="cursor-pointer overflow-hidden flex-shrink-0"
            style={{ width: '80px', height: '80px', borderRadius: '4px', border: '1px solid hsl(15 8% 14%)', transition: 'border-color 0.2s' }}
            onClick={() => setLightbox(url)}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'hsl(25 60% 28%)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(15 8% 14%)')}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8 cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.94)' }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" style={{ borderRadius: '6px' }} />
        </div>
      )}
    </>
  );
}

// ─── Audio embed (Google Drive) ───────────────────────────────────────────────

function AudioEmbed({ url }: { url: string }) {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
  return (
    <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid hsl(15 8% 18%)' }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="80"
        allow="autoplay"
        style={{ display: 'block', border: 'none', background: 'hsl(15 6% 10%)' }}
        title="Session Recording"
      />
    </div>
  );
}

// ─── Inline video player (MP4) ────────────────────────────────────────────────

function VideoEmbed({ url }: { url: string }) {
  return (
    <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid hsl(15 8% 18%)', background: 'hsl(15 6% 6%)' }}>
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        style={{ display: 'block', width: '100%', maxHeight: '480px', background: '#000' }}
      />
    </div>
  );
}

// ─── Content renderer with woven images ──────────────────────────────────────

function renderWovenContent(
  content: string,
  images: string[],
  imagePositions?: string[],
  isDM?: boolean,
  onSavePosition?: (imgIndex: number, pos: string) => Promise<void>,
): React.ReactNode[] {
  const rawSections = content.split(/(?=^## )/m).filter(s => s.trim());
  const sectionCount = rawSections.length;

  if (images.length === 0 || sectionCount === 0) {
    return renderLines(content.split('\n'));
  }

  const inlineMax = Math.min(images.length, sectionCount);
  const galleryImages = images.slice(inlineMax);

  const imageAfterSection: number[] = [];
  for (let j = 0; j < inlineMax; j++) {
    const raw = Math.round((j + 0.5) * sectionCount / inlineMax) - 1;
    imageAfterSection.push(Math.min(Math.max(raw, 0), sectionCount - 1));
  }

  const nodes: React.ReactNode[] = [];
  rawSections.forEach((section, i) => {
    nodes.push(...renderLines(section.split('\n'), i * 1000));
    imageAfterSection.forEach((targetSection, imgIdx) => {
      if (targetSection === i) {
        nodes.push(
          <WovenImage
            key={`woven-${imgIdx}`}
            url={images[imgIdx]}
            index={imgIdx}
            position={imagePositions?.[imgIdx]}
            isDM={isDM}
            onSavePosition={onSavePosition ? (pos) => onSavePosition(imgIdx, pos) : undefined}
          />
        );
      }
    });
  });

  if (galleryImages.length > 0) {
    nodes.push(<OverflowGallery key="gallery" images={galleryImages} />);
  }

  return nodes;
}

// ─── Session Detail Page ──────────────────────────────────────────────────────

export function SessionDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDM } = useAuth();
  const pat = import.meta.env.VITE_GITHUB_PAT as string;

  // ── Hero image framing ──
  const [isFraming, setIsFraming] = useState(false);
  const [framingPos, setFramingPos] = useState({ x: 50, y: 50 });
  const [frameSaveStatus, setFrameSaveStatus] = useState<'idle'|'saving'|'done'|'error'>('idle');
  const [heroHovered, setHeroHovered] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    vaultService.getSessions()
      .then(setSessions)
      .catch(() => setError('Could not load session data.'))
      .finally(() => setLoading(false));
  }, []);

  // Sorted ascending for prev/next nav (session 1 → 24)
  const sorted = [...sessions].sort((a, b) => a.number - b.number);
  const session = sorted.find(s => s.slug === slug);
  const currentIdx = sorted.findIndex(s => s.slug === slug);
  const prevSession = currentIdx > 0 ? sorted[currentIdx - 1] : null;
  const nextSession = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  const formattedDate = session?.date
    ? new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  function handleFramingStart() {
    if (!session) return;
    const current = session.imagePosition ?? 'center center';
    const parts = current.split(' ');
    const parseVal = (v: string, fallback: number) => {
      if (v === 'center') return 50;
      if (v === 'left') return 0; if (v === 'right') return 100;
      if (v === 'top') return 0; if (v === 'bottom') return 100;
      return parseFloat(v) || fallback;
    };
    setFramingPos({ x: parseVal(parts[0], 50), y: parseVal(parts[1] || parts[0], 50) });
    setIsFraming(true); setFrameSaveStatus('idle');
  }

  function handleFramingMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isFraming || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
    setFramingPos({ x, y });
  }

  async function handleSaveInlinePosition(imgIndex: number, pos: string) {
    if (!session) return;
    await updateSessionInlineImagePosition(session.slug, imgIndex, pos, pat);
    setSessions(prev => prev.map(s => {
      if (s.slug !== session.slug) return s;
      const positions = [...(s.imagePositions || s.images.map(() => 'center center'))];
      positions[imgIndex] = pos;
      return { ...s, imagePositions: positions };
    }));
  }

  async function handleFramingAccept() {
    if (!session) return;
    const posStr = `${framingPos.x}% ${framingPos.y}%`;
    setFrameSaveStatus('saving');
    try {
      await updateSessionImagePosition(session.slug, posStr, pat);
      setSessions(prev => prev.map(s => s.slug === session.slug ? { ...s, imagePosition: posStr } : s));
      setFrameSaveStatus('done');
      setTimeout(() => { setIsFraming(false); setFrameSaveStatus('idle'); }, 1200);
    } catch {
      setFrameSaveStatus('error');
    }
  }

  useEffect(() => {
    if (!isFraming) return;
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Enter') handleFramingAccept(); }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFraming, framingPos]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ height: '520px', background: 'hsl(15 6% 8%)', borderRadius: '6px', opacity: 0.5 }} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="font-display italic mb-6" style={{ color: 'hsl(15 4% 40%)' }}>
          {error ?? 'Session not found.'}
        </p>
        <Link href="/sessions" className="font-display text-xs uppercase tracking-[0.2em]" style={{ color: 'hsl(25 80% 38%)', textDecoration: 'none' }}>
          ← Campaign Journal
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

      {/* ── Hero ── */}
      <div
        ref={heroRef}
        className="relative"
        style={{
          height: 'clamp(360px, 60vh, 600px)', overflow: 'hidden',
          cursor: isFraming ? 'crosshair' : 'default',
          outline: isFraming ? '2px solid hsl(25 100% 38%)80' : 'none',
        }}
        onMouseEnter={() => { if (!isFraming) setHeroHovered(true); }}
        onMouseLeave={() => { if (!isFraming) setHeroHovered(false); }}
        onMouseMove={handleFramingMouseMove}
      >
        {session.imageUrl ? (
          <motion.img
            src={session.imageUrl}
            alt={session.title}
            className="w-full h-full object-cover"
            style={{
              opacity: 0.52,
              objectPosition: isFraming ? `${framingPos.x}% ${framingPos.y}%` : (session.imagePosition ?? 'center center'),
              transition: isFraming ? 'object-position 0.05s linear' : undefined,
            }}
            animate={isFraming ? {} : { scale: [1, 1.07] }}
            transition={{ duration: 16, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, hsl(15 8% 6%), hsl(25 20% 10%))' }} />
        )}

        {/* Multi-layer gradient: rich at bottom, lighter in middle */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to top, hsl(15 6% 8%) 0%, hsl(15 6% 8%)cc 15%, rgba(10,8,7,0.4) 50%, transparent 75%)'
        }} />

        {/* ── Framing overlay (DM mode) ── */}
        {isFraming && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: `${framingPos.x}%`, top: `${framingPos.y}%`, transform: 'translate(-50%, -50%)', width: '40px', height: '40px' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'hsl(25 100% 38%)cc', transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'hsl(25 100% 38%)cc', transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(25 100% 38%)', boxShadow: '0 0 10px hsl(25 100% 38%)' }} />
            </div>
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,6,4,0.88)', border: '1px solid hsl(25 100% 38%)50', borderRadius: '4px', padding: '5px 12px' }}>
              <span className="font-serif uppercase" style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'hsl(25 100% 48%)' }}>
                Drag to Frame · {framingPos.x}% {framingPos.y}%
              </span>
            </div>
          </div>
        )}

        {/* ── DM: Adjust Frame + Accept/Cancel ── */}
        {isDM && session.imageUrl && !isFraming && (
          <button
            onClick={handleFramingStart}
            style={{
              position: 'absolute', bottom: '16px', right: '16px', zIndex: 10,
              background: 'rgba(8,6,4,0.82)', border: '1px solid hsl(25 100% 38%)40',
              borderRadius: '4px', padding: '6px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              opacity: heroHovered ? 1 : 0, transition: 'opacity 0.2s ease',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="hsl(25 100% 38%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            <span className="font-serif uppercase" style={{ fontSize: '9px', letterSpacing: '0.18em', color: 'hsl(25 100% 38%)' }}>Adjust Frame</span>
          </button>
        )}
        {isDM && isFraming && (
          <div style={{
            position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, display: 'flex', gap: '8px', alignItems: 'center',
            background: 'rgba(8,6,4,0.9)', border: '1px solid hsl(25 100% 38%)35',
            borderRadius: '6px', padding: '8px 14px',
          }}>
            <span className="font-display" style={{ fontSize: '11px', color: 'hsl(15 4% 40%)', marginRight: '4px' }}>
              {framingPos.x}% {framingPos.y}%
            </span>
            <button
              onClick={() => { setIsFraming(false); setFrameSaveStatus('idle'); }}
              style={{ background: 'transparent', border: '1px solid hsl(15 8% 22%)', borderRadius: '4px', padding: '5px 12px', cursor: 'pointer', color: 'hsl(15 4% 42%)', fontSize: '11px', fontFamily: 'serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >Cancel</button>
            <button
              onClick={handleFramingAccept}
              disabled={frameSaveStatus === 'saving'}
              style={{ background: frameSaveStatus === 'done' ? 'hsl(120 40% 20%)' : 'hsl(25 100% 38%)22', border: `1px solid ${frameSaveStatus === 'done' ? 'hsl(120 50% 30%)' : 'hsl(25 100% 38%)60'}`, borderRadius: '4px', padding: '5px 14px', cursor: frameSaveStatus === 'saving' ? 'wait' : 'pointer', color: frameSaveStatus === 'done' ? 'hsl(120 60% 55%)' : 'hsl(25 100% 48%)', fontSize: '11px', fontFamily: 'serif', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: frameSaveStatus === 'saving' ? 0.6 : 1 }}
            >
              {frameSaveStatus === 'saving' ? 'Saving…' : frameSaveStatus === 'done' ? 'Saved' : 'Accept'}
            </button>
          </div>
        )}

        {/* Session number — top left */}
        <div className="absolute" style={{ top: '2rem', left: '2rem' }}>
          <span className="font-display uppercase tracking-[0.35em]" style={{ fontSize: '0.55rem', color: 'hsl(25 80% 52%)', display: 'block', marginBottom: '0.25rem' }}>
            Session
          </span>
          <span className="font-serif font-black" style={{ fontSize: '5rem', color: 'hsl(25 100% 44%)', lineHeight: 1, textShadow: '0 0 80px hsl(25 90% 20%), 0 0 20px hsl(25 80% 10%)' }}>
            {session.number}
          </span>
        </div>

        {/* Title — bottom left */}
        <div className="absolute" style={{ bottom: '2.5rem', left: '2rem', right: '2rem' }}>
          {/* Thin amber sweep line above title */}
          <div style={{ width: '48px', height: '2px', background: 'hsl(25 80% 42%)', marginBottom: '1rem', borderRadius: '1px' }} />
          <h1
            className="font-serif font-black uppercase tracking-wide leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', color: 'hsl(15 4% 97%)', textShadow: '0 2px 32px rgba(0,0,0,0.95)' }}
          >
            {session.title}
          </h1>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Back link */}
        <Link
          href="/sessions"
          className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.22em] mb-8 transition-colors duration-200"
          style={{ color: 'hsl(15 4% 32%)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'hsl(25 80% 42%)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'hsl(15 4% 32%)'}
        >
          <ChevronLeft size={12} />
          Campaign Journal
        </Link>

        {/* Meta: date + tags */}
        <div className="flex flex-wrap items-center gap-3 mb-7">
          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar size={11} style={{ color: 'hsl(15 4% 32%)' }} />
              <span className="font-display text-xs uppercase tracking-[0.18em]" style={{ color: 'hsl(15 4% 38%)' }}>
                {formattedDate}
              </span>
            </div>
          )}
          {session.videoUrl && (
            <span className="flex items-center gap-1 font-display text-[10px] uppercase tracking-wider px-2 py-0.5"
              style={{ background: 'hsl(25 80% 12%)', border: '1px solid hsl(25 80% 24%)', borderRadius: '3px', color: 'hsl(25 80% 48%)' }}>
              <Video size={9} /> Video
            </span>
          )}
          {session.tags.map(tag => (
            <span
              key={tag}
              className="font-display text-[10px] uppercase tracking-wider px-2 py-0.5"
              style={{ background: 'hsl(15 6% 11%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '3px', color: 'hsl(15 4% 36%)' }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Audio embed */}
        {session.audioUrl && (
          <div className="mb-8">
            <p className="font-display text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: 'hsl(25 60% 32%)' }}>
              Session Recording
            </p>
            <AudioEmbed url={session.audioUrl} />
          </div>
        )}

        {/* Video embed */}
        {session.videoUrl && (
          <div className="mb-8">
            <p className="font-display text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: 'hsl(25 60% 32%)' }}>
              Session Clip
            </p>
            <VideoEmbed url={session.videoUrl} />
          </div>
        )}

        {/* Summary */}
        <p className="font-serif italic mb-7" style={{ color: 'hsl(15 4% 56%)', fontSize: '1.08rem', lineHeight: 1.78 }}>
          {session.summary}
        </p>

        {/* Amber divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, hsl(25 50% 18%))' }} />
          <div style={{ width: '6px', height: '6px', background: 'hsl(25 80% 38%)', transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to left, transparent, hsl(25 50% 18%))' }} />
        </div>

        {/* Content with woven images */}
        <div style={{ fontSize: '0.97rem', lineHeight: 1.88 }}>
          {renderWovenContent(session.content, session.images, session.imagePositions, isDM, handleSaveInlinePosition)}
        </div>

        {/* ── Prev / Next nav ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '3.5rem 0 2rem' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, hsl(25 50% 18%))' }} />
          <div style={{ width: '6px', height: '6px', background: 'hsl(25 80% 38%)', transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to left, transparent, hsl(25 50% 18%))' }} />
        </div>

        <div className="flex justify-between items-start gap-4">
          {prevSession ? (
            <Link
              href={`/sessions/${prevSession.slug}`}
              className="flex items-center gap-2 flex-1"
              style={{ textDecoration: 'none' }}
            >
              <ChevronLeft size={14} style={{ color: 'hsl(25 80% 36%)', flexShrink: 0 }} />
              <div>
                <div className="font-display text-[9px] uppercase tracking-[0.25em] mb-0.5" style={{ color: 'hsl(15 4% 28%)' }}>
                  Session {prevSession.number}
                </div>
                <div className="font-serif text-sm leading-snug" style={{ color: 'hsl(15 4% 56%)' }}>
                  {prevSession.title}
                </div>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {nextSession ? (
            <Link
              href={`/sessions/${nextSession.slug}`}
              className="flex items-center gap-2 flex-1 justify-end text-right"
              style={{ textDecoration: 'none' }}
            >
              <div>
                <div className="font-display text-[9px] uppercase tracking-[0.25em] mb-0.5" style={{ color: 'hsl(15 4% 28%)' }}>
                  Session {nextSession.number}
                </div>
                <div className="font-serif text-sm leading-snug" style={{ color: 'hsl(15 4% 56%)' }}>
                  {nextSession.title}
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'hsl(25 80% 36%)', flexShrink: 0 }} />
            </Link>
          ) : <div className="flex-1" />}
        </div>

      </div>
    </motion.div>
  );
}
