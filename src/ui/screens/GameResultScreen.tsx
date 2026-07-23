import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMemo } from 'react';

import { DEVELOPER_CREDIT } from '../../config/appInfo';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { calculateGameResult } from '../gameResult';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

type GameResultScreenProps = {
  game: ActiveGameData;
  onRematch: () => void;
  onNewTeams: () => void;
};

export function GameResultScreen({
  game,
  onRematch,
  onNewTeams,
}: GameResultScreenProps) {
  const result = useMemo(() => calculateGameResult(game), [game]);
  const isIndividual = result.mode === 'individual';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.brand}>101 YAZ-BOZ</Text>
            <Text style={styles.title}>Oyun Bitti</Text>
            <Text style={styles.subtitle}>
              {result.playedRounds} / {result.targetRoundCount} el tamamlandı
            </Text>
            <Text style={styles.semanticsHint}>Düşük puan avantajlıdır</Text>
          </View>

          {isIndividual ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Kazanan Oyuncu</Text>
              {result.individualWinner?.kind === 'tie' ? (
                <>
                  <Text style={styles.winnerTitle}>Berabere</Text>
                  {result.individualWinner.players.map((row) => (
                    <View key={row.playerId} style={styles.scoreRow}>
                      <Text style={styles.scoreName} numberOfLines={1}>
                        {row.name}
                      </Text>
                      <Text style={styles.scoreValue}>{row.totalScore}</Text>
                    </View>
                  ))}
                </>
              ) : result.individualWinner?.kind === 'winner' ? (
                <>
                  <Text style={styles.winnerTitle} numberOfLines={2}>
                    {result.individualWinner.name}
                  </Text>
                  <Text style={styles.winnerScore}>
                    {result.individualWinner.totalScore}
                  </Text>
                </>
              ) : null}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Kazanan Takım</Text>
              {result.pairedWinner?.kind === 'tie' ? (
                <>
                  <Text style={styles.winnerTitle}>Berabere</Text>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreName} numberOfLines={1}>
                      {result.pairedWinner.team1Name}
                    </Text>
                    <Text style={styles.scoreValue}>
                      {result.pairedWinner.team1Score}
                    </Text>
                  </View>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreName} numberOfLines={1}>
                      {result.pairedWinner.team2Name}
                    </Text>
                    <Text style={styles.scoreValue}>
                      {result.pairedWinner.team2Score}
                    </Text>
                  </View>
                </>
              ) : result.pairedWinner?.kind === 'winner' ? (
                <>
                  <Text style={styles.winnerTitle} numberOfLines={2}>
                    {result.pairedWinner.teamName}
                  </Text>
                  <Text style={styles.winnerScore}>
                    {result.pairedWinner.teamScore}
                  </Text>
                  <View style={styles.scoreRow}>
                    <Text style={styles.otherLabel} numberOfLines={1}>
                      {result.pairedWinner.otherTeamName}
                    </Text>
                    <Text style={styles.otherScore}>
                      {result.pairedWinner.otherTeamScore}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          )}

          {result.firstPlacePlayers.length > 0 ? (
            <View style={styles.topCard}>
              <Text style={styles.cardLabel}>
                {result.firstPlacePlayers.length > 1
                  ? 'Oyun Birincileri'
                  : 'Oyun Birincisi'}
              </Text>
              {result.firstPlacePlayers.map((row) => (
                <View key={row.playerId}>
                  <Text style={styles.topName} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={styles.topScore}>{row.totalScore}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Oyuncu Sıralaması</Text>
            <View style={styles.standings}>
              {result.standings.map((row) => (
                <Text
                  key={row.playerId}
                  style={styles.standingLine}
                  numberOfLines={1}
                >
                  {row.rank}. {row.name} — {row.totalScore}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Aynı Oyuncularla Yeni Oyun"
            onPress={onRematch}
          />
          <SecondaryButton
            label="Yeni Takım ve Oyuncular"
            onPress={onNewTeams}
            style={styles.secondaryAction}
          />
          <Text style={styles.credit}>{DEVELOPER_CREDIT}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  brand: {
    ...typography.brand,
    color: colors.primaryMuted,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    color: colors.text,
  },
  subtitle: {
    ...typography.infoLabel,
    color: colors.textSecondary,
  },
  semanticsHint: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: colors.primaryMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  topCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardLabel: {
    ...typography.infoLabel,
    color: colors.primary,
  },
  winnerTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    color: colors.text,
  },
  winnerScore: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 46,
    color: colors.primary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scoreName: {
    ...typography.buttonSecondary,
    color: colors.text,
    flex: 1,
  },
  scoreValue: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
  otherLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  otherScore: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
  topName: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: colors.text,
  },
  topScore: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.primaryMuted,
    marginBottom: spacing.xs,
  },
  standings: {
    gap: 6,
  },
  standingLine: {
    ...typography.body,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  secondaryAction: {
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',
  },
  credit: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    opacity: 0.75,
  },
});
