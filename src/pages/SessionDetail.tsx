import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { vaultService } from '../vaultService';
import type { SessionEntry } from '../types';

// ─── Inline markdown ──────────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('***') && part.endsWith('***')) return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: 'hsl(15 4% 88%)' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function renderLines(lines: string[], keyOffset = 0): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let key = keyOffset;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      nodes.push(
        <h3 key={key++} className="font-serif font-bold mt-10 mb-3 uppercase tracking-wide"
          style={{ fontSize: '0.85rem', color: 'hsl(25 100% 42%)', letterSpacing: '0.18em' }}>
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      nodes.push(
        <blockquote key={key++} className="my-4 pl-4 italic"
          style={{ borderLeft: '2px solid hsl(25 80% 28%)', color: 'hsl(15 4% 55%)' }}>
          {parseInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('- ')) {
      nodes.push(
        <div key={key++} className="flex gap-2 my-1" style={{ color: 'hsl(15 4% 68%)' }}>
          <span style={{ color: 'hsl(25 80% 38%)', flexShrink: 0 }}>·</span>
          <span>{parseInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.startsWith('---')) {
      nodes.push(<div key={key++} className="forge-divider my-6" />);
    } else if (line.trim() === '') {
      nodes.push(<div key={key++} style={{ height: '0.6rem' }} />);
    } else {
      nodes.push(
        <p key={key++} className="leading-relaxed" style={{ color: 'hsl(15 4% 72%)', marginBottom: '0.15rem' }}>
          {parseInline(line)}
        </p>
      );
    }
  }
  return nodes;
}

// ─── Woven image (full-width inline figure) ───────────────────────────────────

function WovenImage({ url, index }: { url: string; index: number }) {
  const [lightbox, setLightbox] = useState(false);
  return (
    <>
      <div
        className="my-10 overflow-hidden cursor-pointer"
        style={{
          borderRadius: '4px',
          border: '1px solid hsl(15 8% 14%)',
          transition: 'border-color 0.2s',
        }}
        onClick={() => setLightbox(true)}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'hsl(25 60% 28%)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(15 8% 14%)')}
      >
        <img
          src={url}
          alt=""
          className="w-full object-cover"
          style={{ maxHeight: '340px', opacity: 0.88, display: 'block' }}
        />
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8 cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.92)' }}
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
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" style={{ borderRadius: '6px' }} />
        </div>
      )}
    </>
  );
}

// ─── Audio embed ──────────────────────────────────────────────────────────────

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

// ─── Content renderer with woven images ──────────────────────────────────────

function renderWovenContent(content: string, images: string[]): React.ReactNode[] {
  // Split into sections at ## boundaries (includes any preamble before the first ##)
  const rawSections = content.split(/(?=^## )/m).filter(s => s.trim());
  const sectionCount = rawSections.length;

  if (images.length === 0 || sectionCount === 0) {
    return renderLines(content.split('\n'));
  }

  // Cap inline images at 1 per section; overflow goes to gallery
  const inlineMax = Math.min(images.length, sectionCount);
  const galleryImages = images.slice(inlineMax);

  // Distribute inline images evenly across section breaks
  // Image j appears after section: clamp(round((j+0.5) * sections / inlineMax) - 1, 0, sections-1)
  const imageAfterSection: number[] = [];
  for (let j = 0; j < inlineMax; j++) {
    const raw = Math.round((j + 0.5) * sectionCount / inlineMax) - 1;
    imageAfterSection.push(Math.min(Math.max(raw, 0), sectionCount - 1));
  }

  const nodes: React.ReactNode[] = [];
  rawSections.forEach((section, i) => {
    nodes.push(...renderLines(section.split('\n'), i * 1000));
    // Inject any images assigned to this section
    imageAfterSection.forEach((targetSection, imgIdx) => {
      if (targetSection === i) {
        nodes.push(<WovenImage key={`woven-${imgIdx}`} url={images[imgIdx]} index={imgIdx} />);
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

  useEffect(() => {
    vaultService.getSessions()
      .then(setSessions)
      .catch(() => setError('Could not load session data.'))
      .finally(() => setLoading(false));
  }, []);

  const session = sessions.find(s => s.slug === slug);
  const currentIdx = sessions.findIndex(s => s.slug === slug);
  const prevSession = currentIdx > 0 ? sessions[currentIdx - 1] : null;
  const nextSession = currentIdx < sessions.length - 1 ? sessions[currentIdx + 1] : null;

  const formattedDate = session?.date
    ? new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ height: '420px', background: 'hsl(15 6% 8%)', borderRadius: '6px', opacity: 0.5 }} />
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
      <div className="relative" style={{ height: 'clamp(300px, 48vh, 480px)', overflow: 'hidden' }}>
        {session.imageUrl ? (
          <img
            src={session.imageUrl}
            alt={session.title}
            className="w-full h-full object-cover"
            style={{ opacity: 0.5, objectPosition: session.imagePosition ?? 'center center' }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, hsl(15 8% 6%), hsl(25 20% 10%))' }} />
        )}
        {/* Gradient overlay: heavy at bottom so text is readable */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(15 6% 8%) 0%, rgba(10,8,7,0.55) 40%, transparent 70%)' }} />

        {/* Session number — top left */}
        <div className="absolute" style={{ top: '2rem', left: '2rem' }}>
          <span className="font-display uppercase tracking-[0.35em]" style={{ fontSize: '0.55rem', color: 'hsl(25 80% 48%)', display: 'block', marginBottom: '0.2rem' }}>
            Session
          </span>
          <span className="font-serif font-black" style={{ fontSize: '4.5rem', color: 'hsl(25 100% 44%)', lineHeight: 1, textShadow: '0 0 60px hsl(25 80% 18%)' }}>
            {session.number}
          </span>
        </div>

        {/* Title — bottom */}
        <div className="absolute" style={{ bottom: '2rem', left: '2rem', right: '2rem' }}>
          <h1
            className="font-serif font-black uppercase tracking-wide leading-tight"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.8rem)', color: 'hsl(15 4% 96%)', textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}
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
          style={{ color: 'hsl(15 4% 36%)', textDecoration: 'none' }}
        >
          <ChevronLeft size={12} />
          Campaign Journal
        </Link>

        {/* Meta: date + tags */}
        <div className="flex flex-wrap items-center gap-3 mb-7">
          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar size={11} style={{ color: 'hsl(15 4% 35%)' }} />
              <span className="font-display text-xs uppercase tracking-[0.18em]" style={{ color: 'hsl(15 4% 38%)' }}>
                {formattedDate}
              </span>
            </div>
          )}
          {session.tags.map(tag => (
            <span
              key={tag}
              className="font-display text-[10px] uppercase tracking-wider px-2 py-0.5"
              style={{ background: 'hsl(15 6% 11%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '3px', color: 'hsl(15 4% 38%)' }}
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

        {/* Summary */}
        <p className="font-serif italic mb-7" style={{ color: 'hsl(15 4% 56%)', fontSize: '1.08rem', lineHeight: 1.72 }}>
          {session.summary}
        </p>

        <div className="forge-divider mb-10" />

        {/* Content with woven images */}
        <div style={{ fontSize: '0.97rem', lineHeight: 1.88 }}>
          {renderWovenContent(session.content, session.images)}
        </div>

        {/* ── Prev / Next nav ── */}
        <div className="forge-divider mt-14 mb-8" />
        <div className="flex justify-between items-start gap-4">
          {prevSession ? (
            <Link
              href={`/sessions/${prevSession.slug}`}
              className="flex items-center gap-2 flex-1"
              style={{ textDecoration: 'none' }}
            >
              <ChevronLeft size={14} style={{ color: 'hsl(25 80% 36%)', flexShrink: 0 }} />
              <div>
                <div className="font-display text-[9px] uppercase tracking-[0.25em] mb-0.5" style={{ color: 'hsl(15 4% 32%)' }}>
                  Session {prevSession.number}
                </div>
                <div className="font-serif text-sm leading-snug" style={{ color: 'hsl(15 4% 60%)' }}>
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
                <div className="font-display text-[9px] uppercase tracking-[0.25em] mb-0.5" style={{ color: 'hsl(15 4% 32%)' }}>
                  Session {nextSession.number}
                </div>
                <div className="font-serif text-sm leading-snug" style={{ color: 'hsl(15 4% 60%)' }}>
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
