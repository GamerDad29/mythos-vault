import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { vaultService } from '../vaultService';
import type { SessionEntry } from '../types';

// ─── Inline markdown renderer ─────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('***') && part.endsWith('***')) return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: 'hsl(15 4% 88%)' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function renderSessionContent(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      nodes.push(
        <h3 key={key++} className="font-serif font-bold mt-8 mb-3 uppercase tracking-wide" style={{ fontSize: '0.85rem', color: 'hsl(25 100% 42%)', letterSpacing: '0.18em' }}>
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      nodes.push(
        <blockquote key={key++} className="my-4 pl-4 italic" style={{ borderLeft: '2px solid hsl(25 80% 28%)', color: 'hsl(15 4% 55%)' }}>
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

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 flex-wrap mt-6">
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

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, index }: { session: SessionEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = session.date
    ? new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: 'easeOut' }}
    >
      <div style={{ background: 'hsl(15 6% 8%)', border: '1px solid hsl(15 8% 14%)', borderRadius: '6px', overflow: 'hidden' }}>

        {/* Hero image */}
        {session.imageUrl && (
          <div className="relative" style={{ height: '260px', overflow: 'hidden' }}>
            <img src={session.imageUrl} alt={session.title} className="w-full h-full object-cover" style={{ opacity: 0.5 }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(15 6% 8%) 0%, rgba(0,0,0,0.1) 60%)' }} />
          </div>
        )}

        <div className="p-8">
          {/* Session number */}
          <div className="flex items-center gap-4 mb-5">
            <span className="font-display uppercase tracking-[0.3em]" style={{ fontSize: '0.6rem', color: 'hsl(25 80% 38%)' }}>Session</span>
            <span className="font-serif font-black" style={{ fontSize: '2.8rem', color: 'hsl(25 100% 38%)', lineHeight: 1 }}>{session.number}</span>
            <div className="flex-1" style={{ height: '1px', background: 'linear-gradient(to right, hsl(25 60% 20%), transparent)' }} />
          </div>

          {/* Title */}
          <h2 className="font-serif font-black uppercase tracking-wide mb-4 leading-tight" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', color: 'hsl(15 4% 92%)' }}>
            {session.title}
          </h2>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {formattedDate && (
              <span className="font-display text-xs uppercase tracking-[0.2em]" style={{ color: 'hsl(15 4% 38%)' }}>
                {formattedDate}
              </span>
            )}
            {session.audioUrl && (
              <a
                href={session.audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-display text-xs uppercase tracking-wider px-3 py-1.5 transition-all duration-200"
                style={{ background: 'hsl(25 100% 38%)15', border: '1px solid hsl(25 100% 38%)40', borderRadius: '3px', color: 'hsl(25 100% 42%)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(25 100% 38%)28')}
                onMouseLeave={e => (e.currentTarget.style.background = 'hsl(25 100% 38%)15')}
              >
                <Volume2 size={11} />
                Listen
              </a>
            )}
          </div>

          {/* Summary */}
          <p className="font-serif italic mb-5" style={{ color: 'hsl(15 4% 52%)', fontSize: '1.05rem', lineHeight: 1.65 }}>
            {session.summary}
          </p>

          {/* Expanded content */}
          {expanded && (
            <div className="mt-4 mb-6" style={{ fontSize: '0.96rem', lineHeight: 1.85 }}>
              {renderSessionContent(session.content)}
              <ImageGallery images={session.images} />
            </div>
          )}

          {/* Toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] transition-colors duration-200"
            style={{ color: expanded ? 'hsl(15 4% 38%)' : 'hsl(25 80% 38%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Collapse' : 'Read the Recap'}
          </button>

          {/* Collapsed image count */}
          {!expanded && session.images.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <ImageIcon size={11} style={{ color: 'hsl(15 4% 28%)' }} />
              <span className="font-display text-[10px] uppercase tracking-wider" style={{ color: 'hsl(15 4% 28%)' }}>
                {session.images.length} image{session.images.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Sessions() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vaultService.getSessions()
      .then(setSessions)
      .catch(() => setError('Could not load session recaps from the Vault.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
        <p className="font-display text-sm uppercase tracking-[0.3em] mb-3" style={{ color: 'hsl(25 80% 38%)' }}>
          Chronicle
        </p>
        <h1 className="font-serif font-black uppercase tracking-wide mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'hsl(15 4% 92%)' }}>
          Campaign Journal
        </h1>
        <div className="forge-divider w-24 mb-4" />
        <p className="font-display italic" style={{ color: 'hsl(15 4% 50%)' }}>
          A chronicle of the Pathways Unseen — session by session
        </p>
      </motion.div>

      {error ? (
        <p className="font-display italic text-center py-20" style={{ color: 'hsl(15 4% 40%)' }}>{error}</p>
      ) : loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: '180px', background: 'hsl(15 6% 8%)', borderRadius: '6px', border: '1px solid hsl(15 8% 14%)', opacity: 0.5 }} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {sessions.map((session, i) => (
            <SessionCard key={session.id} session={session} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
