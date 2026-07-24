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
import { colors as active, layout, radii } from '../theme';

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
  const { height, width } = useWindowDimensions();
  const compact = height < 700 || width < 380;
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const playedRounds = game.rounds.length;
  const targetRounds = resolveTargetRoundCount(game.targetRoundCount);
  const roundsLeft = remainingRoundCount(playedRounds, targetRounds);
  const model = useMemo(() => buildScoreSheet(game), [game]);
  const [actionsOpen, setActionsOpen] = useState(false);

  function openActions() {
    setActionsOpen(true);
  }

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
            accessibilityLabel="Geri"
            onPress={onHome}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <View style={styles.titleBlock} pointerEvents="none">
            <Text style={styles.title}>Aktif Oyun</Text>
            <Text style={styles.roundInfo}>
              El {playedRounds}/{targetRounds} · Kalan {roundsLeft}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="İşlemler"
            onPress={openActions}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.menuLabel}>⋮</Text>
          </Pressable>
        </View>

        {isIndividual ? (
          <View style={styles.individualBanner}>
            <Text style={styles.individualTitle}>Bireysel Skor</Text>
            <Text style={styles.individualPlayers} numberOfLines={1}>
              {model.playerNames.join(' · ')}
            </Text>
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
        <ScoreSheetTable model={model} compact={compact} />
      </View>

      <View style={[styles.footer, compact && styles.footerCompact]}>
        <Pressable
          accessibilityRole="button"
          onPress={onNewRound}
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryAction,
            compact && styles.actionButtonCompact,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.actionLabel, styles.primaryActionLabel]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            + Yeni El
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onAddPenalty}
          style={({ pressed }) => [
            styles.actionButton,
            compact && styles.actionButtonCompact,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={styles.actionLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            + Ceza Ekle
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={openActions}
          style={({ pressed }) => [
            styles.actionButton,
            compact && styles.actionButtonCompact,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={styles.actionLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            ≡ İşlemler
          </Text>
        </Pressable>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 6,
  },
  headerCompact: {
    paddingBottom: 5,
    gap: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.headerMinHeight,
  },
  iconButton: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  backLabel: {
    fontSize: 30,
    fontWeight: '300',
    color: active.gold,
    marginTop: -2,
  },
  menuLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: active.white,
    lineHeight: 24,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: active.white,
  },
  roundInfo: {
    fontSize: 10,
    fontWeight: '500',
    color: active.headerMuted,
    marginTop: 1,
  },
  teamBanner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingBottom: 2,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  teamGold: {
    width: 1.5,
    backgroundColor: active.gold,
    alignSelf: 'stretch',
  },
  teamName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: active.gold,
    textAlign: 'center',
  },
  playerNames: {
    fontSize: 11,
    fontWeight: '500',
    color: active.playerCream,
    textAlign: 'center',
  },
  individualBanner: {
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
    paddingHorizontal: 8,
  },
  individualTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: active.gold,
  },
  individualPlayers: {
    fontSize: 11,
    fontWeight: '500',
    color: active.playerCream,
    textAlign: 'center',
  },
  tableArea: {
    flex: 1,
    minHeight: 0,
    backgroundColor: active.cream,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tableAreaCompact: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 2,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: active.green,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  footerCompact: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 6,
  },
  actionButton: {
    flex: 1,
    minHeight: layout.buttonHeight,
    borderRadius: 10,
    backgroundColor: active.greenDeep,
    borderWidth: 1,
    borderColor: 'rgba(200, 164, 77, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionButtonCompact: {
    minHeight: layout.buttonHeightCompact,
  },
  primaryAction: {
    flex: 1.15,
    borderWidth: 1.5,
    borderColor: active.gold,
    backgroundColor: active.greenDeep,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: active.white,
    textAlign: 'center',
  },
  primaryActionLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
});
