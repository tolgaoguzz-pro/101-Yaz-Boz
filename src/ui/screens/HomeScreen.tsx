import type { ReactNode } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DEVELOPER_CREDIT } from '../../config/appInfo';
import { gameModeLabel, resolveGameMode } from '../gameMode';
import { resolveGameStatus } from '../gameLifecycle';
import { resolveTargetRoundCount } from '../targetRoundCount';
import { ActiveGameData } from './ActiveGameScreen';

/** Referans ANA EKRAN paleti (yalnızca bu ekran). */
const home = {
  felt: '#1F5E3B',
  feltDeep: '#174A2E',
  feltLight: '#2A6E47',
  cream: '#F7F2E8',
  gold: '#C8A44D',
  text: '#263238',
  textMuted: '#7A847C',
  divider: '#E2DCD0',
  white: '#FFFFFF',
  iconMuted: '#4A5560',
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
        <View style={styles.menuIconSlot}>{icon}</View>
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

function PlayIcon() {
  return <Text style={styles.iconPlay}>▶</Text>;
}

function TrophyIcon() {
  return <Text style={styles.iconTrophy}>♔</Text>;
}

function PlusIcon() {
  return <Text style={styles.iconMuted}>＋</Text>;
}

function StatsIcon() {
  return <Text style={styles.iconMuted}>▮▮▮</Text>;
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
      <View style={styles.felt}>
        <View style={styles.feltTextureA} />
        <View style={styles.feltTextureB} />
        <View style={styles.feltTextureC} />

        <View style={styles.logoBlock}>
          <Text style={styles.logo101}>101</Text>
          <Text style={styles.logoYazBoz}>YAZ-BOZ</Text>
        </View>
      </View>

      <View style={styles.sheet}>
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
    height: '28%',
    minHeight: 160,
    maxHeight: 220,
    backgroundColor: home.felt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  feltTextureA: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: home.feltLight,
    opacity: 0.18,
  },
  feltTextureB: {
    position: 'absolute',
    bottom: -50,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: home.feltDeep,
    opacity: 0.35,
  },
  feltTextureC: {
    position: 'absolute',
    top: 24,
    right: 40,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: home.feltLight,
    opacity: 0.12,
  },
  logoBlock: {
    alignItems: 'center',
    gap: 2,
  },
  logo101: {
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 60,
    color: home.gold,
    letterSpacing: 1,
  },
  logoYazBoz: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    color: home.gold,
    letterSpacing: 6,
  },
  sheet: {
    flex: 1,
    backgroundColor: home.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 24,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  menuList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: 10,
    gap: 14,
  },
  continueRow: {
    alignItems: 'flex-start',
    minHeight: 64,
  },
  menuRowPressed: {
    opacity: 0.72,
  },
  menuRowDisabled: {
    opacity: 0.45,
  },
  menuIconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    color: home.text,
  },
  menuSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
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
  iconPlay: {
    fontSize: 16,
    color: home.felt,
  },
  iconTrophy: {
    fontSize: 18,
    color: home.gold,
  },
  iconMuted: {
    fontSize: 18,
    fontWeight: '600',
    color: home.iconMuted,
  },
  infoBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: home.iconMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: home.iconMuted,
    marginTop: -1,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  club: {
    fontSize: 16,
    color: home.gold,
  },
  credit: {
    fontSize: 11,
    fontWeight: '500',
    color: home.textMuted,
  },
});
