import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

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
import { colors as ui, layout, radii } from '../theme';

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

  const showBonus = result.finishTeamBonus.amount !== 0;
  const bonusLabel = isIndividual
    ? (nameById.get(bonusPlayerId ?? '') ?? 'Bitiren')
    : result.finishTeamBonus.teamId != null
      ? teamNameFromActiveGame(game, result.finishTeamBonus.teamId)
      : 'Bonus';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>EL ÖNİZLEME</Text>
        <View style={styles.goldRule} />
        <Text style={styles.metaLine}>Bitiren Oyuncu: {finisherName}</Text>
        <Text style={styles.metaLine}>
          Bitiş Türü: {finishTypeLabel(meta.finishType)}
        </Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.panel}>
          <View style={styles.tableHeader}>
            <Text style={styles.colPlayerHeader}>Oyuncu</Text>
            <Text style={styles.colScoreHeader}>Puan</Text>
          </View>

          {result.players.map((row, index) => (
            <View
              key={row.playerId}
              style={[
                styles.row,
                index === result.players.length - 1 &&
                  (isIndividual || !result.teams.length) &&
                  !showBonus &&
                  styles.rowLast,
              ]}
            >
              <Text style={styles.colPlayer} numberOfLines={1}>
                {nameById.get(row.playerId) ?? row.playerId}
              </Text>
              <Text style={styles.colScore}>{row.score}</Text>
            </View>
          ))}

          {!isIndividual ? (
            <>
              <View style={styles.teamDivider} />
              {result.teams.map((team, index) => (
                <View
                  key={team.teamId}
                  style={[
                    styles.row,
                    index === result.teams.length - 1 &&
                      !showBonus &&
                      styles.rowLast,
                  ]}
                >
                  <Text style={styles.teamLabel} numberOfLines={1}>
                    {teamNameFromActiveGame(game, team.teamId)} Toplamı
                  </Text>
                  <Text style={styles.teamScore}>{team.score}</Text>
                </View>
              ))}
            </>
          ) : null}

          {showBonus ? (
            <View style={[styles.bonusRow, styles.rowLast]}>
              <Text style={styles.bonusLabel} numberOfLines={1}>
                Bitiş Bonusu · {bonusLabel}
              </Text>
              <Text style={styles.bonusValue}>
                {result.finishTeamBonus.amount}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !saving && styles.pressed,
              saving && styles.disabled,
            ]}
          >
            <Text style={styles.primaryLabel}>ELİ KAYDET</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            disabled={saving}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && !saving && styles.pressed,
              saving && styles.disabled,
            ]}
          >
            <Text style={styles.secondaryLabel}>GERİ DÖN VE DÜZELT</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ui.green,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: ui.gold,
  },
  goldRule: {
    width: 56,
    height: 2,
    backgroundColor: ui.gold,
    borderRadius: 1,
    marginVertical: 4,
  },
  metaLine: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(247, 242, 232, 0.82)',
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  panel: {
    backgroundColor: ui.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.gold,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    paddingHorizontal: 12,
    backgroundColor: '#EFE8DB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  colPlayerHeader: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: ui.green,
  },
  colScoreHeader: {
    minWidth: 48,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '800',
    color: ui.green,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  colPlayer: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: ui.text,
  },
  colScore: {
    minWidth: 48,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '800',
    color: ui.green,
  },
  teamDivider: {
    height: 1.5,
    backgroundColor: ui.gold,
  },
  teamLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: ui.text,
  },
  teamScore: {
    minWidth: 48,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '800',
    color: ui.green,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(200, 164, 77, 0.16)',
  },
  bonusLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: ui.gold,
  },
  bonusValue: {
    minWidth: 48,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '800',
    color: ui.green,
  },
  footer: {
    gap: 8,
  },
  primaryButton: {
    minHeight: layout.buttonHeight,
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
    minHeight: layout.buttonHeight,
    borderRadius: 10,
    backgroundColor: ui.white,
    borderWidth: 1,
    borderColor: ui.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: ui.green,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
