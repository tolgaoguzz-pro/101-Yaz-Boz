import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { chrome, colors, layout, radii, spacing, typography } from '../theme';

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
  return <View style={[chrome.goldRule, style]} />;
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
    minHeight: layout.headerIcon,
    minWidth: layout.headerIcon,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  backPressed: {
    backgroundColor: colors.creamHeader,
  },
  backPressedLight: {
    backgroundColor: 'rgba(247, 242, 232, 0.12)',
  },
  backLabel: {
    ...typography.buttonSecondary,
    color: colors.green,
  },
  backLabelLight: {
    color: colors.headerMuted,
  },
  sectionLabel: {
    ...typography.section,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  sectionLabelLight: {
    color: colors.gold,
    opacity: 0.9,
  },
});
