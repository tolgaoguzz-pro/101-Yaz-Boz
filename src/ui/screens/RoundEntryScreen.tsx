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

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

type RoundEntryOpenType = 'didNotOpen' | 'series' | 'doubles';

type RoundEntryFinishType =
  | 'normal'
  | 'okey'
  | 'fromHand'
  | 'fromHandAndOkey'
  | 'none';

type RoundEntryPlayerRef = {
  id: string;
  name: string;
};

type RoundEntryPlayerForm = {
  playerId: string;
  openType: RoundEntryOpenType;
  remainingTilePointsText: string;
  remainingOkeyCount: number;
  wrongOpenCount: number;
  playableTileDiscardCount: number;
  manualPenaltyText: string;
};

type RoundEntryForm = {
  finisherPlayerId: string | null;
  finishType: RoundEntryFinishType;
  players: RoundEntryPlayerForm[];
};

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

function playersFromGame(game: ActiveGameData): RoundEntryPlayerRef[] {
  return [
    {
      id: 't0-p0',
      name: game.teams[0].players[0].name,
    },
    {
      id: 't0-p1',
      name: game.teams[0].players[1].name,
    },
    {
      id: 't1-p0',
      name: game.teams[1].players[0].name,
    },
    {
      id: 't1-p1',
      name: game.teams[1].players[1].name,
    },
  ];
}

function createInitialForm(players: RoundEntryPlayerRef[]): RoundEntryForm {
  return {
    finisherPlayerId: null,
    finishType: 'none',
    players: players.map((player) => ({
      playerId: player.id,
      openType: 'series',
      remainingTilePointsText: '0',
      remainingOkeyCount: 0,
      wrongOpenCount: 0,
      playableTileDiscardCount: 0,
      manualPenaltyText: '0',
    })),
  };
}

function parseNonNegativeNumber(text: string): number {
  const parsed = Number.parseInt(text.replace(/[^\d-]/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

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
  const roster = useMemo(() => playersFromGame(game), [game]);
  const [form, setForm] = useState<RoundEntryForm>(() =>
    createInitialForm(roster),
  );

  const finishOptionsDisabled = form.finisherPlayerId === null;

  function selectFinisher(playerId: string | null) {
    setForm((current) => ({
      ...current,
      finisherPlayerId: playerId,
      finishType: playerId === null ? 'none' : current.finishType === 'none' ? 'normal' : current.finishType,
    }));
  }

  function selectFinishType(finishType: RoundEntryFinishType) {
    if (form.finisherPlayerId === null) {
      return;
    }
    if (finishType === 'none') {
      return;
    }
    setForm((current) => ({ ...current, finishType }));
  }

  function updatePlayer(
    playerId: string,
    patch: Partial<RoundEntryPlayerForm>,
  ) {
    setForm((current) => ({
      ...current,
      players: current.players.map((player) =>
        player.playerId === playerId ? { ...player, ...patch } : player,
      ),
    }));
  }

  function handlePreview() {
    const payload = {
      finisherPlayerId: form.finisherPlayerId,
      finishType: form.finishType,
      players: form.players.map((player) => {
        const ref = roster.find((entry) => entry.id === player.playerId);
        return {
          playerId: player.playerId,
          name: ref?.name ?? player.playerId,
          openType: player.openType,
          remainingTilePoints: parseNonNegativeNumber(
            player.remainingTilePointsText,
          ),
          remainingOkeyCount: player.remainingOkeyCount,
          wrongOpenCount: player.wrongOpenCount,
          playableTileDiscardCount: player.playableTileDiscardCount,
          manualPenalty: parseNonNegativeNumber(player.manualPenaltyText),
        };
      }),
    };
    console.log(payload);
  }

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
              {roster.map((player) => (
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
                const disabled =
                  finishOptionsDisabled
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
            const player = roster.find(
              (entry) => entry.id === playerForm.playerId,
            );
            if (!player) {
              return null;
            }

            return (
              <View key={player.id} style={styles.playerCard}>
                <Text style={styles.playerTitle}>{player.name}</Text>

                <Text style={styles.fieldLabel}>Açılış türü</Text>
                <View style={styles.chipWrap}>
                  {OPEN_OPTIONS.map((option) => (
                    <ChoiceChip
                      key={option.value}
                      label={option.label}
                      selected={playerForm.openType === option.value}
                      onPress={() =>
                        updatePlayer(player.id, { openType: option.value })
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
                      updatePlayer(player.id, {
                        remainingTilePointsText: value,
                      })
                    }
                    onBlur={() =>
                      updatePlayer(player.id, {
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
                    updatePlayer(player.id, { remainingOkeyCount: value })
                  }
                />
                <Stepper
                  label="Yanlış açma"
                  value={playerForm.wrongOpenCount}
                  onChange={(value) =>
                    updatePlayer(player.id, { wrongOpenCount: value })
                  }
                />
                <Stepper
                  label="İşlek taş cezası"
                  value={playerForm.playableTileDiscardCount}
                  onChange={(value) =>
                    updatePlayer(player.id, {
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
                      updatePlayer(player.id, { manualPenaltyText: value })
                    }
                    onBlur={() =>
                      updatePlayer(player.id, {
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
