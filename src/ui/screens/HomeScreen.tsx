import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HomeInfoCard } from '../components/HomeInfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

type HomeScreenProps = {
  activeGame: ActiveGameData | null;
  onContinue: () => void;
  onNewGame: () => void;
};

function showComingSoon(feature: string) {
  Alert.alert(feature, 'Henüz hazır değil. Yakında eklenecek.');
}

export function HomeScreen({
  activeGame,
  onContinue,
  onNewGame,
}: HomeScreenProps) {
  function handleNewGame() {
    if (!activeGame) {
      onNewGame();
      return;
    }

    Alert.alert(
      'Yeni oyun başlatılsın mı?',
      'Mevcut aktif oyun silinir ve skorlar kaybolur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Yeni Oyun',
          style: 'destructive',
          onPress: onNewGame,
        },
      ],
    );
  }

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

        {activeGame ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeLabel}>Aktif oyun</Text>
            <Text style={styles.activeScore}>
              {activeGame.teams[0].name} {activeGame.teams[0].totalScore} —{' '}
              {activeGame.teams[1].name} {activeGame.teams[1].totalScore}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {activeGame ? (
            <PrimaryButton label="Devam Et" onPress={onContinue} />
          ) : null}
          <PrimaryButton label="Yeni Oyun" onPress={handleNewGame} />
          <View style={styles.secondaryRow}>
            <SecondaryButton
              label="Geçmiş"
              onPress={() => showComingSoon('Geçmiş')}
            />
            <SecondaryButton
              label="Ayarlar"
              onPress={() => showComingSoon('Ayarlar')}
            />
          </View>
        </View>

        <Text style={styles.warning}>
          Test sürümü: Uygulama kapanırsa aktif oyun silinir.
        </Text>

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
  activeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  activeLabel: {
    ...typography.infoLabel,
    color: colors.primary,
  },
  activeScore: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  actions: {
    gap: spacing.sm,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  warning: {
    ...typography.infoLabel,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
