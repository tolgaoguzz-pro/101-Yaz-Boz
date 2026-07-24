import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { CompletedGameRecord } from '../../domain/completedGame';
import {
  calculateMatchupSeries,
  MatchupSeriesSummary,
} from '../../domain/tournament';
import { listCompletedGamesByMatchup } from '../../persistence/completedGameRepository';
import { resolveGameMode } from '../gameMode';
import {
  buildTournamentGameRow,
  TournamentGameRowModel,
} from '../tournamentPresentation';
import { colors as ui, layout, radii } from '../theme';

type TournamentDetailScreenProps = {
  matchupKey: string;
  onBack: () => void;
  onOpenGame: (gameId: string) => void;
  onPlayAgain: (record: CompletedGameRecord) => void;
};

function averagePenaltyLabel(series: MatchupSeriesSummary): string {
  if (series.individual && series.individual.length > 0) {
    const sum = series.individual.reduce(
      (total, player) => total + player.averagePenalty,
      0,
    );
    return String(Math.round(sum / series.individual.length));
  }

  let sum = 0;
  let count = 0;
  for (const game of series.games) {
    for (const player of game.finalPlayerScores) {
      sum += player.totalScore;
      count += 1;
    }
  }
  return count > 0 ? String(Math.round(sum / count)) : '—';
}

function winnerLabel(outcomeLine: string): string {
  if (outcomeLine.startsWith('Kazanan: ')) {
    return outcomeLine.slice('Kazanan: '.length);
  }
  return outcomeLine;
}

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
          setLatestRecord(summary?.games[0] ?? null);
          setRows((summary?.games ?? []).map(buildTournamentGameRow));
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

  const isIndividual =
    series != null && resolveGameMode(series.gameMode) === 'individual';
  const playAgainLabel = isIndividual
    ? 'Bu Oyuncularla Yeni Oyun'
    : 'Bu Takımlarla Yeni Oyun';

  const tiesCount = useMemo(() => {
    if (!series) {
      return 0;
    }
    if (series.paired) {
      return series.paired.ties;
    }
    return series.individualTieGames;
  }, [series]);

  const avgPenalty = series ? averagePenaltyLabel(series) : '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Turnuva Detayı</Text>
        <View style={styles.backSpacer} />
      </View>

      {loading ? (
        <View style={styles.sheet}>
          <Text style={styles.empty}>Yükleniyor…</Text>
        </View>
      ) : !series ? (
        <View style={styles.sheet}>
          <Text style={styles.empty}>Bu eşleşme için oyun bulunamadı.</Text>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            {series.paired ? (
              <View style={styles.seriesRow}>
                <Text style={styles.teamName} numberOfLines={2}>
                  {series.paired.teamA.displayLabel}
                </Text>
                <Text style={styles.seriesScore}>{series.paired.winsA}</Text>
                <Text style={styles.seriesDash}>—</Text>
                <Text style={styles.seriesScore}>{series.paired.winsB}</Text>
                <Text style={styles.teamName} numberOfLines={2}>
                  {series.paired.teamB.displayLabel}
                </Text>
              </View>
            ) : (
              <View style={styles.seriesRow}>
                <Text style={styles.teamName} numberOfLines={2}>
                  {series.individual?.[0]?.name ?? '—'}
                </Text>
                <Text style={styles.seriesScore}>
                  {series.individual?.[0]?.wins ?? 0}
                </Text>
                <Text style={styles.seriesDash}>—</Text>
                <Text style={styles.seriesScore}>
                  {series.individual?.[1]?.wins ?? 0}
                </Text>
                <Text style={styles.teamName} numberOfLines={2}>
                  {series.individual?.[1]?.name ?? '—'}
                </Text>
              </View>
            )}

            <View style={styles.goldRule} />

            <View style={styles.infoRow}>
              <Text style={styles.infoItem}>
                • Toplam Maç: {series.totalGames}
              </Text>
              <Text style={styles.infoItem}>• Beraberlik: {tiesCount}</Text>
              <Text style={styles.infoItem}>
                • Ortalama Ceza: {avgPenalty}
              </Text>
            </View>
          </View>

          <View style={styles.sheet}>
            <Text style={styles.listTitle}>Geçmiş Maçlar</Text>
            <FlatList
              data={rows}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onOpenGame(item.id)}
                  style={({ pressed }) => [
                    styles.gameRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.gameText}>
                    <Text style={styles.gameDate}>{item.completedAt}</Text>
                    <Text style={styles.gameScore} numberOfLines={1}>
                      {item.scoreLine}
                    </Text>
                    <Text style={styles.gameWinner} numberOfLines={1}>
                      {winnerLabel(item.outcomeLine)}
                    </Text>
                  </View>
                  <Text style={styles.detailLink}>▶ Detayı Gör</Text>
                </Pressable>
              )}
            />

            {latestRecord ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onPlayAgain(latestRecord)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryLabel}>{playAgainLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ui.green,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 40,
  },
  backLabel: {
    fontSize: 32,
    fontWeight: '300',
    color: ui.white,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: ui.white,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 10,
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: ui.white,
    textAlign: 'center',
  },
  seriesScore: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
    color: ui.gold,
    minWidth: 36,
    textAlign: 'center',
  },
  seriesDash: {
    fontSize: 22,
    fontWeight: '700',
    color: ui.gold,
  },
  goldRule: {
    height: 1.5,
    backgroundColor: ui.gold,
    opacity: 0.85,
    marginHorizontal: 24,
  },
  infoRow: {
    gap: 2,
    alignItems: 'center',
  },
  infoItem: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(247, 242, 232, 0.78)',
  },
  sheet: {
    flex: 1,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: ui.green,
    marginBottom: 6,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  gameText: {
    flex: 1,
    gap: 2,
  },
  gameDate: {
    fontSize: 11,
    fontWeight: '500',
    color: ui.textMuted,
  },
  gameScore: {
    fontSize: 14,
    fontWeight: '700',
    color: ui.text,
  },
  gameWinner: {
    fontSize: 13,
    fontWeight: '600',
    color: ui.green,
  },
  detailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: ui.gold,
  },
  primaryButton: {
    minHeight: layout.buttonHeight,
    borderRadius: 10,
    backgroundColor: ui.green,
    borderWidth: 1,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.white,
    textAlign: 'center',
  },
  empty: {
    fontSize: 15,
    fontWeight: '600',
    color: ui.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  pressed: {
    opacity: 0.82,
  },
});
