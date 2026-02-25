import { useState, useEffect } from 'react';
import type { VaultEntityStub } from '../types';

const STORAGE_KEY = 'vault-recently-viewed';
const CHANGE_EVENT = 'vault-recently-viewed-change';
const MAX = 6;

function getStored(): VaultEntityStub[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<VaultEntityStub[]>(getStored);

  useEffect(() => {
    const handler = () => setRecent(getStored());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const track = (entity: VaultEntityStub) => {
    const current = getStored();
    const next = [entity, ...current.filter(e => e.id !== entity.id)].slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setRecent(next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  };

  return { recent, track };
}
