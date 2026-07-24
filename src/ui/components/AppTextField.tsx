import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

type AppTextFieldProps = TextInputProps & {
  label: string;
  compact?: boolean;
};

export function AppTextField({
  label,
  style,
  compact = false,
  ...props
}: AppTextFieldProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        selectTextOnFocus
        {...props}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, compact && styles.inputCompact, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  wrapCompact: {
    gap: 2,
  },
  label: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  inputCompact: {
    minHeight: 40,
    fontSize: 15,
  },
});
