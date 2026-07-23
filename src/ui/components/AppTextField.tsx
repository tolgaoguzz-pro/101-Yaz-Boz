import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

type AppTextFieldProps = TextInputProps & {
  label: string;
};

export function AppTextField({ label, style, ...props }: AppTextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        selectTextOnFocus
        {...props}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 17,
    fontWeight: '500',
  },
});
