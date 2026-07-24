import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { chrome, colors, layout, radii, spacing } from '../theme';

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
        pressed && !disabled && chrome.pressed,
        disabled && chrome.disabled,
        style,
      ]}
    >
      <Text
        style={[
          chrome.buttonSecondaryLabel,
          disabled && { color: colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    ...chrome.buttonSecondary,
    minHeight: layout.buttonHeight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
});
