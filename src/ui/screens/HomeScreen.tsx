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

import {
  invokeHomeContinue,
  shouldEnableHomeContinue,
} from '../homeContinue';
import { gameModeLabel, resolveGameMode } from '../gameMode';
import { resolveGameStatus } from '../gameLifecycle';
import { resolveTargetRoundCount } from '../targetRoundCount';
import { ActiveGameData } from './ActiveGameScreen';

/**
 * Ölçüler: design/home-ana-ekran.png @ 393×852
 * creamY=207 (24.3%), footerY=783 (h=69), pad≈20, kart≈80, gap≈12–14, radius≈30/15
 */
const REF_W = 393;
const REF_H = 852;
const REF_CREAM_Y = 207;
const REF_FOOTER_Y = 783;
const REF_CARD_H = 80;
const REF_CARD_GAP = 11;
const REF_PAD_H = 20;
const REF_SHEET_RADIUS = 30;
const REF_CARD_RADIUS = 15;
/** Logo grubu ~%17 büyüme (referans mikro rötuş). */
const LOGO_BOOST = 1.17;

const C = {
  green: '#1F5E3B',
  cream: '#F7F2E8',
  creamLogo: '#F3E6C8',
  white: '#FFFFFF',
  cardFace: '#FFFEFC',
  text: '#263238',
  textMuted: '#6B736C',
  gold: '#C8A44D',
  tileRed: '#C62828',
  tileBlack: '#1A1A1A',
  tileGreen: '#1F5E3B',
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

type MenuItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: 'play' | 'trophy' | 'plus' | 'stats' | 'info';
  onPress: () => void;
  disabled?: boolean;
  strongPlay?: boolean;
  extra?: ReactNode;
};

function LogoTiles({ scale }: { scale: number }) {
  const tileW = Math.round(42 * scale);
  const tileH = Math.round(56 * scale);
  const digit = Math.round(26 * scale);
  return (
    <View style={[styles.tileRow, { gap: Math.round(5 * scale) }]}>
      <View style={[styles.tile, { width: tileW, height: tileH }]}>
        <Text style={[styles.tileDigit, { fontSize: digit, color: C.tileRed }]}>
          1
        </Text>
      </View>
      <View style={[styles.tile, { width: tileW, height: tileH }]}>
        <Text
          style={[styles.tileDigit, { fontSize: digit, color: C.tileBlack }]}
        >
          0
        </Text>
      </View>
      <View style={[styles.tile, { width: tileW, height: tileH }]}>
        <Text
          style={[styles.tileDigit, { fontSize: digit, color: C.tileGreen }]}
        >
          1
        </Text>
      </View>
    </View>
  );
}

function MenuIcon({
  kind,
  strong,
}: {
  kind: MenuItem['icon'];
  strong?: boolean;
}) {
  if (kind === 'play') {
    return (
      <View style={[styles.iconWrap, strong && styles.iconWrapStrong]}>
        <Text style={[styles.iconPlay, strong && styles.iconOnGreen]}>▶</Text>
      </View>
    );
  }
  if (kind === 'trophy') {
    return (
      <View style={styles.iconWrap}>
        <Text style={styles.iconTrophy}>♔</Text>
      </View>
    );
  }
  if (kind === 'plus') {
    return (
      <View style={styles.iconWrap}>
        <Text style={styles.iconPlus}>＋</Text>
      </View>
    );
  }
  if (kind === 'stats') {
    return (
      <View style={styles.iconWrap}>
        <View style={styles.bars}>
          <View style={[styles.bar, { height: 8 }]} />
          <View style={[styles.bar, { height: 12 }]} />
          <View style={[styles.bar, { height: 16 }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.iconWrap}>
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
  const { height, width } = useWindowDimensions();
  const scale = Math.min(width / REF_W, height / REF_H);
  const logoScale = scale * LOGO_BOOST;
  const heroH = Math.round((REF_CREAM_Y / REF_H) * height);
  const footerH = Math.max(
    52,
    Math.round(((REF_H - REF_FOOTER_Y) / REF_H) * height),
  );
  const cardH = Math.round(REF_CARD_H * scale);
  const cardGap = Math.round(REF_CARD_GAP * scale);
  const padH = Math.round(REF_PAD_H * scale);
  const sheetRadius = Math.round(REF_SHEET_RADIUS * scale);
  const cardRadius = Math.round(REF_CARD_RADIUS * scale);

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

  const menuItems: MenuItem[] = [
    continueGame
      ? {
          key: 'continue',
          title: continueTitle,
          subtitle: '',
          icon: 'play',
          strongPlay: true,
          onPress: handleContinuePress,
          extra: (
            <View style={styles.continueExtra}>
              <View style={styles.continueMeta}>
                <Text style={styles.metaMode}>{modeLabel}</Text>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaRounds}>
                  El {playedRounds}/{targetRounds}
                </Text>
              </View>
              {status === 'paused' ? (
                <Text style={styles.paused}>Duraklatıldı</Text>
              ) : null}
              <View style={styles.scoreBlock}>
                {scoreLines.map((line) => (
                  <Text key={line} style={styles.scoreLine} numberOfLines={1}>
                    {line}
                  </Text>
                ))}
              </View>
              <View style={styles.continueLinks}>
                <Pressable onPress={handleRestart} hitSlop={8}>
                  <Text style={styles.link}>Yeniden Başlat</Text>
                </Pressable>
                <Text style={styles.dot}>·</Text>
                <Pressable onPress={handleAbandon} hitSlop={8}>
                  <Text style={styles.linkMuted}>İptal Et</Text>
                </Pressable>
              </View>
            </View>
          ),
        }
      : {
          key: 'continue',
          title: 'Devam Eden Oyun',
          subtitle: 'Son oyuna devam et',
          icon: 'play',
          onPress: handleContinuePress,
          disabled: true,
        },
    {
      key: 'tournaments',
      title: 'Turnuvalar',
      subtitle: 'Turnuva geçmişini görüntüle',
      icon: 'trophy',
      onPress: onTournaments,
    },
    {
      key: 'new',
      title: 'Yeni Oyun',
      subtitle: 'Yeni bir oyun başlat',
      icon: 'plus',
      onPress: handleNewGame,
    },
    {
      key: 'stats',
      title: 'İstatistikler',
      subtitle: 'Oyun ve başarı istatistikleri',
      icon: 'stats',
      onPress: onStats,
    },
    {
      key: 'about',
      title: 'Hakkında',
      subtitle: 'Uygulama hakkında',
      icon: 'info',
      onPress: onAbout,
    },
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { height: heroH }]}>
        <SafeAreaView style={styles.heroSafe} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hakkında"
            onPress={onAbout}
            hitSlop={8}
            style={styles.settingsBtn}
          >
            <Text style={styles.settingsGlyph}>⚙</Text>
          </Pressable>
          <View style={styles.logoBlock} pointerEvents="none">
            <Text
              style={[
                styles.logo101,
                {
                  fontSize: Math.round(52 * logoScale),
                  lineHeight: Math.round(56 * logoScale),
                },
              ]}
            >
              101
            </Text>
            <Text
              style={[
                styles.logoYazBoz,
                {
                  fontSize: Math.round(16 * logoScale),
                  letterSpacing: 5 * logoScale,
                },
              ]}
            >
              YAZ-BOZ
            </Text>
            <LogoTiles scale={Math.max(0.9, logoScale)} />
          </View>
        </SafeAreaView>
      </View>

      <View
        style={[
          styles.sheet,
          {
            borderTopLeftRadius: sheetRadius,
            borderTopRightRadius: sheetRadius,
            marginTop: -Math.round(16 * scale),
          },
        ]}
      >
        <View style={[styles.menu, { paddingHorizontal: padH, gap: cardGap }]}>
          {menuItems.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityState={{ disabled: !!item.disabled }}
              disabled={!!item.disabled}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.card,
                {
                  minHeight: item.extra ? undefined : cardH,
                  borderRadius: cardRadius,
                },
                !!item.extra && styles.cardTall,
                item.disabled && styles.cardDisabled,
                pressed && !item.disabled && styles.pressed,
              ]}
            >
              <View
                style={[styles.iconSlot, !!item.extra && styles.iconSlotTall]}
                pointerEvents="none"
              >
                <MenuIcon kind={item.icon} strong={item.strongPlay} />
              </View>
              <View
                style={styles.cardText}
                pointerEvents={item.extra ? 'box-none' : 'none'}
              >
                <Text style={styles.cardTitle} pointerEvents="none">
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text
                    style={styles.cardSubtitle}
                    numberOfLines={1}
                    pointerEvents="none"
                  >
                    {item.subtitle}
                  </Text>
                ) : null}
                {item.extra}
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { minHeight: footerH }]}>
        <Text style={styles.footerText}>♔  İyi oyunlar!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.green,
  },
  hero: {
    backgroundColor: C.green,
    overflow: 'hidden',
  },
  heroSafe: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 22,
  },
  settingsBtn: {
    position: 'absolute',
    top: 4,
    right: 14,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  settingsGlyph: {
    fontSize: 18,
    color: C.white,
  },
  logoBlock: {
    alignItems: 'center',
    gap: 2,
    marginTop: -14,
    paddingBottom: 0,
  },
  logo101: {
    fontWeight: '800',
    color: C.creamLogo,
  },
  logoYazBoz: {
    fontWeight: '700',
    color: C.white,
    marginBottom: 4,
  },
  tileRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  tile: {
    borderRadius: 5,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileDigit: {
    fontWeight: '800',
  },
  sheet: {
    flex: 1,
    backgroundColor: C.cream,
    paddingTop: 16,
  },
  menu: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardFace,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200, 164, 77, 0.28)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#174A2E',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTall: {
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  cardDisabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.82,
  },
  iconSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotTall: {
    paddingTop: 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: C.gold,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapStrong: {
    backgroundColor: C.green,
    borderColor: C.gold,
  },
  iconPlay: {
    fontSize: 12,
    color: C.green,
    marginLeft: 1,
  },
  iconOnGreen: {
    color: C.white,
  },
  iconTrophy: {
    fontSize: 16,
    color: C.gold,
  },
  iconPlus: {
    fontSize: 18,
    color: C.text,
    marginTop: -1,
  },
  iconInfo: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  bar: {
    width: 3,
    borderRadius: 1,
    backgroundColor: C.text,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: C.textMuted,
  },
  continueExtra: {
    marginTop: 4,
    gap: 4,
  },
  continueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaMode: {
    fontSize: 12,
    fontWeight: '700',
    color: C.green,
  },
  metaSep: {
    fontSize: 12,
    color: C.textMuted,
  },
  metaRounds: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },
  paused: {
    fontSize: 11,
    fontWeight: '700',
    color: C.gold,
  },
  scoreBlock: {
    gap: 1,
    paddingTop: 1,
  },
  scoreLine: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },
  continueLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(38, 50, 56, 0.12)',
  },
  link: {
    fontSize: 12,
    fontWeight: '600',
    color: C.green,
  },
  linkMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  dot: {
    color: C.textMuted,
  },
  footer: {
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.white,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
