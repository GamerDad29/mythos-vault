import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { User, MapPin, Shield, Package, Scroll, Swords, Bookmark } from 'lucide-react';
import type { VaultEntityStub } from '../types';
import { FACTION_COLORS } from '../types';
import { vaultService } from '../vaultService';
import { useBookmarks } from '../hooks/useBookmarks';

const TYPE_ICON: Record<string, React.ReactNode> = {
  NPC: <User size={20} strokeWidth={1.5} />,
  LOCATION: <MapPin size={20} strokeWidth={1.5} />,
  FACTION: <Shield size={20} strokeWidth={1.5} />,
  ITEM: <Package size={20} strokeWidth={1.5} />,
  LORE: <Scroll size={20} strokeWidth={1.5} />,
  CREATURE: <Swords size={20} strokeWidth={1.5} />,
};

interface Props {
  entity: VaultEntityStub;
  index?: number;
}

export function EntityCard({ entity, index = 0 }: Props) {
  const [imgError, setImgError] = useState(false);
  const { isBookmarked, toggle } = useBookmarks();
  const factionColor = entity.factionId ? FACTION_COLORS[entity.factionId] : undefined;
  const accentColor = factionColor || 'hsl(25 100% 40%)';
  const href = `/${entity.type.toLowerCase()}s/${entity.slug}`;
  const bookmarked = isBookmarked(entity.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      style={{ position: 'relative' }}
    >
      <Link href={href}>
        <div
          className="group cursor-pointer overflow-hidden transition-all duration-300"
          style={{
            background: 'hsl(20 6% 10%)',
            border: '1px solid hsl(15 8% 16%)',
            borderRadius: '4px',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}55`;
            (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px -8px ${accentColor}33`;
            // Prefetch full entity so navigation is instant
            vaultService.getEntity(entity.type, entity.slug).catch(() => {});
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(15 8% 16%)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          {/* Image or placeholder */}
          <div
            className="relative overflow-hidden"
            style={{ height: '180px', background: 'hsl(15 6% 7%)' }}
          >
            {entity.imageUrl && !imgError ? (
              <>
                <img
                  src={entity.imageUrl}
                  alt={entity.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{
                  height: '72px',
                  background: 'linear-gradient(to bottom, transparent, hsl(20 6% 10%))',
                }} />
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%)',
                }} />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center relative"
                style={{ background: 'radial-gradient(ellipse at center, hsl(20 8% 11%) 0%, hsl(15 6% 7%) 100%)' }}>
                <div style={{ color: 'hsl(15 8% 30%)', opacity: 0.7 }}>
                  {TYPE_ICON[entity.type] || <Scroll size={28} strokeWidth={1} />}
                </div>
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)',
                }} />
              </div>
            )}

            {/* Type badge */}
            <div
              className="absolute top-3 left-3 font-serif text-xs uppercase tracking-[0.15em] px-2 py-1"
              style={{
                background: 'rgba(10,8,6,0.85)',
                border: `1px solid ${accentColor}44`,
                color: accentColor,
                borderRadius: '2px',
              }}
            >
              {entity.type}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {entity.category && (
              <p
                className="font-display text-xs uppercase tracking-[0.15em] mb-2"
                style={{ color: accentColor, opacity: 0.8 }}
              >
                {entity.category}
              </p>
            )}
            <h3
              className="font-serif font-bold text-lg uppercase tracking-wide mb-2 leading-tight"
              style={{ color: 'hsl(15 4% 92%)' }}
            >
              {entity.name}
            </h3>
            {entity.summary && (
              <p
                className="font-sans text-sm leading-relaxed line-clamp-2"
                style={{ color: 'hsl(15 4% 58%)', fontSize: '14px' }}
              >
                {entity.summary}
              </p>
            )}

            {/* Tags */}
            {entity.tags && entity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {entity.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="font-serif text-xs uppercase tracking-wider px-2 py-0.5"
                    style={{
                      background: 'hsl(15 6% 14%)',
                      color: 'hsl(15 4% 50%)',
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
      </Link>

      {/* Bookmark button — outside Link so it doesn't trigger navigation */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(entity.id); }}
        className="absolute top-3 right-3 z-10 flex items-center justify-center transition-all duration-200"
        style={{
          width: '28px',
          height: '28px',
          background: bookmarked ? `${accentColor}22` : 'rgba(10,8,6,0.75)',
          border: `1px solid ${bookmarked ? accentColor + '66' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '2px',
          color: bookmarked ? accentColor : 'hsl(15 4% 45%)',
          cursor: 'pointer',
        }}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
      >
        <Bookmark size={12} fill={bookmarked ? 'currentColor' : 'none'} />
      </button>
    </motion.div>
  );
}
