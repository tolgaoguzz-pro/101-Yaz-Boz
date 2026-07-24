import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

type ScreenBackButtonProps = {
  onPress: () => void;
  label?: string;
  light?: boolean;
};

export function ScreenBackButton({
  onPress,
  label = 'Geri',
  light = false,
}: ScreenBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.backButton,
        light && styles.backButtonLight,
        pressed && (light ? styles.backPressedLight : styles.backPressed),
      ]}
    >
      <Text style={[styles.backLabel, light && styles.backLabelLight]}>
        {label}
      </Text>
    </Pressable>
  );
}

type GoldRuleProps = {
  style?: ViewStyle;
};

export function GoldRule({ style }: GoldRuleProps) {
  return <View style={[styles.goldRule, style]} />;
}

type SectionLabelProps = {
  children: string;
  light?: boolean;
};

export function SectionLabel({ children, light = false }: SectionLabelProps) {
  return (
    <Text style={[styles.sectionLabel, light && styles.sectionLabelLight]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  backButtonLight: {},
  backPressed: {
    backgroundColor: colors.surface,
  },
  backPressedLight: {
    backgroundColor: 'rgba(247, 241, 231, 0.12)',
  },
  backLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  backLabelLight: {
    color: colors.textOnDark,
  },
  goldRule: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.gold,
    opacity: 0.85,
    alignSelf: 'stretch',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.goldMuted,
  },
  sectionLabelLight: {
    color: colors.goldSoft,
  },
});
