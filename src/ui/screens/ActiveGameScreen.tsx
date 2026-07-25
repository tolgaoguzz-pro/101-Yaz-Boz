import {
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
import {
  ScoreSheetTable,
  activeMintSurface,
} from '../components/ScoreSheetTable';
import { buildScoreSheet } from '../scoreSheet';
import { resolveTargetRoundCount } from '../targetRoundCount';

const palette = {
  background: '#0B3A2D',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelLight: '#E8EFEA',
  border: '#B7CBBE',
  textGreen: '#17513D',
  accent: '#B58A43',
  white: '#FFFFFF',
  teamName: '#174333',
  playerMuted: 'rgba(23,67,51,0.68)',
  progress: 'rgba(255,255,255,0.92)',
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
  const compact = height < 700 || width < 380;
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const playedRounds = game.rounds.length;
  const targetRounds = resolveTargetRoundCount(game.targetRoundCount);
  const model = useMemo(() => buildScoreSheet(game), [game]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<'finish' | 'abandon' | null>(
    null,
  );

  function openActions() {
    setActionsOpen(true);
  }

  // Native Alert.alert (Dialog) Android'de window dimensions'ı bozuyor;
  // Bitir/İptal sonrası Home compact görünüyordu. Onay aynı metinlerle
  // uygulama içi overlay'de (Modal/Alert değil) gösterilir.
  const showConfirm = !actionsOpen && confirmKind !== null;
  const confirmCopy =
    confirmKind === 'finish'
      ? {
          title: 'Oyunu bitir',
          message:
            'Oyun planlanan el sayısına ulaşmadan bitirilecek. Devam edilsin mi?',
          confirmLabel: 'Bitir',
          onConfirm: onFinishEarly,
        }
      : confirmKind === 'abandon'
        ? {
            title: 'Oyunu iptal et',
            message: 'Bu oyun silinir ve sonuç sayılmaz. Emin misin?',
            confirmLabel: 'İptal Et',
            onConfirm: onAbandon,
          }
        : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
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
            <View style={styles.backChevron} />
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
            <View style={styles.menuDots}>
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
            </View>
          </Pressable>
        </View>

        <View style={styles.progressRow}>
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
            <View style={styles.pauseGlyph}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
            <Text style={styles.durdurLabel}>Durdur</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        {isIndividual ? (
          <View style={styles.teamBand}>
            <Text style={styles.teamName}>Bireysel Skor</Text>
            <Text style={styles.playerNames} numberOfLines={2}>
              {model.playerNames.join(' · ')}
            </Text>
          </View>
        ) : (
          <View style={styles.teamBand}>
            <View style={styles.teamSide}>
              <Text style={styles.teamName} numberOfLines={1}>
                {game.teams[0].name}
              </Text>
              <Text style={styles.playerNames} numberOfLines={1}>
                {game.teams[0].players[0].name} &{' '}
                {game.teams[0].players[1].name}
              </Text>
            </View>
            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
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

        <View style={styles.tableShell}>
          <ScoreSheetTable
            model={model}
            compact={compact}
            bodyRowBoost={3}
            emphasizeHeader
            surface={activeMintSurface}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yeni el"
          onPress={onNewRound}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={styles.actionLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Yeni El
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ceza ekle"
          onPress={onAddPenalty}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={styles.actionLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Ceza Ekle
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="İşlemler"
          onPress={openActions}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={styles.actionLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            İşlemler
          </Text>
        </Pressable>
      </View>

      {actionsOpen ? (
        <GameActionsSheet
          visible
          onClose={() => setActionsOpen(false)}
          onPause={onPause}
          onFinishEarly={() => setConfirmKind('finish')}
          onAbandon={() => setConfirmKind('abandon')}
        />
      ) : null}

      {showConfirm && confirmCopy ? (
        <View style={styles.confirmRoot} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vazgeç"
            style={styles.confirmBackdrop}
            onPress={() => setConfirmKind(null)}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{confirmCopy.title}</Text>
            <Text style={styles.confirmMessage}>{confirmCopy.message}</Text>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vazgeç"
                onPress={() => setConfirmKind(null)}
                style={({ pressed }) => [
                  styles.confirmCancelBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmCancelLabel}>Vazgeç</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={confirmCopy.confirmLabel}
                onPress={() => {
                  const run = confirmCopy.onConfirm;
                  setConfirmKind(null);
                  run();
                }}
                style={({ pressed }) => [
                  styles.confirmDangerBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmDangerLabel}>
                  {confirmCopy.confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: palette.background,
  },
  confirmRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,18,14,0.55)',
  },
  confirmCard: {
    backgroundColor: palette.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.teamName,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.playerMuted,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  confirmCancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textGreen,
  },
  confirmDangerBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8A6A0',
    backgroundColor: '#F0D7D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDangerLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8B2E25',
  },
  header: {
    backgroundColor: palette.background,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  backChevron: {
    width: 12,
    height: 12,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  menuDots: {
    height: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.white,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: -0.4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  progressText: {
    flex: 1,
    gap: 2,
  },
  progressLine: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
    color: palette.progress,
  },
  durdurBtn: {
    height: 52,
    minWidth: 112,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pauseGlyph: {
    flexDirection: 'row',
    gap: 3,
  },
  pauseBar: {
    width: 3,
    height: 12,
    borderRadius: 1,
    backgroundColor: palette.white,
  },
  durdurLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.white,
  },
  panel: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 16,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  teamBand: {
    backgroundColor: palette.panel,
    paddingTop: 26,
    paddingBottom: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  teamName: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.teamName,
    textAlign: 'center',
  },
  playerNames: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.playerMuted,
    textAlign: 'center',
  },
  vsBadge: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: palette.dark,
    borderWidth: 2,
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: 0.5,
  },
  tableShell: {
    flex: 1,
    minHeight: 0,
    backgroundColor: palette.panelLight,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  actionButton: {
    flex: 1,
    height: 74,
    borderRadius: 18,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textGreen,
    textAlign: 'center',
  },
});
