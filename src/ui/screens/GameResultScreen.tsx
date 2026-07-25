import { useMemo } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { calculateGameResult } from '../gameResult';
import { formatSafeDateTime } from '../tournamentPresentation';
import { ActiveGameData, SavedRoundSummary } from './ActiveGameScreen';

type GameResultScreenProps = {
  game: ActiveGameData;
  seriesSummaryLine?: string | null;
  onRematch: () => void;
  onViewTournament: () => void;
  onHome: () => void;
};

type Density = 'normal' | 'compact' | 'ultraCompact';

const palette = {
  background: '#083428',
  darkSurface: '#0E4938',
  panel: '#DCE7DF',
  panelLight: '#EAF1EC',
  panelMuted: '#C9D8CF',
  border: '#B7CBBE',
  borderStrong: '#AFC5B8',
  textDark: '#142D25',
  textGreen: '#174333',
  accent: '#D9A63C',
  accentSoft: '#F2C75D',
  positive: '#0D684B',
  negative: '#B3261E',
  negativeSurface: '#F0D7D4',
  loseBorder: '#D8A6A0',
  loseText: '#7F2721',
  winBadgeBg: '#F5E7B8',
  loseBadgeBg: '#F3D2CF',
  loseBadgeText: '#9A2D26',
  badgeText: '#72531F',
  white: '#FFFFFF',
  scoreBadgeText: '#2D361D',
  iconWell: '#D3E2D8',
  headerSub: 'rgba(255,255,255,0.72)',
  mutedGreen: 'rgba(23,67,51,0.62)',
  rowLine: 'rgba(23,67,51,0.12)',
  cancelBorder: 'rgba(255,255,255,0.62)',
  metaLine: 'rgba(255,255,255,0.56)',
} as const;

function resolveDensity(height: number): Density {
  if (height >= 850) {
    return 'normal';
  }
  if (height >= 700) {
    return 'compact';
  }
  return 'ultraCompact';
}

function resolveIndividualDensity(height: number): 'normal' | 'compact' {
  return height >= 850 ? 'normal' : 'compact';
}

function formatSignedScore(score: number): string {
  if (score > 0) {
    return `+${score}`;
  }
  return String(score);
}

function teammateName(
  game: ActiveGameData,
  playerId: string,
): string | null {
  for (const team of game.teams) {
    const match = team.players.find((player) => player.id === playerId);
    if (!match) {
      continue;
    }
    const other = team.players.find((player) => player.id !== playerId);
    return other?.name ?? null;
  }
  return null;
}

function countHandStyleFinishes(rounds: SavedRoundSummary[]): number | null {
  if (!rounds.length) {
    return null;
  }
  let seenFinishType = false;
  let count = 0;
  for (const round of rounds) {
    if (round.finishType == null) {
      continue;
    }
    seenFinishType = true;
    if (
      round.finishType === 'fromHand' ||
      round.finishType === 'fromHandAndOkey'
    ) {
      count += 1;
    }
  }
  return seenFinishType ? count : null;
}

function highestRoundPlayerScore(rounds: SavedRoundSummary[]): number | null {
  if (!rounds.length) {
    return null;
  }
  let max: number | null = null;
  for (const round of rounds) {
    for (const entry of round.players ?? []) {
      if (typeof entry.score !== 'number') {
        continue;
      }
      max = max === null ? entry.score : Math.max(max, entry.score);
    }
  }
  return max;
}

function formatDurationLabel(
  startedAt: string | undefined,
  completedAt: string | undefined,
): string | null {
  if (!startedAt || !completedAt) {
    return null;
  }
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }
  const totalSeconds = Math.floor((end - start) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours} sa ${minutes} dk`;
  }
  if (minutes > 0) {
    return `${minutes} dk ${seconds} sn`;
  }
  return `${seconds} sn`;
}

function buildMetaLine(game: ActiveGameData): string | null {
  const duration = formatDurationLabel(game.startedAt, game.completedAt);
  const completedLabel = formatSafeDateTime(game.completedAt);
  if (!duration && !completedLabel) {
    return null;
  }
  if (duration && completedLabel) {
    return `Oyun Süresi: ${duration} · ${completedLabel}`;
  }
  if (duration) {
    return `Oyun Süresi: ${duration}`;
  }
  return completedLabel;
}

function DiceIcon({ size }: { size: number }) {
  const face = Math.max(12, Math.round(size * 0.55));
  const dot = Math.max(2, Math.round(size * 0.1));
  return (
    <View style={[styles.summaryIconWell, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.diceFace, { width: face, height: face }]}>
        <View style={[styles.diceDot, { width: dot, height: dot, borderRadius: dot / 2, top: 2, left: 2 }]} />
        <View style={[styles.diceDot, { width: dot, height: dot, borderRadius: dot / 2, top: 2, right: 2 }]} />
        <View style={[styles.diceDot, { width: dot, height: dot, borderRadius: dot / 2, bottom: 2, left: 2 }]} />
        <View style={[styles.diceDot, { width: dot, height: dot, borderRadius: dot / 2, bottom: 2, right: 2 }]} />
      </View>
    </View>
  );
}

function TargetIcon({ size }: { size: number }) {
  const outer = Math.max(12, Math.round(size * 0.55));
  const mid = Math.max(7, Math.round(size * 0.3));
  const core = Math.max(3, Math.round(size * 0.12));
  return (
    <View style={[styles.summaryIconWell, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.targetOuter, { width: outer, height: outer, borderRadius: outer / 2 }]}>
        <View style={[styles.targetMid, { width: mid, height: mid, borderRadius: mid / 2 }]}>
          <View style={[styles.targetCore, { width: core, height: core, borderRadius: core / 2 }]} />
        </View>
      </View>
    </View>
  );
}

function PeakIcon({ size }: { size: number }) {
  return (
    <View style={[styles.summaryIconWell, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={styles.peakBars}>
        <View style={[styles.peakBar, styles.peakBarShort]} />
        <View style={[styles.peakBar, styles.peakBarTall]} />
        <View style={[styles.peakBar, styles.peakBarMid]} />
      </View>
    </View>
  );
}

function CelebrateIcon({ size }: { size: number }) {
  return (
    <View
      style={[
        styles.celebrateIcon,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      pointerEvents="none"
    >
      <View style={styles.celebrateCore} />
      <View style={[styles.celebrateSpark, styles.celebrateSpark1]} />
      <View style={[styles.celebrateSpark, styles.celebrateSpark2]} />
      <View style={[styles.celebrateDot, styles.celebrateDot1]} />
    </View>
  );
}

export function GameResultScreen({
  game,
  seriesSummaryLine: _seriesSummaryLine,
  onRematch,
  onViewTournament,
  onHome,
}: GameResultScreenProps) {
  const { height } = useWindowDimensions();
  const result = useMemo(() => calculateGameResult(game), [game]);
  const isIndividual = result.mode === 'individual';
  const density = isIndividual
    ? resolveIndividualDensity(height)
    : resolveDensity(height);
  const compact = density === 'compact';
  const ultra = !isIndividual && density === 'ultraCompact';
  const isTie = result.isTie;

  const handFinishCount = useMemo(
    () => countHandStyleFinishes(game.rounds ?? []),
    [game.rounds],
  );
  const highestHand = useMemo(
    () => highestRoundPlayerScore(game.rounds ?? []),
    [game.rounds],
  );
  const metaLine = useMemo(() => buildMetaLine(game), [game]);

  const winnerNameBlock = (() => {
    if (isIndividual) {
      if (result.individualWinner?.kind === 'tie') {
        return result.individualWinner.players.map((row) => row.name).join('\n');
      }
      if (result.individualWinner?.kind === 'winner') {
        return result.individualWinner.name;
      }
      return '—';
    }
    if (result.pairedWinner?.kind === 'tie') {
      return `${result.pairedWinner.team1Name}\n${result.pairedWinner.team2Name}`;
    }
    if (result.pairedWinner?.kind === 'winner') {
      return result.pairedWinner.teamName;
    }
    return '—';
  })();

  const winnerScoreValue = (() => {
    if (isIndividual) {
      if (result.individualWinner?.kind === 'winner') {
        return result.individualWinner.totalScore;
      }
      if (result.individualWinner?.kind === 'tie') {
        return result.individualWinner.players[0]?.totalScore ?? 0;
      }
      return 0;
    }
    if (result.pairedWinner?.kind === 'winner') {
      return result.pairedWinner.teamScore;
    }
    if (result.pairedWinner?.kind === 'tie') {
      return result.pairedWinner.team1Score;
    }
    return 0;
  })();

  const winnerTeamName =
    !isIndividual && result.pairedWinner?.kind === 'winner'
      ? result.pairedWinner.teamName
      : null;

  const winnerKicker = isIndividual
    ? isTie
      ? 'ORTAK BİRİNCİLER'
      : 'KAZANAN OYUNCU'
    : isTie
      ? 'BERABERE'
      : 'KAZANAN TAKIM';

  const trophySize = isIndividual
    ? compact
      ? 74
      : 82
    : ultra
      ? 66
      : compact
        ? 74
        : 82;
  const winnerMinHeight = isIndividual
    ? 112
    : ultra
      ? 94
      : compact
        ? 102
        : 112;
  const scoreBadgeMinWidth = ultra ? 80 : compact ? 88 : 96;
  const rowHeight = isIndividual
    ? 54
    : ultra
      ? 38
      : compact
        ? 42
        : 46;
  const avatarSize = ultra ? 28 : compact ? 31 : 34;
  const teamCardMinHeight = ultra ? 66 : compact ? 74 : 82;
  const summaryColMinHeight = isIndividual
    ? 72
    : ultra
      ? 44
      : compact
        ? 50
        : 56;
  const iconSize = ultra ? 22 : compact ? 25 : 28;
  const celebrateMinHeight = isIndividual
    ? 54
    : ultra
      ? 34
      : compact
        ? 38
        : 42;
  const buttonHeight = isIndividual ? 52 : ultra ? 42 : compact ? 44 : 48;

  const summaryItems: {
    key: string;
    label: string;
    value: string;
    icon: 'dice' | 'target' | 'peak';
  }[] = [
    {
      key: 'played',
      label: 'Oynanan El',
      value: String(result.playedRounds),
      icon: 'dice',
    },
    {
      key: 'hand',
      label: 'Kafadan Bitiren',
      value: handFinishCount == null ? '—' : String(handFinishCount),
      icon: 'target',
    },
    {
      key: 'high',
      label: 'En Yüksek El',
      value: highestHand == null ? '—' : formatSignedScore(highestHand),
      icon: 'peak',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={[styles.content, isIndividual && styles.contentIndividual]}>
          <View style={[styles.header, compact && styles.headerCompact, ultra && styles.headerUltra]}>
            <Text
              style={[
                styles.title,
                compact && styles.titleCompact,
                ultra && styles.titleUltra,
              ]}
            >
              Oyun Bitti
            </Text>
            <Text
              style={[
                styles.subtitle,
                compact && styles.subtitleCompact,
                ultra && styles.subtitleUltra,
              ]}
            >
              Tebrikler! Harika bir oyun oynadınız.
            </Text>
          </View>

          <View
            style={[
              styles.winnerCard,
              { minHeight: winnerMinHeight },
              isIndividual && styles.winnerCardIndividual,
            ]}
          >
            <Image
              source={require('../../../assets/images/winner-trophy.png')}
              style={{ width: trophySize, height: trophySize }}
              resizeMode="contain"
            />
            <View style={styles.winnerInfo}>
              <Text style={styles.winnerKicker}>{winnerKicker}</Text>
              <Text
                style={[
                  styles.winnerName,
                  compact && styles.winnerNameCompact,
                  ultra && styles.winnerNameUltra,
                ]}
                numberOfLines={2}
              >
                {winnerNameBlock}
              </Text>
            </View>
            <View style={[styles.scoreBadge, { minWidth: scoreBadgeMinWidth }]}>
              <Text
                style={[
                  styles.scoreBadgeText,
                  compact && styles.scoreBadgeTextCompact,
                  ultra && styles.scoreBadgeTextUltra,
                ]}
              >
                {formatSignedScore(winnerScoreValue)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.scoresPanel,
              isIndividual && styles.scoresPanelIndividual,
            ]}
          >
            <Text
              style={[
                styles.panelTitle,
                compact && styles.panelTitleCompact,
                ultra && styles.panelTitleUltra,
              ]}
            >
              SON SKORLAR
            </Text>
            {result.standings.map((row, index) => {
              const partner = !isIndividual
                ? teammateName(game, row.playerId)
                : null;
              const isLast = index === result.standings.length - 1;
              const scorePositive = row.totalScore > 0;
              const scoreNegative = row.totalScore < 0;
              return (
                <View
                  key={row.playerId}
                  style={[
                    styles.standingRow,
                    { height: rowHeight },
                    isLast && styles.standingRowLast,
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarSize / 2,
                      },
                    ]}
                  >
                    <Text style={styles.avatarLetter}>
                      {(row.name.trim().charAt(0) || '?').toLocaleUpperCase(
                        'tr-TR',
                      )}
                    </Text>
                  </View>
                  <View style={styles.standingMid}>
                    <Text
                      style={[
                        styles.standingName,
                        compact && styles.standingNameCompact,
                        ultra && styles.standingNameUltra,
                      ]}
                      numberOfLines={1}
                    >
                      {row.name}
                    </Text>
                    {partner ? (
                      <Text
                        style={[
                          styles.standingSub,
                          compact && styles.standingSubCompact,
                          ultra && styles.standingSubUltra,
                        ]}
                        numberOfLines={1}
                      >
                        {partner} ile takım
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.standingScore,
                      compact && styles.standingScoreCompact,
                      ultra && styles.standingScoreUltra,
                      scorePositive && styles.scorePositive,
                      scoreNegative && styles.scoreNegative,
                      !scorePositive && !scoreNegative && styles.scoreNeutral,
                    ]}
                  >
                    {formatSignedScore(row.totalScore)}
                  </Text>
                </View>
              );
            })}
          </View>

          {!isIndividual ? (
            <View style={styles.teamsPanel}>
              <Text
                style={[
                  styles.panelTitle,
                  compact && styles.panelTitleCompact,
                  ultra && styles.panelTitleUltra,
                  styles.teamsTitle,
                ]}
              >
                TAKIM TOPLAMLARI
              </Text>
              <View style={styles.teamsRow}>
                {game.teams.map((team) => {
                  const won =
                    winnerTeamName != null && team.name === winnerTeamName;
                  const lost = !isTie && winnerTeamName != null && !won;
                  return (
                    <View
                      key={team.name}
                      style={[
                        styles.teamCard,
                        { minHeight: teamCardMinHeight },
                        won && styles.teamCardWin,
                        lost && styles.teamCardLose,
                        isTie && styles.teamCardTie,
                      ]}
                    >
                      <Text
                        style={[
                          styles.teamCardName,
                          compact && styles.teamCardNameCompact,
                          ultra && styles.teamCardNameUltra,
                          lost && styles.teamCardNameLose,
                        ]}
                        numberOfLines={1}
                      >
                        {team.name}
                      </Text>
                      <Text
                        style={[
                          styles.teamCardScore,
                          compact && styles.teamCardScoreCompact,
                          ultra && styles.teamCardScoreUltra,
                          won && styles.scorePositive,
                          lost && styles.scoreNegative,
                          isTie && styles.scoreNeutral,
                        ]}
                      >
                        {formatSignedScore(team.totalScore)}
                      </Text>
                      {!isTie ? (
                        <View
                          style={[
                            styles.teamBadge,
                            won ? styles.teamBadgeWin : styles.teamBadgeLose,
                          ]}
                        >
                          <Text
                            style={[
                              styles.teamBadgeText,
                              won
                                ? styles.teamBadgeTextWin
                                : styles.teamBadgeTextLose,
                            ]}
                          >
                            {won ? 'Kazandı' : 'Kaybetti'}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.summaryPanel,
              isIndividual && styles.summaryPanelIndividual,
            ]}
          >
            <Text
              style={[
                styles.summaryTitle,
                compact && styles.summaryTitleCompact,
                ultra && styles.summaryTitleUltra,
                isIndividual && styles.summaryTitleIndividual,
              ]}
            >
              OYUN ÖZETİ
            </Text>
            <View style={styles.summaryRow}>
              {summaryItems.map((item, index) => (
                <View
                  key={item.key}
                  style={[styles.summaryCol, { minHeight: summaryColMinHeight }]}
                >
                  {index > 0 ? <View style={styles.summaryDivider} /> : null}
                  <View style={styles.summaryInner}>
                    {item.icon === 'dice' ? (
                      <DiceIcon size={iconSize} />
                    ) : item.icon === 'target' ? (
                      <TargetIcon size={iconSize} />
                    ) : (
                      <PeakIcon size={iconSize} />
                    )}
                    <Text
                      style={[
                        styles.summaryLabel,
                        compact && styles.summaryLabelCompact,
                        ultra && styles.summaryLabelUltra,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        compact && styles.summaryValueCompact,
                        ultra && styles.summaryValueUltra,
                      ]}
                    >
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.celebrateCard, { minHeight: celebrateMinHeight }]}>
              <CelebrateIcon size={ultra ? 18 : 20} />
              <View style={styles.celebrateText}>
                <Text
                  style={[
                    styles.celebrateTitle,
                    compact && styles.celebrateTitleCompact,
                    ultra && styles.celebrateTitleUltra,
                  ]}
                >
                  Harika bir oyun oldu!
                </Text>
                <Text
                  style={[
                    styles.celebrateSub,
                    compact && styles.celebrateSubCompact,
                    ultra && styles.celebrateSubUltra,
                  ]}
                >
                  Yeni oyunda görüşmek üzere.
                </Text>
              </View>
            </View>
          </View>

          {metaLine ? <Text style={styles.metaLine}>{metaLine}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={onViewTournament}
            style={({ pressed }) => [
              styles.tournamentLink,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.tournamentLabel}>Turnuva Geçmişi</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onHome}
            style={({ pressed }) => [
              styles.homeButton,
              { height: buttonHeight },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.homeLabel,
                compact && styles.footerLabelCompact,
                ultra && styles.footerLabelUltra,
              ]}
            >
              Ana Sayfaya Dön
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onRematch}
            style={({ pressed }) => [
              styles.newGameButton,
              { height: buttonHeight },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.newGameLabel,
                compact && styles.footerLabelCompact,
                ultra && styles.footerLabelUltra,
              ]}
            >
              Yeni Oyun Başlat
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  contentIndividual: {
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  header: {
    height: 90,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  headerCompact: {
    height: 84,
  },
  headerUltra: {
    height: 82,
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
    color: palette.white,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 25,
    lineHeight: 30,
  },
  titleUltra: {
    fontSize: 23,
    lineHeight: 27,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: palette.headerSub,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  subtitleUltra: {
    fontSize: 12,
    lineHeight: 15,
  },
  winnerCard: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.darkSurface,
    borderColor: palette.accent,
    borderWidth: 1.5,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  winnerCardIndividual: {
    marginBottom: 10,
  },
  winnerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  winnerKicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: palette.accent,
  },
  winnerName: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: palette.white,
  },
  winnerNameCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  winnerNameUltra: {
    fontSize: 20,
    lineHeight: 24,
  },
  scoreBadge: {
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.accent,
    borderColor: palette.accentSoft,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  scoreBadgeText: {
    fontSize: 22,
    fontWeight: '900',
    color: palette.scoreBadgeText,
    fontVariant: ['tabular-nums'],
  },
  scoreBadgeTextCompact: {
    fontSize: 20,
  },
  scoreBadgeTextUltra: {
    fontSize: 18,
  },
  scoresPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: palette.panelLight,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
  },
  scoresPanelIndividual: {
    marginTop: 0,
    paddingVertical: 10,
    marginBottom: 0,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: palette.textGreen,
    textAlign: 'center',
    marginBottom: 4,
  },
  panelTitleCompact: {
    fontSize: 16,
  },
  panelTitleUltra: {
    fontSize: 15,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: palette.rowLine,
    borderBottomWidth: 1,
    gap: 8,
  },
  standingRowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    backgroundColor: palette.positive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '900',
    color: palette.white,
  },
  standingMid: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  standingName: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.textGreen,
  },
  standingNameCompact: {
    fontSize: 13,
  },
  standingNameUltra: {
    fontSize: 12,
  },
  standingSub: {
    fontSize: 11,
    color: palette.mutedGreen,
  },
  standingSubCompact: {
    fontSize: 10,
  },
  standingSubUltra: {
    fontSize: 9,
  },
  standingScore: {
    fontSize: 19,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  standingScoreCompact: {
    fontSize: 17,
  },
  standingScoreUltra: {
    fontSize: 16,
  },
  scorePositive: {
    color: palette.positive,
  },
  scoreNegative: {
    color: palette.negative,
  },
  scoreNeutral: {
    color: palette.textDark,
  },
  teamsPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    backgroundColor: palette.panelLight,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
  },
  teamsTitle: {
    marginBottom: 6,
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  teamCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  teamCardWin: {
    backgroundColor: palette.panel,
    borderColor: palette.borderStrong,
  },
  teamCardLose: {
    backgroundColor: palette.negativeSurface,
    borderColor: palette.loseBorder,
  },
  teamCardTie: {
    backgroundColor: palette.panelMuted,
    borderColor: palette.borderStrong,
  },
  teamCardName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    color: palette.textGreen,
  },
  teamCardNameCompact: {
    fontSize: 12,
  },
  teamCardNameUltra: {
    fontSize: 11,
  },
  teamCardNameLose: {
    color: palette.loseText,
  },
  teamCardScore: {
    fontSize: 25,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  teamCardScoreCompact: {
    fontSize: 22,
  },
  teamCardScoreUltra: {
    fontSize: 20,
  },
  teamBadge: {
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamBadgeWin: {
    backgroundColor: palette.winBadgeBg,
    borderColor: palette.accent,
  },
  teamBadgeLose: {
    backgroundColor: palette.loseBadgeBg,
    borderColor: palette.loseBorder,
  },
  teamBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  teamBadgeTextWin: {
    color: palette.badgeText,
  },
  teamBadgeTextLose: {
    color: palette.loseBadgeText,
  },
  summaryPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: palette.panelLight,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
  },
  summaryPanelIndividual: {
    marginTop: 12,
    minHeight: 170,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: palette.textGreen,
    textAlign: 'center',
    marginBottom: 6,
  },
  summaryTitleCompact: {
    fontSize: 15,
  },
  summaryTitleUltra: {
    fontSize: 14,
  },
  summaryTitleIndividual: {
    fontSize: 18,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryCol: {
    flex: 1,
    position: 'relative',
  },
  summaryDivider: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 1,
    backgroundColor: 'rgba(23,67,51,0.14)',
  },
  summaryInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  summaryIconWell: {
    backgroundColor: palette.iconWell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceFace: {
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: palette.positive,
    position: 'relative',
  },
  diceDot: {
    position: 'absolute',
    backgroundColor: palette.positive,
  },
  targetOuter: {
    borderWidth: 1.5,
    borderColor: palette.positive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetMid: {
    borderWidth: 1.5,
    borderColor: palette.positive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetCore: {
    backgroundColor: palette.positive,
  },
  peakBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
  },
  peakBar: {
    width: 3,
    borderRadius: 1,
    backgroundColor: palette.positive,
  },
  peakBarShort: { height: 6 },
  peakBarTall: { height: 13 },
  peakBarMid: { height: 9 },
  summaryLabel: {
    fontSize: 10,
    color: palette.textGreen,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryLabelCompact: {
    fontSize: 9,
  },
  summaryLabelUltra: {
    fontSize: 8,
  },
  summaryValue: {
    fontSize: 17,
    color: palette.positive,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  summaryValueCompact: {
    fontSize: 15,
  },
  summaryValueUltra: {
    fontSize: 14,
  },
  celebrateCard: {
    marginTop: 6,
    backgroundColor: palette.panel,
    borderColor: palette.borderStrong,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  celebrateIcon: {
    backgroundColor: palette.positive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrateCore: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: palette.accent,
  },
  celebrateSpark: {
    position: 'absolute',
    width: 6,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: palette.accentSoft,
  },
  celebrateSpark1: { top: 4, right: 3, transform: [{ rotate: '20deg' }] },
  celebrateSpark2: { bottom: 5, left: 2, transform: [{ rotate: '-25deg' }] },
  celebrateDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFE394',
  },
  celebrateDot1: { top: 3, left: 6 },
  celebrateText: {
    flexShrink: 1,
    alignItems: 'center',
    gap: 1,
  },
  celebrateTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  celebrateTitleCompact: {
    fontSize: 11,
  },
  celebrateTitleUltra: {
    fontSize: 10,
  },
  celebrateSub: {
    fontSize: 10,
    color: palette.mutedGreen,
    textAlign: 'center',
  },
  celebrateSubCompact: {
    fontSize: 9,
  },
  celebrateSubUltra: {
    fontSize: 8,
  },
  metaLine: {
    fontSize: 10,
    color: palette.metaLine,
    textAlign: 'center',
    marginTop: 5,
    marginHorizontal: 16,
  },
  tournamentLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  tournamentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
  },
  footer: {
    backgroundColor: palette.background,
    paddingHorizontal: 16,
    paddingTop: 7,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  homeButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderColor: palette.cancelBorder,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  newGameButton: {
    flex: 1,
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  homeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
  },
  newGameLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14533F',
    textAlign: 'center',
  },
  footerLabelCompact: {
    fontSize: 12,
  },
  footerLabelUltra: {
    fontSize: 11,
  },
  pressed: {
    opacity: 0.82,
  },
});
