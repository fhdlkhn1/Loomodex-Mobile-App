// Loomodex design tokens — ported from the web prototype to React Native.

export const LMX = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F6FA',
  surfaceMuted: '#FAFBFD',
  ink: '#0F1620',
  ink70: 'rgba(15,22,32,0.66)',
  ink50: 'rgba(15,22,32,0.46)',
  ink30: 'rgba(15,22,32,0.26)',
  ink10: 'rgba(15,22,32,0.08)',
  hairline: 'rgba(15,22,32,0.07)',
  border: '#E3E8EF',
  accent: '#F37524',
  accentInk: '#FFFFFF',
  accentSoft: '#FFEBDC',
  brand: '#0EA5E9',
  brandDeep: '#0B7FB5',
  brandSoft: '#DCF1FB',
  emerald: '#0E8A57',
  emeraldSoft: '#DAF1E6',
  amber: '#D38A1A',
  rose: '#C42458',
  r: { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 },
};

// Font family names registered via @expo-google-fonts (see App.tsx).
export const FONT = {
  sans: 'Geist_400Regular',
  sansMed: 'Geist_500Medium',
  sansSemi: 'Geist_600SemiBold',
  sansBold: 'Geist_700Bold',
  mono: 'GeistMono_400Regular',
  monoMed: 'GeistMono_500Medium',
  monoSemi: 'GeistMono_600SemiBold',
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
};

// Resolve a Geist family for a numeric/keyword weight.
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

// Format Guinean Franc: "175 000"
export const fr = (n: number): string =>
  Math.round(n).toLocaleString('fr-FR').replace(/[\u00A0,]/g, ' ');

export const gnf = (n: number): string => fr(n) + ' GNF';

export const gnfShort = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'K';
  return String(n);
};

// Soft card shadow approximation used across the app.
export const shadow = (level: 'sm' | 'md' | 'lg' = 'sm') => {
  const map = {
    sm: { shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, y: 2 },
    md: { shadowOpacity: 0.1, shadowRadius: 16, elevation: 4, y: 8 },
    lg: { shadowOpacity: 0.16, shadowRadius: 30, elevation: 10, y: 16 },
  }[level];
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: map.y },
    shadowOpacity: map.shadowOpacity,
    shadowRadius: map.shadowRadius,
    elevation: map.elevation,
  };
};
