import { Link, useLocation } from 'wouter';
import { BookOpen, Clock, BarChart2, Bookmark } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';

const ENTITY_NAV = [
  { label: 'NPCs', href: '/npcs' },
  { label: 'Creatures', href: '/creatures' },
  { label: 'Locations', href: '/locations' },
  { label: 'Factions', href: '/factions' },
  { label: 'Items', href: '/items' },
  { label: 'Lore', href: '/lore' },
];

const TOOL_NAV = [
  { label: 'Timeline', href: '/timeline', Icon: Clock },
  { label: 'Stats', href: '/stats', Icon: BarChart2 },
];

export function Header() {
  const [location] = useLocation();
  const { bookmarks } = useBookmarks();

  return (
    <header
      style={{
        borderBottom: '1px solid hsl(15 8% 16%)',
        background: 'linear-gradient(180deg, hsl(15 8% 7%) 0%, hsl(15 6% 8%) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer flex-shrink-0">
            <BookOpen
              size={20}
              style={{ color: 'hsl(25 100% 40%)' }}
              strokeWidth={1.5}
            />
            <div>
              <div
                className="font-serif font-bold text-sm uppercase tracking-[0.2em]"
                style={{ color: 'hsl(15 4% 92%)' }}
              >
                Mythos Vault
              </div>
              <div
                className="font-display text-xs italic"
                style={{ color: 'hsl(15 4% 50%)', letterSpacing: '0.05em' }}
              >
                Pathways Unseen
              </div>
            </div>
          </div>
        </Link>

        {/* Bookmark icon — always visible */}
        <Link href="/bookmarks">
          <div
            className="relative cursor-pointer flex items-center justify-center md:hidden"
            style={{ width: '36px', height: '36px', color: location === '/bookmarks' ? 'hsl(25 100% 45%)' : 'hsl(15 4% 55%)' }}
          >
            <Bookmark size={18} strokeWidth={1.5} />
            {bookmarks.length > 0 && (
              <span
                className="absolute top-0.5 right-0.5 font-sans text-xs flex items-center justify-center"
                style={{
                  minWidth: '14px', height: '14px', padding: '0 3px',
                  background: 'hsl(25 100% 38%)', color: '#fff',
                  borderRadius: '7px', fontSize: '9px', fontWeight: 700,
                }}
              >
                {bookmarks.length}
              </span>
            )}
          </div>
        </Link>

        {/* Entity nav + tool nav */}
        <div className="hidden md:flex items-center gap-1">
          {ENTITY_NAV.map(({ label, href }) => {
            const active = location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <span
                  className="font-serif text-xs uppercase tracking-[0.15em] px-3 py-2 cursor-pointer transition-all duration-200"
                  style={{
                    color: active ? 'hsl(25 100% 45%)' : 'hsl(15 4% 60%)',
                    borderBottom: active ? '1px solid hsl(25 100% 40%)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.target as HTMLElement).style.color = 'hsl(15 4% 85%)';
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.target as HTMLElement).style.color = 'hsl(15 4% 60%)';
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div
            className="mx-2 self-stretch w-px"
            style={{ background: 'hsl(15 8% 18%)', marginTop: '4px', marginBottom: '4px' }}
          />

          {/* Bookmark link */}
          <Link href="/bookmarks">
            <span
              className="relative flex items-center gap-1.5 font-serif text-xs uppercase tracking-[0.12em] px-3 py-2 cursor-pointer transition-all duration-200"
              style={{
                color: location === '/bookmarks' ? 'hsl(25 100% 45%)' : 'hsl(15 4% 48%)',
                borderBottom: location === '/bookmarks' ? '1px solid hsl(25 100% 40%)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (location !== '/bookmarks') (e.currentTarget as HTMLElement).style.color = 'hsl(15 4% 75%)'; }}
              onMouseLeave={e => { if (location !== '/bookmarks') (e.currentTarget as HTMLElement).style.color = 'hsl(15 4% 48%)'; }}
            >
              <Bookmark size={11} style={{ display: 'inline' }} />
              Saved
              {bookmarks.length > 0 && (
                <span
                  className="font-sans flex items-center justify-center"
                  style={{
                    minWidth: '14px', height: '14px', padding: '0 3px',
                    background: 'hsl(25 100% 38%)', color: '#fff',
                    borderRadius: '7px', fontSize: '9px', fontWeight: 700,
                  }}
                >
                  {bookmarks.length}
                </span>
              )}
            </span>
          </Link>

          {/* Tool nav */}
          {TOOL_NAV.map(({ label, href, Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <span
                  className="flex items-center gap-1.5 font-serif text-xs uppercase tracking-[0.12em] px-3 py-2 cursor-pointer transition-all duration-200"
                  style={{
                    color: active ? 'hsl(25 100% 45%)' : 'hsl(15 4% 48%)',
                    borderBottom: active ? '1px solid hsl(25 100% 40%)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'hsl(15 4% 75%)';
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'hsl(15 4% 48%)';
                  }}
                >
                  <Icon size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
