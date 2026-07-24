import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { APP_INFO, DEVELOPER_CREDIT } from '../../config/appInfo';
import { colors as ui, layout, radii } from '../theme';

type AboutScreenProps = {
  onBack: () => void;
};

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function AboutScreen({ onBack }: AboutScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>HAKKINDA</Text>
          <View style={styles.goldRule} />
        </View>
        <View style={styles.backSpacer} />
      </View>

      <View style={styles.sheet}>
        <Text style={styles.brand}>{APP_INFO.name}</Text>
        <Text style={styles.description}>
          Eşli ve Tekli 101 Okey skor ve turnuva uygulaması.
        </Text>

        <View style={styles.divider} />

        <View style={styles.infoPanel}>
          <InfoRow label="Sürüm" value={APP_INFO.version} />
          <InfoRow label="Geliştirici" value={DEVELOPER_CREDIT} />
          <InfoRow
            label="Telif"
            value={`© ${APP_INFO.copyrightYear}`}
            last
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>Ana Sayfa</Text>
          </Pressable>
        </View>
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
    minHeight: layout.headerMinHeight,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  backButton: {
    width: layout.headerIcon,
    height: layout.headerIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: layout.headerIcon,
  },
  backLabel: {
    fontSize: 30,
    fontWeight: '300',
    color: ui.white,
    marginTop: -2,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.white,
  },
  goldRule: {
    width: 40,
    height: 1.5,
    backgroundColor: ui.gold,
    borderRadius: 1,
    marginTop: 2,
  },
  sheet: {
    flex: 1,
    backgroundColor: ui.cream,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: ui.green,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: ui.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    height: 1.5,
    backgroundColor: ui.gold,
    opacity: 0.75,
    marginVertical: 4,
  },
  infoPanel: {
    backgroundColor: ui.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.gold,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.line,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ui.textMuted,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: ui.text,
    textAlign: 'right',
  },
  footer: {
    marginTop: 'auto',
  },
  primaryButton: {
    minHeight: layout.buttonHeight,
    borderRadius: 10,
    backgroundColor: ui.green,
    borderWidth: 1,
    borderColor: ui.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
