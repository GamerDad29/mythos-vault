import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import type { VaultEntityStub } from '../types';
import { TYPE_ICONS } from '../types';

const TYPE_COLORS: Record<string, string> = {
  NPC:      'hsl(25 100% 42%)',
  CREATURE: 'hsl(0 65% 48%)',
  LOCATION: 'hsl(200 55% 42%)',
  FACTION:  'hsl(280 45% 48%)',
  ITEM:     'hsl(45 75% 48%)',
  LORE:     'hsl(150 40% 40%)',
};

export function Stats() {
  const [entities, setEntities] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vaultService.getIndex()
      .then(index => setEntities(index.entities))
      .catch(() => setError('Could not load vault data.'))
      .finally(() => setLoading(false));
  }, []);

  const typeCounts: Record<string, number> = {};
  for (const e of entities) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(typeCounts), 1);

  // Most recently published per type
  const byTypeRecent: Record<string, VaultEntityStub> = {};
  for (const e of [...entities].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )) {
    if (!byTypeRecent[e.type]) byTypeRecent[e.type] = e;
  }

  // Oldest and newest overall
  const sorted = [...entities].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <p
          className="font-display text-sm uppercase tracking-[0.3em] mb-3"
          style={{ color: 'hsl(25 80% 38%)' }}
        >
          Chronicle
        </p>
        <h1
          className="font-serif font-black uppercase tracking-wide mb-3"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'hsl(15 4% 92%)' }}
        >
          Vault Stats
        </h1>
        <div className="forge-divider w-24 mb-4" />
        <p className="font-display italic" style={{ color: 'hsl(15 4% 50%)' }}>
          A survey of the chronicle's contents.
        </p>
      </motion.div>

      {error ? (
        <p className="font-display italic text-center py-20" style={{ color: 'hsl(15 4% 40%)' }}>
          {error}
        </p>
      ) : loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                height: '160px',
                background: 'hsl(20 6% 10%)',
                border: '1px solid hsl(15 8% 16%)',
                borderRadius: '4px',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Total count — full width */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 p-8 flex items-center gap-8 flex-wrap"
            style={{
              background: 'hsl(20 6% 10%)',
              border: '1px solid hsl(15 8% 16%)',
              borderRadius: '4px',
            }}
          >
            <div>
              <p
                className="font-serif font-black"
                style={{ fontSize: '4.5rem', lineHeight: 1, color: 'hsl(25 100% 45%)' }}
              >
                {entities.length}
              </p>
              <p
                className="font-serif text-xs uppercase tracking-[0.25em] mt-1"
                style={{ color: 'hsl(15 4% 50%)' }}
              >
                Total Entries
              </p>
            </div>
            <div
              className="hidden sm:block self-stretch w-px"
              style={{ background: 'hsl(15 8% 18%)' }}
            />
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {typeEntries.map(([type, count]) => (
                <Link key={type} href={`/${type.toLowerCase()}s`}>
                  <div className="flex items-center gap-2 cursor-pointer group">
                    <span style={{ fontSize: '1rem' }}>{TYPE_ICONS[type] || '◆'}</span>
                    <span
                      className="font-serif text-sm transition-colors"
                      style={{ color: 'hsl(15 4% 70%)' }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.color = TYPE_COLORS[type] || 'hsl(25 80% 50%)')}
                      onMouseLeave={e => ((e.target as HTMLElement).style.color = 'hsl(15 4% 70%)')}
                    >
                      {count} {type.charAt(0) + type.slice(1).toLowerCase()}{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Type distribution bars */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="p-6"
            style={{
              background: 'hsl(20 6% 10%)',
              border: '1px solid hsl(15 8% 16%)',
              borderRadius: '4px',
            }}
          >
            <h3
              className="font-serif font-bold uppercase tracking-[0.15em] text-sm mb-6"
              style={{ color: 'hsl(15 4% 70%)' }}
            >
              By Type
            </h3>
            <div className="space-y-4">
              {typeEntries.map(([type, count], i) => {
                const color = TYPE_COLORS[type] || 'hsl(25 60% 38%)';
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12 + i * 0.06 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="font-serif text-xs uppercase tracking-wider"
                        style={{ color: 'hsl(15 4% 62%)' }}
                      >
                        {TYPE_ICONS[type]} {type}
                      </span>
                      <span
                        className="font-serif text-xs tabular-nums"
                        style={{ color: 'hsl(15 4% 42%)' }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '5px',
                        background: 'hsl(15 8% 14%)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.18 + i * 0.06, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                        style={{ height: '100%', background: color, borderRadius: '3px' }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Latest per type */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="p-6"
            style={{
              background: 'hsl(20 6% 10%)',
              border: '1px solid hsl(15 8% 16%)',
              borderRadius: '4px',
            }}
          >
            <h3
              className="font-serif font-bold uppercase tracking-[0.15em] text-sm mb-6"
              style={{ color: 'hsl(15 4% 70%)' }}
            >
              Latest Per Type
            </h3>
            <div>
              {Object.entries(byTypeRecent).map(([type, entity], i) => {
                const href = `/${type.toLowerCase()}s/${entity.slug}`;
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.16 + i * 0.05 }}
                  >
                    <Link href={href}>
                      <div
                        className="flex items-center gap-3 py-2.5 cursor-pointer transition-opacity"
                        style={{
                          borderBottom: '1px solid hsl(15 8% 13%)',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.65')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                      >
                        <span style={{ fontSize: '0.9rem', opacity: 0.6, flexShrink: 0 }}>
                          {TYPE_ICONS[type] || '◆'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-serif text-sm truncate"
                            style={{ color: 'hsl(15 4% 82%)' }}
                          >
                            {entity.name}
                          </p>
                        </div>
                        <p
                          className="font-serif text-xs flex-shrink-0"
                          style={{ color: 'hsl(15 4% 38%)' }}
                        >
                          {new Date(entity.publishedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Chronicle span */}
          {oldest && newest && oldest.id !== newest.id && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="lg:col-span-2 p-6 flex gap-8 flex-wrap"
              style={{
                background: 'hsl(20 6% 10%)',
                border: '1px solid hsl(15 8% 16%)',
                borderRadius: '4px',
              }}
            >
              <div>
                <p
                  className="font-serif text-xs uppercase tracking-wider mb-1"
                  style={{ color: 'hsl(15 4% 40%)' }}
                >
                  First Entry
                </p>
                <p className="font-serif text-sm" style={{ color: 'hsl(15 4% 78%)' }}>
                  {oldest.name}
                </p>
                <p
                  className="font-display italic text-xs mt-0.5"
                  style={{ color: 'hsl(15 4% 42%)' }}
                >
                  {new Date(oldest.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <div
                className="hidden sm:block self-stretch w-px"
                style={{ background: 'hsl(15 8% 18%)' }}
              />
              <div>
                <p
                  className="font-serif text-xs uppercase tracking-wider mb-1"
                  style={{ color: 'hsl(15 4% 40%)' }}
                >
                  Latest Entry
                </p>
                <p className="font-serif text-sm" style={{ color: 'hsl(15 4% 78%)' }}>
                  {newest.name}
                </p>
                <p
                  className="font-display italic text-xs mt-0.5"
                  style={{ color: 'hsl(15 4% 42%)' }}
                >
                  {new Date(newest.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
