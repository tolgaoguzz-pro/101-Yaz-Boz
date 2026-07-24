import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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
import { colors as ui, layout, radii } from '../theme';

const ROW_HEIGHT = layout.tableRowHeight;
const HEADER_ROW_HEIGHT = layout.tableHeaderHeight;

const FINISH_ROW_1 = FINISH_OPTIONS.filter((o) =>
  o.value === 'normal' || o.value === 'fromHand' || o.value === 'okey',
);
const FINISH_ROW_2 = FINISH_OPTIONS.filter(
  (o) => o.value === 'fromHandAndOkey' || o.value === 'none',
);

type RoundEntryScreenProps = {
  game: ActiveGameData;
  onBack: () => void;
  onSaveRound: (result: CalculateRoundResult, meta: RoundSaveMeta) => void;
};

function MiniSeg({
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
        styles.miniSeg,
        selected && styles.miniSegSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.miniSegLabel, selected && styles.miniSegLabelSelected]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
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
  onFocusTiles,
}: {
  playerName: string;
  playerForm: RoundEntryPlayerForm;
  mode: ReturnType<typeof getPlayerCardMode>;
  onSetOpened: (opened: boolean) => void;
  onSetOpenKind: (kind: 'series' | 'doubles') => void;
  onChangeTiles: (value: string) => void;
  onBlurTiles: () => void;
  onFocusTiles: () => void;
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
          <View style={styles.inlineSeg}>
            <MiniSeg
              label="Açtı"
              selected={opened}
              onPress={() => onSetOpened(true)}
            />
            <MiniSeg
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
          <View style={styles.inlineSeg}>
            <MiniSeg
              label="Seri"
              selected={playerForm.openType === 'series'}
              onPress={() => onSetOpenKind('series')}
            />
            <MiniSeg
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
            onFocus={onFocusTiles}
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

function FinisherChip({
  name,
  selected,
  compact,
  onPress,
}: {
  name: string;
  selected: boolean;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
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
        {name}
      </Text>
    </Pressable>
  );
}

export function RoundEntryScreen({
  game,
  onBack,
  onSaveRound,
}: RoundEntryScreenProps) {
  const { height, width } = useWindowDimensions();
  const compact = height < 700 || width < 380;
  const scrollRef = useRef<ScrollView>(null);
  const tableOffsetRef = useRef(0);

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const savingLock = useRef(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  function scrollRowIntoView(rowIndex: number) {
    const y =
      tableOffsetRef.current + HEADER_ROW_HEIGHT + rowIndex * ROW_HEIGHT - 12;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y),
        animated: true,
      });
    });
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

  function renderFinishRow(
    options: typeof FINISH_OPTIONS,
    rowKey: string,
  ) {
    return (
      <View key={rowKey} style={styles.finishRow}>
        {options.map((option, index) => {
          const isNoneOption = option.value === 'none';
          const disabled = finishOptionsDisabled
            ? !isNoneOption
            : isNoneOption;
          const selected = form.finishType === option.value;
          const isLast = index === options.length - 1;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => onFinishSegmentPress(option.value)}
              style={({ pressed }) => [
                styles.finishCell,
                !isLast && styles.finishCellDivider,
                selected && styles.finishCellSelected,
                disabled && styles.finishCellDisabled,
                pressed && !disabled && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.finishCellLabel,
                  compact && styles.finishCellLabelCompact,
                  selected && styles.finishCellLabelSelected,
                  disabled && styles.finishCellLabelDisabled,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
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
          <View style={styles.titleBlock} pointerEvents="none">
            <Text style={styles.title}>Yeni El</Text>
            <Text style={styles.roundMeta}>
              {currentRound} / {targetRounds}. El
            </Text>
          </View>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.sheet}>
          <ScrollView
            ref={scrollRef}
            style={styles.bodyScroll}
            contentContainerStyle={[
              styles.bodyContent,
              compact && styles.bodyContentCompact,
              keyboardVisible && styles.bodyContentKeyboard,
            ]}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={keyboardVisible}
          >
            <Pressable
              accessible={false}
              onPress={Keyboard.dismiss}
              style={[styles.bodyPressable, compact && styles.bodyPressableCompact]}
            >
              {isIndividual ? (
                <View style={styles.individualGrid}>
                  {rosterPlayers.map((player) => (
                    <View key={player.id} style={styles.individualCell}>
                      <FinisherChip
                        name={player.name}
                        selected={form.finisherPlayerId === player.id}
                        compact={compact}
                        onPress={() => selectFinisher(player.id)}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.teamBlocks}>
                  <View style={styles.teamBlock}>
                    <Text style={styles.teamHeading} numberOfLines={1}>
                      {game.teams[0].name}
                    </Text>
                    {team1Players.map((player) => (
                      <FinisherChip
                        key={player.id}
                        name={player.name}
                        selected={form.finisherPlayerId === player.id}
                        compact={compact}
                        onPress={() => selectFinisher(player.id)}
                      />
                    ))}
                  </View>
                  <View style={styles.teamDivider} />
                  <View style={styles.teamBlock}>
                    <Text style={styles.teamHeading} numberOfLines={1}>
                      {game.teams[1].name}
                    </Text>
                    {team2Players.map((player) => (
                      <FinisherChip
                        key={player.id}
                        name={player.name}
                        selected={form.finisherPlayerId === player.id}
                        compact={compact}
                        onPress={() => selectFinisher(player.id)}
                      />
                    ))}
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>Bitiş Türü</Text>
              <View style={styles.finishSegment}>
                {renderFinishRow(FINISH_ROW_1, 'finish-row-1')}
                <View style={styles.finishRowDivider} />
                {renderFinishRow(FINISH_ROW_2, 'finish-row-2')}
              </View>

              {showHandAutoNote ? (
                <View style={styles.handNote}>
                  <Text style={styles.handNoteText}>
                    Diğer oyuncular açmamış sayılacaktır.
                  </Text>
                </View>
              ) : null}

              {showPlayerTable ? (
                <View
                  style={styles.entryTable}
                  onLayout={(event) => {
                    tableOffsetRef.current = event.nativeEvent.layout.y;
                  }}
                >
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
                      style={[
                        styles.colKalan,
                        styles.gridCell,
                        styles.gridCellLast,
                      ]}
                    >
                      <Text style={styles.headerCell}>Kalan</Text>
                    </View>
                  </View>
                  {visiblePlayerIds.map((playerId, rowIndex) => {
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
                        onFocusTiles={() => scrollRowIntoView(rowIndex)}
                      />
                    );
                  })}
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Pressable>
          </ScrollView>

          {!keyboardVisible ? (
            <View style={[styles.footer, compact && styles.footerCompact]}>
              <Pressable
                accessibilityRole="button"
                onPress={onBack}
                disabled={saving}
                style={({ pressed }) => [
                  styles.footerButton,
                  styles.cancelButton,
                  compact && styles.footerButtonCompact,
                  pressed && !saving && styles.pressed,
                ]}
              >
                <Text
                  style={styles.cancelLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  İptal
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handlePreview}
                disabled={saving}
                style={({ pressed }) => [
                  styles.footerButton,
                  styles.secondaryButton,
                  compact && styles.footerButtonCompact,
                  pressed && !saving && styles.pressed,
                  saving && styles.disabled,
                ]}
              >
                <Text
                  style={styles.secondaryLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Önizle
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleDirectSave}
                disabled={saving}
                style={({ pressed }) => [
                  styles.footerButton,
                  styles.primaryButton,
                  compact && styles.footerButtonCompact,
                  pressed && !saving && styles.pressed,
                  saving && styles.disabled,
                ]}
              >
                <Text
                  style={styles.primaryLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  Eli Kaydet
                </Text>
              </Pressable>
            </View>
          ) : null}
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
    paddingBottom: 6,
    backgroundColor: ui.green,
    minHeight: 44,
  },
  headerCompact: {
    paddingBottom: 4,
    minHeight: 40,
  },
  backButton: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 40,
  },
  backLabel: {
    fontSize: 30,
    fontWeight: '300',
    color: ui.white,
    marginTop: -2,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.white,
  },
  roundMeta: {
    fontSize: 10,
    fontWeight: '500',
    color: ui.headerMuted,
    marginTop: 1,
  },
  sheet: {
    flex: 1,
    minHeight: 0,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  bodyScroll: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  bodyContentCompact: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  bodyContentKeyboard: {
    paddingBottom: 20,
  },
  bodyPressable: {
    gap: 8,
  },
  bodyPressableCompact: {
    gap: 6,
  },
  teamBlocks: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  teamBlock: {
    flex: 1,
    gap: 5,
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
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: ui.green,
    textAlign: 'center',
    marginBottom: 1,
  },
  individualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  individualCell: {
    width: '48%',
    flexGrow: 1,
  },
  finisherButton: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: ui.green,
    backgroundColor: ui.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  finisherButtonCompact: {
    minHeight: 36,
  },
  finisherSelected: {
    backgroundColor: ui.green,
    borderColor: ui.gold,
  },
  finisherLabel: {
    fontSize: 13,
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
    letterSpacing: 0.4,
    color: ui.green,
  },
  finishSegment: {
    borderWidth: 1.5,
    borderColor: ui.gold,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: ui.white,
  },
  finishRow: {
    flexDirection: 'row',
    minHeight: 36,
  },
  finishRowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ui.goldSoft,
  },
  finishCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 7,
    backgroundColor: ui.white,
  },
  finishCellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: ui.goldSoft,
  },
  finishCellSelected: {
    backgroundColor: ui.green,
  },
  finishCellDisabled: {
    opacity: 0.38,
  },
  finishCellLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ui.green,
    textAlign: 'center',
  },
  finishCellLabelCompact: {
    fontSize: 11,
  },
  finishCellLabelSelected: {
    color: ui.white,
  },
  finishCellLabelDisabled: {
    color: ui.textMuted,
  },
  handNote: {
    backgroundColor: ui.creamHeader,
    borderWidth: 1,
    borderColor: ui.goldSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  handNoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: ui.textMuted,
    textAlign: 'center',
  },
  entryTable: {
    borderWidth: 1.5,
    borderColor: ui.gold,
    borderRadius: 6,
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
    paddingHorizontal: 3,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: ui.goldSoft,
  },
  gridCellLast: {
    borderRightWidth: 0,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '800',
    color: ui.green,
    textAlign: 'center',
  },
  colPlayer: {
    width: 64,
  },
  colDurum: {
    flex: 1.35,
  },
  colAcilis: {
    flex: 1.05,
  },
  colKalan: {
    width: 50,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 11,
    fontWeight: '700',
    color: ui.text,
  },
  inlineSeg: {
    flexDirection: 'row',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ui.green,
    overflow: 'hidden',
  },
  miniSeg: {
    flex: 1,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    backgroundColor: ui.white,
  },
  miniSegSelected: {
    backgroundColor: ui.green,
  },
  miniSegLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ui.green,
  },
  miniSegLabelSelected: {
    color: ui.white,
  },
  cellDash: {
    fontSize: 12,
    color: ui.textMuted,
    textAlign: 'center',
  },
  tileInput: {
    width: 42,
    height: layout.inputHeight,
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
    flexDirection: 'row',
    backgroundColor: ui.cream,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.line,
  },
  footerCompact: {
    paddingTop: 6,
    paddingBottom: 6,
    gap: 6,
  },
  footerButton: {
    flex: 1,
    minHeight: layout.buttonHeight,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  footerButtonCompact: {
    minHeight: layout.buttonHeightCompact,
  },
  primaryButton: {
    flex: 1.2,
    backgroundColor: ui.green,
    borderWidth: 1.5,
    borderColor: ui.gold,
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: ui.white,
  },
  secondaryButton: {
    backgroundColor: ui.white,
    borderWidth: 1.5,
    borderColor: ui.green,
  },
  secondaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ui.green,
  },
  cancelButton: {
    backgroundColor: ui.white,
    borderWidth: 1,
    borderColor: ui.goldSoft,
  },
  cancelLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ui.textMuted,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
