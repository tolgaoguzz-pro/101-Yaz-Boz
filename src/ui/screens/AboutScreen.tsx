import { useMemo } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { APP_INFO, DEVELOPER_CREDIT } from '../../config/appInfo';

type AboutScreenProps = {
  onBack: () => void;
};

type Density = 'normal' | 'compact' | 'ultraCompact';

const palette = {
  background: '#0B3A2D',
  hero: '#0E4938',
  dark: '#14533F',
  panel: '#DCE7DF',
  panelLight: '#EAF1EC',
  accent: '#B58A43',
  textGreen: '#174333',
  textDark: '#142D25',
  textMuted: 'rgba(23,67,51,0.62)',
  white: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.62)',
  heroBody: 'rgba(255,255,255,0.72)',
  quoteBg: 'rgba(255,255,255,0.05)',
  quoteBorder: 'rgba(255,255,255,0.10)',
  quoteText: 'rgba(255,255,255,0.82)',
  rowLine: 'rgba(23,67,51,0.12)',
  heart: '#B3261E',
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

function BackChevron() {
  return (
    <View style={styles.backChevron} pointerEvents="none">
      <View style={styles.backChevronShape} />
    </View>
  );
}

function ThanksDecor() {
  return (
    <View style={styles.thanksDecor} pointerEvents="none">
      <View style={styles.thanksLeafLeft} />
      <View style={styles.thanksHeart} />
      <View style={styles.thanksLeafRight} />
    </View>
  );
}

function InfoRow({
  label,
  value,
  last = false,
  density,
}: {
  label: string;
  value: string;
  last?: boolean;
  density: Density;
}) {
  const ultra = density === 'ultraCompact';
  const compact = density === 'compact';
  return (
    <View
      style={[
        styles.infoRow,
        ultra && styles.infoRowUltra,
        compact && !ultra && styles.infoRowCompact,
        last && styles.infoRowLast,
      ]}
    >
      <Text
        style={[
          styles.infoLabel,
          ultra && styles.infoLabelUltra,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          ultra && styles.infoValueUltra,
          compact && !ultra && styles.infoValueCompact,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export function AboutScreen({ onBack }: AboutScreenProps) {
  const { height } = useWindowDimensions();
  const density = resolveDensity(height);
  const compact = density === 'compact';
  const ultra = density === 'ultraCompact';

  const logoSize = useMemo(() => {
    if (ultra) {
      return 82;
    }
    if (compact) {
      return 96;
    }
    return 110;
  }, [compact, ultra]);

  const heroPadding = ultra ? 14 : compact ? 18 : 22;
  const panelPadding = ultra ? 12 : compact ? 15 : 18;
  const brandSize = ultra ? 25 : compact ? 27 : 30;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.header,
          compact && styles.headerCompact,
          ultra && styles.headerUltra,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
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
            Hakkında
          </Text>
          {!ultra ? (
            <Text style={styles.subtitle}>101 Yaz-Boz uygulaması</Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.content,
          ultra && styles.contentUltra,
          compact && !ultra && styles.contentCompact,
        ]}
      >
        <View style={[styles.heroCard, { padding: heroPadding }]}>
          <Image
            source={require('../../../assets/images/home-101-hero.png')}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
          />
          <Text style={[styles.brand, { fontSize: brandSize }]}>
            {APP_INFO.name}
          </Text>
          <Text
            style={[
              styles.heroDescription,
              ultra && styles.heroDescriptionUltra,
            ]}
          >
            {APP_INFO.shortDescription}
          </Text>
        </View>

        <View style={[styles.infoPanel, { padding: panelPadding }]}>
          <Text
            style={[
              styles.panelTitle,
              ultra && styles.panelTitleUltra,
            ]}
          >
            Uygulama Bilgileri
          </Text>
          <InfoRow
            label="Sürüm"
            value={APP_INFO.version}
            density={density}
          />
          <InfoRow
            label="Geliştirici"
            value={DEVELOPER_CREDIT}
            density={density}
          />
          <InfoRow
            label="Telif"
            value={`© ${APP_INFO.copyrightYear}`}
            last
            density={density}
          />
        </View>

        <View
          style={[
            styles.thanksCard,
            { padding: ultra ? 12 : compact ? 14 : 16 },
          ]}
        >
          <ThanksDecor />
          <Text
            style={[
              styles.thanksTitle,
              ultra && styles.thanksTitleUltra,
            ]}
          >
            Teşekkürler
          </Text>
          <Text
            style={[
              styles.thanksBody,
              ultra && styles.thanksBodyUltra,
            ]}
          >
            Bu uygulama, 101 Okey oynayan arkadaş gruplarının skor takibini
            kolaylaştırmak için geliştirildi.
          </Text>
        </View>

        <View
          style={[
            styles.quoteCard,
            { padding: ultra ? 12 : 16 },
          ]}
        >
          <Text
            style={[
              styles.quoteText,
              ultra && styles.quoteTextUltra,
            ]}
          >
            “İyi oyunlar,{'\n'}bol okeyler.”
          </Text>
        </View>

        <Text style={styles.versionLine}>v {APP_INFO.version}</Text>
      </View>

      <View style={[styles.footer, ultra && styles.footerUltra]}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.primaryButton,
            ultra && styles.primaryButtonUltra,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.primaryLabel,
              ultra && styles.primaryLabelUltra,
            ]}
          >
            Ana Sayfa
          </Text>
        </Pressable>
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
    paddingBottom: 12,
  },
  headerCompact: {
    paddingBottom: 10,
  },
  headerUltra: {
    paddingBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 42,
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
    gap: 3,
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
  content: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 16,
    gap: 10,
    justifyContent: 'flex-start',
  },
  contentCompact: {
    gap: 8,
  },
  contentUltra: {
    gap: 6,
    marginHorizontal: 14,
  },
  heroCard: {
    backgroundColor: palette.hero,
    borderColor: palette.accent,
    borderWidth: 1.5,
    borderRadius: 24,
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    fontWeight: '900',
    color: palette.white,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: palette.heroBody,
    paddingHorizontal: 4,
  },
  heroDescriptionUltra: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoPanel: {
    backgroundColor: palette.panel,
    borderRadius: 22,
    overflow: 'hidden',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.textGreen,
    marginBottom: 4,
  },
  panelTitleUltra: {
    fontSize: 16,
    marginBottom: 2,
  },
  infoRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.rowLine,
  },
  infoRowCompact: {
    height: 48,
  },
  infoRowUltra: {
    height: 42,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
  },
  infoLabelUltra: {
    fontSize: 12,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: palette.textDark,
    textAlign: 'right',
  },
  infoValueCompact: {
    fontSize: 15,
  },
  infoValueUltra: {
    fontSize: 14,
  },
  thanksCard: {
    backgroundColor: palette.panelLight,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
  },
  thanksDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 24,
  },
  thanksHeart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.heart,
  },
  thanksLeafLeft: {
    width: 10,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.accent,
    transform: [{ rotate: '-25deg' }],
  },
  thanksLeafRight: {
    width: 10,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.accent,
    transform: [{ rotate: '25deg' }],
  },
  thanksTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.textGreen,
    textAlign: 'center',
  },
  thanksTitleUltra: {
    fontSize: 15,
  },
  thanksBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: palette.textMuted,
  },
  thanksBodyUltra: {
    fontSize: 12,
    lineHeight: 18,
  },
  quoteCard: {
    backgroundColor: palette.quoteBg,
    borderColor: palette.quoteBorder,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    color: palette.quoteText,
    textAlign: 'center',
  },
  quoteTextUltra: {
    fontSize: 14,
  },
  versionLine: {
    fontSize: 11,
    color: palette.white,
    opacity: 0.45,
    textAlign: 'center',
    marginTop: 'auto',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  footerUltra: {
    paddingTop: 6,
    paddingBottom: 8,
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: palette.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonUltra: {
    height: 46,
    borderRadius: 14,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.dark,
  },
  primaryLabelUltra: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.82,
  },
});
