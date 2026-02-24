import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { vaultService } from '../vaultService';
import { SkeletonHero } from '../components/Skeleton';
import type { VaultEntity } from '../types';
import { FACTION_COLORS } from '../types';

// Very simple markdown renderer — bold, italic, headers
function renderContent(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;

    // Section headers (ALL CAPS lines that are short labels)
    if (/^[A-Z][A-Z\s]+$/.test(line.trim()) && line.trim().length < 40) {
      return (
        <div key={i} className="mt-8 mb-3">
          <p
            className="font-serif text-xs uppercase tracking-[0.25em]"
            style={{ color: 'hsl(25 80% 38%)' }}
          >
            {line.trim()}
          </p>
          <div className="forge-divider mt-1" />
        </div>
      );
    }

    // Bold + italic inline
    const parsed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                       .replace(/\*(.+?)\*/g, '<em>$1</em>');

    return (
      <p
        key={i}
        className="font-sans leading-relaxed"
        style={{ color: 'hsl(15 4% 78%)', fontSize: '17px', marginBottom: '0.5rem' }}
        dangerouslySetInnerHTML={{ __html: parsed }}
      />
    );
  });
}

export function EntityDetail() {
  const [, params] = useRoute('/:type/:slug');
  const type = params?.type?.slice(0, -1).toUpperCase() || ''; // strip trailing 's'
  const slug = params?.slug || '';

  const [entity, setEntity] = useState<VaultEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!type || !slug) return;
    setLoading(true);
    vaultService.getEntity(type, slug)
      .then(setEntity)
      .catch(() => setError('This entry has not been revealed.'))
      .finally(() => setLoading(false));
  }, [type, slug]);

  const backHref = `/${params?.type || ''}`;
  const backLabel = (params?.type || 'back').charAt(0).toUpperCase() + (params?.type || 'back').slice(1);

  const factionColor = entity?.factionId ? FACTION_COLORS[entity.factionId] : undefined;
  const accentColor = factionColor || 'hsl(25 100% 38%)';

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div style={{ height: '32px', width: '120px', background: 'hsl(20 6% 14%)', borderRadius: '4px', marginBottom: '32px' }} />
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
            Entry Not Found
          </h1>
          <p className="font-display italic mb-8" style={{ color: 'hsl(15 4% 40%)' }}>
            {error || 'This secret has not yet been uncovered.'}
          </p>
          <Link href={backHref}>
            <span className="font-serif text-sm uppercase tracking-wider cursor-pointer" style={{ color: accentColor }}>
              ← Back to {backLabel}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back button */}
        <Link href={backHref}>
          <div
            className="inline-flex items-center gap-2 cursor-pointer mb-10 font-serif text-xs uppercase tracking-wider transition-colors"
            style={{ color: 'hsl(15 4% 45%)' }}
            onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
            onMouseLeave={e => (e.currentTarget.style.color = 'hsl(15 4% 45%)')}
          >
            <ArrowLeft size={14} />
            {backLabel}
          </div>
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden mb-12"
          style={{
            border: `1px solid ${accentColor}33`,
            borderRadius: '4px',
            background: `linear-gradient(135deg, rgba(20,16,12,1) 0%, hsl(20 6% 10%) 100%)`,
            boxShadow: `0 0 60px -20px ${accentColor}22`,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Image */}
            <div
              className="relative overflow-hidden"
              style={{ minHeight: '280px', background: 'hsl(15 6% 7%)' }}
            >
              {entity.imageUrl && !imgError ? (
                <>
                  <img
                    src={entity.imageUrl}
                    alt={entity.name}
                    className="w-full h-full object-cover"
                    style={{ minHeight: '280px', display: 'block' }}
                    onError={() => setImgError(true)}
                  />
                  {/* Right-edge fade into hero content — desktop */}
                  <div className="absolute inset-y-0 right-0 pointer-events-none hidden md:block" style={{
                    width: '100px',
                    background: 'linear-gradient(to right, transparent, rgba(18,14,10,0.97))',
                  }} />
                  {/* Bottom fade — mobile */}
                  <div className="absolute inset-x-0 bottom-0 pointer-events-none md:hidden" style={{
                    height: '80px',
                    background: 'linear-gradient(to bottom, transparent, rgba(18,14,10,0.97))',
                  }} />
                  {/* Corner vignette */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at 30% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)',
                  }} />
                </>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center relative"
                  style={{
                    minHeight: '280px',
                    background: `radial-gradient(ellipse at 35% 50%, hsl(20 8% 11%) 0%, hsl(15 6% 6%) 100%)`,
                  }}
                >
                  <span style={{ fontSize: '5rem', opacity: 0.12, color: accentColor }}>⟁</span>
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.3) 100%)',
                  }} />
                </div>
              )}
            </div>

            {/* Header info */}
            <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-center">
              {entity.category && (
                <p
                  className="font-display text-xs uppercase tracking-[0.25em] mb-4"
                  style={{ color: accentColor, opacity: 0.85 }}
                >
                  {entity.type} · {entity.category}
                </p>
              )}

              <h1
                className="font-serif font-black uppercase leading-tight mb-4"
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                  letterSpacing: '0.04em',
                  color: 'hsl(15 4% 94%)',
                }}
              >
                {entity.name}
              </h1>

              <div
                className="mb-5"
                style={{ height: '2px', width: '48px', background: accentColor }}
              />

              {entity.summary && (
                <p
                  className="font-display italic text-lg leading-relaxed"
                  style={{ color: 'hsl(15 4% 62%)', fontSize: '16px' }}
                >
                  {entity.summary}
                </p>
              )}

              {/* Tags */}
              {entity.tags && entity.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {entity.tags.map(tag => (
                    <span
                      key={tag}
                      className="font-serif text-xs uppercase tracking-wider px-2.5 py-1"
                      style={{
                        background: `${accentColor}18`,
                        border: `1px solid ${accentColor}33`,
                        color: accentColor,
                        borderRadius: '2px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Body content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Main content */}
          <div className="lg:col-span-2">
            <div
              className="p-8"
              style={{
                background: 'hsl(20 6% 10%)',
                border: '1px solid hsl(15 8% 16%)',
                borderRadius: '4px',
              }}
            >
              {renderContent(entity.content)}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Meta */}
            <div
              className="p-6"
              style={{
                background: 'hsl(20 6% 10%)',
                border: '1px solid hsl(15 8% 16%)',
                borderRadius: '4px',
              }}
            >
              <h3
                className="font-serif font-bold uppercase tracking-[0.15em] text-sm mb-5"
                style={{ color: 'hsl(15 4% 70%)' }}
              >
                Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-serif text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(15 4% 40%)' }}>Type</p>
                  <p className="font-sans text-sm" style={{ color: 'hsl(15 4% 78%)', fontSize: '15px' }}>{entity.type}</p>
                </div>
                {entity.source && (
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(15 4% 40%)' }}>Source</p>
                    <p className="font-sans text-sm" style={{ color: 'hsl(15 4% 78%)', fontSize: '15px' }}>{entity.source}</p>
                  </div>
                )}
                <div>
                  <p className="font-serif text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(15 4% 40%)' }}>Published</p>
                  <p className="font-sans text-sm" style={{ color: 'hsl(15 4% 78%)', fontSize: '15px' }}>
                    {new Date(entity.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Image link if exists */}
            {entity.imageUrl && (
              <a
                href={entity.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 transition-colors cursor-pointer"
                style={{
                  background: 'hsl(20 6% 10%)',
                  border: '1px solid hsl(15 8% 16%)',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${accentColor}44`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(15 8% 16%)')}
              >
                <span className="font-serif text-xs uppercase tracking-wider" style={{ color: 'hsl(15 4% 55%)' }}>
                  View Full Image
                </span>
                <ExternalLink size={13} style={{ color: 'hsl(15 4% 40%)' }} />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
