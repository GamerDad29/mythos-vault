import { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { vaultService } from '../vaultService';
import { SkeletonHero } from '../components/Skeleton';
import type { VaultEntity, VaultEntityStub } from '../types';
import { FACTION_COLORS } from '../types';
import { renderContent, stripHiddenBlocks } from '../utils/renderContent';

const TYPE_PLURALS: Record<string, string> = {
  npcs: 'NPCs',
  creatures: 'Creatures',
  locations: 'Locations',
  factions: 'Factions',
  items: 'Items',
  lore: 'Lore',
  pcs: 'Characters',
};

export function EntityDetail() {
  const [, params] = useRoute('/:type/:slug');
  const [, navigate] = useLocation();
  const type = params?.type?.slice(0, -1).toUpperCase() || ''; // strip trailing 's'
  const slug = params?.slug || '';

  const [entity, setEntity] = useState<VaultEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [indexStubs, setIndexStubs] = useState<VaultEntityStub[]>([]);

  useEffect(() => {
    if (!type || !slug) return;
    setLoading(true);
    vaultService.getEntity(type, slug)
      .then(e => {
        setEntity(e);
      })
      .catch(() => setError('This entry has not been revealed.'))
      .finally(() => setLoading(false));
  }, [type, slug]);

  useEffect(() => {
    vaultService.getIndex().then(idx => setIndexStubs(idx.entities)).catch(() => {});
  }, []);

  const backHref = `/${params?.type || ''}`;
  const backLabel = TYPE_PLURALS[params?.type || ''] || (params?.type || 'Back').charAt(0).toUpperCase() + (params?.type || 'back').slice(1);

  const factionColor = entity?.factionId ? FACTION_COLORS[entity.factionId] : undefined;
  const accentColor = factionColor || (entity?.type === 'PC' ? 'hsl(200 70% 45%)' : 'hsl(25 100% 38%)');

  // Related entries — priority: same faction > same location > same city > same type
  const seen = new Set<string>();
  const pickRelated = (candidates: VaultEntityStub[], limit: number) =>
    candidates.filter(s => !s.hidden && s.id !== entity?.id && !seen.has(s.id))
      .slice(0, limit)
      .map(s => { seen.add(s.id); return s; });

  const relatedByFaction  = entity?.factionId  ? pickRelated(indexStubs.filter(s => s.factionId  === entity.factionId),  4) : [];
  const relatedByLocation = entity?.locationId ? pickRelated(indexStubs.filter(s => s.locationId === entity.locationId), 3) : [];
  const relatedByCity     = entity?.cityId     ? pickRelated(indexStubs.filter(s => s.cityId     === entity.cityId),     3) : [];
  const relatedByType     = entity?.type       ? pickRelated(indexStubs.filter(s => s.type       === entity.type),       4) : [];

  const hasRelated = relatedByFaction.length + relatedByLocation.length + relatedByCity.length + relatedByType.length > 0;

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

  if (entity?.hidden) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="font-serif text-5xl mb-6" style={{ color: 'hsl(15 8% 18%)' }}>⟁</p>
          <p
            className="font-display text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: 'hsl(15 4% 30%)' }}
          >
            Not yet revealed
          </p>
          <h1
            className="font-serif font-bold text-3xl uppercase tracking-wide mb-4 select-none"
            style={{ color: 'hsl(15 4% 45%)', filter: 'blur(5px)' }}
          >
            {entity.name}
          </h1>
          <p className="font-display italic mb-8" style={{ color: 'hsl(15 4% 35%)' }}>
            This entry has not yet been uncovered.
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

  const displayContent = stripHiddenBlocks(entity.content);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-10 font-serif text-xs uppercase tracking-wider">
          <Link href="/">
            <span
              className="cursor-pointer transition-colors"
              style={{ color: 'hsl(15 4% 40%)' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = accentColor)}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 40%)')}
            >
              Chronicle
            </span>
          </Link>
          <span style={{ color: 'hsl(15 8% 22%)' }}>›</span>
          <Link href={backHref}>
            <span
              className="cursor-pointer transition-colors"
              style={{ color: 'hsl(15 4% 40%)' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = accentColor)}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 40%)')}
            >
              {backLabel}
            </span>
          </Link>
          <span style={{ color: 'hsl(15 8% 22%)' }}>›</span>
          <span style={{ color: 'hsl(15 4% 65%)' }}>{entity.name}</span>
        </nav>

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
              onClick={(e) => {
                const a = (e.target as HTMLElement).closest('a[data-vault-link]');
                if (a) {
                  e.preventDefault();
                  navigate((a as HTMLAnchorElement).getAttribute('href') || '/');
                }
              }}
            >
              {renderContent(displayContent, accentColor, indexStubs, entity.id)}
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
              <div className="mb-5">
                <h3
                  className="font-serif font-bold uppercase tracking-[0.15em] text-sm"
                  style={{ color: 'hsl(15 4% 70%)' }}
                >
                  Details
                </h3>
              </div>
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

            {/* Related entries */}
            {hasRelated && (
              <div
                className="p-6"
                style={{
                  background: 'hsl(20 6% 10%)',
                  border: '1px solid hsl(15 8% 16%)',
                  borderRadius: '4px',
                }}
              >
                <h3
                  className="font-serif font-bold uppercase tracking-[0.15em] text-sm mb-4"
                  style={{ color: 'hsl(15 4% 70%)' }}
                >
                  Related Entries
                </h3>

                {[
                  { label: 'Same Faction',  items: relatedByFaction },
                  { label: 'Same Location', items: relatedByLocation },
                  { label: 'Same City',     items: relatedByCity },
                  { label: 'Also in the Chronicle', items: relatedByType },
                ].filter(g => g.items.length > 0).map(group => (
                  <div key={group.label} className="mb-4 last:mb-0">
                    <p
                      className="font-serif text-xs uppercase tracking-[0.2em] mb-2"
                      style={{ color: accentColor, opacity: 0.6 }}
                    >
                      {group.label}
                    </p>
                    {group.items.map((s, idx) => (
                      <Link key={s.id} href={`/${s.type.toLowerCase()}s/${s.slug}`}>
                        <div
                          className="cursor-pointer py-2.5 transition-colors"
                          style={{
                            borderBottom: idx < group.items.length - 1 ? '1px solid hsl(15 8% 14%)' : 'none',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                          onMouseLeave={e => (e.currentTarget.style.color = '')}
                        >
                          {s.category && (
                            <p className="font-serif text-xs uppercase tracking-wider mb-0.5" style={{ color: 'hsl(15 4% 35%)' }}>
                              {s.category}
                            </p>
                          )}
                          <p className="font-serif text-sm" style={{ color: 'hsl(15 4% 65%)' }}>
                            {s.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
