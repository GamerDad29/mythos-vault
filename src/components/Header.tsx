import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Clock, BarChart2, ScrollText, Menu, X, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const { isDM, login, logout } = useAuth();

  const allNav = [
    ...ENTITY_NAV.map(n => ({ ...n, Icon: null })),
    ...TOOL_NAV,
  ];

  function handleLogin() {
    if (login(password)) {
      setShowLogin(false);
      setPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  }

  function handleLockClick() {
    if (isDM) {
      logout();
    } else {
      setShowLogin(true);
      setLoginError(false);
      setPassword('');
    }
  }

  return (
    <>
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

          {/* Right side: DM badge + lock button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isDM && (
              <span
                className="font-serif uppercase tracking-wider hidden md:inline"
                style={{
                  color: 'hsl(25 100% 50%)',
                  border: '1px solid hsl(25 100% 38%)',
                  borderRadius: '2px',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  padding: '2px 6px',
                }}
              >
                DM
              </span>
            )}
            <button
              onClick={handleLockClick}
              title={isDM ? 'Logout (DM mode)' : 'DM Login'}
              style={{
                color: isDM ? 'hsl(25 100% 50%)' : 'hsl(15 4% 40%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isDM ? <Unlock size={17} /> : <Lock size={17} />}
            </button>

            {/* Mobile: hamburger */}
            <button
              className="md:hidden flex items-center justify-center"
              style={{ color: 'hsl(15 4% 60%)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
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

      {/* Login modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowLogin(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              style={{
                background: 'hsl(20 6% 10%)',
                border: '1px solid hsl(25 60% 28%)',
                borderRadius: '4px',
                padding: '2rem',
                width: '100%',
                maxWidth: '360px',
                margin: '1rem',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Lock size={16} style={{ color: 'hsl(25 100% 45%)' }} />
                <h2
                  className="font-serif font-bold uppercase tracking-[0.15em]"
                  style={{ color: 'hsl(15 4% 90%)', fontSize: '16px' }}
                >
                  DM Access
                </h2>
              </div>
              <p className="font-display italic" style={{ color: 'hsl(15 4% 45%)', fontSize: '14px', marginBottom: '1.5rem' }}>
                Enter the dungeon master password.
              </p>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError(false); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Password"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                style={{
                  width: '100%',
                  background: 'hsl(15 6% 7%)',
                  border: `1px solid ${loginError ? 'hsl(0 60% 40%)' : 'hsl(15 8% 20%)'}`,
                  borderRadius: '4px',
                  color: 'hsl(15 4% 88%)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '15px',
                  marginBottom: '0.5rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {loginError && (
                <p style={{ color: 'hsl(0 60% 50%)', fontSize: '13px', marginBottom: '0.75rem' }}>
                  Incorrect password.
                </p>
              )}
              {!loginError && <div style={{ height: '0.75rem' }} />}
              <button
                onClick={handleLogin}
                style={{
                  width: '100%',
                  background: 'hsl(25 100% 38%)',
                  color: 'hsl(15 4% 95%)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.55rem',
                  fontFamily: 'serif',
                  fontSize: '13px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                Unlock
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
