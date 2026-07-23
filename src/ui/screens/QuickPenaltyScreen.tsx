import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DEFAULT_SCORE_RULES } from '../../engine/rules';
import { PrimaryButton } from '../components/PrimaryButton';
import { resolveGameMode } from '../gameMode';
import { playersFromActiveGame } from '../gameRoster';
import { colors, radii, spacing, typography } from '../theme';
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

const PENALTY_OPTIONS: {
  kind: QuickPenaltyKind;
  label: string;
}[] = [
  { kind: 'remainingOkey', label: 'Elde Okey' },
  { kind: 'wrongOpen', label: 'Yanlış Açma' },
  { kind: 'playableTileDiscard', label: 'İşlek Taş' },
  { kind: 'manual', label: 'Manuel Ceza' },
];

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

type GridChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function GridChip({ label, selected, onPress }: GridChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.gridChip,
        selected && styles.gridChipSelected,
        pressed && styles.gridChipPressed,
      ]}
    >
      <Text
        style={[styles.gridChipLabel, selected && styles.gridChipLabelSelected]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function QuickPenaltyScreen({
  game,
  onBack,
  onApply,
}: QuickPenaltyScreenProps) {
  const players = useMemo(() => playersFromActiveGame(game), [game]);
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [kind, setKind] = useState<QuickPenaltyKind | null>(null);
  const [manualText, setManualText] = useState('101');

  const amount = kind === null ? 0 : amountForKind(kind, manualText);
  const canSubmit = playerId !== null && kind !== null && amount > 0;
  const selectedPlayer = players.find((player) => player.id === playerId);

  function handleApply() {
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

  const summary =
    selectedPlayer && kind
      ? `${selectedPlayer.name} · ${labelForKind(kind)} +${amount}`
      : 'Oyuncu ve ceza seç';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.content}>
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
            <Text style={styles.title}>Ceza Ekle</Text>
          </View>

          <Text style={styles.subtitle}>
            {isIndividual
              ? 'Oyuncuyu ve ceza türünü seç. Ceza yalnız seçilen oyuncuya yazılır.'
              : 'Oyuncuyu ve ceza türünü seç.'}
          </Text>

          <Text style={styles.sectionTitle}>Oyuncu</Text>
          <View style={styles.grid}>
            {players.map((player) => (
              <GridChip
                key={player.id}
                label={player.name}
                selected={playerId === player.id}
                onPress={() => setPlayerId(player.id)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Ceza türü</Text>
          <View style={styles.grid}>
            {PENALTY_OPTIONS.map((option) => (
              <GridChip
                key={option.kind}
                label={option.label}
                selected={kind === option.kind}
                onPress={() => setKind(option.kind)}
              />
            ))}
          </View>

          {kind === 'manual' ? (
            <View style={styles.manualRow}>
              <Text style={styles.manualLabel}>Miktar</Text>
              <TextInput
                keyboardType="number-pad"
                value={manualText}
                onChangeText={setManualText}
                onBlur={() =>
                  setManualText(String(amountForKind('manual', manualText)))
                }
                placeholderTextColor={colors.textSecondary}
                style={styles.manualInput}
              />
            </View>
          ) : null}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Cezayı Ekle"
            onPress={handleApply}
            disabled={!canSubmit}
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shell: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  backButton: {
    minHeight: 44,
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  gridChip: {
    width: '48.5%',
    minHeight: 52,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  gridChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gridChipPressed: {
    backgroundColor: colors.surface,
  },
  gridChipLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  gridChipLabelSelected: {
    color: colors.textOnPrimary,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manualLabel: {
    ...typography.infoLabel,
    color: colors.textSecondary,
    minWidth: 56,
  },
  manualInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  summaryCard: {
    marginTop: 'auto',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.xs,
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
