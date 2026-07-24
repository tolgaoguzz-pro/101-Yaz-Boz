import { useRef, useState, type RefObject } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
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

const ui = {
  green: '#1F5E3B',
  cream: '#F7F2E8',
  creamCard: '#FFFEF9',
  gold: '#C8A44D',
  goldSoft: 'rgba(200, 164, 77, 0.55)',
  white: '#FFFFFF',
  text: '#263238',
  textMuted: '#6B736C',
  border: '#D4CBB8',
} as const;

type NewGameScreenProps = {
  onBack: () => void;
  onStart: (game: ActiveGameData) => void;
};

type CompactInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  inputRef?: RefObject<TextInput | null>;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  onFocus?: () => void;
};

function CompactInput({
  label,
  value,
  onChangeText,
  inputRef,
  returnKeyType = 'next',
  onSubmitEditing,
  onFocus,
}: CompactInputProps) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        selectTextOnFocus
        returnKeyType={returnKeyType}
        blurOnSubmit={returnKeyType === 'done'}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        placeholderTextColor={ui.textMuted}
        style={styles.fieldInput}
      />
    </View>
  );
}

export function NewGameScreen({ onBack, onStart }: NewGameScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 700;
  const scrollRef = useRef<ScrollView>(null);

  const team1Ref = useRef<TextInput>(null);
  const p1Ref = useRef<TextInput>(null);
  const p2Ref = useRef<TextInput>(null);
  const team2Ref = useRef<TextInput>(null);
  const p3Ref = useRef<TextInput>(null);
  const p4Ref = useRef<TextInput>(null);

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

  function setRoundByIndex(index: number) {
    const clamped = Math.max(
      0,
      Math.min(TARGET_ROUND_COUNT_OPTIONS.length - 1, index),
    );
    setTargetRoundCount(TARGET_ROUND_COUNT_OPTIONS[clamped]);
    if (error) {
      setError(null);
    }
  }

  function stepRound(delta: number) {
    const currentIndex = TARGET_ROUND_COUNT_OPTIONS.indexOf(targetRoundCount);
    setRoundByIndex((currentIndex < 0 ? 0 : currentIndex) + delta);
  }

  function scrollFieldIntoView(position: 'start' | 'middle' | 'end') {
    requestAnimationFrame(() => {
      if (position === 'start') {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      if (position === 'middle') {
        scrollRef.current?.scrollTo({ y: 90, animated: true });
        return;
      }
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  function focusNext(ref: RefObject<TextInput | null>) {
    ref.current?.focus();
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
  const roundIndex = TARGET_ROUND_COUNT_OPTIONS.indexOf(targetRoundCount);

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
          <Text style={styles.title}>Yeni Oyun</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.sheet}>
          <ScrollView
            ref={scrollRef}
            style={styles.formScroll}
            contentContainerStyle={[
              styles.formContent,
              compact && styles.formContentCompact,
            ]}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Pressable accessible={false} onPress={Keyboard.dismiss}>
              <Text style={styles.sectionTitle}>Oyun Tipi</Text>
              <View style={styles.segment}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleSelectGameMode('paired')}
                  style={({ pressed }) => [
                    styles.segmentItem,
                    isPaired && styles.segmentItemSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentIcon,
                      isPaired && styles.segmentIconSelected,
                    ]}
                  >
                    👥
                  </Text>
                  <Text
                    style={[
                      styles.segmentLabel,
                      isPaired && styles.segmentLabelSelected,
                    ]}
                  >
                    {gameModeShortLabel('paired')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleSelectGameMode('individual')}
                  style={({ pressed }) => [
                    styles.segmentItem,
                    !isPaired && styles.segmentItemSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentIcon,
                      !isPaired && styles.segmentIconSelected,
                    ]}
                  >
                    👤
                  </Text>
                  <Text
                    style={[
                      styles.segmentLabel,
                      !isPaired && styles.segmentLabelSelected,
                    ]}
                  >
                    {gameModeShortLabel('individual')}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>
                {isPaired ? 'Takımlar' : 'Oyuncular'}
              </Text>

              {isPaired ? (
                <View style={styles.teamsRow}>
                  <View style={styles.teamCard}>
                    <Text style={styles.teamHeading}>Takım 1</Text>
                    <CompactInput
                      label="Takım"
                      value={form.team1Name}
                      onChangeText={(value) => updateField('team1Name', value)}
                      inputRef={team1Ref}
                      onSubmitEditing={() => focusNext(p1Ref)}
                      onFocus={() => scrollFieldIntoView('start')}
                    />
                    <CompactInput
                      label="Oyuncu"
                      value={form.player1Name}
                      onChangeText={(value) =>
                        updateField('player1Name', value)
                      }
                      inputRef={p1Ref}
                      onSubmitEditing={() => focusNext(p2Ref)}
                      onFocus={() => scrollFieldIntoView('start')}
                    />
                    <CompactInput
                      label="Oyuncu"
                      value={form.player2Name}
                      onChangeText={(value) =>
                        updateField('player2Name', value)
                      }
                      inputRef={p2Ref}
                      onSubmitEditing={() => focusNext(team2Ref)}
                      onFocus={() => scrollFieldIntoView('middle')}
                    />
                  </View>

                  <View style={styles.teamCard}>
                    <Text style={styles.teamHeading}>Takım 2</Text>
                    <CompactInput
                      label="Takım"
                      value={form.team2Name}
                      onChangeText={(value) => updateField('team2Name', value)}
                      inputRef={team2Ref}
                      onSubmitEditing={() => focusNext(p3Ref)}
                      onFocus={() => scrollFieldIntoView('middle')}
                    />
                    <CompactInput
                      label="Oyuncu"
                      value={form.player3Name}
                      onChangeText={(value) =>
                        updateField('player3Name', value)
                      }
                      inputRef={p3Ref}
                      onSubmitEditing={() => focusNext(p4Ref)}
                      onFocus={() => scrollFieldIntoView('end')}
                    />
                    <CompactInput
                      label="Oyuncu"
                      value={form.player4Name}
                      onChangeText={(value) =>
                        updateField('player4Name', value)
                      }
                      inputRef={p4Ref}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      onFocus={() => scrollFieldIntoView('end')}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.playersGrid}>
                  <View style={styles.playerCard}>
                    <CompactInput
                      label="Oyuncu 1"
                      value={form.player1Name}
                      onChangeText={(value) =>
                        updateField('player1Name', value)
                      }
                      inputRef={p1Ref}
                      onSubmitEditing={() => focusNext(p2Ref)}
                      onFocus={() => scrollFieldIntoView('start')}
                    />
                    <CompactInput
                      label="Oyuncu 2"
                      value={form.player2Name}
                      onChangeText={(value) =>
                        updateField('player2Name', value)
                      }
                      inputRef={p2Ref}
                      onSubmitEditing={() => focusNext(p3Ref)}
                      onFocus={() => scrollFieldIntoView('middle')}
                    />
                  </View>
                  <View style={styles.playerCard}>
                    <CompactInput
                      label="Oyuncu 3"
                      value={form.player3Name}
                      onChangeText={(value) =>
                        updateField('player3Name', value)
                      }
                      inputRef={p3Ref}
                      onSubmitEditing={() => focusNext(p4Ref)}
                      onFocus={() => scrollFieldIntoView('end')}
                    />
                    <CompactInput
                      label="Oyuncu 4"
                      value={form.player4Name}
                      onChangeText={(value) =>
                        updateField('player4Name', value)
                      }
                      inputRef={p4Ref}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      onFocus={() => scrollFieldIntoView('end')}
                    />
                  </View>
                </View>
              )}

              <View style={styles.roundRow}>
                <Text style={styles.roundLabel}>Hedef El Sayısı</Text>
                <View style={styles.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={roundIndex <= 0}
                    onPress={() => stepRound(-1)}
                    style={({ pressed }) => [
                      styles.stepButton,
                      roundIndex <= 0 && styles.stepButtonDisabled,
                      pressed && roundIndex > 0 && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepButtonLabel}>−</Text>
                  </Pressable>
                  <View style={styles.stepValueBox}>
                    <Text style={styles.stepValue}>{targetRoundCount}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={roundIndex >= TARGET_ROUND_COUNT_OPTIONS.length - 1}
                    onPress={() => stepRound(1)}
                    style={({ pressed }) => [
                      styles.stepButton,
                      roundIndex >= TARGET_ROUND_COUNT_OPTIONS.length - 1 &&
                        styles.stepButtonDisabled,
                      pressed &&
                        roundIndex < TARGET_ROUND_COUNT_OPTIONS.length - 1 &&
                        styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepButtonLabel}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.quickRow}>
                {TARGET_ROUND_COUNT_OPTIONS.map((option) => {
                  const selected = targetRoundCount === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      onPress={() => setRoundByIndex(
                        TARGET_ROUND_COUNT_OPTIONS.indexOf(option),
                      )}
                      style={({ pressed }) => [
                        styles.quickChip,
                        selected && styles.quickChipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickChipLabel,
                          selected && styles.quickChipLabelSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Pressable>
          </ScrollView>

          <View style={[styles.footer, compact && styles.footerCompact]}>
            <Pressable
              accessibilityRole="button"
              onPress={handleStart}
              style={({ pressed }) => [
                styles.primaryButton,
                compact && styles.primaryButtonCompact,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>Oyunu Başlat</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Keyboard.dismiss();
                onBack();
              }}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelLabel}>İptal</Text>
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
    alignItems: 'center',
    minHeight: 44,
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
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: ui.white,
  },
  sheet: {
    flex: 1,
    minHeight: 0,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  formScroll: {
    flex: 1,
    minHeight: 0,
  },
  formContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  formContentCompact: {
    paddingTop: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ui.text,
    marginBottom: 6,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ui.gold,
    overflow: 'hidden',
    backgroundColor: ui.white,
    marginBottom: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ui.creamCard,
    paddingHorizontal: 8,
  },
  segmentItemSelected: {
    backgroundColor: ui.green,
  },
  segmentIcon: {
    fontSize: 14,
  },
  segmentIconSelected: {
    opacity: 1,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.green,
  },
  segmentLabelSelected: {
    color: ui.white,
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  teamCard: {
    flex: 1,
    backgroundColor: ui.creamCard,
    borderWidth: 1.5,
    borderColor: ui.gold,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 4,
  },
  teamHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: ui.gold,
    textAlign: 'center',
    marginBottom: 2,
  },
  playersGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  playerCard: {
    flex: 1,
    backgroundColor: ui.creamCard,
    borderWidth: 1.5,
    borderColor: ui.gold,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  fieldRow: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: ui.textMuted,
  },
  fieldInput: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.white,
    paddingHorizontal: 8,
    color: ui.text,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 10,
  },
  roundLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ui.text,
    flexShrink: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: ui.gold,
    backgroundColor: ui.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.35,
  },
  stepButtonLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: ui.green,
    marginTop: -1,
  },
  stepValueBox: {
    minWidth: 48,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: ui.gold,
    backgroundColor: ui.creamCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepValue: {
    fontSize: 17,
    fontWeight: '800',
    color: ui.green,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickChip: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipSelected: {
    backgroundColor: ui.green,
    borderColor: ui.gold,
  },
  quickChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ui.text,
  },
  quickChipLabelSelected: {
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
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.goldSoft,
    backgroundColor: ui.cream,
  },
  footerCompact: {
    paddingTop: 6,
    paddingBottom: 8,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: ui.green,
    borderWidth: 1.5,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonCompact: {
    minHeight: 46,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: ui.white,
  },
  cancelButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ui.textMuted,
  },
  pressed: {
    opacity: 0.82,
  },
});
