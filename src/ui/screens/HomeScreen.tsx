import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HomeInfoCard } from '../components/HomeInfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { gameModeLabel, resolveGameMode } from '../gameMode';
import { resolveGameStatus } from '../gameLifecycle';
import { resolveTargetRoundCount } from '../targetRoundCount';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

type HomeScreenProps = {
  activeGame: ActiveGameData | null;
  onContinue: () => void;
  onNewGame: () => void;
  onRestart: () => void;
  onAbandon: () => void;
};

function showComingSoon(feature: string) {
  Alert.alert(feature, 'Henüz hazır değil. Yakında eklenecek.');
}

export function HomeScreen({
  activeGame,
  onContinue,
  onNewGame,
  onRestart,
  onAbandon,
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

  function handleRestart() {
    Alert.alert(
      'Oyunu yeniden başlat',
      'Aynı oyuncularla skorlar sıfırlanır. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yeniden Başlat', style: 'destructive', onPress: onRestart },
      ],
    );
  }

  function handleAbandon() {
    Alert.alert(
      'Oyunu iptal et',
      'Bu yarım oyun silinir. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'İptal Et', style: 'destructive', onPress: onAbandon },
      ],
    );
  }

  const targetRounds = activeGame
    ? resolveTargetRoundCount(activeGame.targetRoundCount)
    : 0;
  const playedRounds = activeGame?.rounds.length ?? 0;
  const modeLabel = activeGame
    ? gameModeLabel(resolveGameMode(activeGame.gameMode))
    : '';
  const status = activeGame ? resolveGameStatus(activeGame) : null;
  const cardTitle =
    status === 'paused' ? 'Duraklatılmış Oyun' : 'Devam Eden Oyun';

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
            Eşli ve tekli 101 oyunlarında elleri ve cezaları kolayca hesapla.
          </Text>
        </View>

        {activeGame ? (
          <View style={styles.activeCard}>
            <Pressable
              accessibilityRole="button"
              onPress={onContinue}
              style={({ pressed }) => [pressed && styles.activeCardPressed]}
            >
              <Text style={styles.activeLabel}>{cardTitle}</Text>
              <Text style={styles.activeMode}>{modeLabel}</Text>
              {status === 'paused' ? (
                <Text style={styles.pausedBadge}>Duraklatıldı</Text>
              ) : null}
              <Text style={styles.activeMeta}>
                Oynanan El: {playedRounds} / {targetRounds}
              </Text>
              {resolveGameMode(activeGame.gameMode) === 'individual' ? (
                <>
                  {activeGame.teams.flatMap((team) =>
                    team.players.map((player) => (
                      <Text
                        key={player.id}
                        style={styles.activeScore}
                        numberOfLines={1}
                      >
                        {player.name} {player.totalScore}
                      </Text>
                    )),
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.activeScore} numberOfLines={1}>
                    {activeGame.teams[0].name} {activeGame.teams[0].totalScore}
                  </Text>
                  <Text style={styles.activeScore} numberOfLines={1}>
                    {activeGame.teams[1].name} {activeGame.teams[1].totalScore}
                  </Text>
                </>
              )}
              {activeGame.updatedAt ? (
                <Text style={styles.activeMeta}>
                  Son güncelleme:{' '}
                  {new Date(activeGame.updatedAt).toLocaleString('tr-TR')}
                </Text>
              ) : null}
            </Pressable>
            <View style={styles.cardActions}>
              <PrimaryButton label="Devam Et" onPress={onContinue} />
              <SecondaryButton
                label="Yeniden Başlat"
                onPress={handleRestart}
                style={styles.cardSecondary}
              />
              <Pressable onPress={handleAbandon} style={styles.abandonLink}>
                <Text style={styles.abandonLabel}>İptal Et</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
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
    gap: spacing.sm,
  },
  activeCardPressed: {
    opacity: 0.92,
  },
  activeLabel: {
    ...typography.infoLabel,
    color: colors.primary,
  },
  activeMode: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: colors.primaryMuted,
  },
  pausedBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5A2B',
  },
  activeMeta: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.textSecondary,
  },
  activeScore: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  cardActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cardSecondary: {
    flexGrow: 0,
    width: '100%',
  },
  abandonLink: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abandonLabel: {
    ...typography.buttonSecondary,
    color: '#8B2E2E',
  },
  actions: {
    gap: spacing.sm,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
