import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { DEFAULT_SCORE_RULES } from '../../engine/rules';
import {
  NumericKeyboardAccessory,
  NumericKeyboardAndroidDock,
  numericTextInputProps,
  useNumericKeyboard,
} from '../components/NumericKeyboardAccessory';
import { ScreenBackButton, SectionLabel } from '../components/ScreenChrome';
import { resolveGameMode } from '../gameMode';
import {
  playersFromActiveGame,
  teamNameFromActiveGame,
} from '../gameRoster';
import { ActiveGameData } from './ActiveGameScreen';

export type QuickPenaltyKind =
  | 'remainingOkey'
  | 'wrongOpen'
  | 'playableTileDiscard'
  | 'manual';

export type QuickPenaltySelection = {
  playerId: string;
  playerName: string;
  kind: QuickPenaltyKind;
  label: string;
  amount: number;
};

type QuickPenaltyScreenProps = {
  game: ActiveGameData;
  onBack: () => void;
  onApply: (selection: QuickPenaltySelection) => void;
};

type Density = 'normal' | 'compact' | 'ultraCompact';

const palette = {
  background: '#0B3A2D',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelLight: '#EAF1EC',
  panelMuted: '#C9D8CF',
  border: '#B7CBBE',
  borderStrong: '#AFC5B8',
  accent: '#B58A43',
  textGreen: '#174333',
  textDark: '#142D25',
  textMuted: 'rgba(23,67,51,0.58)',
  amount: '#8B2E25',
  white: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.62)',
  cancelBorder: 'rgba(255,255,255,0.50)',
} as const;

const PENALTY_OPTIONS: {
  kind: QuickPenaltyKind;
  label: string;
}[] = [
  { kind: 'remainingOkey', label: 'Elde Okey' },
  { kind: 'wrongOpen', label: 'Yanlış Açma' },
  { kind: 'playableTileDiscard', label: 'İşlek Taş' },
  { kind: 'manual', label: 'Manuel Ceza' },
];

function resolveDensity(height: number): Density {
  if (height >= 850) {
    return 'normal';
  }
  if (height >= 760) {
    return 'compact';
  }
  return 'ultraCompact';
}

function amountForKind(kind: QuickPenaltyKind, manualText: string): number {
  switch (kind) {
    case 'remainingOkey':
      return DEFAULT_SCORE_RULES.handExtras.okeyPenalty;
    case 'wrongOpen':
      return DEFAULT_SCORE_RULES.handExtras.wrongOpenPenalty;
    case 'playableTileDiscard':
      return DEFAULT_SCORE_RULES.handExtras.playableTileDiscardPenalty;
    case 'manual': {
      const parsed = Number.parseInt(manualText.replace(/[^\d]/g, ''), 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
      }
      return parsed;
    }
  }
}

function labelForKind(kind: QuickPenaltyKind): string {
  switch (kind) {
    case 'remainingOkey':
      return 'Elde Okey';
    case 'wrongOpen':
      return 'Yanlış Açma';
    case 'playableTileDiscard':
      return 'İşlek Taş';
    case 'manual':
      return 'Manuel Ceza';
  }
}

function PlayerChip({
  label,
  teamLabel,
  selected,
  onPress,
  density,
}: {
  label: string;
  teamLabel: string | null;
  selected: boolean;
  onPress: () => void;
  density: Density;
}) {
  const ultra = density === 'ultraCompact';
  const compact = density === 'compact';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.playerChip,
        ultra && styles.playerChipUltra,
        compact && !ultra && styles.playerChipCompact,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.playerChipLabel,
          ultra && styles.playerChipLabelUltra,
          compact && !ultra && styles.playerChipLabelCompact,
          selected && styles.chipLabelSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {teamLabel ? (
        <Text
          style={[
            styles.playerTeamLabel,
            ultra && styles.playerTeamLabelUltra,
            compact && !ultra && styles.playerTeamLabelCompact,
            selected && styles.playerTeamLabelSelected,
          ]}
          numberOfLines={1}
        >
          {teamLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

function PenaltyChip({
  label,
  amountText,
  hint,
  selected,
  onPress,
  density,
}: {
  label: string;
  amountText: string | null;
  hint: string | null;
  selected: boolean;
  onPress: () => void;
  density: Density;
}) {
  const ultra = density === 'ultraCompact';
  const compact = density === 'compact';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.penaltyChip,
        ultra && styles.penaltyChipUltra,
        compact && !ultra && styles.penaltyChipCompact,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.penaltyChipLabel,
          ultra && styles.penaltyChipLabelUltra,
          compact && !ultra && styles.penaltyChipLabelCompact,
          selected && styles.chipLabelSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {amountText ? (
        <Text
          style={[
            styles.penaltyAmount,
            ultra && styles.penaltyAmountUltra,
            compact && !ultra && styles.penaltyAmountCompact,
            selected && styles.chipLabelSelected,
          ]}
        >
          {amountText}
        </Text>
      ) : null}
      {hint ? (
        <Text
          style={[
            styles.penaltyHint,
            ultra && styles.penaltyHintUltra,
            selected && styles.playerTeamLabelSelected,
          ]}
          numberOfLines={1}
        >
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function QuickPenaltyScreen({
  game,
  onBack,
  onApply,
}: QuickPenaltyScreenProps) {
  const { height } = useWindowDimensions();
  const density = resolveDensity(height);
  const compact = density === 'compact';
  const ultra = density === 'ultraCompact';

  const players = useMemo(() => playersFromActiveGame(game), [game]);
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [kind, setKind] = useState<QuickPenaltyKind | null>(null);
  const [manualText, setManualText] = useState('101');
  const [manualFocused, setManualFocused] = useState(false);

  const amount = kind === null ? 0 : amountForKind(kind, manualText);
  const canSubmit = playerId !== null && kind !== null && amount > 0;
  const selectedPlayer = players.find((player) => player.id === playerId);
  const showManualInput = kind === 'manual';
  const numberPad = useNumericKeyboard(showManualInput ? 1 : 0);
  const manualBind = numberPad.bind(0);

  function handleApply() {
    numberPad.dismiss();
    if (!canSubmit || playerId === null || kind === null) {
      return;
    }

    const player = players.find((entry) => entry.id === playerId);
    if (!player) {
      return;
    }

    onApply({
      playerId,
      playerName: player.name,
      kind,
      label: labelForKind(kind),
      amount,
    });
  }

  const selectionReady = selectedPlayer != null && kind != null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <View
          style={[
            styles.header,
            compact && styles.headerCompact,
            ultra && styles.headerUltra,
          ]}
        >
          <ScreenBackButton onPress={onBack} light />
          <View style={styles.titleBlock}>
            <Text
              style={[
                styles.title,
                compact && styles.titleCompact,
                ultra && styles.titleUltra,
              ]}
            >
              Ceza Ekle
            </Text>
            <Text
              style={[
                styles.subtitle,
                compact && styles.subtitleCompact,
                ultra && styles.subtitleUltra,
              ]}
              numberOfLines={ultra ? 1 : 2}
            >
              {isIndividual
                ? 'Ceza yalnızca seçilen oyuncuya uygulanır'
                : 'Oyuncuyu ve ceza türünü seç'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.panel,
            compact && styles.panelCompact,
            ultra && styles.panelUltra,
          ]}
        >
          <View
            style={[
              styles.section,
              compact && styles.sectionCompact,
              ultra && styles.sectionUltra,
            ]}
          >
            <SectionLabel>Oyuncu</SectionLabel>
            <View style={styles.grid}>
              {players.map((player) => (
                <PlayerChip
                  key={player.id}
                  label={player.name}
                  teamLabel={
                    isIndividual
                      ? null
                      : teamNameFromActiveGame(game, player.teamId)
                  }
                  selected={playerId === player.id}
                  onPress={() => setPlayerId(player.id)}
                  density={density}
                />
              ))}
            </View>
          </View>

          <View
            style={[
              styles.section,
              compact && styles.sectionCompact,
              ultra && styles.sectionUltra,
            ]}
          >
            <SectionLabel>Ceza Türü</SectionLabel>
            <View style={styles.grid}>
              {PENALTY_OPTIONS.map((option) => (
                <PenaltyChip
                  key={option.kind}
                  label={option.label}
                  amountText={
                    option.kind === 'manual'
                      ? null
                      : String(amountForKind(option.kind, manualText))
                  }
                  hint={
                    option.kind === 'manual' ? 'Miktarı sen belirle' : null
                  }
                  selected={kind === option.kind}
                  onPress={() => setKind(option.kind)}
                  density={density}
                />
              ))}
            </View>
          </View>

          {showManualInput ? (
            <View
              style={[
                styles.manualRow,
                compact && styles.manualRowCompact,
                ultra && styles.manualRowUltra,
              ]}
            >
              <View style={styles.manualCopy}>
                <Text style={styles.manualTitle}>Ceza Miktarı</Text>
                <Text style={styles.manualHint}>Pozitif bir sayı gir</Text>
              </View>
              <TextInput
                ref={manualBind.ref}
                {...numericTextInputProps}
                inputAccessoryViewID={manualBind.inputAccessoryViewID}
                value={manualText}
                onChangeText={setManualText}
                onFocus={() => {
                  setManualFocused(true);
                  manualBind.onFocus();
                }}
                onBlur={() => {
                  setManualFocused(false);
                  setManualText(String(amountForKind('manual', manualText)));
                }}
                placeholderTextColor={palette.textMuted}
                style={[
                  styles.manualInput,
                  compact && styles.manualInputCompact,
                  ultra && styles.manualInputUltra,
                  manualFocused && styles.manualInputFocused,
                ]}
              />
            </View>
          ) : null}

          <View
            style={[
              styles.summaryCard,
              compact && styles.summaryCardCompact,
              ultra && styles.summaryCardUltra,
            ]}
          >
            <Text
              style={[
                styles.summaryTitle,
                compact && styles.summaryTitleCompact,
                ultra && styles.summaryTitleUltra,
              ]}
            >
              Ceza Özeti
            </Text>
            {!selectionReady ? (
              <Text style={styles.summaryEmpty}>Oyuncu ve ceza türü seç</Text>
            ) : (
              <View style={styles.summaryReady}>
                <Text style={styles.summaryPlayer} numberOfLines={1}>
                  {selectedPlayer?.name}
                </Text>
                <Text style={styles.summaryKind} numberOfLines={1}>
                  {kind ? labelForKind(kind) : ''}
                </Text>
                <Text
                  style={[
                    styles.summaryAmount,
                    compact && styles.summaryAmountCompact,
                    ultra && styles.summaryAmountUltra,
                  ]}
                >
                  +{amount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!numberPad.keyboardVisible ? (
          <View
            style={[
              styles.footer,
              compact && styles.footerCompact,
              ultra && styles.footerUltra,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={({ pressed }) => [
                styles.cancelButton,
                compact && styles.footerButtonCompact,
                ultra && styles.footerButtonUltra,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.cancelLabel,
                  compact && styles.footerLabelCompact,
                  ultra && styles.footerLabelUltra,
                ]}
              >
                İptal
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={handleApply}
              style={({ pressed }) => [
                styles.applyButton,
                compact && styles.footerButtonCompact,
                ultra && styles.footerButtonUltra,
                !canSubmit && styles.applyDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.applyLabel,
                  compact && styles.applyLabelCompact,
                  ultra && styles.applyLabelUltra,
                ]}
              >
                Cezayı Ekle
              </Text>
            </Pressable>
          </View>
        ) : null}

        <NumericKeyboardAccessory fieldCount={numberPad.fieldCount} />
        <NumericKeyboardAndroidDock
          visible={numberPad.showAndroidDock}
          keyboardHeight={numberPad.keyboardHeight}
          canPrev={numberPad.canPrev}
          canNext={numberPad.canNext}
          onPrev={numberPad.goPrev}
          onNext={numberPad.goNext}
          onDismiss={numberPad.dismiss}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  shell: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 6,
  },
  headerCompact: {
    paddingBottom: 8,
  },
  headerUltra: {
    paddingBottom: 6,
  },
  titleBlock: {
    gap: 3,
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: palette.white,
  },
  titleCompact: {
    fontSize: 26,
  },
  titleUltra: {
    fontSize: 23,
  },
  subtitle: {
    fontSize: 14,
    color: palette.headerSub,
  },
  subtitleCompact: {
    fontSize: 13,
  },
  subtitleUltra: {
    fontSize: 12,
  },
  panel: {
    flex: 1,
    minHeight: 0,
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 26,
    marginHorizontal: 16,
    padding: 18,
    overflow: 'hidden',
    gap: 18,
  },
  panelCompact: {
    borderRadius: 22,
    marginHorizontal: 14,
    padding: 14,
    gap: 13,
  },
  panelUltra: {
    borderRadius: 20,
    marginHorizontal: 12,
    padding: 11,
    gap: 9,
  },
  section: {
    gap: 10,
  },
  sectionCompact: {
    gap: 8,
  },
  sectionUltra: {
    gap: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  playerChip: {
    width: '48.5%',
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
  },
  playerChipCompact: {
    minHeight: 48,
    borderRadius: 14,
  },
  playerChipUltra: {
    minHeight: 42,
    borderRadius: 12,
    paddingVertical: 6,
  },
  playerChipLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  playerChipLabelCompact: {
    fontSize: 14,
  },
  playerChipLabelUltra: {
    fontSize: 13,
  },
  playerTeamLabel: {
    fontSize: 11,
    color: palette.textMuted,
    textAlign: 'center',
  },
  playerTeamLabelCompact: {
    fontSize: 10,
  },
  playerTeamLabelUltra: {
    fontSize: 9,
  },
  playerTeamLabelSelected: {
    color: 'rgba(255,255,255,0.72)',
  },
  penaltyChip: {
    width: '48.5%',
    minHeight: 66,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 2,
  },
  penaltyChipCompact: {
    minHeight: 58,
    borderRadius: 15,
    padding: 8,
  },
  penaltyChipUltra: {
    minHeight: 50,
    borderRadius: 13,
    padding: 6,
  },
  penaltyChipLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  penaltyChipLabelCompact: {
    fontSize: 13,
  },
  penaltyChipLabelUltra: {
    fontSize: 12,
  },
  penaltyAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: palette.textDark,
    fontVariant: ['tabular-nums'],
  },
  penaltyAmountCompact: {
    fontSize: 18,
  },
  penaltyAmountUltra: {
    fontSize: 16,
  },
  penaltyHint: {
    fontSize: 11,
    color: palette.textMuted,
    textAlign: 'center',
  },
  penaltyHintUltra: {
    fontSize: 10,
  },
  chipSelected: {
    backgroundColor: palette.dark,
    borderColor: palette.accent,
    borderWidth: 1.5,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipLabelSelected: {
    color: palette.white,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  manualRowCompact: {
    gap: 10,
  },
  manualRowUltra: {
    gap: 8,
  },
  manualCopy: {
    flex: 1,
    gap: 2,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.textGreen,
  },
  manualHint: {
    fontSize: 12,
    color: palette.textMuted,
  },
  manualInput: {
    width: 116,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelLight,
    textAlign: 'center',
    color: palette.textDark,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 8,
  },
  manualInputCompact: {
    width: 104,
    height: 44,
    borderRadius: 13,
    fontSize: 18,
  },
  manualInputUltra: {
    width: 94,
    height: 40,
    borderRadius: 12,
    fontSize: 16,
  },
  manualInputFocused: {
    borderColor: palette.accent,
  },
  summaryCard: {
    marginTop: 'auto',
    backgroundColor: palette.panelMuted,
    borderColor: palette.borderStrong,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  summaryCardCompact: {
    borderRadius: 16,
    padding: 11,
  },
  summaryCardUltra: {
    borderRadius: 14,
    padding: 8,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.textGreen,
  },
  summaryTitleCompact: {
    fontSize: 14,
  },
  summaryTitleUltra: {
    fontSize: 13,
  },
  summaryEmpty: {
    fontSize: 14,
    color: palette.textMuted,
  },
  summaryReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryPlayer: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: palette.textDark,
  },
  summaryKind: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: palette.textGreen,
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.amount,
    fontVariant: ['tabular-nums'],
  },
  summaryAmountCompact: {
    fontSize: 21,
  },
  summaryAmountUltra: {
    fontSize: 18,
  },
  footer: {
    backgroundColor: palette.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerCompact: {
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  footerUltra: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  cancelButton: {
    flex: 0.8,
    height: 54,
    borderRadius: 17,
    backgroundColor: 'transparent',
    borderColor: palette.cancelBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    flex: 1.2,
    height: 54,
    borderRadius: 17,
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonCompact: {
    height: 48,
    borderRadius: 15,
  },
  footerButtonUltra: {
    height: 44,
    borderRadius: 14,
  },
  applyDisabled: {
    opacity: 0.42,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.white,
  },
  applyLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.dark,
  },
  footerLabelCompact: {
    fontSize: 14,
  },
  footerLabelUltra: {
    fontSize: 13,
  },
  applyLabelCompact: {
    fontSize: 15,
  },
  applyLabelUltra: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.86,
  },
});
