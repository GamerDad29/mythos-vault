import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { BookOpen, Clock, BarChart2, ScrollText, Menu, X } from 'lucide-react';

const ENTITY_NAV = [
  { label: 'NPCs', href: '/npcs' },
  { label: 'Creatures', href: '/creatures' },
  { label: 'Locations', href: '/locations' },
  { label: 'Factions', href: '/factions' },
  { label: 'Items', href: '/items' },
  { label: 'Lore', href: '/lore' },
  { label: 'Characters', href: '/characters' },
];

const TOOL_NAV = [
  { label: 'Timeline', href: '/timeline', Icon: Clock },
  { label: 'Stats', href: '/stats', Icon: BarChart2 },
  { label: 'Journal', href: '/journal', Icon: ScrollText },
];

export function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNav = [
    ...ENTITY_NAV.map(n => ({ ...n, Icon: null })),
    ...TOOL_NAV,
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid hsl(15 8% 18%)',
        background: 'rgba(12, 10, 8, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.6)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer flex-shrink-0">
            <BookOpen
              size={22}
              style={{ color: 'hsl(25 100% 40%)', flexShrink: 0 }}
              strokeWidth={1.5}
            />
            <div className="flex flex-col justify-center" style={{ gap: '3px' }}>
              <div
                className="font-serif font-bold uppercase tracking-[0.2em]"
                style={{ color: 'hsl(15 4% 92%)', fontSize: '13px', lineHeight: 1 }}
              >
                Mythos Vault
              </div>
              <div
                className="font-display italic"
                style={{ color: 'hsl(15 4% 50%)', fontSize: '11px', letterSpacing: '0.08em', lineHeight: 1 }}
              >
                Pathways Unseen
              </div>
            </div>
          </div>
        </Link>

        {/* Desktop: Entity nav + tool nav */}
        <div className="hidden md:flex items-center gap-1">
          {ENTITY_NAV.map(({ label, href }) => {
            const active = location.startsWith(href) || (href === '/characters' && location.startsWith('/characters'));
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

        {/* Mobile: hamburger button */}
        <button
          className="md:hidden flex items-center justify-center"
          style={{ color: 'hsl(15 4% 60%)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div
          style={{
            borderTop: '1px solid hsl(15 8% 16%)',
            background: 'rgba(10, 8, 6, 0.97)',
            animation: 'mobileMenuIn 0.18s ease forwards',
          }}
        >
          <div className="px-6 py-4 flex flex-col gap-1">
            {allNav.map(({ label, href, Icon }) => {
              const active = location.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <div
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer"
                    style={{
                      borderRadius: '4px',
                      background: active ? 'hsl(20 8% 13%)' : 'transparent',
                      color: active ? 'hsl(25 100% 45%)' : 'hsl(15 4% 65%)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {Icon && <Icon size={13} />}
                    <span className="font-serif text-sm uppercase tracking-[0.15em]">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
