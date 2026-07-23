import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { TEAM_IDS } from '../gameRoster';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import {
  remainingRoundCount,
  resolveTargetRoundCount,
} from '../targetRoundCount';
import { colors, radii, spacing, typography } from '../theme';

export type ActiveGamePlayer = {
  id: string;
  name: string;
  totalScore: number;
};

export type ActiveGameTeam = {
  name: string;
  totalScore: number;
  players: [ActiveGamePlayer, ActiveGamePlayer];
};

export type SavedRoundSummary = {
  roundNumber: number;
  players: { playerId: string; score: number }[];
  teams: { teamId: string; score: number }[];
  finishTeamBonus: { teamId: string | null; amount: number };
};

export type LastGameAction = {
  playerName: string;
  penaltyLabel: string;
  amount: number;
};

export type ActiveGameData = {
  teams: [ActiveGameTeam, ActiveGameTeam];
  /** Bir sonraki oynanacak el numarası. */
  roundNumber: number;
  rounds: SavedRoundSummary[];
  lastAction: LastGameAction | null;
  /**
   * Planlanan toplam el sayısı.
   * Yeni oyunlarda zorunlu kaydedilir; eski state için opsiyonel fallback kullanılır.
   */
  targetRoundCount?: number;
};

type ActiveGameScreenProps = {
  game: ActiveGameData;
  onHome: () => void;
  onNewRound: () => void;
  onAddPenalty: () => void;
};

function scoreByPlayerId(
  round: SavedRoundSummary,
  playerId: string,
): number {
  return (
    round.players.find((player) => player.playerId === playerId)?.score ?? 0
  );
}

function scoreByTeamId(round: SavedRoundSummary, teamId: string): number {
  return round.teams.find((team) => team.teamId === teamId)?.score ?? 0;
}

function TeamCard({
  team,
  stacked,
}: {
  team: ActiveGameTeam;
  stacked: boolean;
}) {
  return (
    <View
      style={[
        styles.teamCard,
        stacked ? styles.teamCardStacked : styles.teamCardSide,
      ]}
    >
      <Text style={styles.teamName} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.teamScore}>{team.totalScore}</Text>
      <View style={styles.players}>
        {team.players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            <Text style={styles.playerScore}>{player.totalScore}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RoundHistoryItem({
  round,
  game,
  isLatest,
  showDivider,
}: {
  round: SavedRoundSummary;
  game: ActiveGameData;
  isLatest: boolean;
  showDivider: boolean;
}) {
  const rosterPlayers = [
    ...game.teams[0].players,
    ...game.teams[1].players,
  ];

  return (
    <View>
      <View style={[styles.roundBlock, isLatest && styles.roundBlockLatest]}>
        <Text style={styles.roundTitle}>El {round.roundNumber}</Text>

        <View style={styles.roundScores}>
          {rosterPlayers.map((player) => (
            <View key={player.id} style={styles.historyRow}>
              <Text style={styles.historyName} numberOfLines={1}>
                {player.name}
              </Text>
              <Text style={styles.historyScore}>
                {scoreByPlayerId(round, player.id)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.teamTotalLabel}>Takım Toplamı:</Text>
        <View style={styles.roundScores}>
          <View style={styles.historyRow}>
            <Text style={styles.historyName} numberOfLines={1}>
              {game.teams[0].name}
            </Text>
            <Text style={styles.historyScore}>
              {scoreByTeamId(round, TEAM_IDS.team1)}
            </Text>
          </View>
          <View style={styles.historyRow}>
            <Text style={styles.historyName} numberOfLines={1}>
              {game.teams[1].name}
            </Text>
            <Text style={styles.historyScore}>
              {scoreByTeamId(round, TEAM_IDS.team2)}
            </Text>
          </View>
        </View>
      </View>
      {showDivider ? <View style={styles.roundDivider} /> : null}
    </View>
  );
}

export function ActiveGameScreen({
  game,
  onHome,
  onNewRound,
  onAddPenalty,
}: ActiveGameScreenProps) {
  const { width } = useWindowDimensions();
  const stacked = width < 380;
  const playedRounds = game.rounds.length;
  const lastRoundIndex = playedRounds - 1;
  const targetRounds = resolveTargetRoundCount(game.targetRoundCount);
  const roundsLeft = remainingRoundCount(playedRounds, targetRounds);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.fixedTop}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={onHome}
              style={({ pressed }) => [
                styles.homeButton,
                pressed && styles.homePressed,
              ]}
            >
              <Text style={styles.homeLabel}>Ana Sayfa</Text>
            </Pressable>
            <Text style={styles.brand}>101 YAZ-BOZ</Text>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Aktif Oyun</Text>
            <View style={styles.roundMeta}>
              <Text style={styles.roundInfo}>
                Oynanan El: {playedRounds} / {targetRounds}
              </Text>
              <Text style={styles.roundInfo}>Kalan El: {roundsLeft}</Text>
            </View>
          </View>

          <View style={[styles.teamsRow, stacked && styles.teamsColumn]}>
            <TeamCard team={game.teams[0]} stacked={stacked} />
            <TeamCard team={game.teams[1]} stacked={stacked} />
          </View>

          {game.lastAction ? (
            <View style={styles.lastActionCard}>
              <Text style={styles.lastActionTitle}>Son işlem</Text>
              <Text style={styles.lastActionLine}>
                {game.lastAction.playerName} · {game.lastAction.penaltyLabel} +
                {game.lastAction.amount}
              </Text>
            </View>
          ) : null}

          <Text style={styles.historyHeading}>El Geçmişi</Text>
        </View>

        <ScrollView
          style={styles.historyScroll}
          contentContainerStyle={styles.historyContent}
          showsVerticalScrollIndicator={false}
        >
          {playedRounds === 0 ? (
            <Text style={styles.emptyHistory}>Henüz el oynanmadı</Text>
          ) : (
            game.rounds.map((round, index) => (
              <RoundHistoryItem
                key={`round-${round.roundNumber}-${index}`}
                round={round}
                game={game}
                isLatest={index === lastRoundIndex}
                showDivider={index < lastRoundIndex}
              />
            ))
          )}

          <Text style={styles.warning}>
            Aktif oyun bu cihazda otomatik kaydedilir.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <SecondaryButton
            label="Ceza Ekle"
            onPress={onAddPenalty}
            style={styles.penaltyButton}
          />
          <PrimaryButton label="Yeni El" onPress={onNewRound} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shell: {
    flex: 1,
  },
  fixedTop: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  homeButton: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  homePressed: {
    backgroundColor: colors.surface,
  },
  homeLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  brand: {
    ...typography.brand,
    color: colors.primaryMuted,
    textTransform: 'uppercase',
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.text,
  },
  roundMeta: {
    gap: 2,
  },
  roundInfo: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  teamsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamsColumn: {
    flexDirection: 'column',
  },
  teamCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    gap: spacing.sm,
  },
  teamCardSide: {
    flex: 1,
    minWidth: 0,
  },
  teamCardStacked: {
    width: '100%',
  },
  teamName: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  teamScore: {
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 50,
    color: colors.text,
  },
  players: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  playerName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  playerScore: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
  lastActionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  lastActionTitle: {
    ...typography.infoLabel,
    color: colors.primary,
  },
  lastActionLine: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  historyHeading: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  historyScroll: {
    flex: 1,
    marginTop: spacing.sm,
  },
  historyContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  emptyHistory: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  roundBlock: {
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  roundBlockLatest: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roundTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    color: colors.text,
    marginBottom: 2,
  },
  roundScores: {
    gap: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 22,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text,
    flex: 1,
  },
  historyScore: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  teamTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.primaryMuted,
    marginTop: 4,
  },
  roundDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  warning: {
    ...typography.infoLabel,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  penaltyButton: {
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',
  },
});
