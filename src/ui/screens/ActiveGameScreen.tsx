import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radii, spacing, typography } from '../theme';

export type ActiveGamePlayer = {
  name: string;
  totalScore: number;
};

export type ActiveGameTeam = {
  name: string;
  totalScore: number;
  players: [ActiveGamePlayer, ActiveGamePlayer];
};

export type ActiveGameData = {
  teams: [ActiveGameTeam, ActiveGameTeam];
  roundNumber: number;
};

type ActiveGameScreenProps = {
  game: ActiveGameData;
  onHome: () => void;
  onNewRound: () => void;
};

function TeamCard({
  team,
  stacked,
}: {
  team: ActiveGameTeam;
  stacked: boolean;
}) {
  return (
    <View style={[styles.teamCard, stacked ? styles.teamCardStacked : styles.teamCardSide]}>
      <Text style={styles.teamName} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.teamScore}>{team.totalScore}</Text>
      <View style={styles.players}>
        {team.players.map((player) => (
          <View key={player.name} style={styles.playerRow}>
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
}: ActiveGameScreenProps) {
  const { width } = useWindowDimensions();
  const stacked = width < 380;

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
            <Text style={styles.roundInfo}>El {game.roundNumber}</Text>
          </View>

          <View style={[styles.teamsRow, stacked && styles.teamsColumn]}>
            <TeamCard team={game.teams[0]} stacked={stacked} />
            <TeamCard team={game.teams[1]} stacked={stacked} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
