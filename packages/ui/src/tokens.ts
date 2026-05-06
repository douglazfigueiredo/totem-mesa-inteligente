export const colors = {
  bgCream: '#ebe2ce',
  bgPaper: '#fffaf0',
  bgSoft: '#faf3e2',
  bgWarm: '#efe5d2',

  ink: '#2b1b10',
  inkSoft: '#4a3525',
  inkMute: '#7a614c',

  terracota: '#c14a26',
  terracotaDeep: '#9c3819',

  gold: '#d4a13b',
  goldDeep: '#a87b22',

  green: '#6b7b3a',
  greenSoft: '#cde8e1',

  kdsDark: '#1a0f08',
  kdsText: '#f7f1e6',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  card: 18,
} as const;

export const shadows = {
  card: '0 1px 2px rgba(43,27,16,0.04), 0 8px 20px rgba(43,27,16,0.05)',
} as const;

export const fonts = {
  display: "'Fraunces', Georgia, serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
} as const;

export const fontSize = {
  monoMicro: 10,
  bodySmall: 13,
  body: 14,
  subtitle: 18,
  title: 26,
  display: 36,
  timer: 96,
} as const;

export const motion = {
  pageFadeMs: 300,
  pageEasing: 'cubic-bezier(0.2, 0, 0, 1)',
  ringEasing: 'linear',
  bellShakeMs: 600,
  pulseMs: 1000,
} as const;

export type Tokens = {
  colors: typeof colors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  fonts: typeof fonts;
  fontSize: typeof fontSize;
  motion: typeof motion;
};

export const tokens: Tokens = { colors, spacing, radius, shadows, fonts, fontSize, motion };
