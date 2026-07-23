import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HomeInfoCard } from '../components/HomeInfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { colors, spacing, typography } from '../theme';

type HomeScreenProps = {
  onNewGame: () => void;
};

export function HomeScreen({ onNewGame }: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>101 YAZ-BOZ</Text>
          <Text style={styles.title}>Masayı kur, puanı bize bırak.</Text>
          <Text style={styles.subtitle}>
            Eşli 101 oyunlarında tüm elleri ve cezaları kolayca hesapla.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Yeni Oyun" onPress={onNewGame} />
          <View style={styles.secondaryRow}>
            <SecondaryButton
              label="Geçmiş"
              onPress={() => console.log('Geçmiş')}
            />
            <SecondaryButton
              label="Ayarlar"
              onPress={() => console.log('Ayarlar')}
            />
          </View>
        </View>

        <HomeInfoCard />
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
    justifyContent: 'center',
  },
  hero: {
    gap: spacing.md,
  },
  brand: {
    ...typography.brand,
    color: colors.primaryMuted,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.hero,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 340,
  },
  actions: {
    gap: spacing.sm,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
