import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMemo } from 'react';

import type { GameMode } from '../gameMode';
import type { FinishType } from '../../engine/models';
import type { GameActivityEvent, GameStatus } from '../gameActivity';
import { resolveGameMode } from '../gameMode';
import { TEAM_IDS } from '../gameRoster';
import {
  rankPlayersByPenaltyAscending,
  rosterPlayersInOrder,
} from '../gameResult';
import { resolveActivityLog } from '../gameLifecycle';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import {
  remainingRoundCount,
  resolveTargetRoundCount,
} from '../targetRoundCount';
import { colors, radii, spacing, typography } from '../theme';

export type { GameStatus } from '../gameActivity';
export type { GameActivityEvent } from '../gameActivity';

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
  gameMode?: GameMode;
  finishBonusPlayerId?: string | null;
  finishType?: FinishType;
  finisherPlayerId?: string | null;
};

export type LastGameAction = {
  playerName: string;
  penaltyLabel: string;
  amount: number;
};

export type ActiveGameData = {
  teams: [ActiveGameTeam, ActiveGameTeam];
  roundNumber: number;
  rounds: SavedRoundSummary[];
  lastAction: LastGameAction | null;
  targetRoundCount?: number;
  gameMode?: GameMode;
  status?: GameStatus;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  activityLog?: GameActivityEvent[];
};

type ActiveGameScreenProps = {
  game: ActiveGameData;
  onHome: () => void;
  onNewRound: () => void;
  onAddPenalty: () => void;
  onPause: () => void;
  onFinishEarly: () => void;
  onAbandon: () => void;
};

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

function IndividualStandingsCard({ game }: { game: ActiveGameData }) {
  const standings = useMemo(
    () => rankPlayersByPenaltyAscending(rosterPlayersInOrder(game)),
    [game],
  );

  return (
    <View style={styles.individualCard}>
      <Text style={styles.individualHint}>Düşük puan avantajlıdır</Text>
      <View style={styles.individualList}>
        {standings.map((row) => (
          <View key={row.playerId} style={styles.individualRow}>
            <Text style={styles.individualLine} numberOfLines={1}>
              {row.rank}. {row.name} — {row.totalScore}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ActivityLogItem({
  event,
  game,
  isLatest,
  isIndividual,
}: {
  event: GameActivityEvent;
  game: ActiveGameData;
  isLatest: boolean;
  isIndividual: boolean;
}) {
  const rosterPlayers = rosterPlayersInOrder(game);

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
                {game.teams[0].name}
              </Text>
              <Text style={styles.historyScore}>
                {scoreByTeamId(event.teamScores, TEAM_IDS.team1)}
              </Text>
            </View>
            <View style={styles.historyRow}>
              <Text style={styles.historyName} numberOfLines={1}>
                {game.teams[1].name}
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

export function ActiveGameScreen({
  game,
  onHome,
  onNewRound,
  onAddPenalty,
  onPause,
  onFinishEarly,
  onAbandon,
}: ActiveGameScreenProps) {
  const { width } = useWindowDimensions();
  const stacked = width < 380;
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const playedRounds = game.rounds.length;
  const targetRounds = resolveTargetRoundCount(game.targetRoundCount);
  const roundsLeft = remainingRoundCount(playedRounds, targetRounds);
  const activityLog = useMemo(() => resolveActivityLog(game), [game]);
  const lastIndex = activityLog.length - 1;

  function confirmFinishEarly() {
    Alert.alert(
      'Oyunu bitir',
      'Oyun planlanan el sayısına ulaşmadan bitirilecek. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Bitir', style: 'destructive', onPress: onFinishEarly },
      ],
    );
  }

  function confirmAbandon() {
    Alert.alert(
      'Oyunu iptal et',
      'Bu oyun silinir ve sonuç sayılmaz. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'İptal Et', style: 'destructive', onPress: onAbandon },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.shell}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          <View style={styles.roundMeta}>
            <Text style={styles.roundInfo}>
              Oynanan El: {playedRounds} / {targetRounds}
            </Text>
            <Text style={styles.roundInfo}>Kalan El: {roundsLeft}</Text>
          </View>
        </View>

        {isIndividual ? (
          <IndividualStandingsCard game={game} />
        ) : (
          <View style={[styles.teamsRow, stacked && styles.teamsColumn]}>
            <TeamCard team={game.teams[0]} stacked={stacked} />
            <TeamCard team={game.teams[1]} stacked={stacked} />
          </View>
        )}

        {game.lastAction ? (
          <View style={styles.lastActionCard}>
            <Text style={styles.lastActionTitle}>Son işlem</Text>
            <Text style={styles.lastActionLine}>
              {game.lastAction.playerName} · {game.lastAction.penaltyLabel} +
              {game.lastAction.amount}
            </Text>
          </View>
        ) : null}

        <Text style={styles.historyHeading}>Oyun Günlüğü</Text>
        {activityLog.length === 0 ? (
          <Text style={styles.emptyHistory}>Henüz işlem yok</Text>
        ) : (
          <View style={styles.logList}>
            {activityLog.map((event, index) => (
              <ActivityLogItem
                key={event.id}
                event={event}
                game={game}
                isLatest={index === lastIndex}
                isIndividual={isIndividual}
              />
            ))}
          </View>
        )}

        <View style={styles.actionsBlock}>
          <SecondaryButton
            label="Ceza Ekle"
            onPress={onAddPenalty}
            style={styles.fullButton}
          />
          <PrimaryButton label="Yeni El" onPress={onNewRound} />
        </View>

        <View style={styles.lifecycleBlock}>
          <Text style={styles.historyHeading}>Oyun İşlemleri</Text>
          <Pressable onPress={onPause} style={styles.linkButton}>
            <Text style={styles.linkLabel}>Oyunu Durdur</Text>
          </Pressable>
          <Pressable onPress={confirmFinishEarly} style={styles.linkButton}>
            <Text style={styles.linkLabel}>Oyunu Bitir</Text>
          </Pressable>
          <Pressable onPress={confirmAbandon} style={styles.linkButton}>
            <Text style={[styles.linkLabel, styles.dangerLabel]}>
              Oyunu İptal Et
            </Text>
          </Pressable>
        </View>

        <Text style={styles.warning}>
          Aktif oyun bu cihazda otomatik kaydedilir.
        </Text>
      </ScrollView>
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
  pageContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
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
  individualCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  individualHint: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: colors.primaryMuted,
  },
  individualList: {
    gap: 2,
  },
  individualRow: {
    minHeight: 24,
    justifyContent: 'center',
  },
  individualLine: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: colors.text,
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
  emptyHistory: {
    ...typography.body,
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
  actionsBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  fullButton: {
    flexGrow: 0,
    width: '100%',
  },
  lifecycleBlock: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  linkButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  linkLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  dangerLabel: {
    color: '#8B2E2E',
  },
  warning: {
    ...typography.infoLabel,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
