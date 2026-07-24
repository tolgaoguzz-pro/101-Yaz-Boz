import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
};

export function SecondaryButton({
  label,
  onPress,
  style,
  disabled = false,
}: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexGrow: 0,
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
});
