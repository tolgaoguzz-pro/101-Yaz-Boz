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
  kind: Exclude<QuickPenaltyKind, 'manual'>;
  label: string;
}[] = [
  { kind: 'remainingOkey', label: 'Elde Okey' },
  { kind: 'wrongOpen', label: 'Yanlış Açma' },
  { kind: 'playableTileDiscard', label: 'İşlek Taş' },
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

export function QuickPenaltyScreen({
  game,
  onBack,
  onApply,
}: QuickPenaltyScreenProps) {
  const players = useMemo(() => playersFromActiveGame(game), [game]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [kind, setKind] = useState<QuickPenaltyKind | null>(null);
  const [manualText, setManualText] = useState('101');

  const amount = kind === null ? 0 : amountForKind(kind, manualText);
  const canSubmit = playerId !== null && kind !== null && amount > 0;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
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
          <Text style={styles.title}>Ceza Ekle</Text>
          <Text style={styles.subtitle}>Oyuncuyu ve ceza türünü seç.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oyuncu</Text>
          <View style={styles.chipWrap}>
            {players.map((player) => (
              <ChoiceChip
                key={player.id}
                label={player.name}
                selected={playerId === player.id}
                onPress={() => setPlayerId(player.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ceza türü</Text>
          <View style={styles.chipWrap}>
            {PENALTY_OPTIONS.map((option) => (
              <ChoiceChip
                key={option.kind}
                label={option.label}
                selected={kind === option.kind}
                onPress={() => setKind(option.kind)}
              />
            ))}
            <ChoiceChip
              label="Manuel Ceza"
              selected={kind === 'manual'}
              onPress={() => setKind('manual')}
            />
          </View>
        </View>

        {kind === 'manual' ? (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Manuel miktar</Text>
            <TextInput
              keyboardType="number-pad"
              value={manualText}
              onChangeText={setManualText}
              onBlur={() =>
                setManualText(String(amountForKind('manual', manualText)))
              }
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
          </View>
        ) : null}

        {kind !== null ? (
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Eklenecek ceza</Text>
            <Text style={styles.amountValue}>+{amount}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
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
  fieldBlock: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.infoLabel,
    color: colors.textSecondary,
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
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  actions: {
    marginTop: 'auto',
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
