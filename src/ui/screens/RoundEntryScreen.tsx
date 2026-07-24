import { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CalculateRoundResult } from '../../engine/calculateRound';
import { RoundSaveMeta } from '../applyGameUpdates';
import { resolveGameMode } from '../gameMode';
import { playersFromActiveGame } from '../gameRoster';
import {
  createInitialRoundEntryForm,
  parseNonNegativeNumber,
} from '../roundEntry/buildRoundInput';
import { computeRoundFromForm } from '../roundEntry/computeRound';
import { FINISH_OPTIONS } from '../roundEntry/finishLabels';
import {
  applyImpliedOpenTypes,
  getPlayerCardMode,
  getVisiblePlayerIds,
  isHandStyleFinish,
  shouldShowPlayerEntryCards,
} from '../roundEntry/playerFieldRules';
import {
  buildRoundPreviewError,
  buildRoundPreviewState,
  CLOSED_ROUND_PREVIEW,
  RoundPreviewState,
} from '../roundEntry/previewState';
import {
  RoundEntryFinishType,
  RoundEntryForm,
  RoundEntryPlayerForm,
} from '../roundEntry/types';
import { resolveTargetRoundCount } from '../targetRoundCount';
import { ActiveGameData } from './ActiveGameScreen';
import { RoundPreviewScreen } from './RoundPreviewScreen';

/** Referans Yeni El paleti. */
const ui = {
  green: '#1F5E3B',
  greenDeep: '#174A2E',
  cream: '#F7F2E8',
  gold: '#C8A44D',
  white: '#FFFFFF',
  text: '#263238',
  textMuted: '#7A847C',
  line: '#D9D2C4',
  border: '#C5BBA8',
} as const;

type RoundEntryScreenProps = {
  game: ActiveGameData;
  onBack: () => void;
  onSaveRound: (result: CalculateRoundResult, meta: RoundSaveMeta) => void;
};

type ChipProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  compact?: boolean;
};

function Chip({
  label,
  selected,
  disabled = false,
  onPress,
  compact = false,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          compact && styles.chipLabelCompact,
          selected && styles.chipLabelSelected,
          disabled && styles.chipLabelDisabled,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PlayerEntryRow({
  playerName,
  playerForm,
  mode,
  onSetOpened,
  onSetOpenKind,
  onChangeTiles,
  onBlurTiles,
}: {
  playerName: string;
  playerForm: RoundEntryPlayerForm;
  mode: ReturnType<typeof getPlayerCardMode>;
  onSetOpened: (opened: boolean) => void;
  onSetOpenKind: (kind: 'series' | 'doubles') => void;
  onChangeTiles: (value: string) => void;
  onBlurTiles: () => void;
}) {
  const opened = playerForm.openType !== 'didNotOpen';

  return (
    <View style={styles.entryRow}>
      <Text style={styles.colPlayer} numberOfLines={1}>
        {playerName}
      </Text>

      <View style={styles.colDurum}>
        {mode.showOpenedChoice ? (
          <View style={styles.inlineChips}>
            <Chip
              compact
              label="Açtı"
              selected={opened}
              onPress={() => onSetOpened(true)}
            />
            <Chip
              compact
              label="Açmadı"
              selected={!opened}
              onPress={() => onSetOpened(false)}
            />
          </View>
        ) : (
          <Text style={styles.cellDash}>—</Text>
        )}
      </View>

      <View style={styles.colAcilis}>
        {mode.showSeriesDoubles ? (
          <View style={styles.inlineChips}>
            <Chip
              compact
              label="Seri"
              selected={playerForm.openType === 'series'}
              onPress={() => onSetOpenKind('series')}
            />
            <Chip
              compact
              label="Çift"
              selected={playerForm.openType === 'doubles'}
              onPress={() => onSetOpenKind('doubles')}
            />
          </View>
        ) : (
          <Text style={styles.cellDash}>—</Text>
        )}
      </View>

      <View style={styles.colKalan}>
        {mode.showRemainingTiles ? (
          <TextInput
            keyboardType="number-pad"
            value={playerForm.remainingTilePointsText}
            selectTextOnFocus
            onChangeText={onChangeTiles}
            onBlur={onBlurTiles}
            placeholderTextColor={ui.textMuted}
            style={styles.tileInput}
          />
        ) : (
          <Text style={styles.cellDash}>—</Text>
        )}
      </View>
    </View>
  );
}

export function RoundEntryScreen({
  game,
  onBack,
  onSaveRound,
}: RoundEntryScreenProps) {
  const rosterPlayers = useMemo(() => playersFromActiveGame(game), [game]);
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const targetRounds = resolveTargetRoundCount(game.targetRoundCount);
  const currentRound = game.rounds.length + 1;

  const [form, setForm] = useState<RoundEntryForm>(() =>
    createInitialRoundEntryForm(rosterPlayers),
  );
  const [previewState, setPreviewState] =
    useState<RoundPreviewState>(CLOSED_ROUND_PREVIEW);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingLock = useRef(false);

  const finishOptionsDisabled = form.finisherPlayerId === null;
  const visiblePlayerIds = getVisiblePlayerIds(form);
  const showPlayerTable = shouldShowPlayerEntryCards(form);
  const showHandAutoNote =
    form.finisherPlayerId !== null && isHandStyleFinish(form.finishType);

  const team1Players = rosterPlayers.slice(0, 2);
  const team2Players = rosterPlayers.slice(2, 4);

  function clearPreview() {
    setPreviewState(CLOSED_ROUND_PREVIEW);
  }

  function setFormAndNormalize(
    updater: (current: RoundEntryForm) => RoundEntryForm,
  ) {
    clearPreview();
    setError(null);
    setForm((current) => applyImpliedOpenTypes(updater(current)));
  }

  function selectFinisher(playerId: string | null) {
    setFormAndNormalize((current) => ({
      ...current,
      finisherPlayerId: playerId,
      finishType:
        playerId === null
          ? 'none'
          : current.finishType === 'none'
            ? 'normal'
            : current.finishType,
    }));
  }

  function selectFinishType(finishType: RoundEntryFinishType) {
    if (form.finisherPlayerId === null && finishType !== 'none') {
      return;
    }
    if (finishType === 'none' && form.finisherPlayerId !== null) {
      return;
    }
    setFormAndNormalize((current) => ({ ...current, finishType }));
  }

  function updatePlayer(
    playerId: string,
    patch: Partial<RoundEntryPlayerForm>,
  ) {
    setFormAndNormalize((current) => ({
      ...current,
      players: current.players.map((player) =>
        player.playerId === playerId ? { ...player, ...patch } : player,
      ),
    }));
  }

  function setOpened(playerId: string, opened: boolean) {
    if (opened) {
      updatePlayer(playerId, { openType: 'series' });
      return;
    }
    updatePlayer(playerId, {
      openType: 'didNotOpen',
      remainingTilePointsText: '0',
    });
  }

  function setOpenKind(playerId: string, openType: 'series' | 'doubles') {
    updatePlayer(playerId, { openType });
  }

  function commitSave(result: CalculateRoundResult, meta: RoundSaveMeta) {
    if (savingLock.current || saving) {
      return;
    }
    savingLock.current = true;
    setSaving(true);
    Keyboard.dismiss();
    onSaveRound(result, meta);
  }

  function handlePreview() {
    Keyboard.dismiss();
    const outcome = computeRoundFromForm(form, game);
    if (!outcome.ok) {
      setPreviewState(buildRoundPreviewError(outcome.error));
      setError(outcome.error);
      return;
    }
    setError(null);
    setPreviewState(
      buildRoundPreviewState({
        result: outcome.result,
        meta: outcome.meta,
      }),
    );
  }

  function handleDirectSave() {
    Keyboard.dismiss();
    if (savingLock.current || saving) {
      return;
    }
    const outcome = computeRoundFromForm(form, game);
    if (!outcome.ok) {
      setError(outcome.error);
      setPreviewState(buildRoundPreviewError(outcome.error));
      return;
    }
    setError(null);
    commitSave(outcome.result, outcome.meta);
  }

  function handleSaveFromPreview() {
    if (
      !previewState.visible ||
      !previewState.result ||
      !previewState.meta ||
      savingLock.current ||
      saving
    ) {
      return;
    }
    commitSave(previewState.result, previewState.meta);
  }

  const nameByPlayerId = useMemo(() => {
    const map = new Map<string, string>();
    for (const player of rosterPlayers) {
      map.set(player.id, player.name);
    }
    return map;
  }, [rosterPlayers]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Yeni El</Text>
            <Text style={styles.roundMeta}>
              {currentRound} / {targetRounds}. El
            </Text>
          </View>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.body}>
          <View style={styles.teamBlocks}>
            <View style={styles.teamBlock}>
              <Text style={styles.teamHeading} numberOfLines={1}>
                {isIndividual ? 'Oyuncular' : game.teams[0].name}
              </Text>
              {team1Players.map((player) => (
                <Chip
                  key={player.id}
                  label={player.name}
                  selected={form.finisherPlayerId === player.id}
                  onPress={() => selectFinisher(player.id)}
                />
              ))}
            </View>
            <View style={styles.teamDivider} />
            <View style={styles.teamBlock}>
              <Text style={styles.teamHeading} numberOfLines={1}>
                {isIndividual ? ' ' : game.teams[1].name}
              </Text>
              {team2Players.map((player) => (
                <Chip
                  key={player.id}
                  label={player.name}
                  selected={form.finisherPlayerId === player.id}
                  onPress={() => selectFinisher(player.id)}
                />
              ))}
            </View>
          </View>

          <Chip
            label="Bitmedi"
            selected={form.finisherPlayerId === null}
            onPress={() => selectFinisher(null)}
          />

          <Text style={styles.sectionTitle}>BİTİŞ TÜRÜ</Text>
          <View style={styles.finishGrid}>
            {FINISH_OPTIONS.map((option) => {
              const isNoneOption = option.value === 'none';
              const disabled = finishOptionsDisabled
                ? !isNoneOption
                : isNoneOption;
              return (
                <View key={option.value} style={styles.finishCell}>
                  <Chip
                    label={option.label}
                    selected={form.finishType === option.value}
                    disabled={disabled}
                    onPress={() => selectFinishType(option.value)}
                  />
                </View>
              );
            })}
          </View>

          {showHandAutoNote ? (
            <View style={styles.handNote}>
              <Text style={styles.handNoteText}>
                Diğer oyuncular açmamış sayılır.
              </Text>
            </View>
          ) : null}

          {showPlayerTable ? (
            <View style={styles.entryTable}>
              <View style={styles.entryHeader}>
                <Text style={[styles.colPlayer, styles.headerCell]}>
                  Oyuncu
                </Text>
                <Text style={[styles.colDurum, styles.headerCell]}>Durum</Text>
                <Text style={[styles.colAcilis, styles.headerCell]}>
                  Açılış
                </Text>
                <Text style={[styles.colKalan, styles.headerCell]}>Kalan</Text>
              </View>
              {visiblePlayerIds.map((playerId) => {
                const playerForm = form.players.find(
                  (p) => p.playerId === playerId,
                );
                const playerName = nameByPlayerId.get(playerId);
                if (!playerForm || !playerName) {
                  return null;
                }
                const mode = getPlayerCardMode(form, playerId);
                return (
                  <PlayerEntryRow
                    key={playerId}
                    playerName={playerName}
                    playerForm={playerForm}
                    mode={mode}
                    onSetOpened={(opened) => setOpened(playerId, opened)}
                    onSetOpenKind={(kind) => setOpenKind(playerId, kind)}
                    onChangeTiles={(value) =>
                      updatePlayer(playerId, {
                        remainingTilePointsText: value,
                      })
                    }
                    onBlurTiles={() =>
                      updatePlayer(playerId, {
                        remainingTilePointsText: String(
                          parseNonNegativeNumber(
                            playerForm.remainingTilePointsText,
                          ),
                        ),
                      })
                    }
                  />
                );
              })}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={handleDirectSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !saving && styles.pressed,
              saving && styles.disabled,
            ]}
          >
            <Text style={styles.primaryLabel}>Eli Kaydet</Text>
          </Pressable>
          <View style={styles.footerSecondary}>
            <Pressable
              accessibilityRole="button"
              onPress={handlePreview}
              disabled={saving}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && !saving && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              <Text style={styles.secondaryLabel}>Önizle</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              disabled={saving}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && !saving && styles.pressed,
              ]}
            >
              <Text style={styles.cancelLabel}>İptal</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={previewState.visible && previewState.result != null}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={clearPreview}
      >
        {previewState.result && previewState.meta ? (
          <RoundPreviewScreen
            game={game}
            result={previewState.result}
            meta={previewState.meta}
            saving={saving}
            onBack={clearPreview}
            onSave={handleSaveFromPreview}
          />
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ui.green,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: ui.green,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 40,
  },
  backLabel: {
    fontSize: 32,
    fontWeight: '300',
    color: ui.white,
    marginTop: -2,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.white,
  },
  roundMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(247, 242, 232, 0.78)',
  },
  body: {
    flex: 1,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 8,
  },
  teamBlocks: {
    flexDirection: 'row',
    gap: 10,
  },
  teamBlock: {
    flex: 1,
    gap: 6,
  },
  teamDivider: {
    width: 1.5,
    backgroundColor: ui.gold,
    alignSelf: 'stretch',
    opacity: 0.85,
  },
  teamHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: ui.green,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ui.green,
    marginTop: 2,
  },
  finishGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  finishCell: {
    width: '31.5%',
    flexGrow: 1,
  },
  chip: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.green,
    backgroundColor: ui.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chipCompact: {
    minHeight: 28,
    paddingHorizontal: 6,
    flex: 1,
  },
  chipSelected: {
    backgroundColor: ui.green,
    borderColor: ui.gold,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipPressed: {
    opacity: 0.82,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ui.green,
    textAlign: 'center',
  },
  chipLabelCompact: {
    fontSize: 11,
  },
  chipLabelSelected: {
    color: ui.white,
  },
  chipLabelDisabled: {
    color: ui.textMuted,
  },
  handNote: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  handNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: ui.textMuted,
    textAlign: 'center',
  },
  entryTable: {
    flexGrow: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.line,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
    gap: 4,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: ui.green,
  },
  colPlayer: {
    width: 68,
    fontSize: 13,
    fontWeight: '700',
    color: ui.text,
  },
  colDurum: {
    flex: 1.35,
  },
  colAcilis: {
    flex: 1.15,
  },
  colKalan: {
    width: 52,
    alignItems: 'center',
  },
  inlineChips: {
    flexDirection: 'row',
    gap: 4,
  },
  cellDash: {
    fontSize: 12,
    color: ui.textMuted,
    textAlign: 'center',
  },
  tileInput: {
    width: 48,
    minHeight: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.white,
    color: ui.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    color: ui.greenDeep,
    backgroundColor: ui.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  footer: {
    backgroundColor: ui.cream,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.line,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: ui.green,
    borderWidth: 1,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.white,
  },
  footerSecondary: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: ui.white,
    borderWidth: 1,
    borderColor: ui.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ui.green,
  },
  cancelButton: {
    minWidth: 88,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ui.textMuted,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
