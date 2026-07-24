import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { chrome, colors, layout, radii, spacing } from '../theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  style,
  disabled = false,
}: PrimaryButtonProps) {
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
      <Text style={chrome.buttonPrimaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    ...chrome.buttonPrimary,
    minHeight: layout.buttonHeight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
});
