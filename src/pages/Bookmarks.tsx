import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { vaultService } from '../vaultService';
import { EntityCard } from '../components/EntityCard';
import { useBookmarks } from '../hooks/useBookmarks';
import type { VaultEntityStub } from '../types';

export function Bookmarks() {
  const { bookmarks } = useBookmarks();
  const [allEntities, setAllEntities] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vaultService.getIndex()
      .then(idx => setAllEntities(idx.entities))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bookmarkedEntities = allEntities.filter(e => bookmarks.includes(e.id));

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
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
          Bookmarks
        </h1>
        <div className="forge-divider w-24 mb-4" />
        <p className="font-display italic" style={{ color: 'hsl(15 4% 50%)' }}>
          Entries you've marked for quick reference.
        </p>
      </motion.div>

      {loading ? (
        <p className="font-display italic" style={{ color: 'hsl(15 4% 40%)' }}>Loading…</p>
      ) : bookmarkedEntities.length === 0 ? (
        <div
          className="text-center py-24"
          style={{ border: '1px dashed hsl(15 8% 18%)', borderRadius: '4px' }}
        >
          <Bookmark
            size={32}
            strokeWidth={1.5}
            style={{ color: 'hsl(15 8% 22%)', margin: '0 auto 16px' }}
          />
          <p className="font-display italic text-xl" style={{ color: 'hsl(15 4% 35%)' }}>
            No bookmarks yet.
          </p>
          <p
            className="font-sans text-sm mt-2"
            style={{ color: 'hsl(15 4% 28%)', fontSize: '14px' }}
          >
            Click the bookmark icon on any entry to save it here.
          </p>
        </div>
      ) : (
        <>
          <p className="font-sans text-sm mb-6" style={{ color: 'hsl(15 4% 40%)', fontSize: '13px' }}>
            {bookmarkedEntities.length} {bookmarkedEntities.length === 1 ? 'entry' : 'entries'} bookmarked
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {bookmarkedEntities.map((entity, i) => (
              <EntityCard key={entity.id} entity={entity} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
