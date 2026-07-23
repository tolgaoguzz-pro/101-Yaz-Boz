import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';

import type { GameMode } from '../gameMode';
import type { FinishType } from '../../engine/models';
import type { GameActivityEvent, GameStatus } from '../gameActivity';
import { resolveGameMode } from '../gameMode';
import { GameActionsSheet } from '../components/GameActionsSheet';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { ScoreSheetTable } from '../components/ScoreSheetTable';
import { buildScoreSheet } from '../scoreSheet';
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
  completedGameRecordId?: string;
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

export function ActiveGameScreen({
  game,
  onHome,
  onNewRound,
  onAddPenalty,
  onPause,
  onFinishEarly,
  onAbandon,
}: ActiveGameScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const playedRounds = game.rounds.length;
  const targetRounds = resolveTargetRoundCount(game.targetRoundCount);
  const roundsLeft = remainingRoundCount(playedRounds, targetRounds);
  const sheet = useMemo(() => buildScoreSheet(game), [game]);
  const [actionsOpen, setActionsOpen] = useState(false);

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
      <View style={[styles.shell, compact && styles.shellCompact]}>
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
          <Text style={[styles.title, compact && styles.titleCompact]}>
            {isIndividual ? 'Tekli Oyun' : 'Eşli Oyun'}
          </Text>
          <Text style={styles.roundInfo}>
            El {playedRounds}/{targetRounds} · Kalan {roundsLeft}
          </Text>
        </View>

        <View style={styles.sheetWrap}>
          <ScoreSheetTable sheet={sheet} compact={compact} />
        </View>

        <View style={styles.actionsBlock}>
          <PrimaryButton label="Yeni El" onPress={onNewRound} />
          <SecondaryButton
            label="Ceza Ekle"
            onPress={onAddPenalty}
            style={styles.fullButton}
          />
          <SecondaryButton
            label="Oyun İşlemleri"
            onPress={() => setActionsOpen(true)}
            style={styles.fullButton}
          />
        </View>
      </View>

      <GameActionsSheet
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
        onPause={onPause}
        onFinishEarly={confirmFinishEarly}
        onAbandon={confirmAbandon}
      />
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  shellCompact: {
    gap: spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeButton: {
    minHeight: 40,
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
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  titleCompact: {
    fontSize: 20,
  },
  roundInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sheetWrap: {
    flex: 1,
    minHeight: 0,
  },
  actionsBlock: {
    gap: spacing.xs,
  },
  fullButton: {
    flexGrow: 0,
    width: '100%',
  },
});
