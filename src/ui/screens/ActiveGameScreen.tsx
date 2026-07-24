import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
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

type FooterButtonProps = {
  label: string;
  onPress: () => void;
};

function FooterButton({ label, onPress }: FooterButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.footerButton,
        pressed && styles.footerButtonPressed,
      ]}
    >
      <Text style={styles.footerButtonLabel}>{label}</Text>
    </Pressable>
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
      <View style={styles.header}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={onHome}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backPressed,
            ]}
          >
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Aktif Oyun</Text>
            <Text style={styles.roundInfo}>
              El {playedRounds}/{targetRounds} · Kalan {roundsLeft}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActionsOpen(true)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.backPressed,
            ]}
          >
            <Text style={styles.menuDots}>⋮</Text>
          </Pressable>
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

      <View style={styles.tableArea}>
        <ScoreSheetTable model={model} />
      </View>

      <View style={styles.footer}>
        <FooterButton label="+ Yeni El" onPress={onNewRound} />
        <FooterButton label="+ Ceza" onPress={onAddPenalty} />
        <FooterButton
          label="≡ İşlemler"
          onPress={() => setActionsOpen(true)}
        />
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
    gap: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.7,
  },
  backLabel: {
    fontSize: 32,
    fontWeight: '300',
    color: active.white,
    marginTop: -2,
  },
  menuDots: {
    fontSize: 22,
    fontWeight: '700',
    color: active.white,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: active.white,
  },
  roundInfo: {
    fontSize: 12,
    fontWeight: '500',
    color: active.textMuted,
    marginTop: 1,
  },
  teamBanner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 0,
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
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: active.gold,
    textAlign: 'center',
  },
  playerNames: {
    fontSize: 12,
    fontWeight: '500',
    color: active.white,
    textAlign: 'center',
  },
  individualBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  individualPlayer: {
    fontSize: 12,
    fontWeight: '600',
    color: active.white,
    maxWidth: '45%',
    textAlign: 'center',
  },
  tableArea: {
    flex: 1,
    minHeight: 0,
    backgroundColor: active.cream,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  footer: {
    backgroundColor: active.green,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: active.greenDeep,
    borderWidth: 1,
    borderColor: active.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  footerButtonPressed: {
    opacity: 0.85,
  },
  footerButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: active.white,
    textAlign: 'center',
  },
});
