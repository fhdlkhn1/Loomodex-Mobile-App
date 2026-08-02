// Loomodex design tokens — matched to loomodex.com WordPress theme

export const LMX = {
  // Backgrounds
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4FF',
  surfaceMuted: '#FAFBFD',

  // Text
  ink: '#0B1F3A',
  ink70: 'rgba(11,31,58,0.70)',
  ink50: 'rgba(11,31,58,0.50)',
  ink30: 'rgba(11,31,58,0.30)',
  ink10: 'rgba(11,31,58,0.08)',

  // Lines
  hairline: 'rgba(11,31,58,0.07)',
  border: '#DDE3EE',

  // Brand
  brand: '#1E6BFF',         // primary blue
  brandDeep: '#1554CC',     // primary hover
  brandSoft: '#E8EFFE',     // light blue bg

  // Accent
  accent: '#FF7A00',        // orange
  accentInk: '#FFFFFF',
  accentSoft: '#FFF0E5',

  // Dark navy (header/footer)
  navy: '#0B1F3A',

  // Gold
  gold: '#FFC300',

  // Status
  emerald: '#10B981',
  emeraldSoft: '#D1FAE5',
  amber: '#F59E0B',
  rose: '#EF4444',

  // Radius
  r: { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 },
};

// Inter font family (matches loomodex.com)
export const FONT = {
  sans: 'Inter_400Regular',
  sansMed: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  mono: 'Inter_500Medium',
  monoMed: 'Inter_500Medium',
  monoSemi: 'Inter_600SemiBold',
  display: 'Inter_700Bold',
  displayItalic: 'Inter_400Regular',
};

export const sans = (weight: number | string = 400): string => {
  const w = Number(weight);
  if (w >= 700) return FONT.sansBold;
  if (w >= 600) return FONT.sansSemi;
  if (w >= 500) return FONT.sansMed;
  return FONT.sans;
};

export const mono = (weight: number | string = 400): string => {
  const w = Number(weight);
  if (w >= 600) return FONT.monoSemi;
  if (w >= 500) return FONT.monoMed;
  return FONT.mono;
};

// Format Guinean Franc: "175 000 GNF"
export const fr = (n: number): string =>
  Math.round(n).toLocaleString('fr-FR').replace(/[ ,]/g, ' ');

export const gnf = (n: number): string => fr(n) + ' GNF';

// Decode HTML entities WordPress returns in titles (e.g. "Beauty &amp; Care" → "Beauty & Care")
export const decodeEntities = (s?: string | null): string => {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#0*38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0*(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 10)));
};

export const gnfShort = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'K';
  return String(n);
};

export const shadow = (level: 'sm' | 'md' | 'lg' = 'sm') => {
  const map = {
    sm: { shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, y: 2 },
    md: { shadowOpacity: 0.10, shadowRadius: 16, elevation: 4, y: 6 },
    lg: { shadowOpacity: 0.16, shadowRadius: 30, elevation: 10, y: 12 },
  }[level];
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: map.y },
    shadowOpacity: map.shadowOpacity,
    shadowRadius: map.shadowRadius,
    elevation: map.elevation,
  };
};
