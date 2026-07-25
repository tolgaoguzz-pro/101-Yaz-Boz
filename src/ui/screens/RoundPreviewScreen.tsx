import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CalculateRoundResult } from '../../engine/calculateRound';
import { resolveGameMode } from '../gameMode';
import {
  playersFromActiveGame,
  teamNameFromActiveGame,
} from '../gameRoster';
import { playerIdFromIndividualTeamId } from '../individualRound';
import { finishTypeLabel } from '../roundEntry/finishLabels';
import { RoundPreviewMeta } from '../roundEntry/previewState';
import { ActiveGameData } from './ActiveGameScreen';

export type { RoundPreviewMeta } from '../roundEntry/previewState';

const palette = {
  background: '#0B3A2D',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelLight: '#EAF1EC',
  panelMuted: '#C9D8CF',
  panelStrong: '#C5D6CA',
  panelRowAlt: '#E3ECE6',
  border: '#B7CBBE',
  borderStrong: '#AFC5B8',
  textDark: '#142D25',
  textGreen: '#174333',
  teamName: '#17613D',
  teamScore: '#102B22',
  textMuted: 'rgba(23,67,51,0.58)',
  rowLine: 'rgba(23,67,51,0.14)',
  headerMeta: 'rgba(255,255,255,0.68)',
  cancelBorder: 'rgba(255,255,255,0.55)',
  accent: '#B58A43',
  bonusBg: '#E7D9B9',
  bonusBorder: '#C9AA66',
  bonusValue: '#72531F',
  white: '#FFFFFF',
} as const;

type Density = 'normal' | 'compact' | 'ultraCompact';

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
  const { height } = useWindowDimensions();
  const density: Density =
    height < 700 ? 'ultraCompact' : height < 800 ? 'compact' : 'normal';
  const compact = density !== 'normal';
  const ultra = density === 'ultraCompact';

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

  const showBonus = result.finishTeamBonus.amount !== 0;
  const bonusLabel = isIndividual
    ? (nameById.get(bonusPlayerId ?? '') ?? 'Bitiren')
    : result.finishTeamBonus.teamId != null
      ? teamNameFromActiveGame(game, result.finishTeamBonus.teamId)
      : 'Bonus';

  const finishLabel = finishTypeLabel(meta.finishType);
  const nobodyFinished = meta.finisherPlayerId === null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.header,
          compact && styles.headerCompact,
          ultra && styles.headerUltra,
        ]}
      >
        <Text style={[styles.title, compact && styles.titleCompact]}>
          El Önizleme
        </Text>
        {!ultra ? (
          <Text style={styles.metaLine}>
            {finisherName} · {finishLabel}
          </Text>
        ) : null}
        <View style={styles.headerRule} />
      </View>

      <View
        style={[
          styles.panel,
          compact && styles.panelCompact,
          ultra && styles.panelUltra,
        ]}
      >
        <View style={styles.content}>
          <View style={[styles.summaryCard, ultra && styles.summaryCardUltra]}>
            {nobodyFinished ? (
              <Text style={styles.summarySolo} numberOfLines={1}>
                {finisherName}
              </Text>
            ) : (
              <View style={styles.summaryRow}>
                <View style={styles.summarySide}>
                  <Text style={styles.summaryLabel}>Bitiren</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {finisherName}
                  </Text>
                </View>
                <View style={styles.summarySide}>
                  <Text style={styles.summaryLabel}>Bitiş Türü</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {finishLabel}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}
            >
              Oyuncu Puanları
            </Text>
            <View style={styles.scoreGrid}>
              {result.players.map((row, index) => {
                const isLastPlayer = index === result.players.length - 1;
                return (
                  <View
                    key={row.playerId}
                    style={[
                      styles.playerRow,
                      compact && styles.playerRowCompact,
                      index % 2 === 1 && styles.playerRowAlt,
                      isLastPlayer && styles.playerRowLast,
                    ]}
                  >
                    <Text style={styles.playerName} numberOfLines={1}>
                      {nameById.get(row.playerId) ?? row.playerId}
                    </Text>
                    <Text style={styles.playerScore}>{row.score}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {!isIndividual ? (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  compact && styles.sectionTitleCompact,
                ]}
              >
                Takım Toplamları
              </Text>
              <View style={styles.teamsRow}>
                {result.teams.map((team) => (
                  <View
                    key={team.teamId}
                    style={[
                      styles.teamCard,
                      compact && styles.teamCardCompact,
                    ]}
                  >
                    <Text style={styles.teamName} numberOfLines={2}>
                      {teamNameFromActiveGame(game, team.teamId)}
                    </Text>
                    <Text style={styles.teamScore}>{team.score}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {showBonus ? (
            <View style={[styles.bonusCard, ultra && styles.bonusCardUltra]}>
              <View style={styles.bonusTextCol}>
                <Text style={styles.bonusTitle}>Bitiş Bonusu</Text>
                <Text style={styles.bonusSubtitle} numberOfLines={1}>
                  {bonusLabel}
                </Text>
              </View>
              <Text style={styles.bonusValue}>
                {result.finishTeamBonus.amount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

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
          disabled={saving}
          style={({ pressed }) => [
            styles.secondaryButton,
            compact && styles.footerButtonCompact,
            pressed && !saving && styles.pressed,
            saving && styles.disabled,
          ]}
        >
          <Text style={styles.secondaryLabel} numberOfLines={2}>
            Geri Dön ve Düzelt
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.primaryButton,
            compact && styles.footerButtonCompact,
            pressed && !saving && styles.pressed,
            saving && styles.disabled,
          ]}
        >
          <Text style={styles.primaryLabel} numberOfLines={1}>
            {saving ? 'Kaydediliyor…' : 'Eli Kaydet'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  headerCompact: {
    paddingBottom: 8,
  },
  headerUltra: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 26,
  },
  metaLine: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.headerMeta,
    textAlign: 'center',
  },
  headerRule: {
    marginTop: 6,
    width: 48,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  panel: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 16,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 28,
    padding: 18,
    overflow: 'hidden',
  },
  panelCompact: {
    padding: 14,
    borderRadius: 24,
  },
  panelUltra: {
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 22,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: palette.panelMuted,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 20,
    padding: 16,
  },
  summaryCardUltra: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summarySide: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textMuted,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textGreen,
  },
  summarySolo: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textGreen,
  },
  sectionTitleCompact: {
    fontSize: 18,
  },
  scoreGrid: {
    backgroundColor: palette.panelLight,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  playerRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.panelLight,
    borderBottomWidth: 1,
    borderBottomColor: palette.rowLine,
  },
  playerRowCompact: {
    minHeight: 50,
    paddingHorizontal: 14,
  },
  playerRowAlt: {
    backgroundColor: palette.panelRowAlt,
  },
  playerRowLast: {
    borderBottomWidth: 0,
  },
  playerName: {
    flex: 1,
    marginRight: 12,
    fontSize: 16,
    fontWeight: '700',
    color: palette.textGreen,
  },
  playerScore: {
    fontSize: 22,
    fontWeight: '900',
    color: palette.textDark,
    fontVariant: ['tabular-nums'],
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  teamCard: {
    flex: 1,
    minHeight: 112,
    backgroundColor: palette.panelStrong,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  teamCardCompact: {
    minHeight: 92,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.teamName,
    textAlign: 'center',
  },
  teamScore: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.teamScore,
    fontVariant: ['tabular-nums'],
  },
  bonusCard: {
    backgroundColor: palette.bonusBg,
    borderWidth: 1,
    borderColor: palette.bonusBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bonusCardUltra: {
    minHeight: 56,
    paddingHorizontal: 12,
  },
  bonusTextCol: {
    flex: 1,
    gap: 2,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.bonusValue,
  },
  bonusSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(114,83,31,0.78)',
  },
  bonusValue: {
    fontSize: 22,
    fontWeight: '900',
    color: palette.bonusValue,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: palette.background,
  },
  footerCompact: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  footerUltra: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  secondaryButton: {
    flex: 0.9,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cancelBorder,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  primaryButton: {
    flex: 1.1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  footerButtonCompact: {
    height: 50,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.white,
    textAlign: 'center',
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.dark,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.55,
  },
});
