import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';

import { calculateMatchupSeries, MatchupSeriesSummary } from '../../domain/tournament';
import { CompletedGameRecord } from '../../domain/completedGame';
import { listCompletedGamesByMatchup } from '../../persistence/completedGameRepository';
import { PrimaryButton } from '../components/PrimaryButton';
import { resolveGameMode } from '../gameMode';
import {
  buildTournamentGameRow,
  formatSafeDateTime,
  TournamentGameRowModel,
} from '../tournamentPresentation';
import { colors, radii, spacing, typography } from '../theme';

type TournamentDetailScreenProps = {
  matchupKey: string;
  onBack: () => void;
  onOpenGame: (gameId: string) => void;
  onPlayAgain: (record: CompletedGameRecord) => void;
};

export function TournamentDetailScreen({
  matchupKey,
  onBack,
  onOpenGame,
  onPlayAgain,
}: TournamentDetailScreenProps) {
  const [series, setSeries] = useState<MatchupSeriesSummary | null>(null);
  const [latestRecord, setLatestRecord] = useState<CompletedGameRecord | null>(
    null,
  );
  const [rows, setRows] = useState<TournamentGameRowModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const games = await listCompletedGamesByMatchup(matchupKey);
        const summary = calculateMatchupSeries(games);
        if (!cancelled) {
          setSeries(summary);
          setLatestRecord(games[0] ?? null);
          setRows(games.map(buildTournamentGameRow));
        }
      } catch (error) {
        console.warn('[ui] TournamentDetailScreen load failed', error);
        if (!cancelled) {
          setSeries(null);
          setLatestRecord(null);
          setRows([]);
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
  }, [matchupKey]);

  const playAgainLabel =
    series && resolveGameMode(series.gameMode) === 'individual'
      ? 'Bu Oyuncularla Yeni Oyun'
      : 'Bu Takımlarla Yeni Oyun';

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

        <Text style={styles.title}>Turnuva Detayı</Text>

        {loading ? (
          <Text style={styles.empty}>Yükleniyor…</Text>
        ) : !series ? (
          <Text style={styles.empty}>Bu eşleşme için oyun bulunamadı.</Text>
        ) : (
          <>
            <View style={styles.headerCard}>
              {series.gameMode === 'paired' && series.paired ? (
                <>
                  <Text style={styles.teamLine}>
                    {series.paired.teamA.displayLabel}
                  </Text>
                  <Text style={styles.scoreLine}>
                    {series.paired.winsA} - {series.paired.winsB}
                  </Text>
                  <Text style={styles.teamLine}>
                    {series.paired.teamB.displayLabel}
                  </Text>
                  <Text style={styles.meta}>
                    {series.totalGames} maç
                    {series.paired.ties > 0
                      ? ` · ${series.paired.ties} beraberlik`
                      : ''}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Galibiyet sıralaması</Text>
                  {(series.individual ?? []).map((player) => (
                    <Text key={player.nameKey} style={styles.standingLine}>
                      {player.name} — {player.wins} galibiyet
                      {player.sharedWins > 0
                        ? ` · ${player.sharedWins} berabere`
                        : ''}
                      {` · ort. ${Math.round(player.averagePenalty)}`}
                    </Text>
                  ))}
                  <Text style={styles.meta}>
                    {series.totalGames} maç
                    {series.individualTieGames > 0
                      ? ` · ${series.individualTieGames} beraberlik`
                      : ''}
                  </Text>
                </>
              )}
              {series.lastPlayedAt ? (
                <Text style={styles.meta}>
                  Son oyun: {formatSafeDateTime(series.lastPlayedAt)}
                </Text>
              ) : null}
            </View>

            {latestRecord ? (
              <PrimaryButton
                label={playAgainLabel}
                onPress={() => onPlayAgain(latestRecord)}
              />
            ) : null}

            <Text style={styles.sectionHeading}>Geçmiş Oyunlar</Text>
            {rows.map((row) => (
              <View key={row.id} style={styles.gameCard}>
                <Text style={styles.gameDate}>{row.completedAt}</Text>
                <Text style={styles.gameScore}>{row.scoreLine}</Text>
                <Text style={styles.gameOutcome}>{row.outcomeLine}</Text>
                <Text style={styles.gameMeta}>{row.roundsLine}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onOpenGame(row.id)}
                  style={styles.detailLink}
                >
                  <Text style={styles.detailLinkLabel}>Detayı Gör</Text>
                </Pressable>
              </View>
            ))}
          </>
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
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  teamLine: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  scoreLine: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
    color: colors.primary,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  sectionLabel: {
    ...typography.infoLabel,
    color: colors.primary,
  },
  standingLine: {
    ...typography.body,
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionHeading: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  gameCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  gameDate: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  gameScore: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  gameOutcome: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryMuted,
  },
  gameMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailLink: {
    minHeight: 40,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  detailLinkLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
