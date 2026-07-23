import { useMemo, useState } from 'react';
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

import {
  CalculateRoundResult,
  calculateRound,
} from '../../engine/calculateRound';
import { DEFAULT_SCORE_RULES } from '../../engine/rules';
import { RoundSaveMeta } from '../applyGameUpdates';
import { PrimaryButton } from '../components/PrimaryButton';
import { resolveGameMode } from '../gameMode';
import {
  buildRosterFromActiveGame,
  playersFromActiveGame,
} from '../gameRoster';
import { calculateIndividualRound } from '../individualRound';
import {
  buildRoundInputFromForm,
  createInitialRoundEntryForm,
  parseNonNegativeNumber,
} from '../roundEntry/buildRoundInput';
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
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';
import { RoundPreviewScreen } from './RoundPreviewScreen';

type RoundEntryScreenProps = {
  game: ActiveGameData;
  onBack: () => void;
  onSaveRound: (result: CalculateRoundResult, meta: RoundSaveMeta) => void;
};

const FINISH_OPTIONS: { value: RoundEntryFinishType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'okey', label: 'Okey' },
  { value: 'fromHand', label: 'Elden' },
  { value: 'fromHandAndOkey', label: 'E+O' },
  { value: 'none', label: 'Yok' },
];

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  compact?: boolean;
};

function ChoiceChip({
  label,
  selected,
  disabled = false,
  onPress,
  compact = false,
}: ChoiceChipProps) {
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

export function RoundEntryScreen({
  game,
  onBack,
  onSaveRound,
}: RoundEntryScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const rosterPlayers = useMemo(() => playersFromActiveGame(game), [game]);
  const engineRoster = useMemo(() => buildRosterFromActiveGame(game), [game]);
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';

  const [form, setForm] = useState<RoundEntryForm>(() =>
    createInitialRoundEntryForm(rosterPlayers),
  );
  const [previewState, setPreviewState] =
    useState<RoundPreviewState>(CLOSED_ROUND_PREVIEW);
  const [saving, setSaving] = useState(false);

  const finishOptionsDisabled = form.finisherPlayerId === null;
  const visiblePlayerIds = getVisiblePlayerIds(form);
  const showPlayerCards = shouldShowPlayerEntryCards(form);
  const showHandAutoNote =
    form.finisherPlayerId !== null && isHandStyleFinish(form.finishType);

  function clearPreview() {
    setPreviewState(CLOSED_ROUND_PREVIEW);
  }

  function setFormAndNormalize(
    updater: (current: RoundEntryForm) => RoundEntryForm,
  ) {
    clearPreview();
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
    if (form.finisherPlayerId === null) {
      return;
    }
    if (finishType === 'none') {
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

  function handlePreview() {
    try {
      const roundInput = buildRoundInputFromForm(
        form,
        `round-${game.roundNumber}`,
      );
      const previewResult = isIndividual
        ? calculateIndividualRound(roundInput, game, DEFAULT_SCORE_RULES)
        : calculateRound(roundInput, DEFAULT_SCORE_RULES, engineRoster);
      const meta = {
        finishType: form.finishType,
        finisherPlayerId: form.finisherPlayerId,
      };
      // Atomik state: visible + result aynı anda — ikinci dokunuş gerekmez.
      setPreviewState(buildRoundPreviewState({ result: previewResult, meta }));
      Keyboard.dismiss();
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'El hesaplanırken bir hata oluştu.';
      setPreviewState(buildRoundPreviewError(message));
      Keyboard.dismiss();
    }
  }

  function handleSaveFromPreview() {
    Keyboard.dismiss();
    if (
      !previewState.visible ||
      !previewState.result ||
      !previewState.meta ||
      saving
    ) {
      return;
    }
    setSaving(true);
    onSaveRound(previewState.result, previewState.meta);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        >
            <View style={styles.topRow}>
              <Pressable
                accessibilityRole="button"
                onPress={onBack}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backPressed,
                ]}
              >
                <Text style={styles.backLabel}>Geri</Text>
              </Pressable>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Yeni El</Text>
                <Text style={styles.roundMeta}>
                  {game.rounds.length + 1}. El
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bitiren</Text>
              <View style={styles.grid2}>
                {rosterPlayers.map((player) => (
                  <ChoiceChip
                    key={player.id}
                    label={player.name}
                    selected={form.finisherPlayerId === player.id}
                    onPress={() => selectFinisher(player.id)}
                    compact={compact}
                  />
                ))}
                <ChoiceChip
                  label="Bitmedi"
                  selected={form.finisherPlayerId === null}
                  onPress={() => selectFinisher(null)}
                  compact={compact}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bitiş</Text>
              <View style={styles.gridFinish}>
                {FINISH_OPTIONS.map((option) => {
                  const isNoneOption = option.value === 'none';
                  const disabled = finishOptionsDisabled
                    ? !isNoneOption
                    : isNoneOption;
                  return (
                    <ChoiceChip
                      key={option.value}
                      label={option.label}
                      selected={form.finishType === option.value}
                      disabled={disabled}
                      onPress={() => selectFinishType(option.value)}
                      compact
                    />
                  );
                })}
              </View>
            </View>

            {showHandAutoNote ? (
              <Text style={styles.infoText}>
                Diğer üç oyuncu açmamış sayılacak.
              </Text>
            ) : null}

            {showPlayerCards ? (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.colPlayer, styles.th]}>Oyuncu</Text>
                  <Text style={[styles.colStatus, styles.th]}>Durum</Text>
                  <Text style={[styles.colOpen, styles.th]}>Açılış</Text>
                  <Text style={[styles.colTiles, styles.th]}>Kalan</Text>
                </View>
                {visiblePlayerIds.map((playerId) => {
                  const playerForm = form.players.find(
                    (player) => player.playerId === playerId,
                  );
                  const playerName = nameByPlayerId.get(playerId);
                  if (!playerForm || !playerName) {
                    return null;
                  }
                  const mode = getPlayerCardMode(form, playerId);
                  const opened = playerForm.openType !== 'didNotOpen';

                  return (
                    <View key={playerId} style={styles.tableRow}>
                      <Text style={styles.colPlayer} numberOfLines={1}>
                        {playerName}
                      </Text>
                      <View style={styles.colStatus}>
                        {mode.showOpenedChoice ? (
                          <View style={styles.miniRow}>
                            <ChoiceChip
                              label="Açtı"
                              selected={opened}
                              onPress={() => setOpened(playerId, true)}
                              compact
                            />
                            <ChoiceChip
                              label="Yok"
                              selected={!opened}
                              onPress={() => setOpened(playerId, false)}
                              compact
                            />
                          </View>
                        ) : (
                          <Text style={styles.muted}>—</Text>
                        )}
                      </View>
                      <View style={styles.colOpen}>
                        {mode.showSeriesDoubles ? (
                          <View style={styles.miniRow}>
                            <ChoiceChip
                              label="Seri"
                              selected={playerForm.openType === 'series'}
                              onPress={() => setOpenKind(playerId, 'series')}
                              compact
                            />
                            <ChoiceChip
                              label="Çift"
                              selected={playerForm.openType === 'doubles'}
                              onPress={() => setOpenKind(playerId, 'doubles')}
                              compact
                            />
                          </View>
                        ) : (
                          <Text style={styles.muted}>—</Text>
                        )}
                      </View>
                      <View style={styles.colTiles}>
                        {mode.showRemainingTiles ? (
                          <TextInput
                            keyboardType="number-pad"
                            value={playerForm.remainingTilePointsText}
                            selectTextOnFocus
                            onChangeText={(value) =>
                              updatePlayer(playerId, {
                                remainingTilePointsText: value,
                              })
                            }
                            onBlur={() =>
                              updatePlayer(playerId, {
                                remainingTilePointsText: String(
                                  parseNonNegativeNumber(
                                    playerForm.remainingTilePointsText,
                                  ),
                                ),
                              })
                            }
                            placeholderTextColor={colors.textSecondary}
                            style={styles.tileInput}
                          />
                        ) : (
                          <Text style={styles.muted}>—</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {previewState.error ? (
              <Text style={styles.error}>{previewState.error}</Text>
            ) : null}

          <View style={styles.footer}>
            <PrimaryButton label="Önizle" onPress={handlePreview} />
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelPressed,
              ]}
            >
              <Text style={styles.cancelLabel}>İptal</Text>
            </Pressable>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>

      <Modal
        visible={previewState.visible}
        animationType="slide"
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
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  shell: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  backPressed: {
    backgroundColor: colors.surface,
  },
  backLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  roundMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridFinish: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    minHeight: 40,
    minWidth: '30%',
    flexGrow: 1,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCompact: {
    minHeight: 34,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipPressed: {
    backgroundColor: colors.surface,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  chipLabelCompact: {
    fontSize: 12,
  },
  chipLabelSelected: {
    color: colors.textOnPrimary,
  },
  chipLabelDisabled: {
    color: colors.textSecondary,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  th: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 11,
  },
  colPlayer: {
    width: 62,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  colStatus: {
    flex: 1.1,
  },
  colOpen: {
    flex: 1.1,
  },
  colTiles: {
    width: 56,
    alignItems: 'center',
  },
  miniRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  muted: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tileInput: {
    width: 52,
    minHeight: 34,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    ...typography.body,
    color: '#8B2E2E',
    backgroundColor: '#F3D9D4',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footer: {
    marginTop: 'auto' as const,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  cancelButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    backgroundColor: colors.surface,
  },
  cancelLabel: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
});
