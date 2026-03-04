import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { User, MapPin, Shield, Package, Scroll, Swords, Eye, EyeOff } from 'lucide-react';
import type { VaultEntityStub } from '../types';
import { FACTION_COLORS, TYPE_URL_SEGMENT } from '../types';
import { vaultService } from '../vaultService';
import { tokens } from '../tokens';

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
  isDM?: boolean;
  onToggleHidden?: (hidden: boolean) => void;
}

export function EntityCard({ entity, index = 0, isDM, onToggleHidden }: Props) {
  const [imgError, setImgError] = useState(false);
  const factionColor = entity.factionId ? FACTION_COLORS[entity.factionId] : undefined;
  const accentColor = factionColor || 'hsl(25 100% 40%)';
  const href = `/${TYPE_URL_SEGMENT[entity.type] ?? entity.type.toLowerCase() + 's'}/${entity.slug}`;
  const isHidden = entity.hidden;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      style={{ position: 'relative' }}
    >
      <Link href={href}>
        <div
          className="group cursor-pointer overflow-hidden"
          style={{
            background: tokens.color.bg.card,
            border: `1px solid ${isDM && isHidden ? 'hsl(25 80% 22%)' : tokens.color.border.default}`,
            borderRadius: tokens.radius.card,
            transition: tokens.transition.card,
            opacity: isDM && isHidden ? 0.75 : 1,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `${accentColor}55`;
            el.style.transform = 'translateY(-4px)';
            el.style.boxShadow = tokens.shadow.cardHover(accentColor);
            vaultService.getEntity(entity.type, entity.slug).catch(() => {});
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = isDM && isHidden ? 'hsl(25 80% 22%)' : tokens.color.border.default;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = 'none';
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
                  background: `linear-gradient(to bottom, transparent, ${tokens.color.bg.card})`,
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

            {/* DM: HIDDEN badge */}
            {isDM && isHidden && (
              <div
                className="absolute top-3 right-3 font-serif uppercase tracking-[0.15em]"
                style={{
                  background: 'rgba(201,168,76,0.15)',
                  border: '1px solid hsl(25 100% 38%)',
                  color: 'hsl(25 100% 55%)',
                  borderRadius: '2px',
                  fontSize: '9px',
                  padding: '2px 6px',
                  letterSpacing: '0.2em',
                }}
              >
                Hidden
              </div>
            )}
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

      {/* DM: visibility toggle button — outside Link so it doesn't navigate */}
      {isDM && onToggleHidden && (
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onToggleHidden(!isHidden);
          }}
          title={isHidden ? 'Reveal to players' : 'Hide from players'}
          style={{
            position: 'absolute',
            bottom: '14px',
            right: '14px',
            background: 'rgba(10,8,6,0.9)',
            border: `1px solid ${isHidden ? 'hsl(25 100% 40%)' : 'hsl(15 8% 22%)'}`,
            borderRadius: '4px',
            color: isHidden ? 'hsl(25 100% 55%)' : 'hsl(15 4% 40%)',
            cursor: 'pointer',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      )}
    </motion.div>
  );
}
