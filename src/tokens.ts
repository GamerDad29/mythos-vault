// Design tokens — shared constants for the Mythos Vault design system
// Matches the Forge (Mythos Architect) card style conventions.
// Apply to new/changed code only; do not mass-refactor existing components.

export const tokens = {
  radius: {
    tile:   '12px',  // landing nav tiles (Forge rounded-xl)
    card:   '8px',   // entity cards, content panels (Forge rounded-lg)
    button: '4px',   // buttons, small controls
    badge:  '2px',   // type badges, tags
  },

  color: {
    bg: {
      deep:     '#080610',          // page background
      card:     '#0D0A0F',          // card default (Forge-matched)
      cardAlt:  '#09070F',          // slightly darker variant
      elevated: 'hsl(20 8% 12%)',   // hover / elevated state
      surface:  'hsl(20 6% 10%)',   // generic surfaces
    },
    border: {
      default: 'hsl(15 8% 16%)',
      subtle:  'hsl(15 8% 14%)',
    },
    text: {
      primary:   'hsl(15 4% 92%)',
      secondary: 'hsl(15 4% 65%)',
      muted:     'hsl(15 4% 45%)',
      faint:     'hsl(15 4% 38%)',
    },
    accent: 'hsl(25 100% 40%)',
  },

  transition: {
    card: 'all 0.3s ease',
    fast: 'all 0.2s ease',
  },

  shadow: {
    // Dual-bloom glow matching Forge hover style
    cardHover:       (color: string) => `0 0 22px ${color}28, 0 0 44px ${color}10`,
    cardHoverStrong: (color: string) => `0 0 28px ${color}28, inset 0 0 20px ${color}08`,
  },
} as const;
