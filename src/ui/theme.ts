export const colors = {
  background: '#F3EDE3',
  surface: '#E8DFD0',
  surfaceElevated: '#F7F1E7',
  border: '#D4C7B4',
  primary: '#1B4D3E',
  primaryPressed: '#143D31',
  primaryMuted: '#2F6B57',
  text: '#1F2A24',
  textSecondary: '#5C6B63',
  textOnPrimary: '#F7F1E7',
  shadow: '#1A2E26',
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const typography = {
  brand: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
  },
  hero: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  button: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  buttonSecondary: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
};
