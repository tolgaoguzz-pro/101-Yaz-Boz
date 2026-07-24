import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

/**
 * Tek kaynaklı premium yaz-boz tasarım sistemi.
 * Referans: green / cream / gold / text — tüm ekranlar buradan okur.
 */
export const colors = {
  green: '#1F5E3B',
  greenDeep: '#174A2E',
  greenLight: '#2A6E47',
  cream: '#F7F2E8',
  creamHeader: '#EFE8DB',
  creamTotal: '#E6DCC8',
  creamCard: '#FFFEF9',
  gold: '#C8A44D',
  goldSoft: 'rgba(200, 164, 77, 0.55)',
  goldBorder: 'rgba(200, 164, 77, 0.4)',
  text: '#263238',
  textMuted: '#6B736C',
  white: '#FFFFFF',
  line: '#D4CBB8',
  border: '#C5BBA8',
  penalty: '#F8EFC2',
  headerMuted: 'rgba(247, 242, 232, 0.78)',
  playerCream: 'rgba(247, 242, 232, 0.88)',
  tileFace: '#FFFEF8',
  tileRed: '#C62828',
  tileBlack: '#1A1A1A',
  silver: '#A8B0B5',
  bronze: '#B08D57',
  rankMuted: '#A8B0B5',
  rankGoldSoft: '#B08D57',

  /** Alias’lar — ekran / eski bileşen uyumu. */
  felt: '#1F5E3B',
  feltDeep: '#174A2E',
  feltLight: '#2A6E47',
  primary: '#1F5E3B',
  primaryPressed: '#174A2E',
  primaryMuted: '#2A6E47',
  background: '#F7F2E8',
  surface: '#EFE8DB',
  surfaceElevated: '#FFFEF9',
  goldMuted: '#C8A44D',
  textSecondary: '#6B736C',
  textOnDark: '#F7F2E8',
  textOnPrimary: '#FFFFFF',
  textMutedOnDark: 'rgba(247, 242, 232, 0.78)',
  shadow: '#174A2E',
  card: '#FFFEF9',
  cardBorder: 'rgba(200, 164, 77, 0.4)',
  divider: '#D4CBB8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 14,
  sheet: 22,
  pill: 999,
} as const;

/** Sabit kontrol ölçüleri — tüm ekranlar. */
export const layout = {
  headerMinHeight: 44,
  headerIcon: 40,
  buttonHeight: 46,
  buttonHeightCompact: 42,
  inputHeight: 36,
  tableRowHeight: 34,
  tableHeaderHeight: 32,
  tableTotalHeight: 40,
  tableLabelWidth: 40,
  cardMinHeight: 58,
} as const;

export const typography = {
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  headerMeta: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: colors.headerMuted,
  },
  section: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.4,
    color: colors.green,
  },
  title: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.text,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.text,
  },
  bodyStrong: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  button: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.white,
  },
  buttonSecondary: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.green,
  },
  buttonGhost: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textMuted,
  },
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
  logoDisplay: {
    fontSize: 58,
    fontWeight: '800' as const,
    letterSpacing: 1,
    lineHeight: 60,
  },
  hero: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
} as const;

type Textish = TextStyle;
type Viewish = ViewStyle;

export const chrome = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.green,
  } satisfies Viewish,
  flex: {
    flex: 1,
  } satisfies Viewish,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.headerMinHeight,
    paddingHorizontal: spacing.sm,
    paddingBottom: 6,
    backgroundColor: colors.green,
  } satisfies Viewish,
  headerCompact: {
    paddingBottom: 4,
  } satisfies Viewish,
  headerIconButton: {
    width: layout.headerIcon,
    height: layout.headerIcon,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies Viewish,
  headerIconSpacer: {
    width: layout.headerIcon,
  } satisfies Viewish,
  backLabel: {
    fontSize: 30,
    fontWeight: '300',
    color: colors.white,
    marginTop: -2,
  } satisfies Textish,
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
  } satisfies Viewish,
  headerTitle: {
    ...typography.headerTitle,
  } satisfies Textish,
  headerMeta: {
    ...typography.headerMeta,
    marginTop: 1,
  } satisfies Textish,
  sheet: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    overflow: 'hidden',
  } satisfies Viewish,
  sheetPad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  } satisfies Viewish,
  sectionTitle: {
    ...typography.section,
  } satisfies Textish,
  card: {
    backgroundColor: colors.creamCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  } satisfies Viewish,
  cardPressed: {
    opacity: 0.78,
  } satisfies Viewish,
  buttonPrimary: {
    minHeight: layout.buttonHeight,
    borderRadius: radii.md,
    backgroundColor: colors.green,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  } satisfies Viewish,
  buttonSecondary: {
    minHeight: layout.buttonHeight,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  } satisfies Viewish,
  buttonGhost: {
    minHeight: layout.buttonHeight,
    borderRadius: radii.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  } satisfies Viewish,
  buttonCompact: {
    minHeight: layout.buttonHeightCompact,
  } satisfies Viewish,
  buttonPrimaryLabel: {
    ...typography.button,
  } satisfies Textish,
  buttonSecondaryLabel: {
    ...typography.buttonSecondary,
  } satisfies Textish,
  buttonGhostLabel: {
    ...typography.buttonGhost,
  } satisfies Textish,
  input: {
    height: layout.inputHeight,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
  } satisfies Textish,
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  } satisfies Viewish,
  footerCol: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  } satisfies Viewish,
  pressed: {
    opacity: 0.82,
  } satisfies Viewish,
  disabled: {
    opacity: 0.45,
  } satisfies Viewish,
  goldRule: {
    height: 1.5,
    backgroundColor: colors.gold,
    opacity: 0.75,
  } satisfies Viewish,
});
