import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppTextField } from '../components/AppTextField';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  DEFAULT_GAME_MODE,
  GameMode,
  gameModeShortLabel,
} from '../gameMode';
import {
  buildActiveGameFromSetup,
  createInitialNewGameForm,
  NewGameSetupForm,
  validateNewGameSetup,
} from '../newGameSetup';
import {
  DEFAULT_TARGET_ROUND_COUNT,
  TARGET_ROUND_COUNT_OPTIONS,
  TargetRoundCountOption,
} from '../targetRoundCount';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

type NewGameScreenProps = {
  onBack: () => void;
  onStart: (game: ActiveGameData) => void;
};

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function NewGameScreen({ onBack, onStart }: NewGameScreenProps) {
  const [form, setForm] = useState<NewGameSetupForm>(createInitialNewGameForm);
  const [gameMode, setGameMode] = useState<GameMode>(DEFAULT_GAME_MODE);
  const [targetRoundCount, setTargetRoundCount] =
    useState<TargetRoundCountOption>(DEFAULT_TARGET_ROUND_COUNT);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof NewGameSetupForm>(
    key: K,
    value: NewGameSetupForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError(null);
    }
  }

  function handleSelectGameMode(mode: GameMode) {
    setGameMode(mode);
    if (error) {
      setError(null);
    }
  }

  function handleSelectRoundCount(value: TargetRoundCountOption) {
    setTargetRoundCount(value);
    if (error) {
      setError(null);
    }
  }

  function handleStart() {
    Keyboard.dismiss();
    const input = {
      ...form,
      gameMode,
      targetRoundCount,
    };
    const validationError = validateNewGameSetup(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    onStart(buildActiveGameFromSetup(input));
  }

  const isPaired = gameMode === 'paired';

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
          keyboardDismissMode="on-drag"
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
            <Text style={styles.title}>Yeni Oyun</Text>
            <Text style={styles.subtitle}>
              {isPaired
                ? 'Takımları ve oyuncuları belirle, masayı kur.'
                : 'Dört oyuncuyu belirle, masayı kur.'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Oyun Modu</Text>
            <View style={styles.chipRow}>
              <ChoiceChip
                label={gameModeShortLabel('paired')}
                selected={gameMode === 'paired'}
                onPress={() => handleSelectGameMode('paired')}
              />
              <ChoiceChip
                label={gameModeShortLabel('individual')}
                selected={gameMode === 'individual'}
                onPress={() => handleSelectGameMode('individual')}
              />
            </View>
          </View>

          {isPaired ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Takım 1</Text>
                <AppTextField
                  label="Takım adı"
                  value={form.team1Name}
                  onChangeText={(value) => updateField('team1Name', value)}
                />
                <AppTextField
                  label="Oyuncu 1"
                  value={form.player1Name}
                  onChangeText={(value) => updateField('player1Name', value)}
                />
                <AppTextField
                  label="Oyuncu 2"
                  value={form.player2Name}
                  onChangeText={(value) => updateField('player2Name', value)}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Takım 2</Text>
                <AppTextField
                  label="Takım adı"
                  value={form.team2Name}
                  onChangeText={(value) => updateField('team2Name', value)}
                />
                <AppTextField
                  label="Oyuncu 3"
                  value={form.player3Name}
                  onChangeText={(value) => updateField('player3Name', value)}
                />
                <AppTextField
                  label="Oyuncu 4"
                  value={form.player4Name}
                  onChangeText={(value) => updateField('player4Name', value)}
                />
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Oyuncular</Text>
              <AppTextField
                label="Oyuncu 1"
                value={form.player1Name}
                onChangeText={(value) => updateField('player1Name', value)}
              />
              <AppTextField
                label="Oyuncu 2"
                value={form.player2Name}
                onChangeText={(value) => updateField('player2Name', value)}
              />
              <AppTextField
                label="Oyuncu 3"
                value={form.player3Name}
                onChangeText={(value) => updateField('player3Name', value)}
              />
              <AppTextField
                label="Oyuncu 4"
                value={form.player4Name}
                onChangeText={(value) => updateField('player4Name', value)}
              />
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kaç el oynanacak?</Text>
            <Text style={styles.cardHint}>
              Toplam el sayısını seç. Varsayılan 12 el.
            </Text>
            <View style={styles.chipRow}>
              {TARGET_ROUND_COUNT_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option}
                  label={`${option} El`}
                  selected={targetRoundCount === option}
                  onPress={() => handleSelectRoundCount(option)}
                />
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label="Oyunu Başlat" onPress={handleStart} />
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
  card: {
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
  cardTitle: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  cardHint: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipLabel: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  chipLabelSelected: {
    color: colors.textOnPrimary,
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
});
