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
  useWindowDimensions,
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

/** ActiveGame ile birebir aynı palet. */
const ui = {
  green: '#1F5E3B',
  greenDeep: '#174A2E',
  cream: '#F7F2E8',
  creamHeader: '#EFE8DB',
  gold: '#C8A44D',
  goldSoft: 'rgba(200, 164, 77, 0.55)',
  white: '#FFFFFF',
  text: '#263238',
  textMuted: '#6B736C',
  line: '#D4CBB8',
  border: '#C5BBA8',
  headerMuted: 'rgba(247, 242, 232, 0.78)',
} as const;

const ROW_HEIGHT = 40;
const HEADER_ROW_HEIGHT = 32;

type RoundEntryScreenProps = {
  game: ActiveGameData;
  onBack: () => void;
  onSaveRound: (result: CalculateRoundResult, meta: RoundSaveMeta) => void;
};

function MiniChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.miniChip,
        selected && styles.miniChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.miniChipLabel, selected && styles.miniChipLabelSelected]}
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
      <View style={[styles.colPlayer, styles.gridCell]}>
        <Text style={styles.playerName} numberOfLines={1}>
          {playerName}
        </Text>
      </View>

      <View style={[styles.colDurum, styles.gridCell]}>
        {mode.showOpenedChoice ? (
          <View style={styles.inlineChips}>
            <MiniChip
              label="Açtı"
              selected={opened}
              onPress={() => onSetOpened(true)}
            />
            <MiniChip
              label="Açmadı"
              selected={!opened}
              onPress={() => onSetOpened(false)}
            />
          </View>
        ) : (
          <Text style={styles.cellDash}>—</Text>
        )}
      </View>

      <View style={[styles.colAcilis, styles.gridCell]}>
        {mode.showSeriesDoubles ? (
          <View style={styles.inlineChips}>
            <MiniChip
              label="Seri"
              selected={playerForm.openType === 'series'}
              onPress={() => onSetOpenKind('series')}
            />
            <MiniChip
              label="Çift"
              selected={playerForm.openType === 'doubles'}
              onPress={() => onSetOpenKind('doubles')}
            />
          </View>
        ) : (
          <Text style={styles.cellDash}>—</Text>
        )}
      </View>

      <View style={[styles.colKalan, styles.gridCell, styles.gridCellLast]}>
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
  const { height } = useWindowDimensions();
  const compact = height < 700;

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

  function onFinishSegmentPress(finishType: RoundEntryFinishType) {
    if (finishType === 'none') {
      selectFinisher(null);
      return;
    }
    selectFinishType(finishType);
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

  const leftHeading = isIndividual ? 'OYUNCULAR' : game.teams[0].name;
  const rightHeading = isIndividual ? ' ' : game.teams[1].name;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.header, compact && styles.headerCompact]}>
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
            <Text style={[styles.title, compact && styles.titleCompact]}>
              Yeni El
            </Text>
            <Text style={styles.roundMeta}>
              {currentRound} / {targetRounds}. El
            </Text>
          </View>
          <View style={styles.backSpacer} />
        </View>

        <View style={[styles.body, compact && styles.bodyCompact]}>
          <View style={styles.teamBlocks}>
            <View style={styles.teamBlock}>
              <Text style={styles.teamHeading} numberOfLines={1}>
                {leftHeading}
              </Text>
              {team1Players.map((player) => {
                const selected = form.finisherPlayerId === player.id;
                return (
                  <Pressable
                    key={player.id}
                    accessibilityRole="button"
                    onPress={() => selectFinisher(player.id)}
                    style={({ pressed }) => [
                      styles.finisherButton,
                      compact && styles.finisherButtonCompact,
                      selected && styles.finisherSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.finisherLabel,
                        selected && styles.finisherLabelSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {player.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.teamDivider} />

            <View style={styles.teamBlock}>
              <Text style={styles.teamHeading} numberOfLines={1}>
                {rightHeading}
              </Text>
              {team2Players.map((player) => {
                const selected = form.finisherPlayerId === player.id;
                return (
                  <Pressable
                    key={player.id}
                    accessibilityRole="button"
                    onPress={() => selectFinisher(player.id)}
                    style={({ pressed }) => [
                      styles.finisherButton,
                      compact && styles.finisherButtonCompact,
                      selected && styles.finisherSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.finisherLabel,
                        selected && styles.finisherLabelSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {player.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionTitle}>BİTİŞ TÜRÜ</Text>
          <View style={styles.finishSegment}>
            {FINISH_OPTIONS.map((option, index) => {
              const isNoneOption = option.value === 'none';
              const disabled = finishOptionsDisabled
                ? !isNoneOption
                : isNoneOption;
              const selected = form.finishType === option.value;
              const isLast = index === FINISH_OPTIONS.length - 1;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  disabled={disabled}
                  onPress={() => onFinishSegmentPress(option.value)}
                  style={({ pressed }) => [
                    styles.finishSegmentItem,
                    !isLast && styles.finishSegmentDivider,
                    selected && styles.finishSegmentSelected,
                    disabled && styles.finishSegmentDisabled,
                    pressed && !disabled && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.finishSegmentLabel,
                      compact && styles.finishSegmentLabelCompact,
                      selected && styles.finishSegmentLabelSelected,
                      disabled && styles.finishSegmentLabelDisabled,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showHandAutoNote ? (
            <View style={styles.handNote}>
              <View style={styles.handNoteBox}>
                <Text style={styles.handNoteText}>
                  Diğer oyuncular açmamış sayılacaktır.
                </Text>
              </View>
            </View>
          ) : null}

          {showPlayerTable ? (
            <View style={styles.entryTable}>
              <View style={styles.entryHeader}>
                <View style={[styles.colPlayer, styles.gridCell]}>
                  <Text style={styles.headerCell}>Oyuncu</Text>
                </View>
                <View style={[styles.colDurum, styles.gridCell]}>
                  <Text style={styles.headerCell}>Durum</Text>
                </View>
                <View style={[styles.colAcilis, styles.gridCell]}>
                  <Text style={styles.headerCell}>Açılış</Text>
                </View>
                <View
                  style={[styles.colKalan, styles.gridCell, styles.gridCellLast]}
                >
                  <Text style={styles.headerCell}>Kalan</Text>
                </View>
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

        <View style={[styles.footer, compact && styles.footerCompact]}>
          <Pressable
            accessibilityRole="button"
            onPress={handleDirectSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryButton,
              compact && styles.footerButtonCompact,
              pressed && !saving && styles.pressed,
              saving && styles.disabled,
            ]}
          >
            <Text style={styles.primaryLabel}>ELİ KAYDET</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handlePreview}
            disabled={saving}
            style={({ pressed }) => [
              styles.secondaryButton,
              compact && styles.footerButtonCompact,
              pressed && !saving && styles.pressed,
              saving && styles.disabled,
            ]}
          >
            <Text style={styles.secondaryLabel}>ÖNİZLE</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            disabled={saving}
            style={({ pressed }) => [
              styles.cancelButton,
              compact && styles.footerButtonCompact,
              pressed && !saving && styles.pressed,
            ]}
          >
            <Text style={styles.cancelLabel}>İPTAL</Text>
          </Pressable>
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
  headerCompact: {
    paddingBottom: 4,
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
    fontSize: 17,
    fontWeight: '700',
    color: ui.white,
  },
  titleCompact: {
    fontSize: 16,
  },
  roundMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: ui.headerMuted,
    marginTop: 1,
  },
  body: {
    flex: 1,
    minHeight: 0,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
  },
  bodyCompact: {
    paddingTop: 8,
    gap: 7,
  },
  teamBlocks: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 0,
  },
  teamBlock: {
    flex: 1,
    gap: 6,
    paddingHorizontal: 6,
  },
  teamDivider: {
    width: 1.5,
    backgroundColor: ui.gold,
    alignSelf: 'stretch',
  },
  teamHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: ui.green,
    textAlign: 'center',
    marginBottom: 2,
  },
  finisherButton: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: ui.green,
    backgroundColor: ui.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  finisherButtonCompact: {
    minHeight: 40,
  },
  finisherSelected: {
    backgroundColor: ui.green,
    borderColor: ui.gold,
  },
  finisherLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: ui.green,
    textAlign: 'center',
  },
  finisherLabelSelected: {
    color: ui.white,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ui.green,
  },
  finishSegment: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: ui.gold,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: ui.white,
    minHeight: 42,
  },
  finishSegmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 8,
    backgroundColor: ui.white,
  },
  finishSegmentDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: ui.goldSoft,
  },
  finishSegmentSelected: {
    backgroundColor: ui.green,
  },
  finishSegmentDisabled: {
    opacity: 0.38,
  },
  finishSegmentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ui.green,
    textAlign: 'center',
  },
  finishSegmentLabelCompact: {
    fontSize: 10,
  },
  finishSegmentLabelSelected: {
    color: ui.white,
  },
  finishSegmentLabelDisabled: {
    color: ui.textMuted,
  },
  handNote: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  handNoteBox: {
    width: '100%',
    backgroundColor: ui.creamHeader,
    borderWidth: 1.5,
    borderColor: ui.gold,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  handNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: ui.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  entryTable: {
    borderWidth: 1.5,
    borderColor: ui.gold,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: ui.cream,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: HEADER_ROW_HEIGHT,
    backgroundColor: ui.creamHeader,
    borderBottomWidth: 1.5,
    borderBottomColor: ui.gold,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  gridCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: ui.goldSoft,
  },
  gridCellLast: {
    borderRightWidth: 0,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '800',
    color: ui.green,
    textAlign: 'center',
  },
  colPlayer: {
    width: 72,
  },
  colDurum: {
    flex: 1.35,
  },
  colAcilis: {
    flex: 1.1,
  },
  colKalan: {
    width: 54,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 12,
    fontWeight: '700',
    color: ui.text,
  },
  inlineChips: {
    flexDirection: 'row',
    gap: 3,
  },
  miniChip: {
    flex: 1,
    minHeight: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ui.green,
    backgroundColor: ui.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  miniChipSelected: {
    backgroundColor: ui.green,
    borderColor: ui.gold,
  },
  miniChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ui.green,
  },
  miniChipLabelSelected: {
    color: ui.white,
  },
  cellDash: {
    fontSize: 12,
    color: ui.textMuted,
    textAlign: 'center',
  },
  tileInput: {
    width: 44,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.white,
    color: ui.text,
    fontSize: 13,
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.line,
  },
  footerCompact: {
    paddingTop: 6,
    paddingBottom: 8,
    gap: 6,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: ui.green,
    borderWidth: 1.5,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: ui.white,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: ui.white,
    borderWidth: 1.5,
    borderColor: ui.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: ui.green,
  },
  cancelButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ui.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: ui.textMuted,
  },
  footerButtonCompact: {
    minHeight: 42,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
