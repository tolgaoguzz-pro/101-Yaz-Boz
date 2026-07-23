import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { APP_INFO } from '../../config/appInfo';
import { colors, spacing, typography } from '../theme';

export function AppLoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{APP_INFO.name.toUpperCase()}</Text>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.label}>Yükleniyor…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  brand: {
    ...typography.brand,
    color: colors.primaryMuted,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
});
