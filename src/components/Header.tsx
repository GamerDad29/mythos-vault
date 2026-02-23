import { Link, useLocation } from 'wouter';
import { BookOpen } from 'lucide-react';

const NAV = [
  { label: 'NPCs', href: '/npcs' },
  { label: 'Locations', href: '/locations' },
  { label: 'Factions', href: '/factions' },
  { label: 'Items', href: '/items' },
  { label: 'Lore', href: '/lore' },
];

export function Header() {
  const [location] = useLocation();

  return (
    <header
      style={{
        borderBottom: '1px solid hsl(15 8% 16%)',
        background: 'linear-gradient(180deg, hsl(15 8% 7%) 0%, hsl(15 6% 8%) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
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

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ label, href }) => {
            const active = location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <span
                  className="font-serif text-xs uppercase tracking-[0.15em] px-4 py-2 cursor-pointer transition-all duration-200"
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
        </nav>
      </div>
    </header>
  );
}
