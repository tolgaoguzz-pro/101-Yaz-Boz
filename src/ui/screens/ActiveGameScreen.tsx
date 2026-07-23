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
};

type ActiveGameScreenProps = {
  game: ActiveGameData;
  onHome: () => void;
  onNewRound: () => void;
  onAddPenalty: () => void;
};

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

export function ActiveGameScreen({
  game,
  onHome,
  onNewRound,
  onAddPenalty,
}: ActiveGameScreenProps) {
  const { width } = useWindowDimensions();
  const stacked = width < 380;
  const playedRounds = game.rounds.length;
  const lastRound =
    playedRounds > 0 ? game.rounds[playedRounds - 1] : null;

  const lastTeam1 =
    lastRound?.teams.find((team) => team.teamId === TEAM_IDS.team1)?.score ?? 0;
  const lastTeam2 =
    lastRound?.teams.find((team) => team.teamId === TEAM_IDS.team2)?.score ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
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
            <Text style={styles.roundInfo}>Oynanan el: {playedRounds}</Text>
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

          {lastRound ? (
            <View style={styles.lastRoundCard}>
              <Text style={styles.lastRoundTitle}>
                Son el (El {lastRound.roundNumber})
              </Text>
              <Text style={styles.lastRoundLine}>
                {game.teams[0].name}: {lastTeam1}
              </Text>
              <Text style={styles.lastRoundLine}>
                {game.teams[1].name}: {lastTeam2}
              </Text>
            </View>
          ) : null}

          <Text style={styles.warning}>
            Test sürümü: Uygulama kapanırsa aktif oyun silinir.
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
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
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
  roundInfo: {
    ...typography.body,
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
  lastRoundCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  lastRoundTitle: {
    ...typography.buttonSecondary,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  lastRoundLine: {
    ...typography.body,
    color: colors.text,
  },
  lastActionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  lastActionTitle: {
    ...typography.infoLabel,
    color: colors.primary,
  },
  lastActionLine: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  warning: {
    ...typography.infoLabel,
    color: colors.textSecondary,
    textAlign: 'center',
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
