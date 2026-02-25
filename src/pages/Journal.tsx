import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { vaultService } from '../vaultService';
import { SkeletonCard } from '../components/Skeleton';
import type { VaultEntityStub } from '../types';

export function Journal() {
  const [entries, setEntries] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vaultService.getIndex()
      .then(index => {
        const lore = index.entities
          .filter(e => e.type === 'LORE' && !e.hidden)
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setEntries(lore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by month/year
  const grouped: Record<string, VaultEntityStub[]> = {};
  for (const e of entries) {
    const key = new Date(e.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
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
          Campaign Journal
        </h1>
        <div className="forge-divider w-24 mb-4" />
        <p className="font-display italic" style={{ color: 'hsl(15 4% 50%)' }}>
          Annals, recaps, and lore from the Underdark.
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : entries.length === 0 ? (
        <div
          className="text-center py-24"
          style={{ border: '1px dashed hsl(15 8% 18%)', borderRadius: '4px' }}
        >
          <p className="font-display italic text-xl" style={{ color: 'hsl(15 4% 35%)' }}>
            No journal entries yet.
          </p>
          <p
            className="font-sans text-sm mt-2"
            style={{ color: 'hsl(15 4% 28%)', fontSize: '14px' }}
          >
            Publish Lore entries from Mythos Architect to build the journal.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([month, monthEntries], gi) => (
            <motion.div
              key={month}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.08 }}
            >
              {/* Month header */}
              <div className="flex items-center gap-4 mb-6">
                <p
                  className="font-serif text-xs uppercase tracking-[0.25em] flex-shrink-0"
                  style={{ color: 'hsl(25 80% 40%)' }}
                >
                  {month}
                </p>
                <div className="flex-1" style={{ height: '1px', background: 'hsl(15 8% 16%)' }} />
              </div>

              {/* Entries */}
              <div className="space-y-4">
                {monthEntries.map((entry, ei) => (
                  <Link key={entry.id} href={`/lore/${entry.slug}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.08 + ei * 0.05 }}
                      className="cursor-pointer p-6 transition-all duration-200"
                      style={{
                        background: 'hsl(20 6% 10%)',
                        border: '1px solid hsl(15 8% 16%)',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'hsl(25 60% 28%)';
                        (e.currentTarget as HTMLElement).style.background = 'hsl(20 8% 12%)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'hsl(15 8% 16%)';
                        (e.currentTarget as HTMLElement).style.background = 'hsl(20 6% 10%)';
                      }}
                    >
                      {entry.category && (
                        <p
                          className="font-display text-xs uppercase tracking-[0.2em] mb-2"
                          style={{ color: 'hsl(25 80% 38%)' }}
                        >
                          {entry.category}
                        </p>
                      )}
                      <h3
                        className="font-serif font-bold text-xl uppercase tracking-wide mb-2"
                        style={{ color: 'hsl(15 4% 88%)' }}
                      >
                        {entry.name}
                      </h3>
                      {entry.summary && (
                        <p
                          className="font-display italic leading-relaxed"
                          style={{ color: 'hsl(15 4% 55%)', fontSize: '15px' }}
                        >
                          {entry.summary}
                        </p>
                      )}
                      <p
                        className="font-serif text-xs uppercase tracking-wider mt-4"
                        style={{ color: 'hsl(15 4% 35%)' }}
                      >
                        {new Date(entry.publishedAt).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
