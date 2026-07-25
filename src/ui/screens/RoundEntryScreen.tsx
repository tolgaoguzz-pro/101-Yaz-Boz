import { useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
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
import {
  NumericKeyboardAccessory,
  NumericKeyboardAndroidDock,
  numericTextInputProps,
  useNumericKeyboard,
} from '../components/NumericKeyboardAccessory';
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

const palette = {
  background: '#0B3A2D',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelLight: '#EAF1EC',
  panelMuted: '#C9D8CF',
  border: '#B7CBBE',
  borderStrong: '#AFC5B8',
  textDark: '#142D25',
  textGreen: '#174333',
  textMuted: 'rgba(23,67,51,0.62)',
  placeholder: 'rgba(20,45,37,0.42)',
  accent: '#B58A43',
  white: '#FFFFFF',
  headerHint: 'rgba(255,255,255,0.62)',
  cancelBorder: 'rgba(255,255,255,0.55)',
  errorBg: '#F3D8D4',
  errorBorder: '#D9A39B',
  errorText: '#8B2E25',
} as const;

type Density = 'normal' | 'compact' | 'ultraCompact';

type RoundEntryScreenProps = {
  game: ActiveGameData;
  onBack: () => void;
  onSaveRound: (result: CalculateRoundResult, meta: RoundSaveMeta) => void;
};

function MiniSeg({
  label,
  selected,
  onPress,
  dense,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  dense?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.miniSeg,
        dense && styles.miniSegDense,
        selected && styles.miniSegSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.miniSegLabel, selected && styles.miniSegLabelSelected]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FinisherChip({
  name,
  selected,
  onPress,
}: {
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.finisherButton,
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
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {name}
      </Text>
    </Pressable>
  );
}

function FormShell({
  keyboardVisible,
  scrollRef,
  density,
  children,
}: {
  keyboardVisible: boolean;
  scrollRef: RefObject<ScrollView | null>;
  density: Density;
  children: ReactNode;
}) {
  const contentStyle = [
    styles.panelBody,
    density === 'compact' && styles.panelBodyCompact,
    density === 'ultraCompact' && styles.panelBodyUltra,
    keyboardVisible && styles.panelBodyKeyboard,
  ];

  // View↔ScrollView geçişi TextInput'u unmount edip focus/klavye'yi öldürür.
  // Aynı ScrollView örneğinde kal; kapalıyken kaydırmayı kilitle.
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={contentStyle}
      scrollEnabled={keyboardVisible}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  );
}

export function RoundEntryScreen({
  game,
  onBack,
  onSaveRound,
}: RoundEntryScreenProps) {
  const { height, width } = useWindowDimensions();
  const density: Density =
    height < 700 ? 'ultraCompact' : height < 800 ? 'compact' : 'normal';
  const ultra = density === 'ultraCompact';
  const finishWrap = width < 380;
  const scrollRef = useRef<ScrollView>(null);
  const penaltiesOffsetRef = useRef(0);

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

  const numericPlayerIds = useMemo(() => {
    if (!showPlayerTable) {
      return [] as string[];
    }
    return visiblePlayerIds.filter(
      (playerId) => getPlayerCardMode(form, playerId).showRemainingTiles,
    );
  }, [form, showPlayerTable, visiblePlayerIds]);

  const numberPad = useNumericKeyboard(numericPlayerIds.length);
  const keyboardVisible = numberPad.keyboardVisible;
  const focusedPlayerId =
    numberPad.activeIndex !== null
      ? (numericPlayerIds[numberPad.activeIndex] ?? null)
      : null;

  const showOpenRow =
    showPlayerTable &&
    visiblePlayerIds.some(
      (playerId) => getPlayerCardMode(form, playerId).showOpenedChoice,
    );
  const showKindRow =
    showPlayerTable &&
    visiblePlayerIds.some(
      (playerId) => getPlayerCardMode(form, playerId).showSeriesDoubles,
    );
  const showTilesRow = numericPlayerIds.length > 0;

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

  function scrollPenaltiesIntoView(columnIndex: number) {
    const y = Math.max(0, penaltiesOffsetRef.current - 12 + columnIndex * 2);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y, animated: true });
      }, 120);
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

  function renderFinishOptions(options: typeof FINISH_OPTIONS) {
    return options.map((option, index) => {
      const isNoneOption = option.value === 'none';
      // Bitmedi her zaman seçilebilir; diğerleri bitiren yokken pasif.
      const disabled = !isNoneOption && finishOptionsDisabled;
      const selected = form.finishType === option.value;
      const isLast = index === options.length - 1;
      const isWideLabel = option.value === 'fromHandAndOkey';

      return (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onFinishSegmentPress(option.value)}
          style={({ pressed }) => [
            styles.finishCell,
            isWideLabel && styles.finishCellWide,
            finishWrap && styles.finishCellWrap,
            !isLast && !finishWrap && styles.finishCellDivider,
            selected && styles.finishCellSelected,
            disabled && styles.finishCellDisabled,
            pressed && !disabled && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.finishCellLabel,
              selected && styles.finishCellLabelSelected,
              disabled && styles.finishCellLabelDisabled,
            ]}
            numberOfLines={1}
            allowFontScaling={false}
            ellipsizeMode="clip"
          >
            {option.label}
          </Text>
        </Pressable>
      );
    });
  }

  const hideHeaderHint = ultra || keyboardVisible;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.header,
            density !== 'normal' && styles.headerCompact,
            ultra && styles.headerUltra,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.backChevron} />
          </Pressable>
          <View style={styles.titleBlock} pointerEvents="none">
            <Text style={styles.title}>Yeni El</Text>
            {!hideHeaderHint ? (
              <Text style={styles.headerHint}>Bu el için bilgileri girin</Text>
            ) : null}
          </View>
          <View style={styles.backSpacer} />
        </View>

        <View
          style={[
            styles.panel,
            density === 'compact' && styles.panelCompact,
            ultra && styles.panelUltra,
          ]}
        >
          <FormShell
            keyboardVisible={keyboardVisible}
            scrollRef={scrollRef}
            density={density}
          >
            <View
              style={[
                styles.formStack,
                density === 'compact' && styles.formStackCompact,
                ultra && styles.formStackUltra,
              ]}
            >
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitleSm}>Oyun Bilgileri</Text>
                  <View style={styles.roundBadge}>
                    <Text style={styles.roundBadgeText}>
                      El: {currentRound} / {targetRounds}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.vsCard,
                    density !== 'normal' && styles.vsCardCompact,
                    ultra && styles.vsCardUltra,
                  ]}
                >
                  {isIndividual ? (
                    <View style={styles.vsIndividual}>
                      <Text style={styles.vsTeamName} numberOfLines={1}>
                        Bireysel Skor
                      </Text>
                      <Text style={styles.vsPlayersLine} numberOfLines={1}>
                        {rosterPlayers
                          .map((player) => player.name)
                          .join(' · ')}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.vsRow}>
                      <View style={styles.vsSide}>
                        <Text style={styles.vsTeamName} numberOfLines={1}>
                          {game.teams[0].name}
                        </Text>
                        <Text style={styles.vsScore}>
                          {game.teams[0].totalScore}
                        </Text>
                      </View>
                      <View
                        style={[styles.vsBadge, ultra && styles.vsBadgeUltra]}
                      >
                        <Text
                          style={[
                            styles.vsBadgeText,
                            ultra && styles.vsBadgeTextUltra,
                          ]}
                        >
                          VS
                        </Text>
                      </View>
                      <View style={styles.vsSide}>
                        <Text style={styles.vsTeamName} numberOfLines={1}>
                          {game.teams[1].name}
                        </Text>
                        <Text style={styles.vsScore}>
                          {game.teams[1].totalScore}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.outcomeBlock}>
                <Text style={styles.sectionTitleMd}>Elin Sonucu</Text>

                {isIndividual ? (
                  <View style={styles.finisherGrid}>
                    {rosterPlayers.map((player) => (
                      <View key={player.id} style={styles.finisherCell}>
                        <FinisherChip
                          name={player.name}
                          selected={form.finisherPlayerId === player.id}
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
                          onPress={() => selectFinisher(player.id)}
                        />
                      ))}
                    </View>
                    <View style={styles.teamBlock}>
                      <Text style={styles.teamHeading} numberOfLines={1}>
                        {game.teams[1].name}
                      </Text>
                      {team2Players.map((player) => (
                        <FinisherChip
                          key={player.id}
                          name={player.name}
                          selected={form.finisherPlayerId === player.id}
                          onPress={() => selectFinisher(player.id)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                <View
                  style={[
                    styles.finishSegment,
                    finishWrap && styles.finishSegmentWrap,
                  ]}
                >
                  {finishWrap ? (
                    <>
                      <View style={styles.finishRow}>
                        {renderFinishOptions(FINISH_OPTIONS.slice(0, 3))}
                      </View>
                      <View style={styles.finishRowDivider} />
                      <View style={styles.finishRow}>
                        {renderFinishOptions(FINISH_OPTIONS.slice(3))}
                      </View>
                    </>
                  ) : (
                    <View style={styles.finishRow}>
                      {renderFinishOptions(FINISH_OPTIONS)}
                    </View>
                  )}
                </View>

                {showHandAutoNote ? (
                  <Text style={styles.tinyHint}>
                    Diğerleri açmamış sayılır
                  </Text>
                ) : null}

                {showOpenRow ? (
                  <View style={styles.openStatusRow}>
                    <Text style={styles.openStatusLabel}>Açılış</Text>
                    <View style={styles.openStatusPlayers}>
                      {visiblePlayerIds.map((playerId) => {
                        const playerForm = form.players.find(
                          (p) => p.playerId === playerId,
                        );
                        const mode = getPlayerCardMode(form, playerId);
                        if (!playerForm || !mode.showOpenedChoice) {
                          return (
                            <View key={playerId} style={styles.openPlayerSlot}>
                              <Text style={styles.cellDash}>—</Text>
                            </View>
                          );
                        }
                        const opened = playerForm.openType !== 'didNotOpen';
                        return (
                          <View key={playerId} style={styles.openPlayerSlot}>
                            <View style={styles.inlineSeg}>
                              <MiniSeg
                                label="Aç"
                                selected={opened}
                                dense
                                onPress={() => setOpened(playerId, true)}
                              />
                              <MiniSeg
                                label="Yok"
                                selected={!opened}
                                dense
                                onPress={() => setOpened(playerId, false)}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {showOpenRow ? (
                  <Text style={styles.tinyHint}>Açılmadıysa 202 ceza</Text>
                ) : null}
              </View>

              {showPlayerTable ? (
                <View
                  onLayout={(event) => {
                    penaltiesOffsetRef.current = event.nativeEvent.layout.y;
                  }}
                  style={styles.penaltiesBlock}
                >
                  <Text style={styles.sectionTitleMd}>Oyuncu Cezaları</Text>
                  <View style={styles.penaltiesPanel}>
                    <View style={styles.penaltiesRow}>
                      <View style={styles.rowLabelCell}>
                        <Text style={styles.rowLabel}>Oyuncu</Text>
                      </View>
                      {visiblePlayerIds.map((playerId) => (
                        <View key={playerId} style={styles.playerCol}>
                          <Text style={styles.playerColName} numberOfLines={1}>
                            {nameByPlayerId.get(playerId) ?? '—'}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {showKindRow ? (
                      <View style={styles.penaltiesRow}>
                        <View style={styles.rowLabelCell}>
                          <Text style={styles.rowLabel}>Tür</Text>
                        </View>
                        {visiblePlayerIds.map((playerId) => {
                          const playerForm = form.players.find(
                            (p) => p.playerId === playerId,
                          );
                          const mode = getPlayerCardMode(form, playerId);
                          if (!playerForm || !mode.showSeriesDoubles) {
                            return (
                              <View key={playerId} style={styles.playerCol}>
                                <Text style={styles.cellDash}>—</Text>
                              </View>
                            );
                          }
                          return (
                            <View key={playerId} style={styles.playerCol}>
                              <View style={styles.inlineSeg}>
                                <MiniSeg
                                  label="Seri"
                                  selected={playerForm.openType === 'series'}
                                  dense
                                  onPress={() =>
                                    setOpenKind(playerId, 'series')
                                  }
                                />
                                <MiniSeg
                                  label="Çift"
                                  selected={playerForm.openType === 'doubles'}
                                  dense
                                  onPress={() =>
                                    setOpenKind(playerId, 'doubles')
                                  }
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    {showTilesRow ? (
                      <View style={styles.penaltiesRow}>
                        <View style={styles.rowLabelCell}>
                          <Text style={styles.rowLabel}>Kalan</Text>
                        </View>
                        {visiblePlayerIds.map((playerId, columnIndex) => {
                          const playerForm = form.players.find(
                            (p) => p.playerId === playerId,
                          );
                          const mode = getPlayerCardMode(form, playerId);
                          if (!playerForm || !mode.showRemainingTiles) {
                            return (
                              <View key={playerId} style={styles.playerCol}>
                                <Text style={styles.cellDash}>—</Text>
                              </View>
                            );
                          }
                          const padIndex = numericPlayerIds.indexOf(playerId);
                          const padBind =
                            padIndex >= 0 ? numberPad.bind(padIndex) : null;
                          const focused = focusedPlayerId === playerId;
                          return (
                            <View key={playerId} style={styles.playerCol}>
                              <TextInput
                                ref={padBind?.ref}
                                {...numericTextInputProps}
                                inputAccessoryViewID={
                                  padBind?.inputAccessoryViewID
                                }
                                value={playerForm.remainingTilePointsText}
                                onChangeText={(value) =>
                                  updatePlayer(playerId, {
                                    remainingTilePointsText: value,
                                  })
                                }
                                onBlur={() => {
                                  setFormAndNormalize((current) => ({
                                    ...current,
                                    players: current.players.map((player) =>
                                      player.playerId === playerId
                                        ? {
                                            ...player,
                                            remainingTilePointsText: String(
                                              parseNonNegativeNumber(
                                                player.remainingTilePointsText,
                                              ),
                                            ),
                                          }
                                        : player,
                                    ),
                                  }));
                                }}
                                onFocus={() => {
                                  padBind?.onFocus();
                                  if (keyboardVisible) {
                                    scrollPenaltiesIntoView(columnIndex);
                                  }
                                }}
                                placeholderTextColor={palette.placeholder}
                                style={[
                                  styles.tileInput,
                                  focused && styles.tileInputFocused,
                                ]}
                              />
                            </View>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {error ? (
                <Text style={styles.error} numberOfLines={2}>
                  {error}
                </Text>
              ) : null}
            </View>
          </FormShell>
        </View>

        {!keyboardVisible ? (
          <View
            style={[
              styles.footer,
              density !== 'normal' && styles.footerCompact,
              ultra && styles.footerUltra,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              disabled={saving}
              style={({ pressed }) => [
                styles.cancelButton,
                ultra && styles.footerButtonUltra,
                pressed && !saving && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              <Text style={styles.cancelLabel}>İptal</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handlePreview}
              disabled={saving}
              style={({ pressed }) => [
                styles.primaryButton,
                ultra && styles.footerButtonUltra,
                pressed && !saving && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              <Text
                style={styles.primaryLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {saving ? 'Kaydediliyor…' : 'Önizle ve Kaydet'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <NumericKeyboardAndroidDock
          visible={numberPad.showAndroidDock}
          keyboardHeight={numberPad.keyboardHeight}
          canPrev={numberPad.canPrev}
          canNext={numberPad.canNext}
          onPrev={numberPad.goPrev}
          onNext={numberPad.goNext}
          onDismiss={numberPad.dismiss}
        />
      </KeyboardAvoidingView>

      <NumericKeyboardAccessory fieldCount={numberPad.fieldCount} />

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
    backgroundColor: palette.background,
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 8,
    minHeight: 78,
    backgroundColor: palette.background,
  },
  headerCompact: {
    minHeight: 72,
    paddingBottom: 6,
  },
  headerUltra: {
    minHeight: 56,
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
  backChevron: {
    width: 11,
    height: 11,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: palette.white,
  },
  headerHint: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: palette.headerHint,
    textAlign: 'center',
  },
  panel: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 16,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 24,
    overflow: 'hidden',
  },
  panelCompact: {
    borderRadius: 22,
  },
  panelUltra: {
    borderRadius: 20,
    marginHorizontal: 12,
  },
  panelBody: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
  },
  panelBodyCompact: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  panelBodyUltra: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 14,
  },
  panelBodyKeyboard: {
    paddingBottom: 24,
  },
  formStack: {
    flex: 1,
    gap: 12,
  },
  formStackCompact: {
    gap: 11,
  },
  formStackUltra: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitleSm: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.textGreen,
  },
  sectionTitleMd: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.textGreen,
  },
  roundBadge: {
    backgroundColor: palette.panelMuted,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roundBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textGreen,
  },
  vsCard: {
    height: 92,
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: palette.panelMuted,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    justifyContent: 'center',
  },
  vsCardCompact: {
    height: 86,
  },
  vsCardUltra: {
    height: 80,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vsSide: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  vsIndividual: {
    alignItems: 'center',
    gap: 4,
  },
  vsTeamName: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  vsScore: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: palette.dark,
    fontVariant: ['tabular-nums'],
  },
  vsPlayersLine: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textMuted,
    textAlign: 'center',
  },
  vsBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.dark,
    borderWidth: 2,
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsBadgeUltra: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  vsBadgeText: {
    fontSize: 19,
    fontWeight: '800',
    color: palette.white,
  },
  vsBadgeTextUltra: {
    fontSize: 16,
  },
  outcomeBlock: {
    gap: 6,
  },
  finisherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  finisherCell: {
    width: '48%',
    flexGrow: 1,
  },
  teamBlocks: {
    flexDirection: 'row',
    gap: 8,
  },
  teamBlock: {
    flex: 1,
    gap: 6,
  },
  teamHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  finisherButton: {
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  finisherSelected: {
    backgroundColor: palette.dark,
    borderColor: palette.accent,
  },
  finisherLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textGreen,
    textAlign: 'center',
  },
  finisherLabelSelected: {
    color: palette.white,
  },
  finishSegment: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: palette.panelLight,
  },
  finishSegmentWrap: {
    borderRadius: 12,
  },
  finishRow: {
    flexDirection: 'row',
    height: 42,
  },
  finishRowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
  },
  finishCell: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    backgroundColor: palette.panelLight,
  },
  finishCellWide: {
    flex: 1.45,
  },
  finishCellWrap: {
    flexBasis: 0,
  },
  finishCellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: palette.border,
  },
  finishCellSelected: {
    backgroundColor: palette.dark,
  },
  finishCellDisabled: {
    opacity: 0.38,
  },
  finishCellLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: palette.textGreen,
    textAlign: 'center',
  },
  finishCellLabelSelected: {
    color: palette.white,
  },
  finishCellLabelDisabled: {
    color: palette.textMuted,
  },
  tinyHint: {
    fontSize: 11,
    fontWeight: '400',
    color: palette.textMuted,
  },
  openStatusRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openStatusLabel: {
    width: 48,
    fontSize: 13,
    fontWeight: '700',
    color: palette.textGreen,
  },
  openStatusPlayers: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  openPlayerSlot: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  inlineSeg: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    backgroundColor: palette.panelLight,
  },
  miniSeg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    backgroundColor: palette.panelLight,
  },
  miniSegDense: {
    minHeight: 36,
  },
  miniSegSelected: {
    backgroundColor: palette.dark,
  },
  miniSegLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textGreen,
  },
  miniSegLabelSelected: {
    color: palette.white,
  },
  penaltiesBlock: {
    gap: 10,
    flexShrink: 1,
    flexGrow: 1,
  },
  penaltiesPanel: {
    flexGrow: 1,
    minHeight: 180,
    backgroundColor: palette.panelMuted,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
    justifyContent: 'center',
  },
  penaltiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabelCell: {
    width: 44,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.textGreen,
  },
  playerCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  playerColName: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  cellDash: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
  },
  tileInput: {
    width: '100%',
    minWidth: 64,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelLight,
    color: palette.textDark,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
    zIndex: 10,
    elevation: 3,
  },
  tileInputFocused: {
    borderColor: palette.accent,
    borderWidth: 2,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.errorText,
    backgroundColor: palette.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.errorBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.background,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
    minHeight: 76,
  },
  footerCompact: {
    minHeight: 72,
    paddingTop: 8,
    paddingBottom: 10,
  },
  footerUltra: {
    minHeight: 64,
    paddingTop: 6,
    paddingBottom: 8,
  },
  cancelButton: {
    width: '34%',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cancelBorder,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  footerButtonUltra: {
    height: 50,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.dark,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
