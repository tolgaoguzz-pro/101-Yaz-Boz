import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

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

type TournamentDetailScreenProps = {
  matchupKey: string;
  onBack: () => void;
  onOpenGame: (gameId: string) => void;
  onPlayAgain: (record: CompletedGameRecord) => void;
};

type Density = 'normal' | 'compact' | 'ultraCompact';

const palette = {
  background: '#0B3A2D',
  hero: '#0E4938',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelLight: '#EAF1EC',
  border: '#B7CBBE',
  accent: '#B58A43',
  textGreen: '#174333',
  textDark: '#142D25',
  textMuted: 'rgba(23,67,51,0.62)',
  metaMuted: 'rgba(23,67,51,0.58)',
  white: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.62)',
} as const;

function resolveDensity(height: number): Density {
  if (height >= 800) {
    return 'normal';
  }
  if (height >= 700) {
    return 'compact';
  }
  return 'ultraCompact';
}

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

function BackChevron() {
  return (
    <View style={styles.backChevron} pointerEvents="none">
      <View style={styles.backChevronShape} />
    </View>
  );
}

function VsBadge({ size }: { size: number }) {
  return (
    <View
      style={[
        styles.vsBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={styles.vsLabel}>VS</Text>
    </View>
  );
}

export function TournamentDetailScreen({
  matchupKey,
  onBack,
  onOpenGame,
  onPlayAgain,
}: TournamentDetailScreenProps) {
  const { height } = useWindowDimensions();
  const density = resolveDensity(height);
  const compact = density === 'compact';
  const ultra = density === 'ultraCompact';

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

  const leftName = series?.paired
    ? series.paired.teamA.displayLabel
    : (series?.individual?.[0]?.name ?? '—');
  const rightName = series?.paired
    ? series.paired.teamB.displayLabel
    : (series?.individual?.[1]?.name ?? '—');
  const leftWins = series?.paired
    ? series.paired.winsA
    : (series?.individual?.[0]?.wins ?? 0);
  const rightWins = series?.paired
    ? series.paired.winsB
    : (series?.individual?.[1]?.wins ?? 0);

  const vsSize = ultra ? 40 : compact ? 44 : 48;
  const nameSize = ultra ? 18 : compact ? 20 : 22;
  const seriesScoreSize = ultra ? 28 : compact ? 30 : 34;
  const heroPadding = ultra ? 14 : compact ? 16 : 18;
  const gameCardPadding = ultra ? 12 : compact ? 14 : 16;

  const listHeader = series ? (
    <View>
      <View style={[styles.heroCard, { padding: heroPadding }]}>
        <Text style={styles.heroKicker}>TURNUVA SERİSİ</Text>
        <View style={styles.heroNames}>
          <Text
            style={[styles.heroName, { fontSize: nameSize }]}
            numberOfLines={2}
          >
            {leftName}
          </Text>
          <VsBadge size={vsSize} />
          <Text
            style={[styles.heroName, { fontSize: nameSize }]}
            numberOfLines={2}
          >
            {rightName}
          </Text>
        </View>
        <Text
          style={[
            styles.seriesScore,
            { fontSize: seriesScoreSize, lineHeight: seriesScoreSize + 4 },
          ]}
        >
          {leftWins} — {rightWins}
        </Text>
      </View>

      <View
        style={[
          styles.statsCard,
          compact && styles.statsCardCompact,
          ultra && styles.statsCardUltra,
        ]}
      >
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Toplam Maç</Text>
          <Text
            style={[
              styles.statValue,
              ultra && styles.statValueUltra,
              compact && !ultra && styles.statValueCompact,
            ]}
          >
            {series.totalGames}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Beraberlik</Text>
          <Text
            style={[
              styles.statValue,
              ultra && styles.statValueUltra,
              compact && !ultra && styles.statValueCompact,
            ]}
          >
            {tiesCount}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Ort. Ceza</Text>
          <Text
            style={[
              styles.statValue,
              ultra && styles.statValueUltra,
              compact && !ultra && styles.statValueCompact,
            ]}
          >
            {avgPenalty}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.sectionTitle,
          compact && styles.sectionTitleCompact,
          ultra && styles.sectionTitleUltra,
        ]}
      >
        GEÇMİŞ MAÇLAR
      </Text>
    </View>
  ) : null;

  const listFooter = latestRecord ? (
    <View
      style={[
        styles.replayCard,
        compact && styles.replayCardCompact,
        ultra && styles.replayCardUltra,
      ]}
    >
      <Text style={styles.replayTitle}>Bu seriyi yeniden oyna</Text>
      <Text style={styles.replayBody}>
        Aynı oyuncularla yeni bir seri başlat.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => onPlayAgain(latestRecord)}
        style={({ pressed }) => [
          styles.replayButton,
          ultra && styles.replayButtonUltra,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.replayButtonLabel}>{playAgainLabel}</Text>
      </Pressable>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, ultra && styles.headerUltra]}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <BackChevron />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.headerTitle,
              compact && styles.headerTitleCompact,
              ultra && styles.headerTitleUltra,
            ]}
          >
            Turnuva Detayı
          </Text>
          {!ultra ? (
            <Text style={styles.headerSubtitle}>Serinin tüm maç geçmişi</Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centeredState}>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>Yükleniyor…</Text>
          </View>
        </View>
      ) : !series ? (
        <View style={styles.centeredState}>
          <View style={styles.statusCard}>
            <Text style={styles.emptyTitle}>Turnuva bulunamadı</Text>
            <Text style={styles.emptyBody}>
              Bu eşleşmeye ait tamamlanmış maç yok.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.panel}>
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            renderItem={({ item }) => {
              const winner = winnerLabel(item.outcomeLine);
              const showWinnerBadge =
                winner !== 'Berabere' &&
                winner.trim().length > 0 &&
                item.outcomeLine.startsWith('Kazanan: ');

              return (
                <View
                  style={[
                    styles.gameCard,
                    { padding: gameCardPadding },
                    ultra && styles.gameCardUltra,
                  ]}
                >
                  <View style={styles.gameTopRow}>
                    <Text style={styles.gameDate}>{item.completedAt}</Text>
                    {showWinnerBadge ? (
                      <View style={styles.winnerBadge}>
                        <Text style={styles.winnerBadgeText} numberOfLines={1}>
                          {winner}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.gameScore,
                      ultra && styles.gameScoreUltra,
                      compact && !ultra && styles.gameScoreCompact,
                    ]}
                    numberOfLines={2}
                  >
                    {item.scoreLine}
                  </Text>
                  <Text style={styles.gameWinnerLine} numberOfLines={1}>
                    {winner}
                  </Text>

                  <View style={styles.gameBottomRow}>
                    {item.roundsLine ? (
                      <Text style={styles.roundsText}>{item.roundsLine}</Text>
                    ) : (
                      <View />
                    )}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onOpenGame(item.id)}
                      style={({ pressed }) => [
                        styles.detailButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.detailButtonLabel}>Detayı Gör</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: palette.background,
  },
  headerUltra: {
    paddingBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  backChevron: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronShape: {
    width: 10,
    height: 10,
    borderLeftWidth: 2.2,
    borderBottomWidth: 2.2,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
  },
  headerTitleCompact: {
    fontSize: 27,
  },
  headerTitleUltra: {
    fontSize: 25,
  },
  headerSubtitle: {
    fontSize: 14,
    color: palette.headerSub,
    textAlign: 'center',
  },
  panel: {
    flex: 1,
    backgroundColor: palette.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: palette.hero,
    borderColor: palette.accent,
    borderWidth: 1.5,
    borderRadius: 24,
    marginBottom: 12,
    gap: 12,
  },
  heroKicker: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: palette.accent,
    textAlign: 'center',
  },
  heroNames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroName: {
    flex: 1,
    fontWeight: '900',
    color: palette.white,
    textAlign: 'center',
  },
  vsBadge: {
    backgroundColor: palette.dark,
    borderColor: palette.accent,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsLabel: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  seriesScore: {
    fontWeight: '900',
    color: palette.white,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  statsCard: {
    backgroundColor: palette.panel,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statsCardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statsCardUltra: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(23,67,51,0.14)',
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 11,
    color: palette.metaMuted,
    fontWeight: '700',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: palette.textDark,
    fontVariant: ['tabular-nums'],
  },
  statValueCompact: {
    fontSize: 20,
  },
  statValueUltra: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.textGreen,
    marginBottom: 10,
  },
  sectionTitleCompact: {
    fontSize: 17,
  },
  sectionTitleUltra: {
    fontSize: 16,
    marginBottom: 8,
  },
  gameCard: {
    backgroundColor: palette.panelLight,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 10,
    gap: 8,
  },
  gameCardUltra: {
    marginBottom: 8,
  },
  gameTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gameDate: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: palette.metaMuted,
  },
  winnerBadge: {
    backgroundColor: palette.panel,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '55%',
  },
  winnerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textGreen,
  },
  gameScore: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.textDark,
    textAlign: 'center',
  },
  gameScoreCompact: {
    fontSize: 25,
  },
  gameScoreUltra: {
    fontSize: 22,
  },
  gameWinnerLine: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
  },
  gameBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 10,
  },
  roundsText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: palette.textGreen,
  },
  detailButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.dark,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.white,
  },
  replayCard: {
    backgroundColor: palette.panel,
    borderRadius: 18,
    padding: 18,
    marginTop: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  replayCardCompact: {
    padding: 16,
  },
  replayCardUltra: {
    padding: 14,
  },
  replayTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.textGreen,
  },
  replayBody: {
    fontSize: 13,
    color: palette.textMuted,
    lineHeight: 18,
  },
  replayButton: {
    marginTop: 6,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: palette.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  replayButtonUltra: {
    minHeight: 48,
  },
  replayButtonLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  statusCard: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    maxWidth: 360,
    width: '100%',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textGreen,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
