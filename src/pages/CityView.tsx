import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useRoute, useLocation } from 'wouter';
import { X, Hammer, Anchor, Gem, Mountain, Cpu, Eye, Shield } from 'lucide-react';
import { vaultService } from '../vaultService';
import type { VaultEntity, VaultEntityStub } from '../types';
import { FACTION_COLORS } from '../types';
import { renderContent, stripHiddenBlocks } from '../utils/renderContent';

// ─── Static display constants ──────────────────────────────────────────────────

const FACTION_ICONS: Record<string, React.FC<any>> = {
  'iron-hammer-clan': Hammer,
  'deepstone-miners': Anchor,
  'brotherhood-of-forge': Gem,
  'brotherhood-of-iron-mine': Mountain,
  'steel-syndicate': Cpu,
  'bregan-daerthe': Eye,
};

const TABS = ['Overview', 'Districts', 'Factions', 'NPCs', 'Legends'] as const;
type Tab = (typeof TABS)[number];

// ─── Entity Drawer ─────────────────────────────────────────────────────────────

function EntityDrawer({
  stub,
  allStubs,
  onClose,
}: {
  stub: VaultEntityStub;
  allStubs: VaultEntityStub[];
  onClose: () => void;
}) {
  const [entity, setEntity] = useState<VaultEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [, navigate] = useLocation();

  const factionColor = stub.factionId ? FACTION_COLORS[stub.factionId] : undefined;
  const accentColor = factionColor || '#C9A84C';
  const Icon = stub.factionId ? (FACTION_ICONS[stub.factionId] ?? Shield) : Shield;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    setLoading(true);
    vaultService.getEntity(stub.type, stub.slug)
      .then(e => setEntity(e))
      .catch(() => setEntity(null))
      .finally(() => setLoading(false));
  }, [stub.type, stub.slug]);

  const displayContent = entity ? stripHiddenBlocks(entity.content) : '';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,2,0.82)', backdropFilter: 'blur(10px)', zIndex: 50 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0,
          width: 'min(640px, 100vw)',
          background: 'hsl(15 8% 7%)',
          borderLeft: `1px solid ${accentColor}33`,
          overflowY: 'auto', zIndex: 51,
          boxShadow: `-20px 0 80px -20px ${accentColor}20`,
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-8 pt-8 pb-6"
          style={{ background: 'hsl(15 8% 7%)', borderBottom: `1px solid ${accentColor}22` }}
        >
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(15 4% 40%)' }}
          >
            <X size={18} />
          </button>

          {stub.type === 'FACTION' && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className="mb-4"
              style={{
                width: '56px', height: '56px',
                background: `${accentColor}14`,
                border: `1px solid ${accentColor}33`,
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon size={26} style={{ color: accentColor }} strokeWidth={1.5} />
            </motion.div>
          )}

          {stub.category && (
            <p className="font-serif text-xs uppercase tracking-[0.25em] mb-1" style={{ color: accentColor }}>
              {stub.type} · {stub.category}
            </p>
          )}
          <h2 className="font-serif font-bold uppercase tracking-wide" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'hsl(15 4% 94%)' }}>
            {stub.name}
          </h2>
          {stub.summary && (
            <p className="font-sans mt-2" style={{ color: 'hsl(15 4% 48%)', fontSize: '14px' }}>
              {stub.summary}
            </p>
          )}
        </div>

        {/* Hero image — only rendered when entity has imageUrl */}
        {entity?.imageUrl && !imgError && (
          <div className="relative overflow-hidden" style={{ height: '260px' }}>
            <img
              src={entity.imageUrl}
              alt={entity.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
              height: '48px',
              background: 'linear-gradient(to bottom, hsl(15 8% 7%), transparent)',
            }} />
            <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{
              height: '80px',
              background: 'linear-gradient(to bottom, transparent, hsl(15 8% 7%))',
            }} />
          </div>
        )}

        {/* Content */}
        <div
          className="px-8 py-6"
          onClick={(e) => {
            const a = (e.target as HTMLElement).closest('a[data-vault-link]');
            if (a) {
              e.preventDefault();
              onClose();
              navigate((a as HTMLAnchorElement).getAttribute('href') || '/');
            }
          }}
        >
          {loading ? (
            <div className="space-y-3 mt-4">
              {[180, 120, 160, 90].map((w, i) => (
                <div key={i} style={{ height: '14px', width: `${w}px`, background: 'hsl(20 6% 14%)', borderRadius: '3px', maxWidth: '100%' }} />
              ))}
            </div>
          ) : entity ? (
            renderContent(displayContent, accentColor, allStubs, entity.id)
          ) : (
            <p className="font-sans" style={{ color: 'hsl(15 4% 40%)', fontSize: '14px' }}>
              Content not available.
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Lore Group (inline, always expanded) ─────────────────────────────────────

function LoreGroup({ stub, accentColor }: { stub: VaultEntityStub; accentColor: string }) {
  const [entity, setEntity] = useState<VaultEntity | null>(null);

  useEffect(() => {
    vaultService.getEntity(stub.type, stub.slug)
      .then(e => setEntity(e))
      .catch(() => {});
  }, [stub.type, stub.slug]);

  if (!entity) return null;

  // Extract blockquotes from content as individual legend cards
  const lines = entity.content.split('\n');
  const themeHeader = lines.find(l => l.startsWith('## '))?.replace('## ', '').trim() ?? stub.name;
  const note = lines.find(l => l.startsWith('*') && !l.startsWith('**'))?.replace(/\*/g, '').trim();
  const quotes = lines.filter(l => l.startsWith('> ')).map(l => l.slice(2).trim().replace(/^"|"$/g, ''));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="font-serif text-xs uppercase tracking-[0.28em] mb-0.5" style={{ color: accentColor }}>
            {themeHeader}
          </p>
          <div style={{ height: '1px', width: '100%', background: `linear-gradient(90deg, ${accentColor}44, transparent)` }} />
        </div>
      </div>
      {note && (
        <p className="font-sans text-sm mb-4 italic" style={{ color: 'hsl(15 4% 45%)', fontSize: '14px' }}>{note}</p>
      )}
      <div className="space-y-3">
        {quotes.map((quote, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="p-5"
            style={{
              background: 'hsl(20 6% 10%)',
              border: '1px solid hsl(15 8% 14%)',
              borderRadius: '4px',
              transition: 'border-color 0.2s',
            }}
            whileHover={{ borderColor: `${accentColor}40` } as any}
          >
            <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 68%)', fontSize: '15px' }}>
              "{quote}"
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-serif text-4xl mb-4" style={{ color: 'hsl(15 8% 16%)' }}>⟁</p>
      <p className="font-serif text-xs uppercase tracking-[0.2em]" style={{ color: 'hsl(15 4% 28%)' }}>
        Not yet charted
      </p>
      <p className="font-sans text-sm mt-2" style={{ color: 'hsl(15 4% 22%)' }}>
        No {label} found for this city.
      </p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CityView() {
  const [, params] = useRoute('/city/:slug');
  const slug = params?.slug ?? '';

  const [city, setCity] = useState<VaultEntity | null>(null);
  const [cityEntities, setCityEntities] = useState<VaultEntityStub[]>([]);
  const [allStubs, setAllStubs] = useState<VaultEntityStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [drawerStub, setDrawerStub] = useState<VaultEntityStub | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    if (!slug) return;
    Promise.all([vaultService.getCity(slug), vaultService.getIndex()])
      .then(([cityData, index]) => {
        setCity(cityData);
        setAllStubs(index.entities);
        setCityEntities(index.entities.filter(e => (e as any).cityId === slug));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const idx = TABS.indexOf(activeTab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  const meta = (city as any)?.meta as Record<string, string> ?? {};
  const accentColor = meta.accentColor ?? '#C9A84C';

  const factions  = cityEntities.filter(e => e.type === 'FACTION');
  const npcs      = cityEntities.filter(e => e.type === 'NPC');
  const districts = cityEntities.filter(e => e.type === 'LOCATION');
  const lore      = cityEntities.filter(e => e.type === 'LORE');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 w-64">
          {[200, 140, 180].map((w, i) => (
            <div key={i} style={{ height: '14px', width: `${w}px`, background: 'hsl(20 6% 14%)', borderRadius: '3px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="font-serif text-5xl mb-6" style={{ color: 'hsl(15 8% 20%)' }}>⟁</p>
          <h1 className="font-serif font-bold text-3xl uppercase tracking-wide mb-4" style={{ color: 'hsl(15 4% 70%)' }}>
            City Not Found
          </h1>
          <Link href="/"><span className="font-serif text-sm uppercase tracking-wider cursor-pointer" style={{ color: accentColor }}>← Chronicle</span></Link>
        </div>
      </div>
    );
  }

  const cityName = city.name.toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 7%)' }}>

      {/* HERO */}
      <div
        ref={heroRef}
        className="relative overflow-hidden flex flex-col items-center justify-center text-center"
        style={{ height: '100svh', minHeight: '600px' }}
      >
        <div className="absolute inset-0" style={{ background: 'hsl(15 8% 5%)' }} />

        <motion.div
          className="absolute inset-0"
          style={{ y: heroY, background: 'radial-gradient(ellipse 80% 60% at 50% 45%, hsl(20 28% 7%), hsl(15 8% 4%))' }}
        />

        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 50% at 30% 60%, ${accentColor}09, transparent 60%)` }}
          animate={{ x: [0, 18, -10, 0], y: [0, -12, 6, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 72% 38%, rgba(160,30,8,0.07), transparent 65%)' }}
          animate={{ x: [0, -14, 7, 0], y: [0, 9, -5, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />

        {/* Embers */}
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: i % 4 === 0 ? '3px' : '2px',
              height: i % 4 === 0 ? '3px' : '2px',
              background: accentColor,
              left: `${8 + (i * 6.5) % 84}%`,
              bottom: `${8 + (i * 9) % 38}%`,
              filter: 'blur(0.5px)',
            }}
            animate={{
              y: [0, -(50 + (i * 11) % 90)],
              opacity: [0, 0.75, 0],
              x: [(i % 2 === 0 ? 1 : -1) * ((i * 4) % 14)],
            }}
            transition={{ duration: 3.5 + (i % 5), repeat: Infinity, delay: i * 0.35, ease: 'easeOut' }}
          />
        ))}

        <motion.div className="relative z-10 px-6" style={{ opacity: heroOpacity }}>
          <motion.p
            initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-serif text-sm uppercase tracking-[0.4em] mb-8"
            style={{ color: accentColor }}
          >
            {meta.heroSubtitle ?? city.category ?? ''}
          </motion.p>

          <h1
            className="font-serif font-black uppercase mb-6"
            style={{ fontSize: 'clamp(4rem, 14vw, 10rem)', letterSpacing: '0.08em', lineHeight: 0.9 }}
          >
            {cityName.split('').map((letter, i, arr) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 32, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.7, type: 'spring', stiffness: 120, damping: 12 }}
                style={{
                  display: 'inline-block',
                  color: i === arr.length - 1 ? accentColor : 'hsl(15 4% 94%)',
                  textShadow: i === arr.length - 1 ? `0 0 60px ${accentColor}80, 0 0 120px ${accentColor}30` : undefined,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mx-auto mb-6"
            style={{
              height: '1px', width: '200px',
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              transformOrigin: 'center',
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="font-sans text-xl mb-3"
            style={{ color: 'hsl(15 4% 65%)', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)' }}
          >
            {meta.heroTagline ?? city.summary ?? ''}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="font-serif text-xs uppercase tracking-[0.35em]"
            style={{ color: 'hsl(15 4% 32%)' }}
          >
            {meta.heroMotto ?? ''}
          </motion.p>
        </motion.div>

        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: '120px', background: 'linear-gradient(to bottom, transparent, hsl(15 6% 7%))' }}
        />
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <p className="font-serif text-xs uppercase tracking-[0.25em]" style={{ color: 'hsl(15 4% 28%)' }}>Enter</p>
          <motion.div
            style={{ width: '1px', height: '32px', background: `linear-gradient(to bottom, hsl(15 4% 28%), transparent)` }}
            animate={{ scaleY: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-10 font-serif text-xs uppercase tracking-wider"
        >
          <Link href="/">
            <span className="cursor-pointer transition-colors" style={{ color: 'hsl(15 4% 35%)' }}>Chronicle</span>
          </Link>
          <span style={{ color: 'hsl(15 8% 22%)' }}>›</span>
          {city.region && (
            <>
              <span style={{ color: 'hsl(15 4% 35%)' }}>{city.region}</span>
              <span style={{ color: 'hsl(15 8% 22%)' }}>›</span>
            </>
          )}
          <span style={{ color: accentColor }}>{city.name}</span>
        </motion.nav>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative flex items-center mb-10 overflow-x-auto"
          style={{ borderBottom: '1px solid hsl(15 8% 16%)', scrollbarWidth: 'none' }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              ref={el => { tabRefs.current[i] = el; }}
              onClick={() => setActiveTab(tab)}
              className="font-serif text-xs uppercase tracking-[0.18em] px-5 py-3 whitespace-nowrap transition-colors duration-200"
              style={{
                color: activeTab === tab ? accentColor : 'hsl(15 4% 46%)',
                background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', zIndex: 1,
              }}
            >
              {tab}
            </button>
          ))}
          <motion.div
            animate={{ left: indicator.left, width: indicator.width }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{
              position: 'absolute', bottom: '-1px', height: '2px',
              background: accentColor,
              boxShadow: `0 0 10px ${accentColor}70`,
              borderRadius: '1px',
            }}
          />
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <div key={activeTab}>
            {activeTab === 'Overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main content */}
                  <div
                    className="lg:col-span-2 p-8"
                    style={{ background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '4px' }}
                  >
                    {renderContent(stripHiddenBlocks(city.content), accentColor, allStubs, city.id)}
                  </div>

                  {/* Stat block */}
                  <div className="space-y-2">
                    {Object.entries(meta)
                      .filter(([k]) => !['accentColor', 'heroSubtitle', 'heroTagline', 'heroMotto'].includes(k))
                      .map(([label, val]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between px-4 py-2.5"
                          style={{ background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '4px' }}
                        >
                          <span className="font-serif text-xs uppercase tracking-wider" style={{ color: 'hsl(15 4% 38%)' }}>
                            {label}
                          </span>
                          <span className="font-sans text-sm" style={{ color: 'hsl(15 4% 78%)', fontSize: '14px' }}>
                            {val}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Districts' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {districts.length === 0 ? <EmptyState label="districts" /> : districts.map((d, i) => {
                  const distColor = d.factionId ? (FACTION_COLORS[d.factionId] ?? accentColor) : accentColor;
                  const num = d.category?.match(/\d+/)?.[0]?.padStart(2, '0') ?? '??';
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.4, type: 'spring', stiffness: 200 }}
                      onClick={() => setDrawerStub(d)}
                      className="p-6 cursor-pointer"
                      style={{ background: 'hsl(20 6% 10%)', border: `1px solid ${distColor}22`, borderRadius: '4px', transition: 'box-shadow 0.3s, border-color 0.3s' }}
                      whileHover={{ y: -3, boxShadow: `0 8px 40px -8px ${distColor}30`, borderColor: `${distColor}50` } as any}
                    >
                      <p className="font-serif font-bold mb-2" style={{ fontSize: '3rem', lineHeight: 1, color: `${distColor}14`, letterSpacing: '-0.02em' }}>{num}</p>
                      {d.factionId && (
                        <p className="font-serif text-xs uppercase tracking-[0.2em] mb-1" style={{ color: distColor }}>{d.category}</p>
                      )}
                      <h3 className="font-serif font-bold text-lg uppercase tracking-wide mb-3" style={{ color: 'hsl(15 4% 90%)' }}>{d.name}</h3>
                      {d.summary && (
                        <p className="font-sans leading-relaxed mb-4" style={{ color: 'hsl(15 4% 62%)', fontSize: '14px' }}>{d.summary}</p>
                      )}
                      <div style={{ height: '1px', background: `linear-gradient(90deg, ${distColor}44, transparent)` }} />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'Factions' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {factions.length === 0 ? <EmptyState label="factions" /> : factions.map((f, i) => {
                  const fColor = f.factionId ? (FACTION_COLORS[f.factionId] ?? accentColor) : accentColor;
                  const Icon = f.factionId ? (FACTION_ICONS[f.factionId] ?? Shield) : Shield;
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                    >
                      <div
                        onClick={() => setDrawerStub(f)}
                        className="p-6 h-full cursor-pointer"
                        style={{ background: 'hsl(20 6% 10%)', border: `1px solid ${fColor}25`, borderRadius: '4px', transition: 'transform 0.08s ease, box-shadow 0.3s, border-color 0.3s' }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = (e.clientX - rect.left) / rect.width - 0.5;
                          const y = (e.clientY - rect.top) / rect.height - 0.5;
                          e.currentTarget.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
                          e.currentTarget.style.boxShadow = `0 0 40px -8px ${fColor}30`;
                          e.currentTarget.style.borderColor = `${fColor}55`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
                          e.currentTarget.style.transition = 'transform 0.5s ease, box-shadow 0.4s, border-color 0.4s';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = `${fColor}25`;
                        }}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div style={{ width: '44px', height: '44px', flexShrink: 0, background: `${fColor}12`, border: `1px solid ${fColor}28`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={22} style={{ color: fColor }} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            {f.category && (
                              <p className="font-serif text-xs uppercase tracking-[0.22em] mb-0.5" style={{ color: fColor }}>{f.category}</p>
                            )}
                            <h3 className="font-serif font-bold text-lg uppercase tracking-wide leading-tight" style={{ color: 'hsl(15 4% 92%)' }}>{f.name}</h3>
                          </div>
                          <span className="font-serif text-xs uppercase tracking-wider flex-shrink-0 mt-1" style={{ color: `${fColor}80`, fontSize: '10px' }}>
                            View ›
                          </span>
                        </div>
                        {f.summary && (
                          <p className="font-sans leading-relaxed" style={{ color: 'hsl(15 4% 58%)', fontSize: '13px' }}>{f.summary}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'NPCs' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {npcs.length === 0 ? <EmptyState label="NPCs" /> : npcs.map((npc, i) => {
                  const nColor = npc.factionId ? (FACTION_COLORS[npc.factionId] ?? accentColor) : accentColor;
                  return (
                    <motion.div
                      key={npc.id}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -14 : 14 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}
                      onClick={() => setDrawerStub(npc)}
                      className="p-5 cursor-pointer"
                      style={{ background: 'hsl(20 6% 10%)', border: `1px solid ${nColor}20`, borderRadius: '4px', transition: 'box-shadow 0.25s, border-color 0.25s' }}
                      whileHover={{ boxShadow: `0 0 24px -4px ${nColor}25`, borderColor: `${nColor}44` } as any}
                    >
                      <div className="flex items-start gap-3">
                        <div style={{ width: '3px', borderRadius: '2px', background: nColor, alignSelf: 'stretch', flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {npc.category && (
                                <p className="font-serif text-xs uppercase tracking-wider mb-0.5" style={{ color: nColor }}>{npc.category}</p>
                              )}
                              <h4 className="font-serif font-bold text-base uppercase tracking-wide" style={{ color: 'hsl(15 4% 90%)' }}>{npc.name}</h4>
                            </div>
                            <span className="font-serif text-xs uppercase tracking-wider flex-shrink-0 mt-1" style={{ color: `${nColor}70`, fontSize: '10px' }}>View ›</span>
                          </div>
                          {npc.summary && (
                            <p className="font-sans text-sm leading-relaxed mt-2" style={{ color: 'hsl(15 4% 58%)', fontSize: '13px' }}>{npc.summary}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'Legends' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                {lore.length === 0 ? (
                  <EmptyState label="legends" />
                ) : (
                  <>
                    <div className="mb-7 p-5" style={{ background: 'hsl(20 6% 10%)', border: '1px solid hsl(15 8% 16%)', borderRadius: '4px' }}>
                      <div className="flex items-start gap-3">
                        <Eye size={15} style={{ color: accentColor, flexShrink: 0, marginTop: '2px' }} strokeWidth={1.5} />
                        <p className="font-sans" style={{ color: 'hsl(15 4% 58%)', fontSize: '15px', lineHeight: '1.65' }}>
                          What they say about {city.name} in the taverns, alleys, and forge-floors. Some of these are true. None of them are safe to repeat too loudly.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-10">
                      {lore.map(l => (
                        <LoreGroup key={l.id} stub={l} accentColor={accentColor} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* Entity Drawer */}
      <AnimatePresence>
        {drawerStub && (
          <EntityDrawer
            key={drawerStub.id}
            stub={drawerStub}
            allStubs={allStubs}
            onClose={() => setDrawerStub(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
