import { useEffect, useRef, useState, type RefObject } from 'react';
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

const palette = {
  background: '#0B3A2D',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelLight: '#EAF1EC',
  panelMuted: '#C9D8CF',
  segmentTrack: '#C8D8CC',
  border: '#B7CBBE',
  borderStrong: '#AFC5B8',
  textDark: '#142D25',
  textGreen: '#174333',
  textMuted: 'rgba(23,67,51,0.62)',
  placeholder: 'rgba(20,45,37,0.42)',
  accent: '#B58A43',
  white: '#FFFFFF',
  headerHint: 'rgba(255,255,255,0.62)',
  cancel: 'rgba(255,255,255,0.72)',
  errorBg: '#F3D8D4',
  errorBorder: '#D9A39B',
  errorText: '#8B2E25',
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
  dense?: boolean;
  tile?: boolean;
  /** Eşli yan-yana takım kartı inputu */
  column?: boolean;
  columnCompact?: boolean;
  last?: boolean;
};

function CompactInput({
  label,
  value,
  onChangeText,
  inputRef,
  returnKeyType = 'next',
  onSubmitEditing,
  onFocus,
  dense = false,
  tile = false,
  column = false,
  columnCompact = false,
  last = false,
}: CompactInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.fieldRow,
        dense && !tile && !column && styles.fieldRowDense,
        tile && styles.tileField,
        column && styles.columnField,
        column && !last && styles.columnFieldSpaced,
        column && columnCompact && !last && styles.columnFieldSpacedCompact,
      ]}
    >
      <Text
        style={[
          styles.fieldLabel,
          dense && !tile && !column && styles.fieldLabelDense,
          tile && styles.tileLabel,
          tile && dense && styles.tileLabelDense,
          column && styles.columnLabel,
        ]}
        numberOfLines={1}
      >
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
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => setFocused(false)}
        placeholderTextColor={palette.placeholder}
        style={[
          styles.fieldInput,
          dense && !tile && !column && styles.fieldInputDense,
          tile && styles.tileInput,
          tile && dense && styles.tileInputDense,
          column && styles.columnInput,
          column && columnCompact && styles.columnInputCompact,
          focused && styles.fieldInputFocused,
        ]}
      />
    </View>
  );
}

export function NewGameScreen({ onBack, onStart }: NewGameScreenProps) {
  const { height } = useWindowDimensions();
  /** Ortak header/footer için eski eşik. */
  const compact = height < 700;
  /** Tekli + eşli kompakt kart ölçüleri. */
  const layoutCompact = height < 850;
  const individualCompact = layoutCompact;
  const pairedCompact = layoutCompact;
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /** Klavye açık → en kompakt; aksi halde mevcut compact/normal. */
  const dense = isKeyboardVisible;

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
    const run = (useDense: boolean) => {
      if (position === 'start') {
        // ~12–16 px üst boşluk: içeriğin kendi padding'i yeterli.
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      if (position === 'middle') {
        scrollRef.current?.scrollTo({
          y: useDense ? 48 : 90,
          animated: true,
        });
        return;
      }
      scrollRef.current?.scrollToEnd({ animated: true });
    };

    requestAnimationFrame(() => {
      run(dense || isKeyboardVisible);
      // Klavye açıldıktan sonra tekrar hizala (footer gizlenir / layout küçülür).
      setTimeout(() => run(true), 140);
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
  const individualFit = !isPaired && !dense;
  const pairedFit = isPaired && !dense;
  const roundIndex = TARGET_ROUND_COUNT_OPTIONS.indexOf(targetRoundCount);

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
            !dense && compact && styles.headerCompact,
            dense && styles.headerDense,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              dense && styles.backButtonDense,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.backChevron} />
          </Pressable>
          <View style={styles.headerCenter} pointerEvents="none">
            <Text style={[styles.title, dense && styles.titleDense]}>
              Yeni Oyun
            </Text>
            {!dense ? (
              <Text style={styles.headerHint}>
                Oyuncuları ve oyun ayarlarını belirle
              </Text>
            ) : null}
          </View>
          <View style={[styles.backSpacer, dense && styles.backButtonDense]} />
        </View>

        <View
          style={[
            styles.panel,
            !dense && compact && styles.panelCompact,
            dense && styles.panelDense,
            individualFit && styles.panelIndividual,
            pairedFit && styles.panelPaired,
          ]}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.formScroll}
            contentContainerStyle={[
              styles.formContent,
              !dense && compact && styles.formContentCompact,
              dense && styles.formContentDense,
              individualFit && styles.formContentIndividual,
              pairedFit && styles.formContentPaired,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEnabled={dense}
          >
            <Pressable
              accessible={false}
              onPress={Keyboard.dismiss}
              style={[
                dense ? styles.formSectionsDense : undefined,
                individualFit && styles.formSectionsFit,
                pairedFit && styles.formSectionsPaired,
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  dense && styles.sectionTitleDense,
                  individualFit && styles.sectionTitleIndividual,
                  pairedFit && styles.sectionTitlePaired,
                ]}
              >
                Oyun Modu
              </Text>
              {!dense ? (
                <Text
                  style={[
                    styles.sectionHint,
                    individualFit && styles.sectionHintIndividual,
                    pairedFit && styles.sectionHintPaired,
                  ]}
                >
                  Eşli veya bireysel skor takibini seç
                </Text>
              ) : null}
              <View
                style={[
                  styles.segment,
                  dense && styles.segmentDense,
                  individualFit && styles.segmentIndividual,
                  pairedFit && styles.segmentPaired,
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleSelectGameMode('paired')}
                  style={({ pressed }) => [
                    styles.segmentItem,
                    dense && styles.segmentItemDense,
                    isPaired && styles.segmentItemSelected,
                    pressed && styles.pressed,
                  ]}
                >
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
                    dense && styles.segmentItemDense,
                    !isPaired && styles.segmentItemSelected,
                    pressed && styles.pressed,
                  ]}
                >
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

              <Text
                style={[
                  styles.sectionTitle,
                  dense && styles.sectionTitleDense,
                  individualFit && styles.sectionTitleIndividual,
                  pairedFit && styles.sectionTitlePaired,
                ]}
              >
                Takımlar ve Oyuncular
              </Text>
              {!dense ? (
                <Text
                  style={[
                    styles.sectionHint,
                    individualFit && styles.sectionHintIndividual,
                    pairedFit && styles.sectionHintPaired,
                  ]}
                >
                  {isPaired
                    ? 'İki takımın ve oyuncuların adını gir'
                    : 'Dört oyuncunun adını gir'}
                </Text>
              ) : null}

              {isPaired ? (
                <View style={styles.teamsRow}>
                  <View
                    style={[
                      styles.teamCard,
                      pairedCompact && styles.teamCardCompact,
                    ]}
                  >
                    <Text
                      style={[
                        styles.teamCardHeading,
                        pairedCompact && styles.teamCardHeadingCompact,
                      ]}
                    >
                      Takım 1
                    </Text>
                    <CompactInput
                      column
                      columnCompact={pairedCompact}
                      label="Takım"
                      value={form.team1Name}
                      onChangeText={(value) => updateField('team1Name', value)}
                      inputRef={team1Ref}
                      onSubmitEditing={() => focusNext(p1Ref)}
                      onFocus={() => scrollFieldIntoView('start')}
                    />
                    <CompactInput
                      column
                      columnCompact={pairedCompact}
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
                      column
                      columnCompact={pairedCompact}
                      last
                      label="Oyuncu 2"
                      value={form.player2Name}
                      onChangeText={(value) =>
                        updateField('player2Name', value)
                      }
                      inputRef={p2Ref}
                      onSubmitEditing={() => focusNext(team2Ref)}
                      onFocus={() => scrollFieldIntoView('middle')}
                    />
                  </View>

                  <View
                    style={[
                      styles.teamCard,
                      pairedCompact && styles.teamCardCompact,
                    ]}
                  >
                    <Text
                      style={[
                        styles.teamCardHeading,
                        pairedCompact && styles.teamCardHeadingCompact,
                      ]}
                    >
                      Takım 2
                    </Text>
                    <CompactInput
                      column
                      columnCompact={pairedCompact}
                      label="Takım"
                      value={form.team2Name}
                      onChangeText={(value) => updateField('team2Name', value)}
                      inputRef={team2Ref}
                      onSubmitEditing={() => focusNext(p3Ref)}
                      onFocus={() => scrollFieldIntoView('middle')}
                    />
                    <CompactInput
                      column
                      columnCompact={pairedCompact}
                      label="Oyuncu 1"
                      value={form.player3Name}
                      onChangeText={(value) =>
                        updateField('player3Name', value)
                      }
                      inputRef={p3Ref}
                      onSubmitEditing={() => focusNext(p4Ref)}
                      onFocus={() => scrollFieldIntoView('end')}
                    />
                    <CompactInput
                      column
                      columnCompact={pairedCompact}
                      last
                      label="Oyuncu 2"
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
                <View
                  style={[
                    styles.playersGrid,
                    dense && styles.playersGridDense,
                  ]}
                >
                  <View style={styles.playersRow}>
                    <View
                      style={[
                        styles.playerTile,
                        individualCompact && styles.playerTileCompact,
                      ]}
                    >
                      <CompactInput
                        tile
                        dense={dense || individualCompact}
                        label="Oyuncu 1"
                        value={form.player1Name}
                        onChangeText={(value) =>
                          updateField('player1Name', value)
                        }
                        inputRef={p1Ref}
                        onSubmitEditing={() => focusNext(p2Ref)}
                        onFocus={() => scrollFieldIntoView('start')}
                      />
                    </View>
                    <View
                      style={[
                        styles.playerTile,
                        individualCompact && styles.playerTileCompact,
                      ]}
                    >
                      <CompactInput
                        tile
                        dense={dense || individualCompact}
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
                  </View>
                  <View style={styles.playersRow}>
                    <View
                      style={[
                        styles.playerTile,
                        individualCompact && styles.playerTileCompact,
                      ]}
                    >
                      <CompactInput
                        tile
                        dense={dense || individualCompact}
                        label="Oyuncu 3"
                        value={form.player3Name}
                        onChangeText={(value) =>
                          updateField('player3Name', value)
                        }
                        inputRef={p3Ref}
                        onSubmitEditing={() => focusNext(p4Ref)}
                        onFocus={() => scrollFieldIntoView('end')}
                      />
                    </View>
                    <View
                      style={[
                        styles.playerTile,
                        individualCompact && styles.playerTileCompact,
                      ]}
                    >
                      <CompactInput
                        tile
                        dense={dense || individualCompact}
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
                </View>
              )}

              <Text
                style={[
                  styles.sectionTitle,
                  dense && styles.sectionTitleDense,
                  individualFit && styles.sectionTitleIndividual,
                  pairedFit && styles.sectionTitlePaired,
                ]}
              >
                Hedef El
              </Text>
              {!dense ? (
                <Text
                  style={[
                    styles.sectionHint,
                    individualFit && styles.sectionHintIndividual,
                    pairedFit && styles.sectionHintPaired,
                  ]}
                >
                  Oyunun kaç elde biteceğini seç
                </Text>
              ) : null}
              <View
                style={[
                  styles.groupCard,
                  dense && styles.groupCardDense,
                  individualFit && styles.targetCardIndividual,
                  pairedFit && styles.targetCardPaired,
                ]}
              >
                <View style={styles.roundRow}>
                  <Text
                    style={[
                      styles.roundLabel,
                      dense && styles.roundLabelDense,
                    ]}
                  >
                    Hedef El Sayısı
                  </Text>
                  <View style={styles.stepper}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={roundIndex <= 0}
                      onPress={() => stepRound(-1)}
                      style={({ pressed }) => [
                        styles.stepButton,
                        dense && styles.stepButtonDense,
                        individualFit && styles.stepButtonIndividual,
                        pairedFit && styles.stepButtonPaired,
                        roundIndex <= 0 && styles.stepButtonDisabled,
                        pressed && roundIndex > 0 && styles.pressed,
                      ]}
                    >
                      <Text style={styles.stepButtonLabel}>−</Text>
                    </Pressable>
                    <View
                      style={[
                        styles.stepValueBox,
                        dense && styles.stepValueBoxDense,
                        individualFit && styles.stepValueBoxIndividual,
                        pairedFit && styles.stepValueBoxPaired,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepValue,
                          dense && styles.stepValueDense,
                          individualFit && styles.stepValueIndividual,
                          pairedFit && styles.stepValuePaired,
                        ]}
                      >
                        {targetRoundCount}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      disabled={
                        roundIndex >= TARGET_ROUND_COUNT_OPTIONS.length - 1
                      }
                      onPress={() => stepRound(1)}
                      style={({ pressed }) => [
                        styles.stepButton,
                        dense && styles.stepButtonDense,
                        individualFit && styles.stepButtonIndividual,
                        pairedFit && styles.stepButtonPaired,
                        roundIndex >=
                          TARGET_ROUND_COUNT_OPTIONS.length - 1 &&
                          styles.stepButtonDisabled,
                        pressed &&
                          roundIndex <
                            TARGET_ROUND_COUNT_OPTIONS.length - 1 &&
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
                        onPress={() =>
                          setRoundByIndex(
                            TARGET_ROUND_COUNT_OPTIONS.indexOf(option),
                          )
                        }
                        style={({ pressed }) => [
                          styles.quickChip,
                          dense && styles.quickChipDense,
                          individualFit && styles.quickChipIndividual,
                          pairedFit && styles.quickChipPaired,
                          pairedFit &&
                            pairedCompact &&
                            styles.quickChipPairedCompact,
                          selected && styles.quickChipSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickChipLabel,
                            pairedFit && styles.quickChipLabelPaired,
                            selected && styles.quickChipLabelSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Pressable>
          </ScrollView>
        </View>

        {!dense ? (
          <View
            style={[
              styles.footer,
              compact && styles.footerCompact,
              individualFit && styles.footerIndividual,
              pairedFit && styles.footerPaired,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={handleStart}
              style={({ pressed }) => [
                styles.primaryButton,
                individualFit && styles.primaryButtonIndividual,
                pairedFit && styles.primaryButtonPaired,
                pairedFit && pairedCompact && styles.primaryButtonPairedCompact,
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
        ) : null}
      </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: palette.background,
  },
  headerCompact: {
    paddingBottom: 8,
  },
  headerDense: {
    minHeight: 72,
    maxHeight: 72,
    paddingTop: 0,
    paddingBottom: 8,
    marginBottom: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonDense: {
    width: 40,
    height: 40,
  },
  backChevron: {
    width: 12,
    height: 12,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  backSpacer: {
    width: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: -0.4,
  },
  titleDense: {
    fontSize: 24,
  },
  headerHint: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '400',
    color: palette.headerHint,
    textAlign: 'center',
  },
  panel: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 16,
    marginTop: 0,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 28,
    overflow: 'hidden',
  },
  panelCompact: {
    marginHorizontal: 14,
  },
  panelDense: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 20,
  },
  panelIndividual: {
    marginHorizontal: 14,
    borderRadius: 24,
    marginBottom: 2,
  },
  panelPaired: {
    marginHorizontal: 14,
    borderRadius: 24,
    marginBottom: 2,
  },
  formScroll: {
    flex: 1,
    minHeight: 0,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  formContentCompact: {
    paddingTop: 14,
    paddingBottom: 16,
  },
  formContentDense: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  formContentIndividual: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    flexGrow: 1,
  },
  formContentPaired: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 6,
    flexGrow: 1,
  },
  formSectionsDense: {
    gap: 12,
  },
  formSectionsFit: {
    gap: 11,
  },
  formSectionsPaired: {
    gap: 7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textGreen,
    marginBottom: 4,
    marginTop: 8,
  },
  sectionTitleDense: {
    fontSize: 16,
    marginTop: 0,
    marginBottom: 0,
  },
  sectionTitleIndividual: {
    fontSize: 17,
    marginTop: 0,
    marginBottom: 3,
  },
  sectionTitlePaired: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: 0,
    marginBottom: 1,
  },
  sectionHint: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.textMuted,
    marginBottom: 12,
  },
  sectionHintIndividual: {
    fontSize: 12,
    marginBottom: 8,
  },
  sectionHintPaired: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
    marginBottom: 7,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: palette.segmentTrack,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    padding: 4,
    marginBottom: 8,
  },
  segmentDense: {
    height: 46,
    marginBottom: 0,
    borderRadius: 14,
    padding: 3,
  },
  segmentIndividual: {
    height: 48,
    marginBottom: 12,
  },
  segmentPaired: {
    height: 48,
    borderRadius: 15,
    marginBottom: 12,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentItemDense: {
    minHeight: 40,
  },
  segmentItemSelected: {
    backgroundColor: palette.dark,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textGreen,
  },
  segmentLabelSelected: {
    color: palette.white,
    fontWeight: '800',
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
    marginBottom: 4,
  },
  teamCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: palette.panelMuted,
    borderColor: palette.borderStrong,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  teamCardCompact: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  teamCardHeading: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: palette.textGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  teamCardHeadingCompact: {
    fontSize: 14,
    marginBottom: 6,
  },
  columnField: {
    gap: 0,
    minWidth: 0,
    width: '100%',
  },
  columnFieldSpaced: {
    marginBottom: 5,
  },
  columnFieldSpacedCompact: {
    marginBottom: 4,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(23,67,51,0.68)',
    marginBottom: 3,
  },
  columnInput: {
    width: '100%',
    minWidth: 0,
    height: 40,
    minHeight: 40,
    backgroundColor: palette.panelLight,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 0,
    color: palette.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  columnInputCompact: {
    height: 37,
    minHeight: 37,
    fontSize: 12,
  },
  playersGrid: {
    gap: 8,
    marginBottom: 4,
  },
  playersGridDense: {
    marginBottom: 0,
  },
  playersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  playerTile: {
    flex: 1,
    minWidth: 0,
    height: 116,
    backgroundColor: palette.panelMuted,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 16,
    padding: 10,
    justifyContent: 'center',
  },
  playerTileCompact: {
    height: 102,
  },
  tileField: {
    gap: 0,
    minWidth: 0,
    width: '100%',
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.textGreen,
    marginBottom: 6,
  },
  tileLabelDense: {
    fontSize: 12,
    marginBottom: 6,
  },
  tileInput: {
    width: '100%',
    minWidth: 0,
    height: 46,
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    backgroundColor: palette.panelLight,
    borderColor: palette.border,
    borderWidth: 1,
    color: palette.textDark,
  },
  tileInputDense: {
    height: 42,
    minHeight: 42,
    fontSize: 15,
  },
  groupCard: {
    backgroundColor: palette.panelMuted,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  groupCardDense: {
    padding: 12,
    gap: 10,
    borderRadius: 16,
  },
  targetCardIndividual: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },
  targetCardPaired: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 8,
    borderRadius: 16,
    gap: 6,
  },
  fieldRow: {
    gap: 6,
  },
  fieldRowDense: {
    gap: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textGreen,
    marginBottom: 0,
  },
  fieldLabelDense: {
    fontSize: 13,
    marginBottom: 6,
  },
  fieldInput: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelLight,
    paddingHorizontal: 16,
    color: palette.textDark,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  fieldInputDense: {
    minHeight: 44,
    borderRadius: 12,
    fontSize: 15,
    paddingHorizontal: 12,
  },
  fieldInputFocused: {
    borderColor: palette.accent,
    borderWidth: 2,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  roundLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textGreen,
    flexShrink: 1,
  },
  roundLabelDense: {
    fontSize: 13,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDense: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  stepButtonIndividual: {
    width: 40,
    height: 40,
    borderRadius: 13,
  },
  stepButtonPaired: {
    width: 40,
    height: 40,
    borderRadius: 13,
  },
  stepButtonDisabled: {
    opacity: 0.35,
  },
  stepButtonLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: palette.textGreen,
    marginTop: -1,
  },
  stepValueBox: {
    minWidth: 56,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  stepValueBoxDense: {
    minWidth: 48,
    height: 36,
    borderRadius: 12,
  },
  stepValueBoxIndividual: {
    minWidth: 50,
    height: 40,
  },
  stepValueBoxPaired: {
    minWidth: 76,
    height: 40,
  },
  stepValue: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.textDark,
    fontVariant: ['tabular-nums'],
  },
  stepValueDense: {
    fontSize: 22,
  },
  stepValueIndividual: {
    fontSize: 26,
  },
  stepValuePaired: {
    fontSize: 25,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipDense: {
    height: 34,
    borderRadius: 12,
  },
  quickChipIndividual: {
    height: 36,
    marginBottom: 0,
  },
  quickChipPaired: {
    height: 36,
    borderRadius: 11,
    marginBottom: 0,
  },
  quickChipPairedCompact: {
    height: 34,
  },
  quickChipSelected: {
    backgroundColor: palette.dark,
    borderColor: palette.dark,
  },
  quickChipLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textGreen,
  },
  quickChipLabelPaired: {
    fontSize: 13,
  },
  quickChipLabelSelected: {
    color: palette.white,
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.errorText,
    backgroundColor: palette.errorBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.errorBorder,
    padding: 12,
    marginTop: 4,
  },
  footer: {
    backgroundColor: palette.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  footerCompact: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  footerIndividual: {
    paddingTop: 10,
    paddingBottom: 10,
    gap: 4,
  },
  footerPaired: {
    paddingTop: 10,
    paddingBottom: 10,
    gap: 4,
  },
  primaryButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonIndividual: {
    height: 50,
    borderRadius: 16,
  },
  primaryButtonPaired: {
    height: 50,
    borderRadius: 16,
  },
  primaryButtonPairedCompact: {
    height: 48,
  },
  primaryLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.dark,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.cancel,
  },
  pressed: {
    opacity: 0.82,
  },
});

