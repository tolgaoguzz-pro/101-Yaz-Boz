import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DEVELOPER_CREDIT } from '../../config/appInfo';
import {
  invokeHomeContinue,
  shouldEnableHomeContinue,
} from '../homeContinue';
import { gameModeLabel, resolveGameMode } from '../gameMode';
import { resolveGameStatus } from '../gameLifecycle';
import { resolveTargetRoundCount } from '../targetRoundCount';
import { ActiveGameData } from './ActiveGameScreen';
import { colors as home, layout, radii } from '../theme';

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

type MenuCardProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  icon: 'play' | 'trophy' | 'plus' | 'stats' | 'info';
  playStrong?: boolean;
};

function MenuIcon({
  icon,
  playStrong,
  muted,
}: {
  icon: MenuCardProps['icon'];
  playStrong?: boolean;
  muted?: boolean;
}) {
  if (icon === 'play') {
    return (
      <View
        style={[
          styles.iconCircle,
          playStrong && styles.iconCircleStrong,
          muted && styles.iconCircleMuted,
        ]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.iconPlay,
            playStrong && styles.iconPlayStrong,
            muted && styles.iconMutedColor,
          ]}
        >
          ▶
        </Text>
      </View>
    );
  }

  if (icon === 'trophy') {
    return (
      <View style={styles.iconCircle} pointerEvents="none">
        <Text style={styles.iconGlyph}>♔</Text>
      </View>
    );
  }

  if (icon === 'plus') {
    return (
      <View style={styles.iconCircle} pointerEvents="none">
        <Text style={styles.iconPlus}>＋</Text>
      </View>
    );
  }

  if (icon === 'stats') {
    return (
      <View style={styles.iconCircle} pointerEvents="none">
        <View style={styles.statsBars}>
          <View style={[styles.statsBar, styles.statsBarShort]} />
          <View style={[styles.statsBar, styles.statsBarMid]} />
          <View style={[styles.statsBar, styles.statsBarTall]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.iconCircle} pointerEvents="none">
      <Text style={styles.iconInfo}>i</Text>
    </View>
  );
}

function MenuCard({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
  compact = false,
  playStrong = false,
}: MenuCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuCard,
        compact && styles.menuCardCompact,
        disabled && styles.menuCardDisabled,
        pressed && !disabled && styles.menuCardPressed,
      ]}
    >
      <View style={styles.menuIconSlot} pointerEvents="none">
        <MenuIcon icon={icon} playStrong={playStrong} muted={disabled} />
      </View>
      <View style={styles.menuText} pointerEvents="none">
        <Text
          style={[styles.menuTitle, disabled && styles.menuTitleDisabled]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.menuSubtitle, disabled && styles.menuSubtitleDisabled]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function LogoTiles({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.tileRow} pointerEvents="none">
      <View style={[styles.tile, compact && styles.tileCompact]}>
        <Text
          style={[
            styles.tileDigit,
            compact && styles.tileDigitCompact,
            styles.tileDigitRed,
          ]}
        >
          1
        </Text>
      </View>
      <View style={[styles.tile, compact && styles.tileCompact]}>
        <Text
          style={[
            styles.tileDigit,
            compact && styles.tileDigitCompact,
            styles.tileDigitBlack,
          ]}
        >
          0
        </Text>
      </View>
      <View style={[styles.tile, compact && styles.tileCompact]}>
        <Text
          style={[
            styles.tileDigit,
            compact && styles.tileDigitCompact,
            styles.tileDigitRed,
          ]}
        >
          1
        </Text>
      </View>
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
  const compact = height < 700;

  const canContinue = shouldEnableHomeContinue(activeGame);
  const continueGame = canContinue ? activeGame : null;

  function handleContinuePress() {
    invokeHomeContinue(activeGame, onContinue);
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
        {
          text: 'Yeni Oyun',
          style: 'destructive',
          onPress: onNewGame,
        },
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

  const targetRounds = continueGame
    ? resolveTargetRoundCount(continueGame.targetRoundCount)
    : 0;
  const playedRounds = continueGame?.rounds.length ?? 0;
  const modeLabel = continueGame
    ? gameModeLabel(resolveGameMode(continueGame.gameMode))
    : '';
  const status = continueGame ? resolveGameStatus(continueGame) : null;
  const continueTitle =
    status === 'paused' ? 'Duraklatılmış Oyun' : 'Devam Eden Oyun';
  const isIndividual = continueGame
    ? resolveGameMode(continueGame.gameMode) === 'individual'
    : false;

  const scoreLines = continueGame
    ? isIndividual
      ? continueGame.teams.flatMap((team) =>
          team.players.map((player) => `${player.name} ${player.totalScore}`),
        )
      : [
          `${continueGame.teams[0].name} ${continueGame.teams[0].totalScore}`,
          `${continueGame.teams[1].name} ${continueGame.teams[1].totalScore}`,
        ]
    : [];

  const continueSubtitle = continueGame
    ? `${modeLabel} · El ${playedRounds}/${targetRounds}`
    : 'Son oyuna devam et';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[styles.hero, compact && styles.heroCompact]}
        pointerEvents="box-none"
      >
        <View style={styles.feltTextureA} pointerEvents="none" />
        <View style={styles.feltTextureB} pointerEvents="none" />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hakkında"
          onPress={onAbout}
          hitSlop={8}
          style={({ pressed }) => [
            styles.settingsButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.settingsGlyph}>⚙</Text>
        </Pressable>

        <View style={styles.logoBlock} pointerEvents="none">
          <LogoTiles compact={compact} />
          <Text style={[styles.logo101, compact && styles.logo101Compact]}>
            101
          </Text>
          <Text style={[styles.logoYazBoz, compact && styles.logoYazBozCompact]}>
            YAZ-BOZ
          </Text>
        </View>
      </View>

      <View style={[styles.sheet, compact && styles.sheetCompact]}>
        <View style={styles.menuList}>
          {canContinue && continueGame ? (
            <View
              style={[
                styles.continueShell,
                compact && styles.continueShellCompact,
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={continueTitle}
                accessibilityState={{ disabled: false }}
                disabled={false}
                onPress={handleContinuePress}
                style={({ pressed }) => [
                  styles.continueMain,
                  pressed && styles.menuCardPressed,
                ]}
              >
                <View style={styles.menuIconSlot} pointerEvents="none">
                  <MenuIcon icon="play" playStrong />
                </View>
                <View style={styles.menuText} pointerEvents="none">
                  <Text style={styles.menuTitle}>{continueTitle}</Text>
                  <Text style={styles.menuSubtitle} numberOfLines={1}>
                    {continueSubtitle}
                  </Text>
                  {status === 'paused' ? (
                    <Text style={styles.pausedBadge}>Duraklatıldı</Text>
                  ) : null}
                  {scoreLines.map((line) => (
                    <Text key={line} style={styles.scoreLine} numberOfLines={1}>
                      {line}
                    </Text>
                  ))}
                </View>
              </Pressable>

              <View style={styles.continueActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Yeniden Başlat"
                  onPress={handleRestart}
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.continueLink}>Yeniden Başlat</Text>
                </Pressable>
                <Text style={styles.continueDot}>·</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="İptal Et"
                  onPress={handleAbandon}
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.continueLinkMuted}>İptal Et</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <MenuCard
              icon="play"
              title="Devam Eden Oyun"
              subtitle="Son oyuna devam et"
              onPress={handleContinuePress}
              disabled
              compact={compact}
            />
          )}

          <MenuCard
            icon="trophy"
            title="Turnuvalar ve Geçmiş"
            subtitle="Turnuva geçmişini görüntüle"
            onPress={onTournaments}
            compact={compact}
          />
          <MenuCard
            icon="plus"
            title="Yeni Oyun"
            subtitle="Yeni bir oyun başlat"
            onPress={handleNewGame}
            compact={compact}
          />
          <MenuCard
            icon="stats"
            title="İstatistikler"
            subtitle="Oyun ve başarı istatistikleri"
            onPress={onStats}
            compact={compact}
          />
          <MenuCard
            icon="info"
            title="Hakkında"
            subtitle="Uygulama hakkında"
            onPress={onAbout}
            compact={compact}
          />
        </View>

        <Text style={styles.credit}>{DEVELOPER_CREDIT}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: home.felt,
  },
  hero: {
    height: '28%',
    minHeight: 160,
    maxHeight: 210,
    backgroundColor: home.felt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingTop: 4,
    paddingBottom: 10,
  },
  heroCompact: {
    height: '24%',
    minHeight: 132,
    maxHeight: 160,
    paddingBottom: 6,
  },
  feltTextureA: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: home.feltLight,
    opacity: 0.22,
  },
  feltTextureB: {
    position: 'absolute',
    bottom: -50,
    right: -28,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: home.feltDeep,
    opacity: 0.4,
  },
  settingsButton: {
    position: 'absolute',
    top: 4,
    right: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  settingsGlyph: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.88)',
  },
  logoBlock: {
    alignItems: 'center',
    gap: 2,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 6,
  },
  tile: {
    width: 38,
    height: 50,
    borderRadius: 5,
    backgroundColor: home.tileFace,
    borderWidth: 1.5,
    borderColor: home.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCompact: {
    width: 30,
    height: 40,
  },
  tileDigit: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  tileDigitCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  tileDigitRed: {
    color: home.tileRed,
  },
  tileDigitBlack: {
    color: home.tileBlack,
  },
  logo101: {
    fontSize: 58,
    fontWeight: '800',
    lineHeight: 60,
    color: home.gold,
    letterSpacing: 1,
  },
  logo101Compact: {
    fontSize: 44,
    lineHeight: 46,
  },
  logoYazBoz: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 5,
    color: home.white,
  },
  logoYazBozCompact: {
    fontSize: 13,
    letterSpacing: 3.5,
  },
  sheet: {
    flex: 1,
    backgroundColor: home.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -12,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  sheetCompact: {
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  menuList: {
    gap: 8,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: home.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: home.cardBorder,
  },
  menuCardCompact: {
    minHeight: 54,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  menuCardPressed: {
    opacity: 0.78,
  },
  menuCardDisabled: {
    opacity: 0.7,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  continueShell: {
    backgroundColor: home.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: home.cardBorder,
    overflow: 'hidden',
  },
  continueShellCompact: {
    borderRadius: 12,
  },
  continueMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    minHeight: 62,
  },
  menuIconSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    color: home.text,
  },
  menuTitleDisabled: {
    color: home.text,
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: home.textMuted,
  },
  menuSubtitleDisabled: {
    color: home.textMuted,
  },
  pausedBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: home.gold,
    marginTop: 2,
  },
  scoreLine: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: home.text,
  },
  continueActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingLeft: 64,
  },
  continueLink: {
    fontSize: 12,
    fontWeight: '600',
    color: home.felt,
  },
  continueLinkMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: home.textMuted,
  },
  continueDot: {
    color: home.textMuted,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: home.gold,
    backgroundColor: home.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleStrong: {
    backgroundColor: home.felt,
    borderColor: home.gold,
  },
  iconCircleMuted: {
    opacity: 0.85,
  },
  iconPlay: {
    fontSize: 12,
    color: home.felt,
    marginLeft: 1,
  },
  iconPlayStrong: {
    color: home.white,
  },
  iconMutedColor: {
    color: home.textMuted,
  },
  iconGlyph: {
    fontSize: 16,
    color: home.felt,
  },
  iconPlus: {
    fontSize: 18,
    fontWeight: '600',
    color: home.felt,
    marginTop: -1,
  },
  iconInfo: {
    fontSize: 15,
    fontWeight: '700',
    color: home.felt,
    marginTop: -1,
  },
  statsBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
  },
  statsBar: {
    width: 3,
    borderRadius: 1,
    backgroundColor: home.felt,
  },
  statsBarShort: {
    height: 6,
  },
  statsBarMid: {
    height: 10,
  },
  statsBarTall: {
    height: 14,
  },
  credit: {
    fontSize: 10,
    fontWeight: '500',
    color: home.gold,
    textAlign: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
