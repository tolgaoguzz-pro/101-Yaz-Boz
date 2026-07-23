import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';

import { buildAllMatchupSeries } from '../../domain/tournament';
import { listCompletedGames } from '../../persistence/completedGameRepository';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  buildTournamentListCard,
  TournamentListCardModel,
} from '../tournamentPresentation';
import { colors, radii, spacing, typography } from '../theme';

type TournamentListScreenProps = {
  onBack: () => void;
  onOpenMatchup: (matchupKey: string) => void;
  onStartNewGame: () => void;
};

export function TournamentListScreen({
  onBack,
  onOpenMatchup,
  onStartNewGame,
}: TournamentListScreenProps) {
  const [cards, setCards] = useState<TournamentListCardModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const games = await listCompletedGames();
        const series = buildAllMatchupSeries(games);
        if (!cancelled) {
          setCards(series.map(buildTournamentListCard));
        }
      } catch (error) {
        console.warn('[ui] TournamentListScreen load failed', error);
        if (!cancelled) {
          setCards([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

        <Text style={styles.title}>Turnuvalar ve Geçmiş</Text>
        <Text style={styles.subtitle}>
          Aynı oyuncularla oynanan tamamlanmış oyunlar burada gruplanır.
        </Text>

        {loading ? (
          <Text style={styles.empty}>Yükleniyor…</Text>
        ) : cards.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>Henüz tamamlanmış oyun yok</Text>
            <Text style={styles.emptyHint}>
              Bir oyunu bitirdiğinde turnuva geçmişi burada görünür.
            </Text>
            <PrimaryButton label="Yeni Oyun Başlat" onPress={onStartNewGame} />
          </View>
        ) : (
          cards.map((card) => (
            <Pressable
              key={card.matchupKey}
              accessibilityRole="button"
              onPress={() => onOpenMatchup(card.matchupKey)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.mode}>{card.modeLabel}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              <Text style={styles.cardMeta}>{card.meta}</Text>
            </Pressable>
          ))
        )}
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
    gap: spacing.md,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.infoLabel,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardPressed: {
    opacity: 0.9,
  },
  mode: {
    ...typography.infoLabel,
    color: colors.primary,
  },
  cardTitle: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.primaryMuted,
  },
  cardMeta: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
