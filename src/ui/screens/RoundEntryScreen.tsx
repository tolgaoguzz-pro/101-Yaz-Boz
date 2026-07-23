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
};

const OPEN_OPTIONS: { value: RoundEntryOpenType; label: string }[] = [
  { value: 'didNotOpen', label: 'Açmadı' },
  { value: 'series', label: 'Seri' },
  { value: 'doubles', label: 'Çift' },
];

const FINISH_OPTIONS: { value: RoundEntryFinishType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'okey', label: 'Okeyle' },
  { value: 'fromHand', label: 'Elden' },
  { value: 'fromHandAndOkey', label: 'Elden + Okey' },
  { value: 'none', label: 'Yok' },
];

function clampCount(value: number): number {
  return value < 0 ? 0 : value;
}

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

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function Stepper({ label, value, onChange }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(clampCount(value - 1))}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.stepperButtonPressed,
          ]}
        >
          <Text style={styles.stepperButtonLabel}>-</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(value + 1)}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.stepperButtonPressed,
          ]}
        >
          <Text style={styles.stepperButtonLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function RoundEntryScreen({ game, onBack }: RoundEntryScreenProps) {
  const rosterPlayers = useMemo(() => playersFromActiveGame(game), [game]);
  const engineRoster = useMemo(() => buildRosterFromActiveGame(game), [game]);

  const [form, setForm] = useState<RoundEntryForm>(() =>
    createInitialRoundEntryForm(rosterPlayers),
  );
  const [preview, setPreview] = useState<CalculateRoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finishOptionsDisabled = form.finisherPlayerId === null;

  function clearPreview() {
    setPreview(null);
    setError(null);
  }

  function selectFinisher(playerId: string | null) {
    clearPreview();
    setForm((current) => ({
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
    clearPreview();
    setForm((current) => ({ ...current, finishType }));
  }

  function updatePlayer(
    playerId: string,
    patch: Partial<RoundEntryPlayerForm>,
  ) {
    clearPreview();
    setForm((current) => ({
      ...current,
      players: current.players.map((player) =>
        player.playerId === playerId ? { ...player, ...patch } : player,
      ),
    }));
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
    console.log(preview);
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

          <View style={styles.header}>
            <Text style={styles.title}>Yeni El</Text>
            <Text style={styles.subtitle}>
              Bitiren oyuncuyu ve el sonuçlarını gir.
            </Text>
          </View>

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
                const selected = form.finishType === option.value;
                return (
                  <ChoiceChip
                    key={option.value}
                    label={option.label}
                    selected={selected}
                    disabled={disabled}
                    onPress={() => selectFinishType(option.value)}
                  />
                );
              })}
            </View>
          </View>

          {form.players.map((playerForm) => {
            const playerName = nameByPlayerId.get(playerForm.playerId);
            if (!playerName) {
              return null;
            }

            return (
              <View key={playerForm.playerId} style={styles.playerCard}>
                <Text style={styles.playerTitle}>{playerName}</Text>

                <Text style={styles.fieldLabel}>Açılış türü</Text>
                <View style={styles.chipWrap}>
                  {OPEN_OPTIONS.map((option) => (
                    <ChoiceChip
                      key={option.value}
                      label={option.label}
                      selected={playerForm.openType === option.value}
                      onPress={() =>
                        updatePlayer(playerForm.playerId, {
                          openType: option.value,
                        })
                      }
                    />
                  ))}
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Kalan taş puanı</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={playerForm.remainingTilePointsText}
                    onChangeText={(value) =>
                      updatePlayer(playerForm.playerId, {
                        remainingTilePointsText: value,
                      })
                    }
                    onBlur={() =>
                      updatePlayer(playerForm.playerId, {
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

                <Stepper
                  label="Elde kalan okey"
                  value={playerForm.remainingOkeyCount}
                  onChange={(value) =>
                    updatePlayer(playerForm.playerId, {
                      remainingOkeyCount: value,
                    })
                  }
                />
                <Stepper
                  label="Yanlış açma"
                  value={playerForm.wrongOpenCount}
                  onChange={(value) =>
                    updatePlayer(playerForm.playerId, {
                      wrongOpenCount: value,
                    })
                  }
                />
                <Stepper
                  label="İşlek taş cezası"
                  value={playerForm.playableTileDiscardCount}
                  onChange={(value) =>
                    updatePlayer(playerForm.playerId, {
                      playableTileDiscardCount: value,
                    })
                  }
                />

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Manuel ceza</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={playerForm.manualPenaltyText}
                    onChangeText={(value) =>
                      updatePlayer(playerForm.playerId, {
                        manualPenaltyText: value,
                      })
                    }
                    onBlur={() =>
                      updatePlayer(playerForm.playerId, {
                        manualPenaltyText: String(
                          parseNonNegativeNumber(playerForm.manualPenaltyText),
                        ),
                      })
                    }
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />
                </View>
              </View>
            );
          })}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {preview ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>El Sonucu</Text>

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

          <PrimaryButton label="Önizle" onPress={handlePreview} />
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
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
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.sm,
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
    minHeight: 48,
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
    opacity: 0.45,
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
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  playerTitle: {
    fontSize: 20,
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
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 17,
    fontWeight: '500',
  },
  stepper: {
    gap: spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  stepperButtonLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textOnPrimary,
    lineHeight: 28,
  },
  stepperValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
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
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultSectionLabel: {
    ...typography.infoLabel,
    color: colors.primary,
    marginTop: spacing.sm,
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
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  cancelPressed: {
    backgroundColor: colors.surface,
  },
  cancelLabel: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
});
