import { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ExternalLink, Bookmark } from 'lucide-react';
import { vaultService } from '../vaultService';
import { SkeletonHero } from '../components/Skeleton';
import type { VaultEntity, VaultEntityStub } from '../types';
import { FACTION_COLORS } from '../types';
import { useBookmarks } from '../hooks/useBookmarks';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

const TYPE_PLURALS: Record<string, string> = {
  npcs: 'NPCs',
  creatures: 'Creatures',
  locations: 'Locations',
  factions: 'Factions',
  items: 'Items',
  lore: 'Lore',
};

function parseInline(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function linkifyEntities(html: string, stubs: VaultEntityStub[], currentId: string): string {
  const targets = [...stubs]
    .filter(s => s.id !== currentId)
    .sort((a, b) => b.name.length - a.name.length);
  if (targets.length === 0) return html;
  return html.replace(/((?:<[^>]*>)|([^<]+))/g, (match, _, textOnly) => {
    if (!textOnly) return match;
    let result = textOnly;
    for (const stub of targets) {
      const href = `/${stub.type.toLowerCase()}s/${stub.slug}`;
      const esc = stub.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`\\b(${esc})\\b`, 'gi'),
        `<a href="${href}" data-vault-link="true" style="color:hsl(25 100% 55%);text-decoration:underline;text-underline-offset:3px;cursor:pointer;">$1</a>`
      );
    }
    return result;
  });
}

function renderContent(text: string, accentColor: string, stubs: VaultEntityStub[] = [], currentId: string = ''): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  // li = linkified inline — applies inline markdown then cross-links
  const li = (t: string) => linkifyEntities(parseInline(t), stubs, currentId);

  const isSeparatorRow = (row: string) =>
    row.split('|').slice(1, -1).every(c => /^[\s:\-]+$/.test(c));

  const parseTableRow = (row: string) => {
    const parts = row.split('|');
    if (parts[0].trim() === '') parts.shift();
    if (parts[parts.length - 1].trim() === '') parts.pop();
    return parts.map(c => c.trim());
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    // Empty line
    if (!line) {
      nodes.push(<div key={k++} style={{ height: '0.4rem' }} />);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line)) {
      nodes.push(<div key={k++} className="forge-divider my-4" />);
      i++;
      continue;
    }

    // ## Section header
    if (line.startsWith('## ')) {
      nodes.push(
        <div key={k++} className="mt-8 mb-3">
          <p className="font-serif text-xs uppercase tracking-[0.25em]" style={{ color: accentColor }}>
            {line.slice(3).trim()}
          </p>
          <div className="forge-divider mt-1" />
        </div>
      );
      i++;
      continue;
    }

    // # Header
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      nodes.push(
        <p key={k++} className="font-serif font-bold text-lg uppercase tracking-wide mt-6 mb-2"
           style={{ color: 'hsl(15 4% 88%)' }}>
          {line.slice(2).trim()}
        </p>
      );
      i++;
      continue;
    }

    // ALL CAPS label (short section headers without ##)
    if (/^[A-Z][A-Z\s]+$/.test(line) && line.length < 40) {
      nodes.push(
        <div key={k++} className="mt-8 mb-3">
          <p className="font-serif text-xs uppercase tracking-[0.25em]" style={{ color: accentColor }}>
            {line}
          </p>
          <div className="forge-divider mt-1" />
        </div>
      );
      i++;
      continue;
    }

    // Pipe table — collect all consecutive table lines
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const dataRows = tableLines.filter(l => !isSeparatorRow(l));
      if (dataRows.length > 0) {
        const rows = dataRows.map(parseTableRow);
        nodes.push(
          <div key={k++} className="overflow-x-auto my-4">
            <table className="w-full text-center" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: ri === 0 ? `1px solid ${accentColor}44` : '1px solid hsl(15 8% 14%)' }}>
                    {row.map((cell, ci) => ri === 0 ? (
                      <th key={ci} className="font-serif text-xs uppercase tracking-wider py-2 px-2"
                          style={{ color: accentColor }}>
                        {cell}
                      </th>
                    ) : (
                      <td key={ci} className="font-sans py-2 px-2 text-sm" style={{ color: 'hsl(15 4% 78%)' }}
                          dangerouslySetInnerHTML={{ __html: li(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(
        <div key={k++} className="my-3 pl-4" style={{ borderLeft: `2px solid ${accentColor}44` }}>
          <p className="font-display italic" style={{ color: 'hsl(15 4% 55%)', fontSize: '15px' }}
             dangerouslySetInnerHTML={{ __html: li(line.slice(2)) }} />
        </div>
      );
      i++;
      continue;
    }

    // List item (- or * followed by space, but not **bold**)
    if (/^[-*]\s+/.test(line) && !line.startsWith('**')) {
      nodes.push(
        <div key={k++} className="flex gap-2 my-1">
          <span style={{ color: accentColor, flexShrink: 0, marginTop: '2px' }}>·</span>
          <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 78%)', fontSize: '16px' }}
             dangerouslySetInnerHTML={{ __html: li(line.replace(/^[-*]\s+/, '')) }} />
        </div>
      );
      i++;
      continue;
    }

    // Regular paragraph with inline markdown
    nodes.push(
      <p key={k++} className="font-sans leading-relaxed"
         style={{ color: 'hsl(15 4% 78%)', fontSize: '17px', marginBottom: '0.5rem' }}
         dangerouslySetInnerHTML={{ __html: li(line) }} />
    );
    i++;
  }

  return nodes;
}

export function EntityDetail() {
  const [, params] = useRoute('/:type/:slug');
  const [, navigate] = useLocation();
  const type = params?.type?.slice(0, -1).toUpperCase() || ''; // strip trailing 's'
  const slug = params?.slug || '';

  const { isBookmarked, toggle } = useBookmarks();
  const { track } = useRecentlyViewed();

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
        // Track in recently viewed
        track({
          id: e.id, slug: e.slug, name: e.name, type: e.type,
          category: e.category, summary: e.summary, imageUrl: e.imageUrl,
          tags: e.tags, factionId: e.factionId, locationId: e.locationId,
          publishedAt: e.publishedAt,
        });
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
  const accentColor = factionColor || 'hsl(25 100% 38%)';

  const related = indexStubs.filter(s => s.id !== entity?.id && s.type === entity?.type).slice(0, 4);

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
              {renderContent(entity.content, accentColor, indexStubs, entity.id)}
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
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="font-serif font-bold uppercase tracking-[0.15em] text-sm"
                  style={{ color: 'hsl(15 4% 70%)' }}
                >
                  Details
                </h3>
                <button
                  onClick={() => toggle(entity.id)}
                  className="flex items-center gap-1.5 font-serif text-xs uppercase tracking-wider px-2.5 py-1 transition-all duration-200"
                  style={{
                    background: isBookmarked(entity.id) ? `${accentColor}18` : 'transparent',
                    border: `1px solid ${isBookmarked(entity.id) ? accentColor + '44' : 'hsl(15 8% 20%)'}`,
                    borderRadius: '2px',
                    color: isBookmarked(entity.id) ? accentColor : 'hsl(15 4% 45%)',
                    cursor: 'pointer',
                  }}
                >
                  <Bookmark size={11} fill={isBookmarked(entity.id) ? 'currentColor' : 'none'} />
                  {isBookmarked(entity.id) ? 'Saved' : 'Bookmark'}
                </button>
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
            {related.length > 0 && (
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
                  Also in the Chronicle
                </h3>
                <div>
                  {related.map((s, idx) => (
                    <Link key={s.id} href={`/${s.type.toLowerCase()}s/${s.slug}`}>
                      <div
                        className="cursor-pointer py-3 transition-colors"
                        style={{
                          borderBottom: idx < related.length - 1 ? '1px solid hsl(15 8% 14%)' : 'none',
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
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
