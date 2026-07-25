import { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CompletedGameRecord } from '../../domain/completedGame';
import { buildAllMatchupSeries } from '../../domain/tournament';
import { listCompletedGames } from '../../persistence/completedGameRepository';

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

type Density = 'normal' | 'compact' | 'ultraCompact';

const palette = {
  background: '#0B3A2D',
  hero: '#0E4938',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelLight: '#EAF1EC',
  panelMuted: '#C9D8CF',
  border: '#B7CBBE',
  accent: '#B58A43',
  textGreen: '#174333',
  textDark: '#142D25',
  white: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.62)',
  rowLine: 'rgba(23,67,51,0.12)',
} as const;

function resolveDensity(height: number): Density {
  if (height >= 900) {
    return 'normal';
  }
  if (height >= 780) {
    return 'compact';
  }
  return 'ultraCompact';
}

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

function formatStat(value: number | null): string {
  return value === null ? '—' : String(value);
}

function BackChevron() {
  return (
    <View style={styles.backChevron} pointerEvents="none">
      <View style={styles.backChevronShape} />
    </View>
  );
}

function MetricIcon({
  kind,
  size,
}: {
  kind: 'avg' | 'low' | 'streak' | 'games';
  size: number;
}) {
  return (
    <View
      style={[
        styles.metricIconWell,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      pointerEvents="none"
    >
      {kind === 'avg' ? (
        <View style={styles.iconBars}>
          <View style={[styles.iconBar, { height: 4 }]} />
          <View style={[styles.iconBar, { height: 8 }]} />
          <View style={[styles.iconBar, { height: 6 }]} />
        </View>
      ) : null}
      {kind === 'low' ? <View style={styles.iconDot} /> : null}
      {kind === 'streak' ? <View style={styles.iconPeak} /> : null}
      {kind === 'games' ? (
        <View style={styles.iconGrid}>
          <View style={styles.iconGridCell} />
          <View style={styles.iconGridCell} />
          <View style={styles.iconGridCell} />
          <View style={styles.iconGridCell} />
        </View>
      ) : null}
    </View>
  );
}

function StatRow({
  label,
  value,
  last = false,
  rowHeight,
  labelSize,
  valueSize,
}: {
  label: string;
  value: string;
  last?: boolean;
  rowHeight: number;
  labelSize: number;
  valueSize: number;
}) {
  return (
    <View style={[styles.row, { height: rowHeight }, last && styles.rowLast]}>
      <Text
        style={[styles.rowLabel, { fontSize: labelSize, lineHeight: labelSize + 2 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[styles.rowValue, { fontSize: valueSize, lineHeight: valueSize + 2 }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export function StatsScreen({ onBack }: StatsScreenProps) {
  const { height } = useWindowDimensions();
  const density = resolveDensity(height);
  const compact = density === 'compact';
  const ultra = density === 'ultraCompact';

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
  const winRate =
    stats && stats.totalGames > 0
      ? Math.round((stats.wins / stats.totalGames) * 100)
      : 0;
  const winRateWidth = `${winRate}%` as `${number}%`;

  const contentGap = ultra ? 4 : compact ? 6 : 8;

  const summaryHeight = ultra ? 60 : compact ? 78 : 96;
  const summaryPadH = ultra ? 8 : compact ? 12 : 14;
  const summaryPadV = ultra ? 6 : compact ? 10 : 14;
  const summaryRadius = ultra ? 15 : compact ? 18 : 20;
  const summaryLabelSize = ultra ? 9 : 11;
  const summaryValueSize = ultra ? 18 : compact ? 24 : 28;

  const detailGap = ultra ? 5 : compact ? 8 : 10;
  const detailHeight = ultra ? 54 : compact ? 72 : 88;
  const detailPadding = ultra ? 6 : compact ? 9 : 12;
  const detailRadius = ultra ? 14 : 16;
  const iconSize = ultra ? 20 : compact ? 26 : 32;
  const detailLabelSize = ultra ? 9 : compact ? 11 : 12;
  const detailValueSize = ultra ? 17 : compact ? 21 : 24;

  const progressHeight = ultra ? 44 : compact ? 56 : 68;
  const progressPadH = ultra ? 8 : compact ? 10 : 12;
  const progressPadV = ultra ? 5 : compact ? 8 : 12;
  const progressRadius = ultra ? 14 : 16;
  const progressTitleSize = ultra ? 11 : compact ? 13 : 15;
  const progressPercentSize = ultra ? 13 : compact ? 16 : 18;
  const progressBarHeight = ultra ? 5 : compact ? 7 : 8;

  const perfPadding = ultra ? 5 : compact ? 8 : 10;
  const perfRadius = ultra ? 14 : 16;
  const perfTitleSize = ultra ? 12 : compact ? 14 : 16;
  const rowHeight = ultra ? 25 : compact ? 34 : 40;
  const rowLabelSize = ultra ? 10 : compact ? 12 : 13;
  const rowValueSize = ultra ? 12 : compact ? 15 : 17;

  const footerHeight = ultra ? 46 : compact ? 58 : 68;
  const buttonHeight = ultra ? 38 : compact ? 44 : 48;
  const buttonRadius = ultra ? 12 : compact ? 14 : 15;
  const buttonFontSize = ultra ? 12 : compact ? 14 : 15;
  const backSize = ultra ? 36 : 40;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.header,
          compact && styles.headerCompact,
          ultra && styles.headerUltra,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            { width: backSize, height: backSize },
            pressed && styles.pressed,
          ]}
        >
          <BackChevron />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
              ultra && styles.titleUltra,
            ]}
          >
            İstatistikler
          </Text>
          {!ultra ? (
            <Text
              style={[styles.subtitle, compact && styles.subtitleCompact]}
            >
              Tüm oyun performansının özeti
            </Text>
          ) : null}
        </View>
        <View style={{ width: backSize }} />
      </View>

      <View style={[styles.content, { gap: contentGap }]}>
        {loading || !stats ? (
          <View style={styles.centeredState}>
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>Yükleniyor…</Text>
            </View>
          </View>
        ) : !hasData ? (
          <View style={styles.centeredState}>
            <View style={styles.statusCard}>
              <Text style={styles.emptyTitle}>Henüz istatistik yok</Text>
              <Text style={styles.emptyBody}>
                Oyun oynadıkça burada performans özetini göreceksin.
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.summaryCard,
                {
                  height: summaryHeight,
                  paddingHorizontal: summaryPadH,
                  paddingVertical: summaryPadV,
                  borderRadius: summaryRadius,
                },
              ]}
            >
              <View style={styles.summaryCol}>
                <Text
                  style={[
                    styles.summaryLabel,
                    {
                      fontSize: summaryLabelSize,
                      lineHeight: summaryLabelSize + 2,
                    },
                  ]}
                >
                  TOPLAM OYUN
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      fontSize: summaryValueSize,
                      lineHeight: summaryValueSize + 3,
                    },
                  ]}
                >
                  {formatStat(stats.totalGames)}
                </Text>
              </View>
              <View style={styles.summaryCol}>
                <Text
                  style={[
                    styles.summaryLabel,
                    {
                      fontSize: summaryLabelSize,
                      lineHeight: summaryLabelSize + 2,
                    },
                  ]}
                >
                  GALİBİYET
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      fontSize: summaryValueSize,
                      lineHeight: summaryValueSize + 3,
                    },
                  ]}
                >
                  {formatStat(stats.wins)}
                </Text>
              </View>
              <View style={styles.summaryCol}>
                <Text
                  style={[
                    styles.summaryLabel,
                    {
                      fontSize: summaryLabelSize,
                      lineHeight: summaryLabelSize + 2,
                    },
                  ]}
                >
                  MAĞLUBİYET
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      fontSize: summaryValueSize,
                      lineHeight: summaryValueSize + 3,
                    },
                  ]}
                >
                  {formatStat(stats.losses)}
                </Text>
              </View>
            </View>

            <View style={[styles.detailGrid, { gap: detailGap }]}>
              {(
                [
                  {
                    key: 'avg',
                    label: 'Ortalama Ceza',
                    value: formatStat(stats.averagePenalty),
                    icon: 'avg' as const,
                  },
                  {
                    key: 'low',
                    label: 'En Düşük Ceza',
                    value: formatStat(stats.lowestPenalty),
                    icon: 'low' as const,
                  },
                  {
                    key: 'streak',
                    label: 'En İyi Seri',
                    value: formatStat(stats.bestSeries),
                    icon: 'streak' as const,
                  },
                  {
                    key: 'games',
                    label: 'Toplam Oyun',
                    value: formatStat(stats.totalGames),
                    icon: 'games' as const,
                  },
                ] as const
              ).map((card) => (
                <View
                  key={card.key}
                  style={[
                    styles.detailCard,
                    {
                      height: detailHeight,
                      padding: detailPadding,
                      borderRadius: detailRadius,
                    },
                  ]}
                >
                  <MetricIcon kind={card.icon} size={iconSize} />
                  <Text
                    style={[
                      styles.detailLabel,
                      {
                        fontSize: detailLabelSize,
                        lineHeight: detailLabelSize + 2,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {card.label}
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        fontSize: detailValueSize,
                        lineHeight: detailValueSize + 3,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {card.value}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.progressCard,
                {
                  height: progressHeight,
                  paddingHorizontal: progressPadH,
                  paddingVertical: progressPadV,
                  borderRadius: progressRadius,
                },
              ]}
            >
              <View style={styles.progressHeader}>
                <Text
                  style={[styles.progressTitle, { fontSize: progressTitleSize }]}
                >
                  Galibiyet Oranı
                </Text>
                <Text
                  style={[
                    styles.progressPercent,
                    { fontSize: progressPercentSize },
                  ]}
                >
                  {winRate}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressTrack,
                  { height: progressBarHeight, marginTop: ultra ? 4 : 6 },
                ]}
              >
                <View style={[styles.progressFill, { width: winRateWidth }]} />
              </View>
            </View>

            <View
              style={[
                styles.performancePanel,
                {
                  padding: perfPadding,
                  borderRadius: perfRadius,
                },
              ]}
            >
              <Text
                style={[
                  styles.performanceTitle,
                  {
                    fontSize: perfTitleSize,
                    marginBottom: ultra ? 2 : 4,
                  },
                ]}
              >
                Performans
              </Text>
              <StatRow
                label="Toplam Oyun"
                value={String(stats.totalGames)}
                rowHeight={rowHeight}
                labelSize={rowLabelSize}
                valueSize={rowValueSize}
              />
              <StatRow
                label="Galibiyet"
                value={String(stats.wins)}
                rowHeight={rowHeight}
                labelSize={rowLabelSize}
                valueSize={rowValueSize}
              />
              <StatRow
                label="Mağlubiyet"
                value={String(stats.losses)}
                rowHeight={rowHeight}
                labelSize={rowLabelSize}
                valueSize={rowValueSize}
              />
              <StatRow
                label="Ortalama Ceza"
                value={formatStat(stats.averagePenalty)}
                rowHeight={rowHeight}
                labelSize={rowLabelSize}
                valueSize={rowValueSize}
              />
              <StatRow
                label="En İyi Seri"
                value={formatStat(stats.bestSeries)}
                rowHeight={rowHeight}
                labelSize={rowLabelSize}
                valueSize={rowValueSize}
              />
              <StatRow
                label="En Düşük Ceza"
                value={formatStat(stats.lowestPenalty)}
                last
                rowHeight={rowHeight}
                labelSize={rowLabelSize}
                valueSize={rowValueSize}
              />
            </View>
          </>
        )}
      </View>

      <View
        style={[
          styles.footer,
          {
            height: footerHeight,
            paddingHorizontal: ultra ? 12 : 14,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              height: buttonHeight,
              borderRadius: buttonRadius,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.primaryLabel, { fontSize: buttonFontSize }]}>
            Ana Sayfa
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    height: 86,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: palette.background,
  },
  headerCompact: {
    height: 72,
    paddingVertical: 6,
  },
  headerUltra: {
    height: 52,
    paddingVertical: 5,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronShape: {
    width: 8,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 2,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 28,
  },
  titleUltra: {
    fontSize: 21,
    lineHeight: 25,
  },
  subtitle: {
    fontSize: 13,
    color: palette.headerSub,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 2,
    justifyContent: 'flex-start',
  },
  summaryCard: {
    backgroundColor: palette.hero,
    borderColor: palette.accent,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  summaryLabel: {
    letterSpacing: 0.8,
    fontWeight: '800',
    color: palette.accent,
    textAlign: 'center',
  },
  summaryValue: {
    fontWeight: '900',
    color: palette.white,
    fontVariant: ['tabular-nums'],
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 2,
  },
  metricIconWell: {
    backgroundColor: palette.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
    height: 8,
  },
  iconBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: palette.dark,
  },
  iconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.dark,
  },
  iconPeak: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: palette.dark,
  },
  iconGrid: {
    width: 10,
    height: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  iconGridCell: {
    width: 4,
    height: 4,
    borderRadius: 0.5,
    backgroundColor: palette.dark,
  },
  detailLabel: {
    fontWeight: '700',
    color: palette.textGreen,
  },
  detailValue: {
    fontWeight: '900',
    color: palette.textDark,
    fontVariant: ['tabular-nums'],
  },
  progressCard: {
    backgroundColor: palette.panelLight,
    borderColor: palette.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    fontWeight: '800',
    color: palette.textGreen,
  },
  progressPercent: {
    fontWeight: '900',
    color: palette.textDark,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    borderRadius: 3,
    backgroundColor: palette.panelMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.dark,
  },
  performancePanel: {
    flexShrink: 1,
    backgroundColor: palette.panelLight,
    borderColor: palette.border,
    borderWidth: 1,
  },
  performanceTitle: {
    fontWeight: '900',
    color: palette.textGreen,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.rowLine,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontWeight: '700',
    color: palette.textGreen,
  },
  rowValue: {
    fontWeight: '900',
    color: palette.textDark,
    fontVariant: ['tabular-nums'],
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textGreen,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(23,67,51,0.60)',
    textAlign: 'center',
  },
  footer: {
    paddingTop: 3,
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  primaryButton: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontWeight: '800',
    color: palette.dark,
  },
  pressed: {
    opacity: 0.82,
  },
});
