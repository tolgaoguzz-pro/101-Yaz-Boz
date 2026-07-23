import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  CalculateRoundResult,
  calculateRound,
} from '../../engine/calculateRound';
import { DEFAULT_SCORE_RULES } from '../../engine/rules';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  buildRosterFromActiveGame,
  playersFromActiveGame,
  teamNameFromActiveGame,
} from '../gameRoster';
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
  RoundEntryFinishType,
  RoundEntryForm,
  RoundEntryOpenType,
  RoundEntryPlayerForm,
} from '../roundEntry/types';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

type RoundEntryScreenProps = {
  game: ActiveGameData;
  onBack: () => void;
  onSaveRound: (result: CalculateRoundResult) => void;
};

const FINISH_OPTIONS: { value: RoundEntryFinishType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'okey', label: 'Okeyle' },
  { value: 'fromHand', label: 'Elden' },
  { value: 'fromHandAndOkey', label: 'Elden + Okey' },
  { value: 'none', label: 'Yok' },
];

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function ChoiceChip({
  label,
  selected,
  disabled = false,
  onPress,
}: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
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
  const rosterPlayers = useMemo(() => playersFromActiveGame(game), [game]);
  const engineRoster = useMemo(() => buildRosterFromActiveGame(game), [game]);

  const [form, setForm] = useState<RoundEntryForm>(() =>
    createInitialRoundEntryForm(rosterPlayers),
  );
  const [preview, setPreview] = useState<CalculateRoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finishOptionsDisabled = form.finisherPlayerId === null;
  const visiblePlayerIds = getVisiblePlayerIds(form);
  const showPlayerCards = shouldShowPlayerEntryCards(form);
  const showHandAutoNote =
    form.finisherPlayerId !== null && isHandStyleFinish(form.finishType);

  function clearPreview() {
    setPreview(null);
    setError(null);
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
      const result = calculateRound(
        roundInput,
        DEFAULT_SCORE_RULES,
        engineRoster,
      );
      setError(null);
      setPreview(result);
    } catch (caught) {
      setPreview(null);
      const message =
        caught instanceof Error
          ? caught.message
          : 'El hesaplanırken bir hata oluştu.';
      setError(message);
    }
  }

  function handleSave() {
    if (!preview) {
      return;
    }
    onSaveRound(preview);
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

          <Text style={styles.title}>Yeni El</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bitiren oyuncu</Text>
            <View style={styles.chipWrap}>
              {rosterPlayers.map((player) => (
                <ChoiceChip
                  key={player.id}
                  label={player.name}
                  selected={form.finisherPlayerId === player.id}
                  onPress={() => selectFinisher(player.id)}
                />
              ))}
              <ChoiceChip
                label="Kimse Bitmedi"
                selected={form.finisherPlayerId === null}
                onPress={() => selectFinisher(null)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bitiş türü</Text>
            <View style={styles.chipWrap}>
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
                  />
                );
              })}
            </View>
          </View>

          {showHandAutoNote ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Elden bitiş: diğer oyuncular açmamış sayılır. Ceza otomatik
                hesaplanır.
              </Text>
            </View>
          ) : null}

          {showPlayerCards
            ? visiblePlayerIds.map((playerId) => {
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
                  <View key={playerId} style={styles.playerCard}>
                    <Text style={styles.playerTitle}>{playerName}</Text>

                    {mode.showOpenedChoice ? (
                      <View style={styles.chipWrap}>
                        <ChoiceChip
                          label="Açtı"
                          selected={opened}
                          onPress={() => setOpened(playerId, true)}
                        />
                        <ChoiceChip
                          label="Açmadı"
                          selected={!opened}
                          onPress={() => setOpened(playerId, false)}
                        />
                      </View>
                    ) : null}

                    {mode.showSeriesDoubles ? (
                      <View style={styles.chipWrap}>
                        <ChoiceChip
                          label="Seri"
                          selected={playerForm.openType === 'series'}
                          onPress={() => setOpenKind(playerId, 'series')}
                        />
                        <ChoiceChip
                          label="Çift"
                          selected={playerForm.openType === 'doubles'}
                          onPress={() => setOpenKind(playerId, 'doubles')}
                        />
                      </View>
                    ) : null}

                    {mode.showRemainingTiles ? (
                      <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Kalan taş puanı</Text>
                        <TextInput
                          keyboardType="number-pad"
                          value={playerForm.remainingTilePointsText}
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
                          style={styles.input}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })
            : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label="Önizle" onPress={handlePreview} />

          {preview ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>El Sonucu</Text>
              <Text style={styles.resultHint}>
                Bitiren oyuncu 0 puan görünür; bu normaldir.
              </Text>

              <Text style={styles.resultSectionLabel}>Oyuncular</Text>
              {preview.players.map((playerScore) => (
                <View key={playerScore.playerId} style={styles.resultRow}>
                  <Text style={styles.resultName}>
                    {nameByPlayerId.get(playerScore.playerId) ??
                      playerScore.playerId}
                  </Text>
                  <Text style={styles.resultValue}>{playerScore.score}</Text>
                </View>
              ))}

              <Text style={styles.resultSectionLabel}>Takımlar</Text>
              {preview.teams.map((teamScore) => (
                <View key={teamScore.teamId} style={styles.resultRow}>
                  <Text style={styles.resultName}>
                    {teamNameFromActiveGame(game, teamScore.teamId)}
                  </Text>
                  <Text style={styles.resultValue}>{teamScore.score}</Text>
                </View>
              ))}

              {preview.finishTeamBonus.teamId !== null ? (
                <>
                  <Text style={styles.resultSectionLabel}>Bitiş bonusu</Text>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultName}>
                      {teamNameFromActiveGame(
                        game,
                        preview.finishTeamBonus.teamId,
                      )}
                    </Text>
                    <Text style={styles.resultValue}>
                      {preview.finishTeamBonus.amount}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          <PrimaryButton
            label="Eli Kaydet"
            onPress={handleSave}
            disabled={!preview}
          />
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
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  chipLabelSelected: {
    color: colors.textOnPrimary,
  },
  chipLabelDisabled: {
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  playerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  fieldLabel: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 17,
    fontWeight: '500',
  },
  error: {
    ...typography.body,
    color: '#8B2E2E',
    backgroundColor: '#F3D9D4',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  resultCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  resultHint: {
    ...typography.infoLabel,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultSectionLabel: {
    ...typography.infoLabel,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  resultName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  resultValue: {
    ...typography.buttonSecondary,
    color: colors.text,
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
