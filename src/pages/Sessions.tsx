import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Calendar, Volume2, Image as ImageIcon } from 'lucide-react';
import { vaultService } from '../vaultService';
import type { SessionEntry } from '../types';

// ─── Session Index Card ────────────────────────────────────────────────────────

function SessionCard({ session, index }: { session: SessionEntry; index: number }) {
  const formattedDate = session.date
    ? new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: 'easeOut' }}
    >
      <Link href={`/sessions/${session.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          className="overflow-hidden transition-all duration-200"
          style={{
            background: 'hsl(15 6% 8%)',
            border: '1px solid hsl(15 8% 14%)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(25 60% 22%)';
            (e.currentTarget as HTMLDivElement).style.background = 'hsl(15 6% 9%)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(15 8% 14%)';
            (e.currentTarget as HTMLDivElement).style.background = 'hsl(15 6% 8%)';
          }}
        >
          {/* Hero thumbnail */}
          {session.imageUrl ? (
            <div className="relative" style={{ height: '150px', overflow: 'hidden' }}>
              <img
                src={session.imageUrl}
                alt={session.title}
                className="w-full h-full object-cover"
                style={{ opacity: 0.45, objectPosition: session.imagePosition ?? 'center center' }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(15 6% 8%) 0%, transparent 55%)' }} />
              {/* Session number badge */}
              <div className="absolute" style={{ top: '0.8rem', left: '1rem' }}>
                <span className="font-display uppercase tracking-[0.3em]" style={{ fontSize: '0.5rem', color: 'hsl(25 80% 48%)', display: 'block', lineHeight: 1 }}>
                  Session
                </span>
                <span className="font-serif font-black" style={{ fontSize: '2.4rem', color: 'hsl(25 100% 44%)', lineHeight: 1, textShadow: '0 0 30px hsl(25 80% 14%)' }}>
                  {session.number}
                </span>
              </div>
            </div>
          ) : (
            /* No hero — dark panel with number */
            <div className="relative flex items-center" style={{ height: '72px', padding: '0 1.5rem', background: 'hsl(15 6% 7%)' }}>
              <span className="font-display uppercase tracking-[0.3em]" style={{ fontSize: '0.5rem', color: 'hsl(25 60% 32%)', marginRight: '0.75rem' }}>
                Session
              </span>
              <span className="font-serif font-black" style={{ fontSize: '2.6rem', color: 'hsl(25 80% 32%)', lineHeight: 1 }}>
                {session.number}
              </span>
              <div className="flex-1 ml-4" style={{ height: '1px', background: 'linear-gradient(to right, hsl(25 40% 16%), transparent)' }} />
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '1rem 1.5rem 1.2rem' }}>
            <h2 className="font-serif font-black uppercase tracking-wide leading-tight mb-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'hsl(15 4% 90%)' }}>
              {session.title}
            </h2>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {formattedDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={9} style={{ color: 'hsl(15 4% 32%)' }} />
                  <span className="font-display text-[10px] uppercase tracking-[0.15em]" style={{ color: 'hsl(15 4% 36%)' }}>
                    {formattedDate}
                  </span>
                </div>
              )}
              {session.audioUrl && (
                <span className="flex items-center gap-1 font-display text-[10px] uppercase tracking-wider px-2 py-0.5"
                  style={{ background: 'hsl(25 100% 38%)10', border: '1px solid hsl(25 100% 38%)30', borderRadius: '3px', color: 'hsl(25 80% 40%)' }}>
                  <Volume2 size={9} /> Audio
                </span>
              )}
              {session.images.length > 0 && (
                <span className="flex items-center gap-1 font-display text-[10px] uppercase tracking-wider"
                  style={{ color: 'hsl(15 4% 30%)' }}>
                  <ImageIcon size={9} /> {session.images.length}
                </span>
              )}
            </div>

            <p className="font-serif italic mb-3" style={{ color: 'hsl(15 4% 50%)', fontSize: '0.9rem', lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {session.summary}
            </p>

            <span className="font-display text-[10px] uppercase tracking-[0.22em]" style={{ color: 'hsl(25 80% 36%)' }}>
              Read the Recap →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Sessions Index Page ───────────────────────────────────────────────────────

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
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: '240px', background: 'hsl(15 6% 8%)', borderRadius: '6px', border: '1px solid hsl(15 8% 14%)', opacity: 0.4 }} />
          ))}
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {sessions.map((session, i) => (
            <SessionCard key={session.id} session={session} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
