import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CompletedGameRecord } from '../../domain/completedGame';
import { buildAllMatchupSeries } from '../../domain/tournament';
import { listCompletedGames } from '../../persistence/completedGameRepository';
import {
  buildTournamentListCard,
  TournamentListCardModel,
} from '../tournamentPresentation';

type TournamentListScreenProps = {
  onBack: () => void;
  onOpenMatchup: (matchupKey: string) => void;
  onStartNewGame: () => void;
  onPlayAgain: (record: CompletedGameRecord) => void;
};

type Density = 'normal' | 'compact' | 'ultraCompact';

const palette = {
  background: '#0B3A2D',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelMuted: '#C9D8CF',
  border: '#B7CBBE',
  textDark: '#142D25',
  textGreen: '#174333',
  textMuted: 'rgba(23,67,51,0.60)',
  accent: '#B58A43',
  white: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.62)',
  countMuted: 'rgba(255,255,255,0.58)',
  metaMuted: 'rgba(23,67,51,0.58)',
  rule: 'rgba(23,67,51,0.14)',
  iconWell: 'rgba(255,255,255,0.08)',
  iconBorder: 'rgba(255,255,255,0.24)',
} as const;

function resolveDensity(height: number): Density {
  if (height >= 800) {
    return 'normal';
  }
  if (height >= 700) {
    return 'compact';
  }
  return 'ultraCompact';
}

function PlusIcon() {
  return (
    <View style={styles.plusGlyph} pointerEvents="none">
      <View style={styles.plusBarH} />
      <View style={styles.plusBarV} />
    </View>
  );
}

function BackChevron() {
  return (
    <View style={styles.backChevron} pointerEvents="none">
      <View style={styles.backChevronShape} />
    </View>
  );
}

function CardChevron() {
  return (
    <View style={styles.cardChevronHit} pointerEvents="none">
      <View style={styles.cardChevronShape} />
    </View>
  );
}

function ReplayArrow() {
  return (
    <View style={styles.replayGlyph} pointerEvents="none">
      <View style={styles.replayArc} />
      <View style={styles.replayTip} />
    </View>
  );
}

function EmptyTrophyIcon() {
  return (
    <View style={styles.emptyIconWell} pointerEvents="none">
      <View style={styles.emptyCupRim} />
      <View style={styles.emptyCupBody} />
      <View style={styles.emptyCupStem} />
      <View style={styles.emptyCupBase} />
      <View style={styles.emptyCupAccent} />
    </View>
  );
}

function VsBadge({ size }: { size: number }) {
  return (
    <View
      style={[
        styles.vsBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={styles.vsLabel}>VS</Text>
    </View>
  );
}

function TournamentCard({
  item,
  onOpen,
  onPlayAgain,
  density,
}: {
  item: TournamentListCardModel;
  onOpen: () => void;
  onPlayAgain: () => void;
  density: Density;
}) {
  const compact = density === 'compact';
  const ultra = density === 'ultraCompact';
  const cardMinHeight = ultra ? 108 : compact ? 118 : 132;
  const scoreSize = ultra ? 24 : compact ? 27 : 30;
  const vsSize = ultra ? 40 : compact ? 44 : 48;
  const cardPadding = compact || ultra ? 15 : 18;
  const playHeight = ultra ? 48 : 54;

  const modeLine =
    item.modeLabel && item.modeLabel.trim().length > 0
      ? item.modeLabel.trim()
      : null;
  const subtitleLine =
    item.subtitle && item.subtitle.trim().length > 0
      ? item.subtitle.trim()
      : null;

  return (
    <View
      style={[
        styles.card,
        ultra && styles.cardUltra,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [
          styles.cardMain,
          {
            minHeight: cardMinHeight,
            padding: cardPadding,
          },
          pressed && styles.pressed,
        ]}
      >
        <CardChevron />

        <View style={styles.metaTopRow}>
          <Text style={styles.seriesKicker}>Eşleşme Serisi</Text>
          <Text style={styles.totalMatches}>
            Toplam maç: {item.totalGames}
          </Text>
        </View>

        <View style={styles.scoreBoard}>
          <View style={styles.scoreSide}>
            <Text style={styles.sideLabel} numberOfLines={1}>
              {item.leftLabel}
            </Text>
            <Text style={[styles.sideScore, { fontSize: scoreSize }]}>
              {item.scoreLeft}
            </Text>
          </View>

          <VsBadge size={vsSize} />

          <View style={styles.scoreSide}>
            <Text style={styles.sideLabel} numberOfLines={1}>
              {item.rightLabel ?? ''}
            </Text>
            <Text style={[styles.sideScore, { fontSize: scoreSize }]}>
              {item.scoreRight ?? '·'}
            </Text>
          </View>
        </View>

        <View style={styles.metaBottomRow}>
          <Text style={styles.metaText}>Toplam maç: {item.totalGames}</Text>
          {item.lastPlayedLabel ? (
            <Text style={styles.metaText} numberOfLines={1}>
              Son oynanma: {item.lastPlayedLabel}
            </Text>
          ) : null}
        </View>

        {modeLine || subtitleLine ? (
          <View style={styles.extraMeta}>
            {modeLine ? (
              <Text style={styles.extraMetaText} numberOfLines={1}>
                {modeLine}
              </Text>
            ) : null}
            {subtitleLine ? (
              <Text style={styles.extraMetaText} numberOfLines={1}>
                {subtitleLine}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      {item.latestRecord ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPlayAgain}
          style={({ pressed }) => [
            styles.playAgainButton,
            { height: playHeight },
            pressed && styles.pressed,
          ]}
        >
          <ReplayArrow />
          <Text style={styles.playAgainLabel}>{item.playAgainLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function TournamentListScreen({
  onBack,
  onOpenMatchup,
  onStartNewGame,
  onPlayAgain,
}: TournamentListScreenProps) {
  const { height } = useWindowDimensions();
  const density = resolveDensity(height);
  const compact = density === 'compact';
  const ultra = density === 'ultraCompact';

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

  const seriesCountLabel = `${cards.length} seri`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, ultra && styles.headerUltra]}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <BackChevron />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
              ultra && styles.titleUltra,
            ]}
          >
            Turnuvalar
          </Text>
          {!ultra ? (
            <Text style={styles.subtitle}>
              Tamamlanan eşleşmeleri ve serileri görüntüle
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onStartNewGame}
          hitSlop={8}
          style={({ pressed }) => [
            styles.plusButton,
            pressed && styles.pressed,
          ]}
        >
          <PlusIcon />
        </Pressable>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centeredState}>
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Yükleniyor…</Text>
            </View>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.centeredState}>
            <View
              style={[
                styles.emptyCard,
                compact && styles.emptyCardCompact,
              ]}
            >
              <EmptyTrophyIcon />
              <Text style={styles.emptyTitle}>Henüz turnuva yok</Text>
              <Text style={styles.emptyBody}>
                Tamamlanan eşleşmeler burada seri halinde görünecek.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onStartNewGame}
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.emptyButtonLabel}>Yeni Oyun Başlat</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item) => item.matchupKey}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>Turnuva Geçmişi</Text>
                <Text style={styles.listHeaderCount}>{seriesCountLabel}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TournamentCard
                item={item}
                density={density}
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
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 14,
    backgroundColor: palette.background,
  },
  headerUltra: {
    paddingBottom: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronShape: {
    width: 10,
    height: 10,
    borderLeftWidth: 2.2,
    borderBottomWidth: 2.2,
    borderColor: palette.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.white,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 27,
  },
  titleUltra: {
    fontSize: 25,
  },
  subtitle: {
    fontSize: 14,
    color: palette.headerSub,
    textAlign: 'center',
  },
  plusButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: palette.iconWell,
    borderColor: palette.iconBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusGlyph: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBarH: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: palette.white,
  },
  plusBarV: {
    position: 'absolute',
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: palette.white,
  },
  body: {
    flex: 1,
  },
  list: {
    paddingBottom: 28,
  },
  listHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.white,
  },
  listHeaderCount: {
    fontSize: 13,
    color: palette.countMuted,
  },
  card: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 22,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardUltra: {
    marginBottom: 9,
  },
  cardMain: {
    position: 'relative',
  },
  cardChevronHit: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardChevronShape: {
    width: 7,
    height: 7,
    borderTopWidth: 1.8,
    borderRightWidth: 1.8,
    borderColor: palette.accent,
    transform: [{ rotate: '45deg' }],
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 18,
    marginBottom: 12,
  },
  seriesKicker: {
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '800',
    color: palette.accent,
  },
  totalMatches: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.metaMuted,
  },
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  sideLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  sideScore: {
    fontWeight: '900',
    color: palette.textDark,
    fontVariant: ['tabular-nums'],
  },
  vsBadge: {
    backgroundColor: palette.dark,
    borderColor: palette.accent,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsLabel: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  metaBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 12,
    color: palette.metaMuted,
  },
  extraMeta: {
    marginTop: 8,
    gap: 2,
  },
  extraMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
  },
  playAgainButton: {
    borderTopColor: palette.rule,
    borderTopWidth: 1,
    backgroundColor: palette.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  playAgainLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.dark,
  },
  replayGlyph: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayArc: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.dark,
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-30deg' }],
  },
  replayTip: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: palette.dark,
    transform: [{ rotate: '55deg' }],
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  loadingCard: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textGreen,
    textAlign: 'center',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 24,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyCardCompact: {
    paddingVertical: 24,
  },
  emptyIconWell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyCupRim: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accent,
    marginBottom: 2,
  },
  emptyCupBody: {
    width: 24,
    height: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: palette.dark,
  },
  emptyCupStem: {
    width: 4,
    height: 8,
    backgroundColor: palette.dark,
  },
  emptyCupBase: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.dark,
  },
  emptyCupAccent: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accent,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: palette.dark,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
