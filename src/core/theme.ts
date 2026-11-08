import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Palet "Warm Teal" — sengaja berbeda dari aplikasi sebelumnya:
 * kanvas krem hangat, navy pekat, teal sebagai aksen utama, coral untuk urgensi.
 */
export const colors = {
  canvas: '#F6F4EF',
  canvasDeep: '#EFEBE2',
  paper: '#FFFFFF',
  paperWarm: '#FFFDF8',

  ink: '#0B1F2A',
  inkSoft: '#17323E',
  inkMuted: '#3D5560',

  teal: '#0F766E',
  tealDeep: '#115E59',
  tealSoft: '#D9F3EE',
  tealTint: '#F0FAF8',

  coral: '#F97316',
  coralDeep: '#C2410C',
  coralSoft: '#FFEDD5',
  amber: '#B45309',
  amberSoft: '#FEF3C7',
  blue: '#1D4ED8',
  blueSoft: '#DBEAFE',
  violet: '#6D28D9',
  violetSoft: '#EDE9FE',
  rose: '#BE123C',
  roseSoft: '#FFE4E6',
  red: '#B91C1C',
  redSoft: '#FEE2E2',
  green: '#047857',
  greenSoft: '#D1FAE5',

  muted: '#5F5A50',
  mutedSoft: '#756F63',
  line: '#E4DED3',
  lineStrong: '#CFC6B7',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(11, 31, 42, 0.56)',
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const type = {
  display: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -1.1,
    color: colors.ink,
  },
  h1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: colors.ink,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: colors.ink,
  },
  h3: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSoft,
  },
  bodyStrong: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: colors.ink,
  },
  small: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  tiny: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  number: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.ink,
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 7 },
    },
    android: { elevation: 2 },
    default: { boxShadow: '0 7px 20px rgba(11, 31, 42, 0.06)' },
  }) as ViewStyle,
  dock: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.ink,
      shadowOpacity: 0.16,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 14 },
    default: { boxShadow: '0 12px 32px rgba(11, 31, 42, 0.18)' },
  }) as ViewStyle,
  sheet: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.ink,
      shadowOpacity: 0.22,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: -6 },
    },
    android: { elevation: 24 },
    default: { boxShadow: '0 -8px 40px rgba(11, 31, 42, 0.2)' },
  }) as ViewStyle,
};

export const layout = {
  maxWidth: 760,
  pagePadding: 20,
  dockSpace: 124,
} as const;
