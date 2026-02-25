import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import type { VaultEntityStub } from '../types';
import { TYPE_ICONS } from '../types';

function groupByDate(entities: VaultEntityStub[]): [string, VaultEntityStub[]][] {
  const map = new Map<string, VaultEntityStub[]>();
  for (const e of entities) {
    const date = new Date(e.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(e);
  }
  return [...map.entries()];
}

export function Timeline() {
  const [entities, setEntities] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vaultService.getIndex()
      .then(index => {
        const sorted = [...index.entities].sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        setEntities(sorted);
      })
      .catch(() => setError('Could not load the chronicle.'))
      .finally(() => setLoading(false));
  }, []);

  const groups = groupByDate(entities);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-14"
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
          Timeline
        </h1>
        <div className="forge-divider w-24 mb-4" />
        <p className="font-display italic" style={{ color: 'hsl(15 4% 50%)' }}>
          A record of discoveries, in the order they were uncovered.
        </p>
      </motion.div>

      {error ? (
        <p className="font-display italic text-center py-20" style={{ color: 'hsl(15 4% 40%)' }}>
          {error}
        </p>
      ) : loading ? (
        <div className="space-y-10">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div style={{ height: '14px', width: '180px', background: 'hsl(20 6% 14%)', borderRadius: '2px', marginBottom: '16px' }} />
              <div className="space-y-2">
                {[...Array(2)].map((_, j) => (
                  <div key={j} style={{ height: '68px', background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '4px' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : entities.length === 0 ? (
        <div
          className="text-center py-24"
          style={{ border: '1px dashed hsl(15 8% 18%)', borderRadius: '4px' }}
        >
          <p className="font-display italic text-xl" style={{ color: 'hsl(15 4% 35%)' }}>
            No entries in the Vault yet.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-px pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, hsl(25 100% 32%) 0%, hsl(25 40% 18%) 70%, transparent 100%)',
            }}
          />

          <div className="space-y-10 pl-8">
            {groups.map(([date, group], gi) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: gi * 0.07 }}
              >
                {/* Date marker */}
                <div className="flex items-center gap-3 mb-4 -ml-8">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{
                      background: 'hsl(25 100% 38%)',
                      boxShadow: '0 0 10px hsl(25 100% 38% / 0.6)',
                    }}
                  />
                  <p
                    className="font-serif text-xs uppercase tracking-[0.2em]"
                    style={{ color: 'hsl(25 80% 50%)' }}
                  >
                    {date}
                  </p>
                </div>

                {/* Entries for this date */}
                <div className="space-y-2">
                  {group.map((entity, ei) => {
                    const href = `/${entity.type.toLowerCase()}s/${entity.slug}`;
                    return (
                      <Link key={entity.id} href={href}>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: gi * 0.07 + ei * 0.04 }}
                          className="flex items-start gap-4 p-4 cursor-pointer transition-all duration-200"
                          style={{
                            background: 'hsl(20 6% 10%)',
                            border: '1px solid hsl(15 8% 16%)',
                            borderRadius: '4px',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(25 60% 25%)';
                            (e.currentTarget as HTMLElement).style.background = 'hsl(20 8% 12%)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(15 8% 16%)';
                            (e.currentTarget as HTMLElement).style.background = 'hsl(20 6% 10%)';
                          }}
                        >
                          <span
                            style={{ fontSize: '1.1rem', opacity: 0.65, flexShrink: 0, marginTop: '1px' }}
                          >
                            {TYPE_ICONS[entity.type] || '◆'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                              <p
                                className="font-serif font-bold text-sm"
                                style={{ color: 'hsl(15 4% 88%)' }}
                              >
                                {entity.name}
                              </p>
                              <span
                                className="font-serif text-xs uppercase tracking-wider flex-shrink-0"
                                style={{ color: 'hsl(25 80% 38%)' }}
                              >
                                {entity.type}
                              </span>
                            </div>
                            {(entity.category || entity.summary) && (
                              <p
                                className="font-display italic text-xs leading-snug"
                                style={{ color: 'hsl(15 4% 48%)' }}
                              >
                                {entity.summary || entity.category}
                              </p>
                            )}
                          </div>
                          <p
                            className="font-serif text-xs flex-shrink-0 self-center"
                            style={{ color: 'hsl(15 4% 35%)' }}
                          >
                            {new Date(entity.publishedAt).toLocaleTimeString('en-US', {
                              hour: 'numeric', minute: '2-digit',
                            })}
                          </p>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
