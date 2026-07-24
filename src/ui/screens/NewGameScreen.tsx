import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
import { ActiveGameData } from './ActiveGameScreen';

/** Home / ActiveGame ile aynı referans paleti. */
const ui = {
  green: '#1F5E3B',
  cream: '#F7F2E8',
  gold: '#C8A44D',
  white: '#FFFFFF',
  text: '#263238',
  textMuted: '#7A847C',
  line: 'rgba(200, 164, 77, 0.45)',
  border: '#C5BBA8',
} as const;

type NewGameScreenProps = {
  onBack: () => void;
  onStart: (game: ActiveGameData) => void;
};

type SegmentProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function Segment({ label, selected, onPress }: SegmentProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        selected && styles.segmentSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

type CompactFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

function CompactField({ label, value, onChangeText }: CompactFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        selectTextOnFocus
        placeholderTextColor={ui.textMuted}
        style={styles.fieldInput}
      />
    </View>
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
        keyboardVerticalOffset={0}
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
            <Text style={styles.title}>YENİ OYUN</Text>
            <View style={styles.goldRule} />
            <Text style={styles.subtitle}>
              Eşli veya tekli yeni oyun oluştur.
            </Text>
          </View>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.sheet}>
          <Text style={styles.sectionTitle}>OYUN TÜRÜ</Text>
          <View style={styles.segmentRow}>
            <Segment
              label={gameModeShortLabel('paired')}
              selected={gameMode === 'paired'}
              onPress={() => handleSelectGameMode('paired')}
            />
            <Segment
              label={gameModeShortLabel('individual')}
              selected={gameMode === 'individual'}
              onPress={() => handleSelectGameMode('individual')}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            {isPaired ? 'TAKIMLAR' : 'OYUNCULAR'}
          </Text>

          {isPaired ? (
            <View style={styles.teamsRow}>
              <View style={styles.teamCol}>
                <Text style={styles.teamHeading}>Takım 1</Text>
                <View style={styles.teamUnderline} />
                <CompactField
                  label="Takım"
                  value={form.team1Name}
                  onChangeText={(value) => updateField('team1Name', value)}
                />
                <CompactField
                  label="Oyuncu 1"
                  value={form.player1Name}
                  onChangeText={(value) => updateField('player1Name', value)}
                />
                <CompactField
                  label="Oyuncu 2"
                  value={form.player2Name}
                  onChangeText={(value) => updateField('player2Name', value)}
                />
              </View>
              <View style={styles.teamGoldDivider} />
              <View style={styles.teamCol}>
                <Text style={styles.teamHeading}>Takım 2</Text>
                <View style={styles.teamUnderline} />
                <CompactField
                  label="Takım"
                  value={form.team2Name}
                  onChangeText={(value) => updateField('team2Name', value)}
                />
                <CompactField
                  label="Oyuncu 3"
                  value={form.player3Name}
                  onChangeText={(value) => updateField('player3Name', value)}
                />
                <CompactField
                  label="Oyuncu 4"
                  value={form.player4Name}
                  onChangeText={(value) => updateField('player4Name', value)}
                />
              </View>
            </View>
          ) : (
            <View style={styles.playersCol}>
              <CompactField
                label="Oyuncu 1"
                value={form.player1Name}
                onChangeText={(value) => updateField('player1Name', value)}
              />
              <CompactField
                label="Oyuncu 2"
                value={form.player2Name}
                onChangeText={(value) => updateField('player2Name', value)}
              />
              <CompactField
                label="Oyuncu 3"
                value={form.player3Name}
                onChangeText={(value) => updateField('player3Name', value)}
              />
              <CompactField
                label="Oyuncu 4"
                value={form.player4Name}
                onChangeText={(value) => updateField('player4Name', value)}
              />
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>HEDEF EL</Text>
          <View style={styles.chipRow}>
            {TARGET_ROUND_COUNT_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={`${option}`}
                selected={targetRoundCount === option}
                onPress={() => handleSelectRoundCount(option)}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={handleStart}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>OYUNU BAŞLAT</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryLabel}>İptal</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingBottom: 12,
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
    color: ui.gold,
    marginTop: -2,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: ui.gold,
  },
  goldRule: {
    width: 48,
    height: 2,
    backgroundColor: ui.gold,
    borderRadius: 1,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(247, 242, 232, 0.78)',
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ui.green,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ui.green,
    backgroundColor: ui.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: ui.green,
    borderColor: ui.gold,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.green,
  },
  segmentLabelSelected: {
    color: ui.white,
  },
  divider: {
    height: 1.5,
    backgroundColor: ui.gold,
    opacity: 0.7,
    marginVertical: 2,
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  teamCol: {
    flex: 1,
    gap: 6,
  },
  teamGoldDivider: {
    width: 1.5,
    backgroundColor: ui.gold,
    alignSelf: 'stretch',
  },
  teamHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: ui.gold,
    textAlign: 'center',
  },
  teamUnderline: {
    height: 1.5,
    backgroundColor: ui.gold,
    opacity: 0.8,
    marginBottom: 2,
  },
  playersCol: {
    gap: 6,
  },
  field: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ui.textMuted,
  },
  fieldInput: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.white,
    paddingHorizontal: 8,
    color: ui.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: ui.green,
    borderColor: ui.gold,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.text,
  },
  chipLabelSelected: {
    color: ui.white,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    color: ui.green,
    backgroundColor: ui.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  footer: {
    marginTop: 'auto',
    gap: 8,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: ui.green,
    borderWidth: 1,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: ui.white,
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: ui.white,
    borderWidth: 1,
    borderColor: ui.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.green,
  },
  pressed: {
    opacity: 0.82,
  },
});
