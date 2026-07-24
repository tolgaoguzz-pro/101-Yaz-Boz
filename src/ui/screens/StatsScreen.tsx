import { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CompletedGameRecord } from '../../domain/completedGame';
import { buildAllMatchupSeries } from '../../domain/tournament';
import { listCompletedGames } from '../../persistence/completedGameRepository';
import { colors as ui, layout, radii } from '../theme';

type StatsScreenProps = {
  onBack: () => void;
};

type StatsModel = {
  totalGames: number;
  wins: number;
  losses: number;
  averagePenalty: number | null;
  bestSeries: number | null;
  lowestPenalty: number | null;
};

function buildStats(games: CompletedGameRecord[]): StatsModel {
  const seriesList = buildAllMatchupSeries(games);

  let wins = 0;
  let losses = 0;
  let penaltySum = 0;
  let penaltyCount = 0;
  let lowestPenalty: number | null = null;
  let bestSeries: number | null = null;

  for (const game of games) {
    if (!game.resultSummary.isTie) {
      wins += 1;
      losses += 1;
    }
    for (const player of game.finalPlayerScores) {
      penaltySum += player.totalScore;
      penaltyCount += 1;
      if (lowestPenalty === null || player.totalScore < lowestPenalty) {
        lowestPenalty = player.totalScore;
      }
    }
  }

  for (const series of seriesList) {
    if (series.paired) {
      const streak = Math.max(series.paired.winsA, series.paired.winsB);
      if (bestSeries === null || streak > bestSeries) {
        bestSeries = streak;
      }
    } else {
      for (const player of series.individual ?? []) {
        if (bestSeries === null || player.wins > bestSeries) {
          bestSeries = player.wins;
        }
      }
    }
  }

  return {
    totalGames: games.length,
    wins,
    losses,
    averagePenalty:
      penaltyCount > 0 ? Math.round(penaltySum / penaltyCount) : null,
    bestSeries,
    lowestPenalty,
  };
}

function StatRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function StatsScreen({ onBack }: StatsScreenProps) {
  const [stats, setStats] = useState<StatsModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const games = await listCompletedGames();
        if (!cancelled) {
          setStats(buildStats(games));
        }
      } catch (error) {
        console.warn('[ui] StatsScreen load failed', error);
        if (!cancelled) {
          setStats({
            totalGames: 0,
            wins: 0,
            losses: 0,
            averagePenalty: null,
            bestSeries: null,
            lowestPenalty: null,
          });
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

  const hasData = (stats?.totalGames ?? 0) > 0;

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
        <View style={styles.titleBlock}>
          <Text style={styles.title}>İSTATİSTİKLER</Text>
          <View style={styles.goldRule} />
        </View>
        <View style={styles.backSpacer} />
      </View>

      <View style={styles.sheet}>
        {loading || !stats ? (
          <Text style={styles.empty}>Yükleniyor…</Text>
        ) : !hasData ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.empty}>
              İstatistikler oyun oynandıkça oluşacaktır.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.panel}>
              <StatRow label="Toplam Oyun" value={String(stats.totalGames)} />
              <StatRow label="Galibiyet" value={String(stats.wins)} />
              <StatRow label="Mağlubiyet" value={String(stats.losses)} />
              <StatRow
                label="Ortalama Ceza"
                value={
                  stats.averagePenalty === null
                    ? '—'
                    : String(stats.averagePenalty)
                }
              />
              <StatRow
                label="En İyi Seri"
                value={
                  stats.bestSeries === null ? '—' : String(stats.bestSeries)
                }
              />
              <StatRow
                label="En Düşük Ceza"
                value={
                  stats.lowestPenalty === null
                    ? '—'
                    : String(stats.lowestPenalty)
                }
                last
              />
            </View>
          </ScrollView>
        )}

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>Ana Sayfa</Text>
          </Pressable>
        </View>
      </View>
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
    minHeight: layout.headerMinHeight,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  backButton: {
    width: layout.headerIcon,
    height: layout.headerIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: layout.headerIcon,
  },
  backLabel: {
    fontSize: 30,
    fontWeight: '300',
    color: ui.white,
    marginTop: -2,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.white,
  },
  goldRule: {
    width: 40,
    height: 1.5,
    backgroundColor: ui.gold,
    borderRadius: 1,
    marginTop: 2,
  },
  sheet: {
    flex: 1,
    backgroundColor: ui.cream,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listScroll: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    flexGrow: 1,
  },
  panel: {
    backgroundColor: ui.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: ui.gold,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ui.text,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '800',
    color: ui.green,
  },
  emptyBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  empty: {
    fontSize: 15,
    fontWeight: '600',
    color: ui.textMuted,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
  },
  primaryButton: {
    minHeight: layout.buttonHeight,
    borderRadius: 10,
    backgroundColor: ui.green,
    borderWidth: 1,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
