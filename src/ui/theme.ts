/**
 * Premium yaz-boz paleti — yalnızca koyu yeşil, krem, altın, beyaz.
 */
export const colors = {
  /** Koyu yeşil oyun masası */
  felt: '#0F3D2E',
  feltDeep: '#0A2F23',
  primary: '#1B4D3E',
  primaryPressed: '#143D31',
  primaryMuted: '#2F6B57',

  /** Açık krem zemin */
  background: '#F3EDE3',
  surface: '#E8DFD0',
  surfaceElevated: '#F7F1E7',
  border: '#D4C7B4',

  /** İnce altın vurgu */
  gold: '#C6A75E',
  goldSoft: '#D4BC7D',
  goldMuted: '#A8904A',

  /** Beyaz / krem üzeri okunabilirlik */
  white: '#FFFFFF',
  text: '#1B4D3E',
  textSecondary: '#4A6B5C',
  textOnDark: '#F7F1E7',
  textOnPrimary: '#F7F1E7',
  textMutedOnDark: 'rgba(247, 241, 231, 0.72)',

  /** Geriye uyumluluk (gölge yok / minimal) */
  shadow: '#0A2F23',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  brand: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 2.2,
  },
  brandHero: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: 1.6,
    lineHeight: 40,
  },
  hero: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  button: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  buttonSecondary: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
};
