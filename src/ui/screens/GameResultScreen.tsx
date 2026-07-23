import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMemo } from 'react';

import { DEVELOPER_CREDIT } from '../../config/appInfo';
import { PrimaryButton } from '../components/PrimaryButton';
import { calculateGameResult } from '../gameResult';
import { colors, radii, spacing, typography } from '../theme';
import { ActiveGameData } from './ActiveGameScreen';

type GameResultScreenProps = {
  game: ActiveGameData;
  seriesSummaryLine?: string | null;
  onRematch: () => void;
  onViewTournament: () => void;
  onNewTeams: () => void;
};

export function GameResultScreen({
  game,
  seriesSummaryLine,
  onRematch,
  onViewTournament,
  onNewTeams,
}: GameResultScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const result = useMemo(() => calculateGameResult(game), [game]);
  const isIndividual = result.mode === 'individual';
  const isTie = result.isTie;

  const winnerTitle = isIndividual
    ? isTie
      ? 'Ortak Birinciler'
      : 'Kazanan Oyuncu'
    : isTie
      ? 'Berabere'
      : 'Kazanan Takım';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.shell, compact && styles.shellCompact]}>
        <View style={[styles.heroArt, compact && styles.heroArtCompact]}>
          <View style={styles.tileMotifRow}>
            <View style={[styles.tileMotif, styles.tileA]} />
            <View style={[styles.tileMotif, styles.tileB]} />
            <View style={[styles.tileMotif, styles.tileC]} />
          </View>
          <Text style={styles.brand}>101 YAZ-BOZ</Text>
          <Text style={styles.kicker}>Oyun Bitti</Text>
          <Text style={styles.trophy}>{isTie ? '🤝' : '🏆'}</Text>
          <Text style={styles.heroLabel}>{winnerTitle}</Text>

          {isIndividual ? (
            result.individualWinner?.kind === 'tie' ? (
              <View style={styles.tieBlock}>
                {result.individualWinner.players.map((row) => (
                  <Text key={row.playerId} style={styles.winnerName}>
                    {row.name} · {row.totalScore}
                  </Text>
                ))}
              </View>
            ) : result.individualWinner?.kind === 'winner' ? (
              <>
                <Text style={styles.winnerName} numberOfLines={1}>
                  {result.individualWinner.name}
                </Text>
                <Text style={styles.winnerScore}>
                  {result.individualWinner.totalScore}
                </Text>
              </>
            ) : null
          ) : result.pairedWinner?.kind === 'tie' ? (
            <View style={styles.tieBlock}>
              <Text style={styles.winnerName}>
                {result.pairedWinner.team1Name} {result.pairedWinner.team1Score}
              </Text>
              <Text style={styles.winnerName}>
                {result.pairedWinner.team2Name} {result.pairedWinner.team2Score}
              </Text>
            </View>
          ) : result.pairedWinner?.kind === 'winner' ? (
            <>
              <Text style={styles.winnerName} numberOfLines={2}>
                {result.pairedWinner.teamName}
              </Text>
              <Text style={styles.winnerScore}>
                {result.pairedWinner.teamScore}
              </Text>
              <Text style={styles.otherLine}>
                {result.pairedWinner.otherTeamName}{' '}
                {result.pairedWinner.otherTeamScore}
              </Text>
            </>
          ) : null}

          <Text style={styles.hint}>Düşük ceza puanı avantajlıdır</Text>
        </View>

        <View style={styles.rankCard}>
          <Text style={styles.rankTitle}>Sıralama</Text>
          {result.standings.map((row) => (
            <View key={row.playerId} style={styles.rankRow}>
              <Text style={styles.rankPos}>
                {row.rank === 1 && !isTie ? '🏆' : `${row.rank}.`}
              </Text>
              <Text style={styles.rankName} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={styles.rankScore}>{row.totalScore}</Text>
            </View>
          ))}
        </View>

        {seriesSummaryLine ? (
          <View style={styles.seriesCard}>
            <Text style={styles.seriesLabel}>Turnuva</Text>
            <Text style={styles.seriesLine} numberOfLines={2}>
              {seriesSummaryLine}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <PrimaryButton
            label="Aynı Oyuncularla Yeni Oyun"
            onPress={onRematch}
          />
          <View style={styles.secondaryRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onViewTournament}
              style={({ pressed }) => [
                styles.secondaryChip,
                pressed && styles.secondaryPressed,
              ]}
            >
              <Text style={styles.secondaryChipLabel}>Turnuva</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onNewTeams}
              style={({ pressed }) => [
                styles.secondaryChip,
                pressed && styles.secondaryPressed,
              ]}
            >
              <Text style={styles.secondaryChipLabel}>Yeni Kadro</Text>
            </Pressable>
          </View>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  shellCompact: {
    gap: spacing.xs,
  },
  heroArt: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 4,
  },
  heroArtCompact: {
    paddingVertical: spacing.sm,
  },
  tileMotifRow: {
    position: 'absolute',
    right: -8,
    top: -8,
    flexDirection: 'row',
    gap: 6,
    opacity: 0.22,
  },
  tileMotif: {
    width: 36,
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  tileA: { transform: [{ rotate: '12deg' }] },
  tileB: { transform: [{ rotate: '-8deg' }], marginTop: 10 },
  tileC: { transform: [{ rotate: '18deg' }], marginTop: 4 },
  brand: {
    ...typography.brand,
    color: colors.textOnPrimary,
    opacity: 0.85,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnPrimary,
    opacity: 0.9,
  },
  trophy: {
    fontSize: 40,
    lineHeight: 46,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textOnPrimary,
    opacity: 0.9,
  },
  winnerName: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  winnerScore: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
    color: colors.textOnPrimary,
  },
  otherLine: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textOnPrimary,
    opacity: 0.85,
  },
  tieBlock: {
    alignItems: 'center',
    gap: 2,
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textOnPrimary,
    opacity: 0.75,
    marginTop: 2,
  },
  rankCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  rankTitle: {
    ...typography.infoLabel,
    color: colors.primary,
    marginBottom: 2,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 26,
    gap: spacing.sm,
  },
  rankPos: {
    width: 28,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  rankName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rankScore: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  seriesCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  seriesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  seriesLine: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.xs,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  secondaryChipLabel: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  credit: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.75,
  },
});
