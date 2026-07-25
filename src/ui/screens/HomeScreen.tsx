import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  invokeHomeContinue,
  shouldEnableHomeContinue,
} from '../homeContinue';
import { gameModeLabel, resolveGameMode } from '../gameMode';
import { resolveGameStatus } from '../gameLifecycle';
import { resolveTargetRoundCount } from '../targetRoundCount';
import { ActiveGameData } from './ActiveGameScreen';

const palette = {
  background: '#081D18',
  surfaceDark: '#12382F',
  surfaceLight: '#F4EEDF',
  textLight: '#FFFFFF',
  textDark: '#13251F',
  textMutedLight: 'rgba(255,255,255,0.58)',
  accent: '#B58A43',
  chip: 'rgba(244,238,223,0.12)',
  exploreBg: '#C9D8CF',
  exploreBorder: '#AFC5B8',
  exploreTitle: '#143127',
  exploreBody: 'rgba(20,49,39,0.62)',
  exploreChevron: 'rgba(20,49,39,0.42)',
} as const;

type Density = 'normal' | 'compact';

type HomeScreenProps = {
  activeGame: ActiveGameData | null;
  onContinue: () => void;
  onNewGame: () => void;
  onRestart: () => void;
  onAbandon: () => void;
  onTournaments: () => void;
  onStats: () => void;
  onAbout: () => void;
};

function resolveDensity(height: number): Density {
  return height >= 850 ? 'normal' : 'compact';
}

function CornerArrow() {
  return (
    <View style={styles.arrowHit} pointerEvents="none">
      <View style={styles.arrowShape} />
    </View>
  );
}

function InfoChip({
  label,
  value,
  wide,
  compactMeta,
}: {
  label: string;
  value: string;
  wide?: boolean;
  compactMeta?: boolean;
}) {
  return (
    <View
      style={[
        styles.chip,
        wide && styles.chipWide,
        compactMeta && styles.chipMeta,
      ]}
    >
      <Text style={[styles.chipLabel, compactMeta && styles.chipLabelMeta]}>
        {label}
      </Text>
      <Text
        style={[styles.chipValue, compactMeta && styles.chipValueMeta]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export function HomeScreen({
  activeGame,
  onContinue,
  onNewGame,
  onRestart,
  onAbandon,
  onTournaments,
  onStats,
  onAbout,
}: HomeScreenProps) {
  const { height } = useWindowDimensions();
  const density = resolveDensity(height);
  const compact = density === 'compact';

  const canContinue = shouldEnableHomeContinue(activeGame);
  const continueGame = canContinue ? activeGame : null;

  const targetRounds = continueGame
    ? resolveTargetRoundCount(continueGame.targetRoundCount)
    : 0;
  const playedRounds = continueGame?.rounds.length ?? 0;
  const modeLabel = continueGame
    ? gameModeLabel(resolveGameMode(continueGame.gameMode))
    : '';
  const status = continueGame ? resolveGameStatus(continueGame) : null;
  const isPaused = status === 'paused';
  const isIndividual = continueGame
    ? resolveGameMode(continueGame.gameMode) === 'individual'
    : false;

  const scoreChips = continueGame
    ? isIndividual
      ? continueGame.teams.flatMap((team) =>
          team.players.map((player) => ({
            label: player.name,
            value: String(player.totalScore),
          })),
        )
      : [
          {
            label: continueGame.teams[0].name,
            value: String(continueGame.teams[0].totalScore),
          },
          {
            label: continueGame.teams[1].name,
            value: String(continueGame.teams[1].totalScore),
          },
        ]
    : [];

  function handlePrimaryAction() {
    if (continueGame) {
      invokeHomeContinue(activeGame, onContinue);
      return;
    }
    onNewGame();
  }

  function handleNewGame() {
    if (!continueGame) {
      onNewGame();
      return;
    }
    Alert.alert(
      'Yeni oyun başlatılsın mı?',
      'Mevcut aktif oyun silinir ve skorlar kaybolur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yeni Oyun', style: 'destructive', onPress: onNewGame },
      ],
    );
  }

  function handleRestart() {
    Alert.alert(
      'Oyunu yeniden başlat',
      'Aynı oyuncularla skorlar sıfırlanır. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yeniden Başlat', style: 'destructive', onPress: onRestart },
      ],
    );
  }

  function handleAbandon() {
    Alert.alert('Oyunu iptal et', 'Bu yarım oyun silinir. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal Et', style: 'destructive', onPress: onAbandon },
    ]);
  }

  const eyebrow = continueGame ? 'AKTİF OYUN' : 'YENİ MASA';
  const headline = continueGame
    ? 'Kaldığın yerden devam et'
    : 'Masayı kurmaya hazır mısın?';
  const description = continueGame
    ? isPaused
      ? 'Oyun duraklatıldı. İstediğin zaman kaldığın elden devam edebilirsin.'
      : 'Skorlar ve el durumu saklandı. Tek dokunuşla masaya dön.'
    : 'Oyuncuları ekle, oyun modunu seç ve skoru takip etmeye başla.';
  const primaryLabel = continueGame ? 'Devam Et' : 'Yeni Oyun';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoMark}>101</Text>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>Yaz-Boz</Text>
            <Text style={styles.brandSubtitle}>101 Okey skor takip</Text>
          </View>
        </View>

        <View style={styles.main}>
          <View
            style={[
              styles.hero,
              continueGame ? styles.heroActive : styles.heroIdle,
              continueGame && isIndividual && styles.heroActiveIndividual,
              !continueGame && compact && styles.heroIdleCompact,
            ]}
          >
            <View
              style={[
                styles.heroImageWrap,
                !continueGame && styles.heroImageWrapIdle,
                !continueGame && compact && styles.heroImageWrapIdleCompact,
              ]}
              pointerEvents="none"
            >
              <Image
                source={require('../../../assets/images/home-101-hero.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>

            {continueGame ? (
              <>
                <Text style={styles.eyebrow}>{eyebrow}</Text>
                <Text
                  style={[
                    styles.headline,
                    styles.headlineActive,
                    isIndividual && styles.headlineActiveIndividual,
                  ]}
                  numberOfLines={2}
                >
                  {headline}
                </Text>
                <Text
                  style={[
                    styles.description,
                    styles.descriptionActive,
                    isIndividual && styles.descriptionActiveIndividual,
                  ]}
                  numberOfLines={2}
                >
                  {description}
                </Text>

                {isIndividual ? (
                  <>
                    <View style={styles.metaChipRow}>
                      <InfoChip label="Mod" value={modeLabel} compactMeta />
                      <InfoChip
                        label="El"
                        value={`${playedRounds}/${targetRounds}`}
                        compactMeta
                      />
                    </View>
                    <View style={styles.scorePanel}>
                      {scoreChips.map((chip) => (
                        <View
                          key={`${chip.label}-${chip.value}`}
                          style={styles.scoreCell}
                        >
                          <Text style={styles.scoreCellLabel} numberOfLines={1}>
                            {chip.label}
                          </Text>
                          <Text style={styles.scoreCellValue} numberOfLines={1}>
                            {chip.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.chipGrid}>
                    <InfoChip label="Mod" value={modeLabel} />
                    <InfoChip
                      label="El"
                      value={`${playedRounds}/${targetRounds}`}
                    />
                    {scoreChips.map((chip) => (
                      <InfoChip
                        key={`${chip.label}-${chip.value}`}
                        label={chip.label}
                        value={chip.value}
                        wide={scoreChips.length <= 2}
                      />
                    ))}
                  </View>
                )}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={primaryLabel}
                  onPress={handlePrimaryAction}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.primaryButtonActive,
                    isIndividual && styles.primaryButtonActiveIndividual,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryButtonLabel}>{primaryLabel}</Text>
                </Pressable>

                <View
                  style={[
                    styles.secondaryRow,
                    isIndividual && styles.secondaryRowIndividual,
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Yeniden başlat"
                    onPress={handleRestart}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        styles.secondaryLink,
                        isIndividual && styles.secondaryLinkIndividual,
                      ]}
                    >
                      Yeniden Başlat
                    </Text>
                  </Pressable>
                  <View style={styles.secondaryDot} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="İptal et"
                    onPress={handleAbandon}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        styles.secondaryLink,
                        isIndividual && styles.secondaryLinkIndividual,
                      ]}
                    >
                      İptal Et
                    </Text>
                  </Pressable>
                  <View style={styles.secondaryDot} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Yeni oyun"
                    onPress={handleNewGame}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        styles.secondaryLink,
                        isIndividual && styles.secondaryLinkIndividual,
                      ]}
                    >
                      Yeni Oyun
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.heroIdleTop}>
                  <Text style={styles.eyebrowIdle}>{eyebrow}</Text>
                  <Text
                    style={[
                      styles.headlineIdle,
                      compact && styles.headlineIdleCompact,
                    ]}
                    numberOfLines={3}
                  >
                    {headline}
                  </Text>
                  <Text style={styles.descriptionIdle} numberOfLines={3}>
                    {description}
                  </Text>
                </View>

                <View style={styles.heroIdleBottom}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={primaryLabel}
                    onPress={handlePrimaryAction}
                    style={({ pressed }) => [
                      styles.primaryButtonIdle,
                      compact && styles.primaryButtonIdleCompact,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonIdleLabel}>
                      {primaryLabel}
                    </Text>
                  </Pressable>
                  <View style={styles.heroIdleBottomSpacer} />
                </View>
              </>
            )}
          </View>

          <View
            style={[
              styles.exploreSection,
              continueGame &&
                isIndividual &&
                styles.exploreSectionIndividual,
            ]}
          >
            <Text
              style={[
                styles.sectionLabel,
                continueGame &&
                  isIndividual &&
                  styles.sectionLabelIndividual,
              ]}
            >
              Keşfet
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Turnuvalar"
              onPress={onTournaments}
              style={({ pressed }) => [
                styles.exploreWide,
                continueGame &&
                  isIndividual &&
                  styles.exploreWideIndividual,
                pressed && styles.pressedLight,
              ]}
            >
              <CornerArrow />
              <Text style={styles.exploreWideTitle}>Turnuvalar</Text>
              <Text style={styles.exploreWideSubtitle}>
                Eşleşmeleri ve seri geçmişini incele
              </Text>
            </Pressable>

            <View
              style={[
                styles.exploreSplit,
                continueGame &&
                  isIndividual &&
                  styles.exploreSplitIndividual,
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="İstatistikler"
                onPress={onStats}
                style={({ pressed }) => [
                  styles.exploreHalf,
                  continueGame &&
                    isIndividual &&
                    styles.exploreHalfIndividual,
                  pressed && styles.pressedLight,
                ]}
              >
                <CornerArrow />
                <Text style={styles.exploreHalfTitle}>İstatistikler</Text>
                <Text style={styles.exploreHalfSubtitle}>
                  Oyun ve başarı özeti
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hakkında"
                onPress={onAbout}
                style={({ pressed }) => [
                  styles.exploreHalf,
                  continueGame &&
                    isIndividual &&
                    styles.exploreHalfIndividual,
                  pressed && styles.pressedLight,
                ]}
              >
                <CornerArrow />
                <Text style={styles.exploreHalfTitle}>Hakkında</Text>
                <Text style={styles.exploreHalfSubtitle}>
                  Uygulama bilgileri
                </Text>
              </Pressable>
            </View>

            <Text
              style={[
                styles.footerNote,
                continueGame &&
                  isIndividual &&
                  styles.footerNoteIndividual,
              ]}
            >
              Yerel, hızlı ve reklamsız.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: palette.background,
  },
  root: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: palette.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.textDark,
    letterSpacing: -0.5,
  },
  brandText: {
    flex: 1,
    gap: 2,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
    color: palette.textLight,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.70)',
  },
  main: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
  },
  hero: {
    backgroundColor: palette.surfaceDark,
    borderRadius: 26,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  heroIdle: {
    minHeight: 380,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  heroIdleCompact: {
    minHeight: 340,
  },
  heroActive: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroActiveIndividual: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  heroIdleTop: {
    paddingRight: 0,
  },
  heroIdleBottom: {
    width: '100%',
  },
  heroIdleBottomSpacer: {
    height: 30,
  },
  heroImageWrap: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 108,
    height: 98,
  },
  heroImageWrapIdle: {
    top: 18,
    right: 16,
    width: 96,
    height: 88,
  },
  heroImageWrapIdleCompact: {
    width: 86,
    height: 78,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: palette.accent,
    marginBottom: 8,
    paddingRight: 120,
  },
  eyebrowIdle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: palette.accent,
    marginBottom: 14,
    paddingRight: 108,
  },
  headline: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 38,
    color: palette.textLight,
    paddingRight: 110,
  },
  headlineIdle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 38,
    color: palette.textLight,
    paddingRight: 108,
  },
  headlineIdleCompact: {
    fontSize: 29,
    lineHeight: 35,
  },
  headlineActive: {
    fontSize: 31,
    lineHeight: 37,
  },
  headlineActiveIndividual: {
    fontSize: 28,
    lineHeight: 33,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: palette.textMutedLight,
    paddingRight: 24,
    marginTop: 14,
    marginBottom: 0,
  },
  descriptionIdle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: palette.textMutedLight,
    paddingRight: 24,
    marginTop: 16,
  },
  descriptionActive: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  descriptionActiveIndividual: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  metaChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  scorePanel: {
    marginTop: 8,
    backgroundColor: palette.chip,
    borderRadius: 15,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  scoreCell: {
    width: '48%',
    height: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  scoreCellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.textMutedLight,
    marginBottom: 2,
  },
  scoreCellValue: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textLight,
    fontVariant: ['tabular-nums'],
  },
  chip: {
    minWidth: '46%',
    flexGrow: 1,
    height: 60,
    backgroundColor: palette.chip,
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  chipMeta: {
    flex: 1,
    minWidth: 0,
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  chipWide: {
    minWidth: '46%',
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textMutedLight,
    marginBottom: 3,
  },
  chipLabelMeta: {
    fontSize: 10,
  },
  chipValue: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.textLight,
    fontVariant: ['tabular-nums'],
  },
  chipValueMeta: {
    fontSize: 16,
  },
  primaryButton: {
    height: 54,
    borderRadius: 17,
    marginTop: 22,
    backgroundColor: palette.exploreBg,
    borderWidth: 1,
    borderColor: palette.exploreBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonIdle: {
    height: 56,
    borderRadius: 17,
    marginTop: 24,
    backgroundColor: palette.exploreBg,
    borderWidth: 1,
    borderColor: palette.exploreBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonIdleCompact: {
    height: 52,
  },
  primaryButtonIdleLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.exploreTitle,
  },
  primaryButtonActive: {
    height: 52,
    marginTop: 16,
  },
  primaryButtonActiveIndividual: {
    height: 48,
    marginTop: 12,
  },
  primaryButtonLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.exploreTitle,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  secondaryRowIndividual: {
    marginTop: 8,
  },
  secondaryLink: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textMutedLight,
  },
  secondaryLinkIndividual: {
    fontSize: 11,
  },
  secondaryDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  exploreSection: {
    marginTop: 20,
    marginBottom: 0,
  },
  exploreSectionIndividual: {
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: palette.textLight,
    marginBottom: 12,
  },
  sectionLabelIndividual: {
    marginBottom: 10,
  },
  exploreWide: {
    backgroundColor: palette.exploreBg,
    borderWidth: 1,
    borderColor: palette.exploreBorder,
    borderRadius: 22,
    padding: 18,
    height: 122,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreWideIndividual: {
    height: 104,
    padding: 14,
    borderRadius: 20,
  },
  exploreSplit: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  exploreSplitIndividual: {
    gap: 10,
    marginTop: 10,
  },
  exploreHalf: {
    flex: 1,
    backgroundColor: palette.exploreBg,
    borderWidth: 1,
    borderColor: palette.exploreBorder,
    borderRadius: 22,
    padding: 16,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreHalfIndividual: {
    height: 92,
    padding: 12,
    borderRadius: 20,
  },
  exploreWideTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: palette.exploreTitle,
    marginBottom: 4,
    textAlign: 'center',
    width: '86%',
  },
  exploreHalfTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: palette.exploreTitle,
    marginBottom: 4,
    textAlign: 'center',
    width: '86%',
  },
  exploreWideSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    color: palette.exploreBody,
    textAlign: 'center',
    width: '86%',
  },
  exploreHalfSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
    color: palette.exploreBody,
    textAlign: 'center',
    width: '86%',
  },
  arrowHit: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowShape: {
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: palette.exploreChevron,
    transform: [{ rotate: '45deg' }],
  },
  footerNote: {
    marginTop: 14,
    marginBottom: 0,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.45)',
  },
  footerNoteIndividual: {
    marginTop: 10,
  },
  pressed: {
    opacity: 0.88,
  },
  pressedLight: {
    opacity: 0.9,
  },
});
