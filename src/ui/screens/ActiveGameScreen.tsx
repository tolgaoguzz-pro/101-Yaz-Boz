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
import { ScoreSheetTable } from '../components/ScoreSheetTable';
import { buildScoreSheet } from '../scoreSheet';
import {
  remainingRoundCount,
  resolveTargetRoundCount,
} from '../targetRoundCount';

export type { GameStatus } from '../gameActivity';
export type { GameActivityEvent } from '../gameActivity';

/** Referans aktif oyun paleti. */
const active = {
  green: '#1F5E3B',
  greenDeep: '#174A2E',
  cream: '#F7F2E8',
  gold: '#C8A44D',
  white: '#FFFFFF',
  textMuted: 'rgba(247, 242, 232, 0.78)',
} as const;

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
  const compact = height < 700;
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const playedRounds = game.rounds.length;
  const targetRounds = resolveTargetRoundCount(game.targetRoundCount);
  const roundsLeft = remainingRoundCount(playedRounds, targetRounds);
  const model = useMemo(() => buildScoreSheet(game), [game]);
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
      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={onHome}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, compact && styles.titleCompact]}>
              Aktif Oyun
            </Text>
            <Text style={styles.roundInfo}>
              El {playedRounds}/{targetRounds} · Kalan {roundsLeft}
            </Text>
          </View>
          <View style={styles.iconButton} />
        </View>

        {isIndividual ? (
          <View style={styles.individualBanner}>
            {model.playerNames.map((name) => (
              <Text key={name} style={styles.individualPlayer} numberOfLines={1}>
                {name}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.teamBanner}>
            <View style={styles.teamSide}>
              <Text style={styles.teamName} numberOfLines={1}>
                {game.teams[0].name}
              </Text>
              <Text style={styles.playerNames} numberOfLines={1}>
                {game.teams[0].players[0].name} ·{' '}
                {game.teams[0].players[1].name}
              </Text>
            </View>
            <View style={styles.teamGold} />
            <View style={styles.teamSide}>
              <Text style={styles.teamName} numberOfLines={1}>
                {game.teams[1].name}
              </Text>
              <Text style={styles.playerNames} numberOfLines={1}>
                {game.teams[1].players[0].name} ·{' '}
                {game.teams[1].players[1].name}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.tableArea, compact && styles.tableAreaCompact]}>
        <ScoreSheetTable model={model} />
      </View>

      <View style={[styles.footer, compact && styles.footerCompact]}>
        <Pressable
          accessibilityRole="button"
          onPress={onNewRound}
          style={({ pressed }) => [
            styles.primaryButton,
            compact && styles.primaryButtonCompact,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryLabel}>+ Yeni El</Text>
        </Pressable>
        <View style={styles.secondaryRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onAddPenalty}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryLabel}>Ceza</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActionsOpen(true)}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryLabel}>İşlemler</Text>
          </Pressable>
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
    backgroundColor: active.green,
  },
  header: {
    backgroundColor: active.green,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  headerCompact: {
    paddingBottom: 6,
    gap: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  backLabel: {
    fontSize: 32,
    fontWeight: '300',
    color: active.white,
    marginTop: -2,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: active.white,
  },
  titleCompact: {
    fontSize: 16,
  },
  roundInfo: {
    fontSize: 11,
    fontWeight: '500',
    color: active.textMuted,
    marginTop: 1,
  },
  teamBanner: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
  },
  teamGold: {
    width: 1.5,
    backgroundColor: active.gold,
    alignSelf: 'stretch',
  },
  teamName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: active.gold,
    textAlign: 'center',
  },
  playerNames: {
    fontSize: 11,
    fontWeight: '500',
    color: active.white,
    textAlign: 'center',
  },
  individualBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  individualPlayer: {
    fontSize: 11,
    fontWeight: '600',
    color: active.white,
    maxWidth: '45%',
    textAlign: 'center',
  },
  tableArea: {
    flex: 1,
    minHeight: 0,
    backgroundColor: active.cream,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  tableAreaCompact: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  footer: {
    backgroundColor: active.green,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  footerCompact: {
    paddingTop: 6,
    paddingBottom: 8,
    gap: 6,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: active.greenDeep,
    borderWidth: 1.5,
    borderColor: active.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonCompact: {
    minHeight: 48,
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: active.white,
    letterSpacing: 0.3,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(200, 164, 77, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: active.textMuted,
  },
});
