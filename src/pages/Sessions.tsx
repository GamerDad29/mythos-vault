import { motion } from 'framer-motion';
import { ScrollText } from 'lucide-react';

export function Sessions() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ScrollText
          size={40}
          strokeWidth={0.75}
          style={{ color: 'hsl(15 8% 22%)', margin: '0 auto 1.5rem' }}
        />
        <p
          className="font-display text-xs uppercase tracking-[0.3em] mb-3"
          style={{ color: 'hsl(25 80% 35%)' }}
        >
          Coming Soon
        </p>
        <h1
          className="font-serif font-black uppercase tracking-wide mb-4"
          style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'hsl(15 4% 75%)' }}
        >
          Sessions
        </h1>
        <div className="forge-divider w-24 mx-auto mb-6" />
        <p
          className="font-display italic max-w-sm mx-auto"
          style={{ color: 'hsl(15 4% 40%)', fontSize: '16px' }}
        >
          The chronicle of each session — what was risked, what was won, and what was lost forever.
        </p>
      </motion.div>
    </div>
  );
}
