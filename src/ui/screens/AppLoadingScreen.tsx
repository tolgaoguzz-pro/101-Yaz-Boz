import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { APP_INFO } from '../../config/appInfo';
import { GoldRule } from '../components/ScreenChrome';
import { colors, spacing, typography } from '../theme';

export function AppLoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{APP_INFO.name.toUpperCase()}</Text>
      <GoldRule style={styles.rule} />
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.felt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  brand: {
    ...typography.brandHero,
    color: colors.textOnDark,
    textAlign: 'center',
  },
  rule: {
    width: 56,
  },
});
