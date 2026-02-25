import { useState, useEffect } from 'react';

const STORAGE_KEY = 'vault-bookmarks';
const CHANGE_EVENT = 'vault-bookmarks-change';

function getStored(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>(getStored);

  useEffect(() => {
    const handler = () => setBookmarks(getStored());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const toggle = (id: string) => {
    const current = getStored();
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setBookmarks(next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  };

  const isBookmarked = (id: string) => bookmarks.includes(id);

  return { bookmarks, toggle, isBookmarked };
}
