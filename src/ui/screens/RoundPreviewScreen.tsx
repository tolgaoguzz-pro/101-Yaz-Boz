import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { CalculateRoundResult } from '../../engine/calculateRound';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { resolveGameMode } from '../gameMode';
import {
  playersFromActiveGame,
  teamNameFromActiveGame,
} from '../gameRoster';
import { playerIdFromIndividualTeamId } from '../individualRound';
import { finishTypeLabel } from '../roundEntry/finishLabels';
import { RoundPreviewMeta } from '../roundEntry/previewState';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

export type { RoundPreviewMeta } from '../roundEntry/previewState';

type RoundPreviewScreenProps = {
  game: ActiveGameData;
  result: CalculateRoundResult;
  meta: RoundPreviewMeta;
  saving?: boolean;
  onBack: () => void;
  onSave: () => void;
};

export function RoundPreviewScreen({
  game,
  result,
  meta,
  saving = false,
  onBack,
  onSave,
}: RoundPreviewScreenProps) {
  const isIndividual = resolveGameMode(game.gameMode) === 'individual';
  const players = playersFromActiveGame(game);
  const nameById = new Map<string, string>(
    players.map((p) => [p.id, p.name]),
  );
  const finisherName =
    meta.finisherPlayerId === null
      ? 'Kimse bitmedi'
      : (nameById.get(meta.finisherPlayerId) ?? meta.finisherPlayerId);

  const bonusPlayerId = isIndividual
    ? playerIdFromIndividualTeamId(result.finishTeamBonus.teamId)
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.content}>
          <Text style={styles.title}>El Önizleme</Text>
          <Text style={styles.metaLine}>Bitiren: {finisherName}</Text>
          <Text style={styles.metaLine}>
            Bitiş türü: {finishTypeLabel(meta.finishType)}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Oyuncu Puanları</Text>
            {result.players.map((row) => (
              <View key={row.playerId} style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>
                  {nameById.get(row.playerId) ?? row.playerId}
                </Text>
                <Text style={styles.value}>{row.score}</Text>
              </View>
            ))}
          </View>

          {isIndividual ? (
            result.finishTeamBonus.amount !== 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Bitiş Bonusu</Text>
                <View style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>
                    {nameById.get(bonusPlayerId ?? '') ?? 'Bitiren'}
                  </Text>
                  <Text style={styles.value}>
                    {result.finishTeamBonus.amount}
                  </Text>
                </View>
              </View>
            ) : null
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Takım Toplamları</Text>
              {result.teams.map((team) => (
                <View key={team.teamId} style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>
                    {teamNameFromActiveGame(game, team.teamId)}
                  </Text>
                  <Text style={styles.value}>{team.score}</Text>
                </View>
              ))}
              {result.finishTeamBonus.teamId !== null ? (
                <View style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>
                    Bonus ·{' '}
                    {teamNameFromActiveGame(
                      game,
                      result.finishTeamBonus.teamId,
                    )}
                  </Text>
                  <Text style={styles.value}>
                    {result.finishTeamBonus.amount}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Eli Kaydet"
            onPress={onSave}
            disabled={saving}
          />
          <SecondaryButton
            label="Geri Dön ve Düzelt"
            onPress={onBack}
            disabled={saving}
            style={styles.secondary}
          />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  metaLine: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  cardLabel: {
    ...typography.infoLabel,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 24,
    alignItems: 'center',
  },
  name: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  value: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  secondary: {
    flexGrow: 0,
    width: '100%',
  },
});
