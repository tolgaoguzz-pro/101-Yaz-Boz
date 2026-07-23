import { StyleSheet, Text, View } from 'react-native';

import type { GameActivityEvent } from '../gameActivity';
import { resolveGameMode } from '../gameMode';
import { TEAM_IDS } from '../gameRoster';
import { rosterPlayersInOrder } from '../gameResult';
import { resolveActivityLog } from '../gameLifecycle';
import { colors, radii, spacing } from '../theme';
import {
  ActiveGameData,
  ActiveGameTeam,
} from '../screens/ActiveGameScreen';

function scoreByPlayerId(
  scores: { playerId: string; score: number }[],
  playerId: string,
): number {
  return scores.find((player) => player.playerId === playerId)?.score ?? 0;
}

function scoreByTeamId(
  scores: { teamId: string; score: number }[],
  teamId: string,
): number {
  return scores.find((team) => team.teamId === teamId)?.score ?? 0;
}

type ActivityLogViewProps = {
  game: Pick<ActiveGameData, 'teams' | 'gameMode' | 'rounds' | 'activityLog'>;
  emptyLabel?: string;
  highlightLatest?: boolean;
};

function ActivityLogItem({
  event,
  teams,
  isLatest,
  isIndividual,
  rosterPlayers,
}: {
  event: GameActivityEvent;
  teams: [ActiveGameTeam, ActiveGameTeam];
  isLatest: boolean;
  isIndividual: boolean;
  rosterPlayers: { id: string; name: string }[];
}) {
  if (event.type === 'penalty') {
    return (
      <View style={[styles.roundBlock, isLatest && styles.roundBlockLatest]}>
        <Text style={styles.roundTitle}>Ceza</Text>
        <Text style={styles.historyName}>
          {event.playerName} · {event.penaltyLabel} +{event.amount}
        </Text>
        <Text style={styles.bonusLine}>
          #{event.sequence} ·{' '}
          {new Date(event.createdAt).toLocaleString('tr-TR')}
        </Text>
      </View>
    );
  }

  const bonusPlayer = event.finishBonusPlayerId
    ? rosterPlayers.find((player) => player.id === event.finishBonusPlayerId)
    : null;

  return (
    <View style={[styles.roundBlock, isLatest && styles.roundBlockLatest]}>
      <Text style={styles.roundTitle}>{event.roundNumber}. El</Text>
      <View style={styles.roundScores}>
        {rosterPlayers.map((player) => (
          <View key={player.id} style={styles.historyRow}>
            <Text style={styles.historyName} numberOfLines={1}>
              {player.name}
            </Text>
            <Text style={styles.historyScore}>
              {scoreByPlayerId(event.playerScores, player.id)}
            </Text>
          </View>
        ))}
      </View>
      {isIndividual ? (
        event.finishBonusAmount !== 0 ? (
          <Text style={styles.bonusLine}>
            Bitiş bonusu · {bonusPlayer?.name ?? 'Bitiren'}{' '}
            {event.finishBonusAmount}
          </Text>
        ) : null
      ) : (
        <>
          <Text style={styles.teamTotalLabel}>Takım Toplamı:</Text>
          <View style={styles.roundScores}>
            <View style={styles.historyRow}>
              <Text style={styles.historyName} numberOfLines={1}>
                {teams[0].name}
              </Text>
              <Text style={styles.historyScore}>
                {scoreByTeamId(event.teamScores, TEAM_IDS.team1)}
              </Text>
            </View>
            <View style={styles.historyRow}>
              <Text style={styles.historyName} numberOfLines={1}>
                {teams[1].name}
              </Text>
              <Text style={styles.historyScore}>
                {scoreByTeamId(event.teamScores, TEAM_IDS.team2)}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

export function GameActivityLogView({
  game,
  emptyLabel = 'Henüz işlem yok',
  highlightLatest = true,
}: ActivityLogViewProps) {
  const activityLog = resolveActivityLog(game as ActiveGameData);
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const rosterPlayers = rosterPlayersInOrder(game as ActiveGameData);
  const lastIndex = activityLog.length - 1;

  if (activityLog.length === 0) {
    return <Text style={styles.emptyHistory}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.logList}>
      {activityLog.map((event, index) => (
        <ActivityLogItem
          key={event.id}
          event={event}
          teams={game.teams}
          isLatest={highlightLatest && index === lastIndex}
          isIndividual={isIndividual}
          rosterPlayers={rosterPlayers}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyHistory: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  logList: {
    gap: spacing.sm,
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
  bonusLine: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.primaryMuted,
    marginTop: 4,
  },
});
