import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';

import { CompletedGameRecord } from '../../domain/completedGame';
import { buildAllMatchupSeries } from '../../domain/tournament';
import { listCompletedGames } from '../../persistence/completedGameRepository';
import {
  buildTournamentListCard,
  TournamentListCardModel,
} from '../tournamentPresentation';
import { colors as ui, layout, radii } from '../theme';

type TournamentListScreenProps = {
  onBack: () => void;
  onOpenMatchup: (matchupKey: string) => void;
  onStartNewGame: () => void;
  onPlayAgain: (record: CompletedGameRecord) => void;
};

function TournamentCard({
  item,
  onOpen,
  onPlayAgain,
}: {
  item: TournamentListCardModel;
  onOpen: () => void;
  onPlayAgain: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}
      >
        <View style={styles.scoreRow}>
          <Text style={styles.teamLabel} numberOfLines={2}>
            {item.leftLabel}
          </Text>
          <Text style={styles.scoreValue}>{item.scoreLeft}</Text>
          <Text style={styles.scoreDash}>—</Text>
          <Text style={styles.scoreValue}>{item.scoreRight ?? '·'}</Text>
          <Text style={styles.teamLabel} numberOfLines={2}>
            {item.rightLabel ?? ''}
          </Text>
          <Text style={styles.chevron}>▶</Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.metaLine}>• Toplam maç: {item.totalGames}</Text>
          {item.lastPlayedLabel ? (
            <Text style={styles.metaLine}>
              • Son oynanma: {item.lastPlayedLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.cardRule} />

      <Pressable
        accessibilityRole="button"
        onPress={onPlayAgain}
        style={({ pressed }) => [
          styles.playAgainButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.playAgainLabel}>{item.playAgainLabel}</Text>
      </Pressable>
    </View>
  );
}

export function TournamentListScreen({
  onBack,
  onOpenMatchup,
  onStartNewGame,
  onPlayAgain,
}: TournamentListScreenProps) {
  const [cards, setCards] = useState<TournamentListCardModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const games = await listCompletedGames();
        const series = buildAllMatchupSeries(games);
        if (!cancelled) {
          setCards(series.map(buildTournamentListCard));
        }
      } catch (error) {
        console.warn('[ui] TournamentListScreen load failed', error);
        if (!cancelled) {
          setCards([]);
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
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>Turnuvalar</Text>
          <View style={styles.goldRule} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onStartNewGame}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={styles.plusLabel}>＋</Text>
        </Pressable>
      </View>

      <View style={styles.sheet}>
        {loading ? (
          <Text style={styles.empty}>Yükleniyor…</Text>
        ) : cards.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.empty}>Henüz tamamlanmış turnuva yok.</Text>
          </View>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item) => item.matchupKey}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TournamentCard
                item={item}
                onOpen={() => onOpenMatchup(item.matchupKey)}
                onPlayAgain={() => {
                  if (item.latestRecord) {
                    onPlayAgain(item.latestRecord);
                  }
                }}
              />
            )}
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 14,
    backgroundColor: ui.green,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: 32,
    fontWeight: '300',
    color: ui.white,
    marginTop: -2,
  },
  plusLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: ui.gold,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trophy: {
    fontSize: 28,
    lineHeight: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: ui.gold,
    letterSpacing: 0.6,
  },
  goldRule: {
    width: 48,
    height: 2,
    backgroundColor: ui.gold,
    borderRadius: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: ui.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 14,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: ui.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.gold,
    overflow: 'hidden',
  },
  cardMain: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: ui.text,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: ui.green,
    minWidth: 28,
    textAlign: 'center',
  },
  scoreDash: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.gold,
  },
  chevron: {
    fontSize: 14,
    color: ui.gold,
    marginLeft: 2,
  },
  metaBlock: {
    gap: 2,
  },
  metaLine: {
    fontSize: 12,
    fontWeight: '500',
    color: ui.textMuted,
  },
  cardRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ui.line,
    marginHorizontal: 14,
  },
  playAgainButton: {
    minHeight: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  playAgainLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: ui.green,
  },
  emptyBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  empty: {
    fontSize: 15,
    fontWeight: '600',
    color: ui.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
