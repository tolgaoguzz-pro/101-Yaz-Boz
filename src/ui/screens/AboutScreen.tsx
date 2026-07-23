import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { APP_INFO, DEVELOPER_CREDIT } from '../../config/appInfo';
import { colors, radii, spacing, typography } from '../theme';

type AboutScreenProps = {
  onBack: () => void;
};

export function AboutScreen({ onBack }: AboutScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backPressed,
          ]}
        >
          <Text style={styles.backLabel}>Geri</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.brand}>{APP_INFO.name}</Text>
          <Text style={styles.version}>Sürüm {APP_INFO.version}</Text>
          <Text style={styles.credit}>{DEVELOPER_CREDIT}</Text>
          <Text style={styles.copyright}>
            © {APP_INFO.copyrightYear}
          </Text>
        </View>

        <Text style={styles.description}>{APP_INFO.shortDescription}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  backPressed: {
    backgroundColor: colors.surface,
  },
  backLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  hero: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    color: colors.text,
  },
  version: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  credit: {
    ...typography.body,
    color: colors.text,
  },
  copyright: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
