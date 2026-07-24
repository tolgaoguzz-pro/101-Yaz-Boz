import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import { DEVELOPER_CREDIT } from '../../config/appInfo';
import { calculateGameResult } from '../gameResult';
import { ActiveGameData } from './ActiveGameScreen';

/** Referans Oyun Bitti paleti. */
const ui = {
  green: '#1F5E3B',
  greenDeep: '#174A2E',
  cream: '#F7F2E8',
  gold: '#C8A44D',
  silver: '#A8B0B5',
  bronze: '#B08D57',
  white: '#FFFFFF',
  text: '#263238',
  textMuted: '#7A847C',
  line: '#D9D2C4',
} as const;

type GameResultScreenProps = {
  game: ActiveGameData;
  seriesSummaryLine?: string | null;
  onRematch: () => void;
  onViewTournament: () => void;
  onHome: () => void;
};

type ParsedSeries =
  | { kind: 'paired'; teamA: string; winsA: string; winsB: string; teamB: string }
  | { kind: 'individual'; line: string };

function parseSeriesSummary(line: string | null | undefined): ParsedSeries | null {
  if (!line) {
    return null;
  }
  const paired = line.match(/^(.+?)\s+(\d+)\s+-\s+(\d+)\s+(.+)$/);
  if (paired) {
    return {
      kind: 'paired',
      teamA: paired[1],
      winsA: paired[2],
      winsB: paired[3],
      teamB: paired[4],
    };
  }
  return { kind: 'individual', line };
}

function rankTone(rank: number): 'gold' | 'silver' | 'bronze' | 'normal' {
  if (rank === 1) {
    return 'gold';
  }
  if (rank === 2) {
    return 'silver';
  }
  if (rank === 3) {
    return 'bronze';
  }
  return 'normal';
}

export function GameResultScreen({
  game,
  seriesSummaryLine,
  onRematch,
  onViewTournament,
  onHome,
}: GameResultScreenProps) {
  const result = useMemo(() => calculateGameResult(game), [game]);
  const isIndividual = result.mode === 'individual';
  const isTie = result.isTie;
  const series = parseSeriesSummary(seriesSummaryLine);

  const winnerTitle = isIndividual
    ? isTie
      ? 'Ortak Birinciler'
      : 'Kazanan Oyuncu'
    : isTie
      ? 'Berabere'
      : 'Kazanan Takım';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.hero}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.kicker}>OYUN BİTTİ</Text>
          <Text style={styles.winnerLabel}>{winnerTitle}</Text>

          {isIndividual ? (
            result.individualWinner?.kind === 'tie' ? (
              <View style={styles.tieBlock}>
                {result.individualWinner.players.map((row) => (
                  <Text key={row.playerId} style={styles.winnerName}>
                    {row.name}
                  </Text>
                ))}
              </View>
            ) : result.individualWinner?.kind === 'winner' ? (
              <Text style={styles.winnerName} numberOfLines={2}>
                {result.individualWinner.name}
              </Text>
            ) : null
          ) : result.pairedWinner?.kind === 'tie' ? (
            <View style={styles.tieBlock}>
              <Text style={styles.winnerName} numberOfLines={1}>
                {result.pairedWinner.team1Name}
              </Text>
              <Text style={styles.winnerName} numberOfLines={1}>
                {result.pairedWinner.team2Name}
              </Text>
            </View>
          ) : result.pairedWinner?.kind === 'winner' ? (
            <Text style={styles.winnerName} numberOfLines={2}>
              {result.pairedWinner.teamName}
            </Text>
          ) : null}

          <Text style={styles.hint}>Düşük ceza puanı kazanır.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.rankHeader}>
            <Text style={[styles.colRank, styles.headerCell]}>Sıra</Text>
            <Text style={[styles.colName, styles.headerCell]}>Oyuncu</Text>
            <Text style={[styles.colScore, styles.headerCell]}>Puan</Text>
          </View>

          {result.standings.map((row, index) => {
            const tone = rankTone(row.rank);
            const isLast = index === result.standings.length - 1;
            return (
              <View
                key={row.playerId}
                style={[
                  styles.rankRow,
                  tone === 'gold' && styles.rankGold,
                  tone === 'silver' && styles.rankSilver,
                  tone === 'bronze' && styles.rankBronze,
                  isLast && !isIndividual && styles.rankRowBeforeTeams,
                  isLast && isIndividual && styles.rankRowLast,
                ]}
              >
                <View style={styles.colRank}>
                  <View
                    style={[
                      styles.rankBadge,
                      tone === 'gold' && styles.badgeGold,
                      tone === 'silver' && styles.badgeSilver,
                      tone === 'bronze' && styles.badgeBronze,
                      tone === 'normal' && styles.badgeNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankBadgeText,
                        tone === 'normal' && styles.rankBadgeTextNormal,
                      ]}
                    >
                      {row.rank}
                    </Text>
                  </View>
                </View>
                <Text style={styles.colName} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.colScore}>{row.totalScore}</Text>
              </View>
            );
          })}

          {!isIndividual ? (
            <View style={styles.teamBoxes}>
              <View style={styles.teamBox}>
                <Text style={styles.teamBoxLabel} numberOfLines={1}>
                  {game.teams[0].name}
                </Text>
                <Text style={styles.teamBoxScore}>
                  {game.teams[0].totalScore}
                </Text>
              </View>
              <View style={styles.teamBoxDivider} />
              <View style={styles.teamBox}>
                <Text style={styles.teamBoxLabel} numberOfLines={1}>
                  {game.teams[1].name}
                </Text>
                <Text style={styles.teamBoxScore}>
                  {game.teams[1].totalScore}
                </Text>
              </View>
            </View>
          ) : null}

          {series ? (
            <View style={styles.seriesBlock}>
              <Text style={styles.seriesTitle}>Turnuva Durumu</Text>
              {series.kind === 'paired' ? (
                <View style={styles.seriesRow}>
                  <Text style={styles.seriesTeam} numberOfLines={2}>
                    {series.teamA}
                  </Text>
                  <Text style={styles.seriesWins}>{series.winsA}</Text>
                  <Text style={styles.seriesDash}>—</Text>
                  <Text style={styles.seriesWins}>{series.winsB}</Text>
                  <Text style={styles.seriesTeam} numberOfLines={2}>
                    {series.teamB}
                  </Text>
                </View>
              ) : (
                <Text style={styles.seriesLeader} numberOfLines={2}>
                  {series.line}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onRematch}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>Aynı Oyuncularla Yeni Oyun</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onViewTournament}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryLabel}>Turnuva Geçmişi</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onHome}
            style={({ pressed }) => [
              styles.tertiaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.tertiaryLabel}>Ana Sayfa</Text>
          </Pressable>
        </View>

        <Text style={styles.credit}>{DEVELOPER_CREDIT}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ui.green,
  },
  shell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  hero: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 4,
  },
  trophy: {
    fontSize: 44,
    lineHeight: 50,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: ui.white,
    marginTop: 2,
  },
  winnerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(247, 242, 232, 0.78)',
    marginTop: 4,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    color: ui.gold,
    textAlign: 'center',
    marginTop: 2,
  },
  tieBlock: {
    alignItems: 'center',
    gap: 2,
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(247, 242, 232, 0.7)',
    marginTop: 6,
  },
  panel: {
    backgroundColor: ui.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.gold,
    overflow: 'hidden',
    flexShrink: 1,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
    paddingHorizontal: 12,
    backgroundColor: '#EFE8DB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: ui.green,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  rankRowBeforeTeams: {
    borderBottomWidth: 0,
  },
  rankRowLast: {
    borderBottomWidth: 0,
  },
  rankGold: {
    backgroundColor: 'rgba(200, 164, 77, 0.18)',
  },
  rankSilver: {
    backgroundColor: 'rgba(168, 176, 181, 0.22)',
  },
  rankBronze: {
    backgroundColor: 'rgba(176, 141, 87, 0.18)',
  },
  colRank: {
    width: 36,
  },
  colName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: ui.text,
    paddingRight: 8,
  },
  colScore: {
    minWidth: 44,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: ui.green,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGold: {
    backgroundColor: ui.gold,
  },
  badgeSilver: {
    backgroundColor: ui.silver,
  },
  badgeBronze: {
    backgroundColor: ui.bronze,
  },
  badgeNormal: {
    backgroundColor: 'transparent',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: ui.white,
  },
  rankBadgeTextNormal: {
    color: ui.textMuted,
  },
  teamBoxes: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: ui.gold,
    minHeight: 52,
  },
  teamBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  teamBoxDivider: {
    width: 1.5,
    backgroundColor: ui.gold,
  },
  teamBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: ui.textMuted,
    textAlign: 'center',
  },
  teamBoxScore: {
    fontSize: 20,
    fontWeight: '800',
    color: ui.green,
  },
  seriesBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  seriesTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: ui.green,
    textAlign: 'center',
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seriesTeam: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: ui.text,
    textAlign: 'center',
  },
  seriesWins: {
    fontSize: 22,
    fontWeight: '800',
    color: ui.green,
    minWidth: 24,
    textAlign: 'center',
  },
  seriesDash: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.gold,
  },
  seriesLeader: {
    fontSize: 14,
    fontWeight: '700',
    color: ui.text,
    textAlign: 'center',
  },
  actions: {
    gap: 8,
    marginTop: 'auto',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: ui.greenDeep,
    borderWidth: 1,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.white,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: ui.cream,
    borderWidth: 1,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.green,
  },
  tertiaryButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(247, 242, 232, 0.85)',
  },
  credit: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(247, 242, 232, 0.55)',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
