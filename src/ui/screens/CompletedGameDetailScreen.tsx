import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { CompletedGameRecord } from '../../domain/completedGame';
import {
  buildSeriesSummaryLine,
  formatSafeDateTime,
} from '../tournamentPresentation';
import {
  calculateMatchupSeries,
  MatchupSeriesSummary,
} from '../../domain/tournament';
import {
  getCompletedGameById,
  listCompletedGamesByMatchup,
} from '../../persistence/completedGameRepository';
import { ScoreSheetTable } from '../components/ScoreSheetTable';
import { gameModeLabel, resolveGameMode } from '../gameMode';
import { buildScoreSheet } from '../scoreSheet';
import { ActiveGameData } from './ActiveGameScreen';
import { colors as ui, layout, radii } from '../theme';

type CompletedGameDetailScreenProps = {
  gameId: string;
  onBack: () => void;
  onPlayAgain: (record: CompletedGameRecord) => void;
};

function winnerLabel(record: CompletedGameRecord): string {
  if (record.winner.kind === 'paired') {
    return record.winner.outcome === 'winner'
      ? (record.winner.teamName ?? 'Takım')
      : 'Berabere';
  }
  return record.winner.outcome === 'winner'
    ? (record.winner.name ?? 'Oyuncu')
    : 'Berabere';
}

function toSheetGame(record: CompletedGameRecord): ActiveGameData {
  return {
    teams: record.teams,
    roundNumber: record.playedRoundCount,
    rounds: record.rounds,
    lastAction: null,
    targetRoundCount: record.targetRoundCount,
    gameMode: record.gameMode,
    status: 'completed',
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    activityLog: record.activityLog,
    completedGameRecordId: record.id,
  };
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function CompletedGameDetailScreen({
  gameId,
  onBack,
  onPlayAgain,
}: CompletedGameDetailScreenProps) {
  const [record, setRecord] = useState<CompletedGameRecord | null>(null);
  const [series, setSeries] = useState<MatchupSeriesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const loaded = await getCompletedGameById(gameId);
        if (!loaded) {
          if (!cancelled) {
            setRecord(null);
            setSeries(null);
          }
          return;
        }
        const matchupGames = await listCompletedGamesByMatchup(loaded.matchupKey);
        const summary = calculateMatchupSeries(matchupGames);
        if (!cancelled) {
          setRecord(loaded);
          setSeries(summary);
        }
      } catch (error) {
        console.warn('[ui] CompletedGameDetailScreen load failed', error);
        if (!cancelled) {
          setRecord(null);
          setSeries(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const sheetModel = useMemo(
    () => (record ? buildScoreSheet(toSheetGame(record)) : null),
    [record],
  );

  const playAgainLabel =
    record && resolveGameMode(record.gameMode) === 'individual'
      ? 'Bu Oyuncularla Yeni Oyun'
      : 'Bu Takımlarla Yeni Oyun';

  const tournamentLine = buildSeriesSummaryLine(series) ?? '—';
  const matchIndex =
    series && record
      ? series.games.findIndex((game) => game.id === record.id) + 1
      : 0;
  const matchLine =
    series && matchIndex > 0
      ? `${matchIndex} / ${series.totalGames}`
      : '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>TAMAMLANAN OYUN</Text>
          <View style={styles.goldRule} />
        </View>
        <View style={styles.backSpacer} />
      </View>

      {loading ? (
        <View style={styles.sheet}>
          <Text style={styles.empty}>Yükleniyor…</Text>
        </View>
      ) : !record || !sheetModel ? (
        <View style={styles.sheet}>
          <Text style={styles.empty}>Kayıt bulunamadı.</Text>
        </View>
      ) : (
        <View style={styles.sheet}>
          <View style={styles.infoPanel}>
            <InfoRow
              label="Tarih"
              value={formatSafeDateTime(record.completedAt)}
            />
            <InfoRow
              label="Oyun Modu"
              value={gameModeLabel(resolveGameMode(record.gameMode))}
            />
            <InfoRow label="Kazanan" value={winnerLabel(record)} />
            <InfoRow label="Hedef El" value={String(record.targetRoundCount)} />
            <InfoRow
              label="Oynanan El"
              value={String(record.playedRoundCount)}
              last
            />
          </View>

          <View style={styles.tableWrap}>
            <ScoreSheetTable model={sheetModel} />
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.metaLine}>Turnuva: {tournamentLine}</Text>
            <Text style={styles.metaLine}>Maç: {matchLine}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onPlayAgain(record)}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryLabel}>{playAgainLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryLabel}>Turnuva Detayına Dön</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ui.green,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
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
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: ui.gold,
  },
  goldRule: {
    width: 56,
    height: 2,
    backgroundColor: ui.gold,
    borderRadius: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  infoPanel: {
    backgroundColor: ui.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.gold,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    width: 96,
    fontSize: 12,
    fontWeight: '600',
    color: ui.textMuted,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: ui.text,
    textAlign: 'right',
  },
  tableWrap: {
    flex: 1,
    minHeight: 0,
  },
  metaBlock: {
    gap: 2,
    paddingHorizontal: 2,
  },
  metaLine: {
    fontSize: 12,
    fontWeight: '600',
    color: ui.textMuted,
  },
  actions: {
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
    paddingHorizontal: 12,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.white,
    textAlign: 'center',
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
    fontSize: 15,
    fontWeight: '700',
    color: ui.green,
  },
  empty: {
    fontSize: 15,
    fontWeight: '600',
    color: ui.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  pressed: {
    opacity: 0.82,
  },
});
