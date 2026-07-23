import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';

import { CompletedGameRecord } from '../../domain/completedGame';
import { getCompletedGameById } from '../../persistence/completedGameRepository';
import { GameActivityLogView } from '../components/GameActivityLogView';
import { PrimaryButton } from '../components/PrimaryButton';
import { gameModeLabel, resolveGameMode } from '../gameMode';
import { formatSafeDateTime } from '../tournamentPresentation';
import { colors, radii, spacing, typography } from '../theme';

type CompletedGameDetailScreenProps = {
  gameId: string;
  onBack: () => void;
  onPlayAgain: (record: CompletedGameRecord) => void;
};

export function CompletedGameDetailScreen({
  gameId,
  onBack,
  onPlayAgain,
}: CompletedGameDetailScreenProps) {
  const [record, setRecord] = useState<CompletedGameRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const loaded = await getCompletedGameById(gameId);
        if (!cancelled) {
          setRecord(loaded);
        }
      } catch (error) {
        console.warn('[ui] CompletedGameDetailScreen load failed', error);
        if (!cancelled) {
          setRecord(null);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        <Text style={styles.title}>Tamamlanmış Oyun</Text>

        {loading ? (
          <Text style={styles.empty}>Yükleniyor…</Text>
        ) : !record ? (
          <Text style={styles.empty}>Kayıt bulunamadı.</Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Tarih</Text>
              <Text style={styles.value}>
                {formatSafeDateTime(record.completedAt)}
              </Text>
              <Text style={styles.label}>Mod</Text>
              <Text style={styles.value}>{gameModeLabel(record.gameMode)}</Text>
              <Text style={styles.label}>El</Text>
              <Text style={styles.value}>
                {record.playedRoundCount} / {record.targetRoundCount}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Kazanan</Text>
              <Text style={styles.value}>
                {record.winner.kind === 'paired'
                  ? record.winner.outcome === 'winner'
                    ? (record.winner.teamName ?? 'Takım')
                    : 'Berabere'
                  : record.winner.outcome === 'winner'
                    ? (record.winner.name ?? 'Oyuncu')
                    : 'Berabere'}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Final Skor</Text>
              {record.gameMode === 'paired'
                ? record.finalTeamScores.map((team) => (
                    <View key={team.teamName} style={styles.row}>
                      <Text style={styles.name} numberOfLines={1}>
                        {team.teamName}
                      </Text>
                      <Text style={styles.score}>{team.totalScore}</Text>
                    </View>
                  ))
                : null}
              {record.finalPlayerScores.map((player) => (
                <View key={player.id} style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={styles.score}>{player.totalScore}</Text>
                </View>
              ))}
            </View>

            <PrimaryButton
              label={
                resolveGameMode(record.gameMode) === 'individual'
                  ? 'Bu Oyuncularla Yeni Oyun'
                  : 'Bu Takımlarla Yeni Oyun'
              }
              onPress={() => onPlayAgain(record)}
            />

            <Text style={styles.section}>Oyun Günlüğü</Text>
            <GameActivityLogView
              game={{
                teams: record.teams,
                gameMode: record.gameMode,
                rounds: record.rounds,
                activityLog: record.activityLog,
              }}
              emptyLabel="Günlük boş"
              highlightLatest={false}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
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
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    ...typography.infoLabel,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  value: {
    ...typography.buttonSecondary,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 28,
    alignItems: 'center',
  },
  name: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  score: {
    ...typography.buttonSecondary,
    color: colors.textSecondary,
  },
  section: {
    ...typography.buttonSecondary,
    color: colors.primary,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
