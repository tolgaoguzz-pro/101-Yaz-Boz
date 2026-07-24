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

/** Referans ANA EKRAN paleti. */
const home = {
  felt: '#1F5E3B',
  feltDeep: '#174A2E',
  feltLight: '#2A6E47',
  cream: '#F7F2E8',
  gold: '#C8A44D',
  goldSoft: '#D4B56A',
  text: '#263238',
  textMuted: '#6B736C',
  divider: '#E2DCD0',
  white: '#FFFFFF',
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

type MenuRowProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  showDivider?: boolean;
  disabled?: boolean;
};

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  showDivider = true,
  disabled = false,
}: MenuRowProps) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuRow,
          disabled && styles.menuRowDisabled,
          pressed && !disabled && styles.menuRowPressed,
        ]}
      >
        <View style={[styles.menuIconSlot, disabled && styles.menuIconMuted]}>
          {icon}
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, disabled && styles.menuTitleDisabled]}>
            {title}
          </Text>
          <Text
            style={[
              styles.menuSubtitle,
              disabled && styles.menuSubtitleDisabled,
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

/** Referanstaki 101 taş motifi — yalnız RN View/Text. */
function LogoTiles() {
  return (
    <View style={styles.tileRow}>
      <View style={styles.tile}>
        <Text style={[styles.tileDigit, styles.tileDigitRed]}>1</Text>
      </View>
      <View style={styles.tile}>
        <Text style={[styles.tileDigit, styles.tileDigitBlack]}>0</Text>
      </View>
      <View style={styles.tile}>
        <Text style={[styles.tileDigit, styles.tileDigitRed]}>1</Text>
      </View>
    </View>
  );
}

function PlayIcon() {
  return (
    <View style={styles.playBadge}>
      <Text style={styles.iconPlay}>▶</Text>
    </View>
  );
}

function TrophyIcon() {
  return <Text style={styles.iconGold}>♔</Text>;
}

function PlusIcon() {
  return (
    <View style={styles.plusBadge}>
      <Text style={styles.iconPlus}>＋</Text>
    </View>
  );
}

function StatsIcon() {
  return (
    <View style={styles.statsBars}>
      <View style={[styles.statsBar, styles.statsBarShort]} />
      <View style={[styles.statsBar, styles.statsBarMid]} />
      <View style={[styles.statsBar, styles.statsBarTall]} />
    </View>
  );
}

function InfoIcon() {
  return (
    <View style={styles.infoBadge}>
      <Text style={styles.infoBadgeText}>i</Text>
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
      <View style={[styles.felt, compact && styles.feltCompact]}>
        <View style={styles.feltTextureA} />
        <View style={styles.feltTextureB} />
        <View style={styles.logoBlock}>
          <LogoTiles />
          <Text style={[styles.logoWordmark, compact && styles.logoWordmarkCompact]}>
            101 YAZ-BOZ
          </Text>
        </View>
      </View>

      <View style={[styles.sheet, compact && styles.sheetCompact]}>
        <View style={styles.menuList}>
          {activeGame ? (
            <View>
              <Pressable
                accessibilityRole="button"
                onPress={onContinue}
                style={({ pressed }) => [
                  styles.menuRow,
                  styles.continueRow,
                  pressed && styles.menuRowPressed,
                ]}
              >
                <View style={styles.menuIconSlot}>
                  <PlayIcon />
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
                  {activeGame.updatedAt ? (
                    <Text style={styles.updatedLine} numberOfLines={1}>
                      Son güncelleme:{' '}
                      {new Date(activeGame.updatedAt).toLocaleString('tr-TR')}
                    </Text>
                  ) : null}
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
              <View style={styles.divider} />
            </View>
          ) : (
            <MenuRow
              icon={<PlayIcon />}
              title="Devam Eden Oyun"
              subtitle="Son oyuna devam et"
              onPress={onContinue}
              disabled
            />
          )}

          <MenuRow
            icon={<TrophyIcon />}
            title="Turnuvalar ve Geçmiş"
            subtitle="Turnuva geçmişini görüntüle"
            onPress={onTournaments}
          />
          <MenuRow
            icon={<PlusIcon />}
            title="Yeni Oyun"
            subtitle="Yeni bir oyun başlat"
            onPress={handleNewGame}
          />
          <MenuRow
            icon={<StatsIcon />}
            title="İstatistikler"
            subtitle="Oyun ve başarı istatistikleri"
            onPress={onStats}
          />
          <MenuRow
            icon={<InfoIcon />}
            title="Hakkında"
            subtitle="Uygulama hakkında"
            onPress={onAbout}
            showDivider={false}
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
  felt: {
    height: '22%',
    minHeight: 128,
    maxHeight: 176,
    backgroundColor: home.felt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingBottom: 6,
  },
  feltCompact: {
    height: '18%',
    minHeight: 112,
    maxHeight: 140,
  },
  feltTextureA: {
    position: 'absolute',
    top: -36,
    left: -28,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: home.feltLight,
    opacity: 0.2,
  },
  feltTextureB: {
    position: 'absolute',
    bottom: -44,
    right: -24,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: home.feltDeep,
    opacity: 0.38,
  },
  logoBlock: {
    alignItems: 'center',
    gap: 8,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 7,
  },
  tile: {
    width: 36,
    height: 48,
    borderRadius: 5,
    backgroundColor: home.tileFace,
    borderWidth: 1.5,
    borderColor: home.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tileDigit: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  tileDigitRed: {
    color: home.tileRed,
  },
  tileDigitBlack: {
    color: home.tileBlack,
  },
  logoWordmark: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: home.gold,
  },
  logoWordmarkCompact: {
    fontSize: 19,
    letterSpacing: 2,
  },
  sheet: {
    flex: 1,
    backgroundColor: home.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 22,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  sheetCompact: {
    paddingTop: 10,
    paddingHorizontal: 18,
  },
  menuList: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    paddingVertical: 0,
    gap: 14,
  },
  continueRow: {
    alignItems: 'flex-start',
    height: undefined,
    minHeight: 58,
    paddingVertical: 10,
  },
  menuRowPressed: {
    opacity: 0.72,
  },
  menuRowDisabled: {
    opacity: 0.72,
  },
  menuIconSlot: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconMuted: {
    opacity: 0.75,
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
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
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: home.text,
  },
  updatedLine: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    color: home.textMuted,
    marginTop: 2,
  },
  continueActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: home.divider,
  },
  playBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: home.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: home.white,
  },
  iconPlay: {
    fontSize: 11,
    color: home.felt,
    marginLeft: 1,
  },
  iconGold: {
    fontSize: 20,
    color: home.gold,
  },
  plusBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: home.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlus: {
    fontSize: 16,
    fontWeight: '600',
    color: home.gold,
    marginTop: -1,
  },
  statsBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 20,
  },
  statsBar: {
    width: 4,
    borderRadius: 1,
    backgroundColor: home.gold,
  },
  statsBarShort: {
    height: 9,
  },
  statsBarMid: {
    height: 14,
  },
  statsBarTall: {
    height: 20,
  },
  infoBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: home.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: home.gold,
    marginTop: -1,
  },
  footer: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 6,
    paddingBottom: 2,
  },
  club: {
    fontSize: 14,
    color: home.gold,
  },
  credit: {
    fontSize: 10,
    fontWeight: '500',
    color: home.textMuted,
  },
});
