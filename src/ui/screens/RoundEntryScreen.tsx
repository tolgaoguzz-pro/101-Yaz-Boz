import { useMemo, useRef, useState } from 'react';
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
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
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
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';
import { RoundPreviewScreen } from './RoundPreviewScreen';

type RoundEntryScreenProps = {
  game: ActiveGameData;
  onBack: () => void;
  onSaveRound: (result: CalculateRoundResult, meta: RoundSaveMeta) => void;
};

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  fullWidth?: boolean;
};

function ChoiceChip({
  label,
  selected,
  disabled = false,
  onPress,
  fullWidth = false,
}: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        fullWidth && styles.chipFull,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          selected && styles.chipLabelSelected,
          disabled && styles.chipLabelDisabled,
        ]}
        numberOfLines={2}
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
      <Text style={styles.entryName} numberOfLines={1}>
        {playerName}
      </Text>
      <View style={styles.entryControls}>
        {mode.showOpenedChoice ? (
          <View style={styles.miniRow}>
            <ChoiceChip
              label="Açtı"
              selected={opened}
              onPress={() => onSetOpened(true)}
            />
            <ChoiceChip
              label="Açmadı"
              selected={!opened}
              onPress={() => onSetOpened(false)}
            />
          </View>
        ) : null}
        {mode.showSeriesDoubles ? (
          <View style={styles.miniRow}>
            <ChoiceChip
              label="Seri"
              selected={playerForm.openType === 'series'}
              onPress={() => onSetOpenKind('series')}
            />
            <ChoiceChip
              label="Çift"
              selected={playerForm.openType === 'doubles'}
              onPress={() => onSetOpenKind('doubles')}
            />
          </View>
        ) : null}
        {mode.showRemainingTiles ? (
          <View style={styles.tileRow}>
            <Text style={styles.tileLabel}>Kalan</Text>
            <TextInput
              keyboardType="number-pad"
              value={playerForm.remainingTilePointsText}
              selectTextOnFocus
              onChangeText={onChangeTiles}
              onBlur={onBlurTiles}
              placeholderTextColor={colors.textSecondary}
              style={styles.tileInput}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function RoundEntryScreen({
  game,
  onBack,
  onSaveRound,
}: RoundEntryScreenProps) {
  const { height, width } = useWindowDimensions();
  const compact = height < 740;
  const dualColumn = width >= 360;
  const rosterPlayers = useMemo(() => playersFromActiveGame(game), [game]);
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';

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
  const showPlayerCards = shouldShowPlayerEntryCards(form);
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

  function renderPlayerEntries(playerIds: string[]) {
    return playerIds.map((playerId) => {
      const playerForm = form.players.find((p) => p.playerId === playerId);
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
            updatePlayer(playerId, { remainingTilePointsText: value })
          }
          onBlurTiles={() =>
            updatePlayer(playerId, {
              remainingTilePointsText: String(
                parseNonNegativeNumber(playerForm.remainingTilePointsText),
              ),
            })
          }
        />
      );
    });
  }

  const visibleTeam1 = visiblePlayerIds.filter((id) =>
    team1Players.some((p) => p.id === id),
  );
  const visibleTeam2 = visiblePlayerIds.filter((id) =>
    team2Players.some((p) => p.id === id),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            compact && styles.contentCompact,
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
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
                {game.rounds.length + 1} /{' '}
                {game.targetRoundCount ?? 12}. El
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bitiren Oyuncu</Text>
            {isIndividual ? (
              <View style={styles.grid2}>
                {rosterPlayers.map((player) => (
                  <ChoiceChip
                    key={player.id}
                    label={player.name}
                    selected={form.finisherPlayerId === player.id}
                    onPress={() => selectFinisher(player.id)}
                    fullWidth
                  />
                ))}
                <ChoiceChip
                  label="Bitmedi"
                  selected={form.finisherPlayerId === null}
                  onPress={() => selectFinisher(null)}
                  fullWidth
                />
              </View>
            ) : (
              <View style={styles.teamColumns}>
                <View style={styles.teamCol}>
                  <Text style={styles.teamHeading} numberOfLines={1}>
                    {game.teams[0].name}
                  </Text>
                  {team1Players.map((player) => (
                    <ChoiceChip
                      key={player.id}
                      label={player.name}
                      selected={form.finisherPlayerId === player.id}
                      onPress={() => selectFinisher(player.id)}
                      fullWidth
                    />
                  ))}
                </View>
                <View style={styles.teamCol}>
                  <Text style={styles.teamHeading} numberOfLines={1}>
                    {game.teams[1].name}
                  </Text>
                  {team2Players.map((player) => (
                    <ChoiceChip
                      key={player.id}
                      label={player.name}
                      selected={form.finisherPlayerId === player.id}
                      onPress={() => selectFinisher(player.id)}
                      fullWidth
                    />
                  ))}
                </View>
              </View>
            )}
            {!isIndividual ? (
              <ChoiceChip
                label="Bitmedi"
                selected={form.finisherPlayerId === null}
                onPress={() => selectFinisher(null)}
                fullWidth
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bitiş Türü</Text>
            <View style={styles.finishGrid}>
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
                    fullWidth
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Oyuncu Girişleri</Text>
              {isIndividual ? (
                <View style={styles.entryBlock}>
                  {renderPlayerEntries(visiblePlayerIds)}
                </View>
              ) : dualColumn ? (
                <View style={styles.teamColumns}>
                  <View style={styles.entryBlock}>
                    <Text style={styles.teamHeading} numberOfLines={1}>
                      {game.teams[0].name}
                    </Text>
                    {renderPlayerEntries(visibleTeam1)}
                  </View>
                  <View style={styles.entryBlock}>
                    <Text style={styles.teamHeading} numberOfLines={1}>
                      {game.teams[1].name}
                    </Text>
                    {renderPlayerEntries(visibleTeam2)}
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.entryBlock}>
                    <Text style={styles.teamHeading} numberOfLines={1}>
                      {game.teams[0].name}
                    </Text>
                    {renderPlayerEntries(visibleTeam1)}
                  </View>
                  <View style={styles.entryBlock}>
                    <Text style={styles.teamHeading} numberOfLines={1}>
                      {game.teams[1].name}
                    </Text>
                    {renderPlayerEntries(visibleTeam2)}
                  </View>
                </>
              )}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <PrimaryButton
              label="Eli Kaydet"
              onPress={handleDirectSave}
              disabled={saving}
            />
            <SecondaryButton
              label="Önizle"
              onPress={handlePreview}
              disabled={saving}
              style={styles.fullButton}
            />
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              disabled={saving}
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
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  contentCompact: {
    gap: 6,
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
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  teamColumns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamCol: {
    flex: 1,
    gap: 6,
  },
  teamHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryMuted,
    marginBottom: 2,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  finishGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    flexBasis: '46%',
  },
  chipFull: {
    flexBasis: '100%',
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
    textAlign: 'center',
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
  entryBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xs,
    gap: 6,
  },
  entryRow: {
    gap: 4,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  entryControls: {
    gap: 4,
  },
  miniRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tileInput: {
    width: 64,
    minHeight: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    color: colors.text,
    fontSize: 16,
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
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  fullButton: {
    flexGrow: 0,
    width: '100%',
  },
  cancelButton: {
    minHeight: 44,
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
