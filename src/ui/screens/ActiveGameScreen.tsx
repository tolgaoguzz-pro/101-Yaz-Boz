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
import { resolveTargetRoundCount } from '../targetRoundCount';

/**
 * Ölçüler: design/aktif-oyun-yaz-boz.png @ 393×852
 * green→cream y=180 (21.1%), VS Ø≈47, Durdur≈75×28 @ y≈115–138,
 * footer buton y≈780–827 (h≈48), padH≈16–20
 */
const REF_W = 393;
const REF_H = 852;
/** VS rozeti ~%20 büyütme. */
const REF_VS = Math.round(47 * 1.2);
const REF_BTN_H = 48;
const REF_PAD_H = 16;

const C = {
  green: '#1F5E3B',
  cream: '#F7F2E8',
  white: '#FFFFFF',
  gold: '#C8A44D',
  textMuted: '#6B736C',
  border: 'rgba(38, 50, 56, 0.28)',
} as const;

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
  const scale = Math.min(width / REF_W, height / REF_H);
  const compact = height < 700 || width < 380;
  const padH = Math.round(REF_PAD_H * scale);
  const vsSize = Math.round(REF_VS * scale);
  const btnH = Math.round(REF_BTN_H * scale);

  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const playedRounds = game.rounds.length;
  const targetRounds = resolveTargetRoundCount(game.targetRoundCount);
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
      <View style={styles.greenHeader}>
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
          <Text style={styles.title} pointerEvents="none">
            Aktif Oyun
          </Text>
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

        <View style={[styles.progressRow, { paddingHorizontal: padH }]}>
          <View style={styles.progressText}>
            <Text style={styles.progressLine}>Hedef El: {targetRounds}</Text>
            <Text style={styles.progressLine}>Oynanan El: {playedRounds}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Durdur"
            onPress={onPause}
            style={({ pressed }) => [
              styles.durdurBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.durdurLabel}>❚❚  Durdur</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.creamBody}>
        {isIndividual ? (
          <View style={[styles.individualBand, { paddingHorizontal: padH }]}>
            <Text style={styles.individualTitle}>Bireysel Skor</Text>
            <Text style={styles.individualPlayers} numberOfLines={2}>
              {model.playerNames.join(' · ')}
            </Text>
          </View>
        ) : (
          <View style={[styles.teamBand, { paddingHorizontal: padH }]}>
            <View style={styles.teamSide}>
              <Text style={styles.teamName} numberOfLines={1}>
                {game.teams[0].name}
              </Text>
              <Text style={styles.playerNames} numberOfLines={1}>
                {game.teams[0].players[0].name} &{' '}
                {game.teams[0].players[1].name}
              </Text>
            </View>
            <View
              style={[
                styles.vsBadge,
                {
                  width: vsSize,
                  height: vsSize,
                  borderRadius: vsSize / 2,
                },
              ]}
            >
              <Text
                style={[styles.vsText, { fontSize: Math.round(15 * scale) }]}
              >
                VS
              </Text>
            </View>
            <View style={styles.teamSide}>
              <Text style={styles.teamName} numberOfLines={1}>
                {game.teams[1].name}
              </Text>
              <Text style={styles.playerNames} numberOfLines={1}>
                {game.teams[1].players[0].name} &{' '}
                {game.teams[1].players[1].name}
              </Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.tableArea,
            compact && styles.tableAreaCompact,
            { paddingHorizontal: padH },
          ]}
        >
          <ScoreSheetTable
            model={model}
            compact={compact}
            bodyRowBoost={3}
            emphasizeHeader
          />
        </View>

        <View
          style={[
            styles.footer,
            { paddingHorizontal: padH, gap: Math.round(10 * scale) },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={onNewRound}
            style={({ pressed }) => [
              styles.actionButton,
              { minHeight: btnH },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={styles.actionLabel}
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
              { minHeight: btnH },
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
              { minHeight: btnH },
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
    backgroundColor: C.green,
  },
  greenHeader: {
    backgroundColor: C.green,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
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
    color: C.white,
    marginTop: -2,
  },
  menuLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: C.white,
    lineHeight: 24,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    gap: 12,
  },
  progressText: {
    flex: 1,
    gap: 2,
  },
  progressLine: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
  },
  durdurBtn: {
    minHeight: 32,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durdurLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },
  creamBody: {
    flex: 1,
    minHeight: 0,
    backgroundColor: C.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -2,
  },
  teamBand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    gap: 10,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '800',
    color: C.green,
    textAlign: 'center',
  },
  playerNames: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    textAlign: 'center',
  },
  vsBadge: {
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.gold,
  },
  vsText: {
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.5,
  },
  individualBand: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    gap: 6,
  },
  individualTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.green,
    textAlign: 'center',
  },
  individualPlayers: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    textAlign: 'center',
  },
  tableArea: {
    flex: 1,
    minHeight: 0,
    paddingBottom: 4,
  },
  tableAreaCompact: {
    paddingBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: C.cream,
    paddingTop: 8,
    paddingBottom: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.green,
    textAlign: 'center',
  },
});
