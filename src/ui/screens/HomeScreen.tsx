import type { ReactNode } from 'react';
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
import { gameModeLabel, resolveGameMode } from '../gameMode';
import { resolveGameStatus } from '../gameLifecycle';
import { resolveTargetRoundCount } from '../targetRoundCount';
import { ActiveGameData } from './ActiveGameScreen';

const home = {
  felt: '#1F5E3B',
  feltDeep: '#174A2E',
  feltLight: '#2A6E47',
  cream: '#F7F2E8',
  gold: '#C8A44D',
  text: '#263238',
  textMuted: '#6B736C',
  white: '#FFFFFF',
  card: '#FFFEF9',
  cardBorder: 'rgba(200, 164, 77, 0.35)',
  tileFace: '#FFFEF8',
  tileRed: '#C62828',
  tileBlack: '#1A1A1A',
} as const;

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
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
};

function MenuCard({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
  compact = false,
}: MenuCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuCard,
        compact && styles.menuCardCompact,
        disabled && styles.menuCardDisabled,
        pressed && !disabled && styles.menuCardPressed,
      ]}
    >
      <View style={styles.menuIconSlot}>{icon}</View>
      <View style={styles.menuText}>
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
    <View style={styles.tileRow}>
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

function PlayIcon({ strong = false }: { strong?: boolean }) {
  return (
    <View style={[styles.iconCircle, strong && styles.iconCircleStrong]}>
      <Text style={[styles.iconPlay, strong && styles.iconPlayStrong]}>▶</Text>
    </View>
  );
}

function TrophyIcon() {
  return (
    <View style={styles.iconCircle}>
      <Text style={styles.iconGlyph}>♔</Text>
    </View>
  );
}

function PlusIcon() {
  return (
    <View style={styles.iconCircle}>
      <Text style={styles.iconPlus}>＋</Text>
    </View>
  );
}

function StatsIcon() {
  return (
    <View style={styles.iconCircle}>
      <View style={styles.statsBars}>
        <View style={[styles.statsBar, styles.statsBarShort]} />
        <View style={[styles.statsBar, styles.statsBarMid]} />
        <View style={[styles.statsBar, styles.statsBarTall]} />
      </View>
    </View>
  );
}

function InfoIcon() {
  return (
    <View style={styles.iconCircle}>
      <Text style={styles.iconInfo}>i</Text>
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

  function handleNewGame() {
    if (!activeGame) {
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

  const targetRounds = activeGame
    ? resolveTargetRoundCount(activeGame.targetRoundCount)
    : 0;
  const playedRounds = activeGame?.rounds.length ?? 0;
  const modeLabel = activeGame
    ? gameModeLabel(resolveGameMode(activeGame.gameMode))
    : '';
  const status = activeGame ? resolveGameStatus(activeGame) : null;
  const continueTitle =
    status === 'paused' ? 'Duraklatılmış Oyun' : 'Devam Eden Oyun';
  const isIndividual = activeGame
    ? resolveGameMode(activeGame.gameMode) === 'individual'
    : false;

  const scoreLines = activeGame
    ? isIndividual
      ? activeGame.teams.flatMap((team) =>
          team.players.map((player) => `${player.name} ${player.totalScore}`),
        )
      : [
          `${activeGame.teams[0].name} ${activeGame.teams[0].totalScore}`,
          `${activeGame.teams[1].name} ${activeGame.teams[1].totalScore}`,
        ]
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.feltTextureA} />
        <View style={styles.feltTextureB} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hakkında"
          onPress={onAbout}
          hitSlop={10}
          style={({ pressed }) => [
            styles.settingsButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.settingsGlyph}>⚙</Text>
        </Pressable>

        <View style={styles.logoBlock}>
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
          {activeGame ? (
            <Pressable
              accessibilityRole="button"
              onPress={onContinue}
              style={({ pressed }) => [
                styles.menuCard,
                styles.continueCard,
                compact && styles.menuCardCompact,
                pressed && styles.menuCardPressed,
              ]}
            >
              <View style={styles.menuIconSlot}>
                <PlayIcon strong />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{continueTitle}</Text>
                <Text style={styles.menuSubtitle} numberOfLines={1}>
                  {modeLabel} · El {playedRounds}/{targetRounds}
                </Text>
                {status === 'paused' ? (
                  <Text style={styles.pausedBadge}>Duraklatıldı</Text>
                ) : null}
                {scoreLines.map((line) => (
                  <Text key={line} style={styles.scoreLine} numberOfLines={1}>
                    {line}
                  </Text>
                ))}
                <View style={styles.continueActions}>
                  <Pressable onPress={handleRestart} hitSlop={8}>
                    <Text style={styles.continueLink}>Yeniden Başlat</Text>
                  </Pressable>
                  <Text style={styles.continueDot}>·</Text>
                  <Pressable onPress={handleAbandon} hitSlop={8}>
                    <Text style={styles.continueLinkMuted}>İptal Et</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ) : (
            <MenuCard
              icon={<PlayIcon />}
              title="Devam Eden Oyun"
              subtitle="Son oyuna devam et"
              onPress={onContinue}
              disabled
              compact={compact}
            />
          )}

          <MenuCard
            icon={<TrophyIcon />}
            title="Turnuvalar ve Geçmiş"
            subtitle="Turnuva geçmişini görüntüle"
            onPress={onTournaments}
            compact={compact}
          />
          <MenuCard
            icon={<PlusIcon />}
            title="Yeni Oyun"
            subtitle="Yeni bir oyun başlat"
            onPress={handleNewGame}
            compact={compact}
          />
          <MenuCard
            icon={<StatsIcon />}
            title="İstatistikler"
            subtitle="Oyun ve başarı istatistikleri"
            onPress={onStats}
            compact={compact}
          />
          <MenuCard
            icon={<InfoIcon />}
            title="Hakkında"
            subtitle="Uygulama hakkında"
            onPress={onAbout}
            compact={compact}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.club}>♣</Text>
          <Text style={styles.credit}>{DEVELOPER_CREDIT}</Text>
        </View>
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
    height: '30%',
    minHeight: 168,
    maxHeight: 230,
    backgroundColor: home.felt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: 12,
  },
  heroCompact: {
    height: '24%',
    minHeight: 140,
    maxHeight: 168,
    paddingBottom: 8,
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
    top: 6,
    right: 14,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  settingsGlyph: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  logoBlock: {
    alignItems: 'center',
    gap: 4,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  tile: {
    width: 40,
    height: 52,
    borderRadius: 6,
    backgroundColor: home.tileFace,
    borderWidth: 1.5,
    borderColor: home.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCompact: {
    width: 32,
    height: 42,
  },
  tileDigit: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  tileDigitCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  tileDigitRed: {
    color: home.tileRed,
  },
  tileDigitBlack: {
    color: home.tileBlack,
  },
  logo101: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 68,
    color: home.gold,
    letterSpacing: 1,
  },
  logo101Compact: {
    fontSize: 48,
    lineHeight: 52,
  },
  logoYazBoz: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 6,
    color: home.white,
  },
  logoYazBozCompact: {
    fontSize: 14,
    letterSpacing: 4,
  },
  sheet: {
    flex: 1,
    backgroundColor: home.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -8,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  sheetCompact: {
    paddingTop: 12,
    paddingHorizontal: 14,
  },
  menuList: {
    gap: 8,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
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
  continueCard: {
    alignItems: 'flex-start',
    minHeight: 64,
  },
  menuCardPressed: {
    opacity: 0.78,
  },
  menuCardDisabled: {
    opacity: 0.78,
    backgroundColor: 'rgba(255,254,249,0.7)',
  },
  menuIconSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 4,
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
  iconPlay: {
    fontSize: 12,
    color: home.felt,
    marginLeft: 1,
  },
  iconPlayStrong: {
    color: home.white,
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
  footer: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 8,
    paddingBottom: 4,
  },
  club: {
    fontSize: 14,
    color: home.gold,
  },
  credit: {
    fontSize: 10,
    fontWeight: '500',
    color: home.gold,
  },
  pressed: {
    opacity: 0.75,
  },
});
